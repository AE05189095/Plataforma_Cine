// backend/models/Showtime.js
const mongoose = require('mongoose');

// Definición del esquema para un bloqueo individual
const seatLockSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    seats: [{ type: String }], // Array de IDs de asiento ('A1', 'A2')
    expiresAt: { type: Date, required: true, expires: 0 }, // índice TTL de MongoDB, eliminará el documento cuando expire
}, { _id: false });

const showtimeSchema = new mongoose.Schema(
    {
        movie: { type: mongoose.Schema.Types.ObjectId, ref: 'Movie', required: true },
        hall: { type: mongoose.Schema.Types.ObjectId, ref: 'Hall', required: true },
        startAt: { type: Date, required: true },
        date: { type: String, required: true }, // formato 'YYYY-MM-DD'
        time: { type: String, required: true }, // formato 'HH:mm'
        price: { type: Number, required: true, default: 0 },
        seatsBooked: [{ type: String }], // Asientos vendidos permanentemente
        seatsLocks: [seatLockSchema], // Asientos bloqueados temporalmente
        isActive: { type: Boolean, default: true },
        // Opcional: puedes agregar un slug si lo usas para URL amigables
        slug: { type: String, unique: true, sparse: true },
    },
    { timestamps: true }
);

// Índice TTL para limpiar locks automáticamente según expiresAt
showtimeSchema.index({ 'seatsLocks.expiresAt': 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Showtime', showtimeSchema);
