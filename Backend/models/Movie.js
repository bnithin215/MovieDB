const mongoose = require('mongoose');

const movieSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  genre: {
    type: String,
    required: true,
    enum: ['Action', 'Comedy', 'Rom-Com', 'Drama', 'Horror', 'Thriller', 'Sci-Fi', 'Fantasy']
  },
  actor: {
    type: String,
    trim: true
  },
  rating: {
    type: Number,
    min: 1,
    max: 5
  },
  poster: {
    type: String, // URL to poster image
    trim: true
  },
  director: {
    type: String,
    trim: true
  },
  cast: {
    type: String, // Could be changed to Array of Strings for better data structure
    trim: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Reference to the user who added this movie
    required: true
  }
}, {
  timestamps: true // Adds createdAt and updatedAt fields automatically
});

// Index for faster searches
movieSchema.index({ title: 'text', director: 'text', actor: 'text' });
movieSchema.index({ genre: 1 });
movieSchema.index({ rating: -1 });

module.exports = mongoose.model('Movie', movieSchema);