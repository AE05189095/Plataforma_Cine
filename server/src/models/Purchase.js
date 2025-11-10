// server/src/models/Purchase.js
const mongoose = require('mongoose');
const purchaseSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    // Modificado: showtime puede ser ObjectId o string para soportar "-gen-*"
    showtime: { 
      type: mongoose.Schema.Types.Mixed, 
      required: true 
    },
    seats: [{ type: String, required: true }],
    totalPrice: { type: Number, required: true },
    status: { type: String, enum: ['reserved', 'paid', 'cancelled'], default: 'reserved' },
    paymentInfo: { type: Object, select: false },
    confirmationCode: {
      type: String,
      required: true // se genera en el backend al confirmar la compra
    },
    emailSent: {
      type: Boolean,
      default: false // se actualiza a true tras enviar el correo
    }
  },
  { timestamps: true }
);
module.exports = mongoose.model('Purchase', purchaseSchema);