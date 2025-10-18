const mongoose = require("mongoose");

const movieSchema = new mongoose.Schema(
  {
    // 🎬 Datos principales
    title: { type: String, required: true },
    slug: { type: String },
    description: { type: String },

    // 🎭 Género único (en singular)
    genre: { type: String },

    // ⏱️ Duración, clasificación y puntaje
    duration: { type: String },
    rating: { type: String },
    score: { type: Number },

    // 🖼️ Imagen principal (no array)
    image: { type: String, default: "" },

    // 👥 Reparto y subtítulos opcionales
    cast: { type: [String], default: [] },
    subtitles: { type: [String], default: [] },

    // ⚙️ Estado
    isActive: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },

    // 🔗 Relación con funciones (Showtimes)
    showtimes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Showtime",
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Movie", movieSchema);
