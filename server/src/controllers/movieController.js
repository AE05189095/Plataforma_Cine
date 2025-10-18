<<<<<<< HEAD
const Movie = require('../models/Movie');

exports.list = async (req, res) => {
  try {
    const movies = await Movie.find({ isActive: true }).sort({ createdAt: -1 }).lean();
    res.json(movies);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const movie = await Movie.findOne({ slug }).lean();
    if (!movie) return res.status(404).json({ message: 'Película no encontrada' });
    res.json(movie);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const payload = req.body;
    // Slug generation si falta
    if (!payload.slug && payload.title) {
      payload.slug = payload.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    }
    const movie = await Movie.create(payload);
    res.status(201).json(movie);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await Movie.findByIdAndUpdate(id, req.body, { new: true });
    if (!updated) return res.status(404).json({ message: 'Película no encontrada' });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const { id } = req.params;
    await Movie.findByIdAndDelete(id);
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ message: err.message });
=======
const mongoose = require("mongoose");
const Movie = require("../models/Movie");
const Showtime = require("../models/Showtime");

// 📍 Listar todas las películas con funciones
exports.list = async (req, res) => {
  try {
    const movies = await Movie.find()
      .populate({
        path: "showtimes",
        model: "Showtime",
        populate: { path: "hall", select: "name" },
      })
      .lean();

    const baseUrl = `${req.protocol}://${req.get("host")}`;

    // 🧩 Corregimos imágenes y géneros antes de enviar
    const formattedMovies = movies.map((movie) => {
      let imageUrl = "";

      // 🖼️ Si tiene campo "image" válido
      if (movie.image && movie.image.trim() !== "") {
        imageUrl = movie.image;
      }
      // 🖼️ Si tiene array "images"
      else if (movie.images && movie.images.length > 0) {
        imageUrl = movie.images[0];
      }

      // 🔧 Limpiar rutas y convertir a URL completa
      if (imageUrl && !imageUrl.startsWith("http")) {
        imageUrl = `${baseUrl}/images/${imageUrl.replace(/^\/?images\//, "")}`;
      }

      // 🎭 Obtener género
      let genre = movie.genre || (Array.isArray(movie.genres) ? movie.genres[0] : "");

      return {
        ...movie,
        image: imageUrl || `${baseUrl}/images/default-poster.jpg`,
        genre,
      };
    });

    res.json(formattedMovies);
  } catch (error) {
    console.error("❌ Error al listar películas:", error);
    res.status(500).json({ message: "Error al obtener películas." });
  }
};

// 🎬 Obtener una película específica por ID o slug
exports.getById = async (req, res) => {
  try {
    const movieIdOrSlug = req.params.id;

    const movie = await Movie.findOne({
      $or: [
        { _id: mongoose.isValidObjectId(movieIdOrSlug) ? movieIdOrSlug : null },
        { slug: movieIdOrSlug },
      ],
    })
      .populate({
        path: "showtimes",
        model: "Showtime",
        populate: { path: "hall", select: "name" },
      })
      .lean();

    if (!movie) {
      return res.status(404).json({ message: "Película no encontrada." });
    }

    const baseUrl = `${req.protocol}://${req.get("host")}`;

    // 🖼️ Procesar imagen
    let imageUrl = "";
    if (movie.image && movie.image.trim() !== "") {
      imageUrl = movie.image;
    } else if (movie.images && movie.images.length > 0) {
      imageUrl = movie.images[0];
    }

    if (imageUrl && !imageUrl.startsWith("http")) {
      imageUrl = `${baseUrl}/images/${imageUrl.replace(/^\/?images\//, "")}`;
    }

    const genre = movie.genre || (Array.isArray(movie.genres) ? movie.genres[0] : "");

    res.json({ ...movie, image: imageUrl || `${baseUrl}/images/default-poster.jpg`, genre });
  } catch (error) {
    console.error("❌ Error al obtener película:", error);
    res.status(500).json({ message: "Error interno del servidor." });
  }
};

// ➕ Crear película
exports.create = async (req, res) => {
  try {
    if (req.body.image && req.body.image.includes("/images/")) {
      req.body.image = req.body.image.replace(/^\/?images\//, "");
    }

    const movie = new Movie(req.body);
    await movie.save();
    res.status(201).json(movie);
  } catch (error) {
    console.error("❌ Error al crear película:", error);
    res.status(500).json({ message: "Error al crear película." });
  }
};

// ✏️ Actualizar película
exports.update = async (req, res) => {
  try {
    if (req.body.image && req.body.image.includes("/images/")) {
      req.body.image = req.body.image.replace(/^\/?images\//, "");
    }

    const movie = await Movie.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!movie) return res.status(404).json({ message: "Película no encontrada." });

    res.json(movie);
  } catch (error) {
    console.error("❌ Error al actualizar película:", error);
    res.status(500).json({ message: "Error al actualizar película." });
  }
};

// ❌ Eliminar película
exports.remove = async (req, res) => {
  try {
    const movie = await Movie.findByIdAndDelete(req.params.id);
    if (!movie) return res.status(404).json({ message: "Película no encontrada." });

    res.json({ message: "Película eliminada correctamente." });
  } catch (error) {
    console.error("❌ Error al eliminar película:", error);
    res.status(500).json({ message: "Error al eliminar película." });
>>>>>>> mapa-asientos
  }
};
