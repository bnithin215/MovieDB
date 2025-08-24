// Create this file as debug.js in your Backend directory to test routes
const express = require('express');

console.log('Testing route definitions...');

try {
    const app = express();

    // Test basic routes
    app.get('/', (req, res) => res.send('OK'));
    app.get('/test', (req, res) => res.send('Test OK'));

    console.log('✅ Basic routes work');

    // Test auth routes
    const authRoutes = require('./routes/auth');
    app.use('/api/auth', authRoutes);
    console.log('✅ Auth routes loaded');

    // Test movie routes
    const movieRoutes = require('./routes/movies');
    app.use('/api/movies', movieRoutes);
    console.log('✅ Movie routes loaded');

    console.log('All routes loaded successfully!');

} catch (error) {
    console.error('❌ Error loading routes:', error.message);
    console.error('Stack:', error.stack);
}