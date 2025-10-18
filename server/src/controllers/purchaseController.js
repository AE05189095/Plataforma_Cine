// 📁 server/src/controllers/purchaseController.js

const Purchase = require("../models/Purchase");
const Showtime = require("../models/Showtime");
const Movie = require("../models/Movie");
const User = require("../models/User"); //importar el modelo User
const { sendConfirmationEmail } = require("../utils/emailService");


// 🎟️ Registrar una nueva compra
exports.create = async (req, res) => {
  try {
    const { showtimeId, seats } = req.body;
    const userId = req.userId; // Obtener userId del middleware de autenticación

    if (!showtimeId || !Array.isArray(seats) || seats.length === 0) {
      return res.status(400).json({ message: "Datos incompletos." });
    }

    // 🧭 Buscar función
    const showtime = await Showtime.findById(showtimeId)
      .populate("movie", "title")
      .populate("hall", "name");

    if (!showtime) {
      return res.status(404).json({ message: "Función no encontrada." });
    }

    // ⚠️ Verificar que los asientos no estén ya ocupados
    const alreadyBooked = seats.some((s) => showtime.seatsBooked.includes(s));
    if (alreadyBooked) {
      return res.status(400).json({ message: "Uno o más asientos ya están ocupados." });
    }

    
    // ✅ Registrar compra
    const purchase = new Purchase({
      userId, // Guardar userId en la compra
      showtime: showtimeId,
      seats,
      movieTitle: showtime.movie?.title || "Película desconocida",
      hallName: showtime.hall?.name || "Sala desconocida",
      totalPrice: seats.length * (showtime.price || 45),
      createdAt: new Date(),
    });

    await purchase.save();

    // 👤 Buscar email del usuario
    const user = await User.findById(userId);
    // ✉️ Enviar email de confirmación
    const previewUrl = await sendConfirmationEmail(user.email, purchase);

    // 🪑 Marcar los asientos como ocupados en la función
    showtime.seatsBooked.push(...seats);
    await showtime.save();

    return res.status(201).json({
      message: "Compra registrada con éxito.",
      purchase,
      preview: previewUrl, // solo para pruebas con Ethereal
    });
  } catch (error) {
    console.error("Error al registrar la compra:", error);
    res.status(500).json({ message: "Error al registrar la compra." });
  }
};

// 📜 Obtener todas las compras (opcional para debug o panel admin)
exports.list = async (req, res) => {
  try {
    const purchases = await Purchase.find()
      .populate("showtime", "startAt price")
      .sort({ createdAt: -1 });
    res.json(purchases);
  } catch (error) {
    console.error("Error al listar compras:", error);
    res.status(500).json({ message: "Error al obtener las compras." });
  }
};

// 📜 Obtener compras del usuario autenticado
exports.listByUser = async (req, res) => {
  try {
    const purchases = await Purchase.find({ userId: req.userId })
      .populate("showtime", "startAt price")
      .sort({ createdAt: -1 });
    res.json(purchases);
  } catch (error) {
    console.error("Error al obtener compras del usuario:", error);
    res.status(500).json({ message: "Error al obtener tus compras." });
  }
};
