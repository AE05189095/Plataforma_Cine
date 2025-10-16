const mongoose = require("mongoose");

const purchaseSchema = new mongoose.Schema({
  showtime: { type: mongoose.Schema.Types.ObjectId, ref: "Showtime", required: true },
  seats: [{ type: String, required: true }],
  movieTitle: { type: String },
  hallName: { type: String },
  totalPrice: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Purchase", purchaseSchema);
