const mongoose = require('mongoose');

const showtimeSchema = new mongoose.Schema(
  {
    movie: { type: mongoose.Schema.Types.ObjectId, ref: 'Movie', required: true },
    hall: { type: mongoose.Schema.Types.ObjectId, ref: 'Hall', required: true },
    startAt: { type: Date, required: true },
    price: { type: Number, required: true, default: 0 },
    seatsBooked: [{ type: String }], // store seat identifiers like 'A3'
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Showtime', showtimeSchema);
