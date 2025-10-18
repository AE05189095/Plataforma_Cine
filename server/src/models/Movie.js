<<<<<<< HEAD
const mongoose = require('mongoose');

const movieSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String },
    genres: [{ type: String }],
    duration: { type: Number }, // minutos
    director: { type: String },
    cast: [{ type: String }],
    releaseDate: { type: Date },
    rating: { type: Number, min: 0, max: 10, default: 0 },
    ratingCount: { type: Number, default: 0 },
    posterUrl: { type: String },
    images: [{ type: String }],
    language: { type: String },
    subtitles: [{ type: String }],
    isActive: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
=======
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
>>>>>>> mapa-asientos
  },
  { timestamps: true }
);

<<<<<<< HEAD
module.exports = mongoose.model('Movie', movieSchema);
=======
module.exports = mongoose.model("Movie", movieSchema);
>>>>>>> mapa-asientos
