const mongoose = require('mongoose');

const hallSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    // Relación opcional con Movie: permite asociar una sala a una película
    movie: { type: mongoose.Schema.Types.ObjectId, ref: 'Movie' },
    capacity: { type: Number, required: true },
    layout: { type: Object }, // opcionalmente describir filas/columnas
    location: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Hall', hallSchema);
