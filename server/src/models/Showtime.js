// backend/models/Showtime.js
const mongoose = require('mongoose');

// El esquema seatLockSchema de la derecha se omite, ya que la lógica de bloqueo
// temporal se maneja a través del modelo Purchase (status='reserved' con expires: reservedUntil).

const showtimeSchema = new mongoose.Schema(
  {
    // Referencia a la película
    movie: { type: mongoose.Schema.Types.ObjectId, ref: 'Movie', required: true },
    // Referencia a la sala de cine
    hall: { type: mongoose.Schema.Types.ObjectId, ref: 'Hall', required: true },
    // Fecha y hora de inicio de la función
    startAt: { type: Date, required: true },
    // Precio por asiento
    price: { type: Number, required: true, default: 0 },

    // Asientos permanentemente ocupados (legacy/simple, se mantiene por compatibilidad)
    seatsBooked: [{ type: String }], 

    // Mapeo detallado de asientos a la compra/reserva (incluye holds y pagos)
    // Este es el campo más importante para gestionar la ocupación y la liberación de holds.
    seatsBookedMap: [{ 
      seat: { type: String }, 
      purchase: { type: mongoose.Schema.Types.ObjectId, ref: 'Purchase' } 
    }],

    // Indica si la función está activa
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Showtime', showtimeSchema);