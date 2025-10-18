const mongoose = require("mongoose");
const Movie = require("../models/Movie");
const Showtime = require("../models/Showtime"); // Importación necesaria para el populate

// 📍 Listar todas las películas con funciones
exports.list = async (req, res) => {
    try {
        // Obtenemos las películas con sus funciones y el nombre de la sala
        const movies = await Movie.find({})
            .populate({
                path: "showtimes", // Campo 'showtimes' en Movie
                model: "Showtime",
                populate: { path: "hall", select: "name" },
            })
            .sort({ createdAt: -1 }) // Últimas creadas primero
            .lean();

        res.json(movies);
    } catch (error) {
        console.error("❌ Error al listar películas:", error);
        res.status(500).json({ message: "Error al obtener películas." });
    }
};

// 🎬 Obtener una película específica por ID o slug
exports.getById = async (req, res) => {
    try {
        const movieIdOrSlug = req.params.id;

        // Verifica si es un ObjectId válido
        const isObjectId = mongoose.Types.ObjectId.isValid(movieIdOrSlug);

        // Buscar por _id o slug
        const query = isObjectId ? { _id: movieIdOrSlug } : { slug: movieIdOrSlug };

        const movie = await Movie.findOne(query)
            .populate({
                path: "showtimes",
                model: "Showtime",
                populate: { path: "hall", select: "name" },
            })
            .lean();

        if (!movie) {
            return res.status(404).json({ message: "Película no encontrada." });
        }

        res.json(movie);
    } catch (error) {
        console.error("❌ Error al obtener película:", error);
        res.status(500).json({ message: "Error interno del servidor." });
    }
};

// ➕ Crear una película
exports.create = async (req, res) => {
    try {
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
        const movie = await Movie.findByIdAndUpdate(req.params.id, req.body, {
            new: true, // Devuelve el documento actualizado
        });

        if (!movie)
            return res.status(404).json({ message: "Película no encontrada." });

        res.json(movie);
    } catch (error) {
        console.error("❌ Error al actualizar película:", error);
        res.status(500).json({ message: "Error al actualizar película." });
    }
};

// ❌ Eliminar película
exports.remove = async (req, res) => {
    try {
        // Eliminamos primero las funciones relacionadas
        await Showtime.deleteMany({ movie: req.params.id }); 

        const movie = await Movie.findByIdAndDelete(req.params.id);
        if (!movie)
            return res.status(404).json({ message: "Película no encontrada." });
        
        res.json({ message: "Película eliminada correctamente." });
    } catch (error) {
        console.error("❌ Error al eliminar película:", error);
        res.status(500).json({ message: "Error al eliminar película." });
    }
};
