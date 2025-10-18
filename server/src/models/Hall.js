const mongoose = require("mongoose");

const hallSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    capacity: { type: Number, required: true },
    layout: { type: Object },        // Opcional: filas/columnas o disposición de asientos
    location: { type: String },      // Ubicación de la sala
    isActive: { type: Boolean, default: true }, // Estado activo/inactivo
    description: { type: String },   // Descripción de la sala
  },
  { timestamps: true } // createdAt y updatedAt automáticos
);

module.exports = mongoose.model("Hall", hallSchema);
