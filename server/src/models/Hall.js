<<<<<<< HEAD
const mongoose = require('mongoose');
=======
const mongoose = require("mongoose");
>>>>>>> mapa-asientos

const hallSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    capacity: { type: Number, required: true },
<<<<<<< HEAD
    layout: { type: Object }, // opcionalmente describir filas/columnas
    location: { type: String },
    isActive: { type: Boolean, default: true },
=======
    description: { type: String },
>>>>>>> mapa-asientos
  },
  { timestamps: true }
);

<<<<<<< HEAD
module.exports = mongoose.model('Hall', hallSchema);
=======
module.exports = mongoose.model("Hall", hallSchema);
>>>>>>> mapa-asientos
