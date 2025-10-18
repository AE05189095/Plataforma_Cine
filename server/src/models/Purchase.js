const mongoose = require("mongoose");

const purchaseSchema = new mongoose.Schema(
  {
    // 🔑 Referencia al usuario
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    // 🔑 Referencia a la función
    showtime: { type: mongoose.Schema.Types.ObjectId, ref: "Showtime", required: true },

    // 🎟️ Asientos comprados
    seats: [{ type: String, required: true }],

    // 💰 Precio total
    totalPrice: { type: Number, required: true },

    // 🛡️ Estado de la compra
    status: { type: String, enum: ["reserved", "paid", "cancelled"], default: "reserved" },
    paymentInfo: { type: Object },

    // 📌 Datos desnormalizados para trazabilidad rápida
    movieTitle: { type: String },
    hallName: { type: String },
  },
  { timestamps: true } // createdAt y updatedAt automáticos
);

module.exports = mongoose.model("Purchase", purchaseSchema);
