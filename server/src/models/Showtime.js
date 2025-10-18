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
      default: 0,
      min: 0, // Buena práctica
    },

    // 💺 Asientos reservados (identificadores como 'A1', 'B5', etc.)
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
    timestamps: true, // createdAt / updatedAt automáticos
  }
);

module.exports = mongoose.model("Showtime", showtimeSchema);
