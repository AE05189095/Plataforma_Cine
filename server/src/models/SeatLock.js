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
  expiresAt: {
    type: Date,
    required: true
  }
});

// Índice compuesto para búsquedas eficientes
seatLockSchema.index({ showtimeId: 1, seatId: 1 });
seatLockSchema.index({ userId: 1 });
seatLockSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('SeatLock', seatLockSchema);