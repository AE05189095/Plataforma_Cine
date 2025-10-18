const mongoose = require("mongoose");

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
    rating: { type: Number, min: 0, max: 10, default: 0 }, // promedio
    ratingCount: { type: Number, default: 0 }, // cantidad de votos
    score: { type: Number }, // puntuación interna
    posterUrl: { type: String },
    images: [{ type: String }],
    language: { type: String },
    subtitles: [{ type: String }],
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
  {
    timestamps: true,
  }
);


module.exports = mongoose.model("Movie", movieSchema);
