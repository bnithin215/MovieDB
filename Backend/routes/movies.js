const express = require('express');
const Movie = require('../models/Movie');
const jwt = require('jsonwebtoken');
const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;

function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  try {
    const user = jwt.verify(token, JWT_SECRET);
    req.user = user;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

router.get('/', authMiddleware, async (req, res) => {
  const movies = await Movie.find();
  res.json(movies);
});

router.post('/', authMiddleware, async (req, res) => {
  const { title, genre } = req.body;
  const movie = new Movie({ title, genre });
  await movie.save();
  res.status(201).json(movie);
});

module.exports = router;
