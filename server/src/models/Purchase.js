const mongoose = require('mongoose');

const purchaseSchema = new mongoose.Schema(
  {
    // Referencia al usuario que realiza la compra
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    // Referencia a la función de cine
    showtime: { type: mongoose.Schema.Types.ObjectId, ref: 'Showtime', required: true },
    // Asientos comprados/reservados (ej: ["A1", "A2"])
    seats: [{ type: String, required: true }],
    // Precio total de la transacción
    totalPrice: { type: Number, required: true },
    // Estado de la compra (pago o reserva temporal)
    status: { type: String, enum: ['reserved', 'paid', 'cancelled'], default: 'reserved' },
    // Información sensible del pago (excluida por defecto en consultas)
    paymentInfo: { type: Object, select: false },

    // --- Campos para Holds (Reservas Temporales) y Cancelación (de la izquierda) ---
    // Fecha y hora hasta la que esta reserva temporal es válida (solo si status='reserved')
    reservedUntil: { type: Date },
    // Fecha de cancelación
    cancelledAt: { type: Date },
    // Motivo de la cancelación (ej: 'expired', 'released', 'refunded')
    cancelReason: { type: String },

    // --- Campos para Confirmación (de la derecha) ---
    // Código único para que el cliente acceda a la función
    confirmationCode: {
      type: String,
      required: true // Asegura que una compra/hold tenga un identificador
    },
    // Bandera para rastrear si se envió el correo de confirmación
    emailSent: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true } // Agrega createdAt y updatedAt automáticamente
);

module.exports = mongoose.model('Purchase', purchaseSchema);