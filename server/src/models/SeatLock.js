// models/SeatLock.js
const mongoose = require('mongoose');

const seatLockSchema = new mongoose.Schema({
  showtimeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Showtime',
    required: true
  },
  seatId: {
    type: String,
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lockedAt: {
    type: Date,
    default: Date.now
  },
  // expiresAt puede quedar vacío para locks permanentes (asientos vendidos).
  expiresAt: {
    type: Date,
    required: false
  },
  // Referencias adicionales para facilitar consultas por sala y película
  hallId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hall',
  },
  movieId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Movie',
  }
});

// Índice compuesto para búsquedas eficientes
seatLockSchema.index({ showtimeId: 1, seatId: 1 });
seatLockSchema.index({ userId: 1 });
seatLockSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('SeatLock', seatLockSchema);