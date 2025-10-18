<<<<<<< HEAD
const mongoose = require('mongoose');

const showtimeSchema = new mongoose.Schema(
  {
    movie: { type: mongoose.Schema.Types.ObjectId, ref: 'Movie', required: true },
    hall: { type: mongoose.Schema.Types.ObjectId, ref: 'Hall', required: true },
    startAt: { type: Date, required: true },
    price: { type: Number, required: true, default: 0 },
    seatsBooked: [{ type: String }], // store seat identifiers like 'A3'
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Showtime', showtimeSchema);
=======
const mongoose = require("mongoose");

const showtimeSchema = new mongoose.Schema(
  {
    // 🎬 Película a la que pertenece la función
    movie: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Movie", // 🔗 Debe coincidir exactamente con el nombre del modelo Movie
      required: true,
    },

    // 🏛️ Sala en la que se proyecta
    hall: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hall", // 🔗 Nombre del modelo de salas
      required: true,
    },

    // 🕒 Fecha y hora de inicio
    startAt: {
      type: Date,
      required: true,
    },

    // 💵 Precio de la entrada
    price: {
      type: Number,
      required: true,
      min: 0,
    },

    // 💺 Asientos reservados
    seatsBooked: {
      type: [String],
      default: [],
    },

    // ⚙️ Estado (activo o no)
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true, // createdAt / updatedAt
  }
);

module.exports = mongoose.model("Showtime", showtimeSchema);
>>>>>>> mapa-asientos
