// backend/models/Showtime.js
const mongoose = require('mongoose');

// Definición del esquema para un bloqueo individual
const seatLockSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    seats: [{ type: String }], // Array de IDs de asiento ('A1', 'A2')
    expiresAt: { type: Date, required: true, expires: 0 }, // Índice de expiración de MongoDB
}, { _id: false });

const showtimeSchema = new mongoose.Schema(
    {
        movie: { type: mongoose.Schema.Types.ObjectId, ref: 'Movie', required: true },
        hall: { type: mongoose.Schema.Types.ObjectId, ref: 'Hall', required: true },
        startAt: { type: Date, required: true },
        price: { type: Number, required: true, default: 0 },
        seatsBooked: [{ type: String }], // Asientos vendidos (permanente)
        // 🛑 NUEVO CAMPO: Asientos bloqueados temporalmente
        seatsLocks: [seatLockSchema], 
        isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Showtime', showtimeSchema);