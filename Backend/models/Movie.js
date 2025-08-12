const mongoose = require('mongoose');

const movieSchema = new mongoose.Schema({
  title: String,
  genre: String,
  actor: String,
  rating: Number,
  poster: String,
  director: String,
  cast: String,
});

module.exports = mongoose.model('Movie', movieSchema);
