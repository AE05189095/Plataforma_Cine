const mongoose = require("mongoose");

const purchaseSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // trazabilidad
    showtime: { type: mongoose.Schema.Types.ObjectId, ref: "Showtime", required: true },
    seats: [{ type: String, required: true }],
    movieTitle: { type: String }, // para mostrar en historial
    hallName: { type: String },
    totalPrice: { type: Number, required: true },
    status: { type: String, enum: ["reserved", "paid", "cancelled"], default: "reserved" }, // estado de compra
    paymentInfo: { type: Object }, // opcional
  },
  { timestamps: true }
);

module.exports = mongoose.model("Purchase", purchaseSchema);

