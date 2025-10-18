const Purchase = require("../models/Purchase");
const Showtime = require("../models/Showtime");
const Movie = require("../models/Movie"); // Para el populate si hace falta

// 🎟️ Registrar una nueva compra y BLOQUEAR asientos ATÓMICAMENTE
exports.create = async (req, res) => {
    try {
        // Se asume que req.user viene del middleware de autenticación
        const userId = req.user?.userId;
        const { showtimeId, seats } = req.body;

        if (!userId || !showtimeId || !Array.isArray(seats) || seats.length === 0) {
            return res.status(400).json({ message: 'Datos incompletos o usuario no autenticado.' });
        }

        // Obtener detalles de la función
        const showtimeDetails = await Showtime.findById(showtimeId)
            .populate("movie", "title")
            .populate("hall", "name")
            .lean();

        if (!showtimeDetails) {
            return res.status(404).json({ message: "Función no encontrada." });
        }

        // Operación ATÓMICA: agregar asientos solo si ninguno está reservado
        const showtime = await Showtime.findOneAndUpdate(
            { _id: showtimeId, seatsBooked: { $nin: seats } },
            { $push: { seatsBooked: { $each: seats } } },
            { new: true }
        ).lean();

        if (!showtime) {
            return res.status(409).json({ message: 'Error: Uno o más asientos ya fueron reservados.' });
        }

        // Calcular total y registrar la compra
        const totalPrice = seats.length * (showtimeDetails.price || 45);

        const purchase = await Purchase.create({
            user: userId,
            showtime: showtimeId,
            seats,
            totalPrice,
            status: 'confirmed', // Simplificado
            movieTitle: showtimeDetails.movie?.title || "Película desconocida",
            hallName: showtimeDetails.hall?.name || "Sala desconocida",
        });

        return res.status(201).json({
            message: "Compra registrada con éxito y asientos reservados.",
            purchase,
        });
    } catch (error) {
        console.error("Error al registrar la compra:", error);
        res.status(500).json({ message: "Error interno del servidor al registrar la compra." });
    }
};

// 📜 Obtener compras de un usuario
exports.listByUser = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(403).json({ message: "Usuario no autenticado." });
        }

        const purchases = await Purchase.find({ user: userId })
            .populate('showtime', 'startAt price')
            .sort({ createdAt: -1 })
            .lean();

        res.json(purchases);
    } catch (error) {
        console.error("Error al listar compras por usuario:", error);
        res.status(500).json({ message: "Error al obtener las compras." });
    }
};

// 📈 Obtener todas las compras (solo Admin)
exports.listAll = async (req, res) => {
    try {
        const purchases = await Purchase.find()
            .populate("showtime", "startAt price")
            .populate("user", "username email")
            .sort({ createdAt: -1 })
            .lean();

        res.json(purchases);
    } catch (error) {
        console.error("Error al listar todas las compras:", error);
        res.status(500).json({ message: "Error al obtener las compras." });
    }
};

// Nota: 'list' de la rama de asientos se renombró a 'listAll' para evitar confusiones.
