<<<<<<< HEAD
const mongoose = require('mongoose');

const purchaseSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    showtime: { type: mongoose.Schema.Types.ObjectId, ref: 'Showtime', required: true },
    seats: [{ type: String, required: true }],
    totalPrice: { type: Number, required: true },
    status: { type: String, enum: ['reserved', 'paid', 'cancelled'], default: 'reserved' },
    paymentInfo: { type: Object },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Purchase', purchaseSchema);
=======
const mongoose = require("mongoose");

const purchaseSchema = new mongoose.Schema({
  showtime: { type: mongoose.Schema.Types.ObjectId, ref: "Showtime", required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },//agregado userId
  seats: [{ type: String, required: true }],
  movieTitle: { type: String },
  hallName: { type: String },
  totalPrice: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Purchase", purchaseSchema);
>>>>>>> mapa-asientos
