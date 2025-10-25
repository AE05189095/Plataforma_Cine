// backend/models/Showtime.js
const mongoose = require('mongoose');

// ✅ Importar los modelos referenciados (para evitar MissingSchemaError)
require('./Movie');
require('./Hall');

// Definición del esquema para un bloqueo individual
const seatLockSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    seats: [{ type: String }], 
    expiresAt: { type: Date, required: true },
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

// Índices recomendados para consultas frecuentes
// - Buscar funciones por sala y ordenar por startAt
// - Buscar funciones por película/fecha
showtimeSchema.index({ hall: 1, startAt: 1, endAt: 1 });
showtimeSchema.index({ movie: 1, date: 1 });

// Hook para asegurar que `endAt` esté presente si se guarda un showtime
// Calcula endAt usando la duración de la película (en minutos). Esto
// ayuda a las comprobaciones de solapamiento y evita tener documentos
// sin endAt cuando la duración está disponible.
showtimeSchema.pre('save', async function (next) {
    try {
        if (!this.endAt && this.startAt && this.movie) {
            // Obtener modelo Movie (se requiere arriba con require('./Movie'))
            const Movie = mongoose.model('Movie');
            const movie = await Movie.findById(this.movie).lean();
            const durationMin = movie && typeof movie.duration === 'number' && movie.duration > 0 ? movie.duration : 120;
            this.endAt = new Date(new Date(this.startAt).getTime() + durationMin * 60000);
        }
    } catch (err) {
        // No bloquear el guardado por este hook; solo intentamos rellenar endAt
        console.error('Showtime pre-save hook error:', err);
    }
    next();
});

module.exports = mongoose.model('Showtime', showtimeSchema);
