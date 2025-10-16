const mongoose = require("mongoose");

const movieSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    genres: [String],
    duration: String,
    rating: String,
    score: Number,
    images: [String],
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
