// backend/models/Showtime.js
const mongoose = require('mongoose');

// Importar los modelos referenciados
require('./Movie');
require('./Hall');

// Definición del esquema para un bloqueo individual
const seatLockSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    seats: [{ type: String }], // Array de IDs de asiento ('A1', 'A2')
    expiresAt: { type: Date, required: true }, // para TTL opcional
}, { _id: false });

const showtimeSchema = new mongoose.Schema(
    {
        movie: { type: mongoose.Schema.Types.ObjectId, ref: 'Movie', required: true },
        hall: { type: mongoose.Schema.Types.ObjectId, ref: 'Hall', required: true },
        startAt: { type: Date, required: true },
        endAt: { type: Date },
        date: { type: String, required: true }, // formato 'YYYY-MM-DD'
        time: { type: String, required: true }, // formato 'HH:mm'
        price: { type: Number, required: true, default: 0 },
        // Precio premium (para filas VIP como A y B). Si es 0, se asume no configurado y el frontend puede usar su default.
        premiumPrice: { type: Number, required: false, default: 0 },
    // Capacidad snapshot tomada de la sala en el momento de crear la función.
    capacity: { type: Number },
        seatsBooked: [{ type: String }], // Asientos vendidos permanentemente
        seatsLocks: [seatLockSchema], // Asientos bloqueados temporalmente
        isActive: { type: Boolean, default: true },
        slug: { type: String, unique: true, sparse: true }, // opcional para URL amigable
    },
    { timestamps: true }
);

// Índice TTL para limpiar locks automáticamente según expiresAt
// showtimeSchema.index({ 'seatsLocks.expiresAt': 1 }, { expireAfterSeconds: 0 });

// Índices recomendados para consultas frecuentes
showtimeSchema.index({ hall: 1, startAt: 1, endAt: 1 });
showtimeSchema.index({ movie: 1, date: 1 });

// Hook para asegurar que `endAt` esté presente si se guarda un showtime
showtimeSchema.pre('save', async function (next) {
    try {
        if (!this.endAt && this.startAt && this.movie) {
            const Movie = mongoose.model('Movie');
            const movie = await Movie.findById(this.movie).lean();
            const durationMin = movie && typeof movie.duration === 'number' && movie.duration > 0 ? movie.duration : 120;
            this.endAt = new Date(this.startAt.getTime() + durationMin * 60000);
        }
    } catch (err) {
        console.error('Showtime pre-save hook error:', err);
    }
    next();
});

module.exports = mongoose.model('Showtime', showtimeSchema);
