const mongoose = require('mongoose');

const reservaSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    showtimeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Showtime', required: true },
    seats: [{ type: String }],
    totalPrice: Number,
    createdAt: { type: Date, default: Date.now },
    estado: {
        type: String,
        enum: ['pendiente', 'confirmada', 'cancelada'],
        default: 'pendiente'
    }
});


module.exports = mongoose.model('Reservation', reservaSchema);