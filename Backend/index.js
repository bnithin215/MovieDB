const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

// Load environment variables - try both locations
if (require('fs').existsSync('.env')) {
    require('dotenv').config(); // .env in current directory (Backend/)
} else {
    require('dotenv').config({ path: path.join(__dirname, '..', '.env') }); // .env in parent directory
}

// Check for required environment variables
if (!process.env.MONGO_URI) {
    console.error("❌ MONGO_URI is missing. Check if .env exists and has the correct variable.");
    process.exit(1);
}

if (!process.env.JWT_SECRET) {
    console.warn("⚠️ JWT_SECRET is missing. Using default secret (not recommended for production)");
}

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => console.log("✅ MongoDB connected"))
    .catch((err) => {
        console.error("❌ MongoDB connection error:", err);
        process.exit(1);
    });

// API Routes - Make sure these are defined correctly
const authRoutes = require('./routes/auth');
const movieRoutes = require('./routes/movies');

app.use('/api/auth', authRoutes);
app.use('/api/movies', movieRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Serve static files from Frontend directory
const frontendPath = path.join(__dirname, '../Frontend');
app.use(express.static(frontendPath));

// Serve the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
});

// Handle 404 for API routes
app.use('/api/*', (req, res) => {
    res.status(404).json({ error: 'API route not found' });
});

// Catch-all for frontend routes - this should be last
app.get('*', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});