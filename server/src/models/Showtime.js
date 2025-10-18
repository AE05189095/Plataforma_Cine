const mongoose = require("mongoose");

const showtimeSchema = new mongoose.Schema(
  {
    // 🎬 Película a la que pertenece la función
    movie: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Movie",
      required: true,
    },

    // 🏛️ Sala en la que se proyecta
    hall: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hall",
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
      default: 0, // ✅ conservado de HEAD
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
    timestamps: true,
  }
);

module.exports = mongoose.model("Showtime", showtimeSchema);
