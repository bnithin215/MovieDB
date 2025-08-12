// index.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
// require('dotenv').config();
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
if (!process.env.MONGO_URI) {
  console.error("❌ MONGO_URI is missing. Check if .env exists and has the correct variable.");
  process.exit(1);
}


const app = express();

app.use(cors());
app.use(express.json()); // For parsing JSON body

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("✅ MongoDB connected"))
.catch((err) => console.error("❌ MongoDB connection error:", err));

// Routes
const movieRoutes = require('./routes/movies');
app.use('/api/movies', movieRoutes);

// Serve frontend
const frontendPath = path.join(__dirname, '../Frontend');
app.use(express.static(frontendPath));

app.get('/', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// Catch-all
app.use((req, res) => {
  res.status(404).send('Route not found');
});
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
