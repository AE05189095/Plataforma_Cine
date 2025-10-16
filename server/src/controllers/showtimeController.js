const Showtime = require("../models/Showtime");

// 🎬 Listar todas las funciones
exports.list = async (req, res) => {
  try {
    const showtimes = await Showtime.find()
      .populate("movie")
      .populate("hall");
    res.json(showtimes);
  } catch (error) {
    console.error("❌ Error al listar funciones:", error);
    res.status(500).json({ message: "Error al listar funciones" });
  }
};

// 🎞️ Obtener una función específica por ID
exports.get = async (req, res) => {
  try {
    const showtime = await Showtime.findById(req.params.id)
      .populate("movie")
      .populate("hall");
    if (!showtime)
      return res.status(404).json({ message: "Función no encontrada" });

    res.json(showtime);
  } catch (error) {
    console.error("❌ Error al obtener función:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

// 🎟️ Obtener mapa de asientos (valor fijo)
exports.getSeats = async (req, res) => {
  try {
    const { id } = req.params;
    const showtime = await Showtime.findById(id).populate("hall");
    if (!showtime)
      return res.status(404).json({ message: "Función no encontrada" });

    // ✅ Valor fijo de asientos
    const totalSeats = 100;

    // Si no hay campo seatsBooked en Mongo, usamos arreglo vacío
    const bookedSeats = showtime.seatsBooked || [];

    // Generamos lista A1...A100
    const availableSeats = Array.from({ length: totalSeats }, (_, i) => `A${i + 1}`)
      .filter((seat) => !bookedSeats.includes(seat));

    res.json({
      _id: showtime._id,
      hall: showtime.hall,
      totalSeats,
      bookedSeats,
      availableSeats,
    });
  } catch (error) {
    console.error("❌ Error al obtener asientos:", error);
    res.status(500).json({ message: "Error al obtener asientos" });
  }
};

// ➕ Crear una nueva función
exports.create = async (req, res) => {
  try {
    const { movie, hall, startAt, price } = req.body;
    const newShowtime = new Showtime({ movie, hall, startAt, price });
    await newShowtime.save();
    res.status(201).json(newShowtime);
  } catch (error) {
    console.error("❌ Error al crear función:", error);
    res.status(500).json({ message: "Error al crear función" });
  }
};

// ✏️ Actualizar una función
exports.update = async (req, res) => {
  try {
    const updated = await Showtime.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!updated)
      return res.status(404).json({ message: "Función no encontrada" });
    res.json(updated);
  } catch (error) {
    console.error("❌ Error al actualizar función:", error);
    res.status(500).json({ message: "Error al actualizar función" });
  }
};

// ❌ Eliminar una función
exports.remove = async (req, res) => {
  try {
    const deleted = await Showtime.findByIdAndDelete(req.params.id);
    if (!deleted)
      return res.status(404).json({ message: "Función no encontrada" });
    res.json({ message: "Función eliminada correctamente" });
  } catch (error) {
    console.error("❌ Error al eliminar función:", error);
    res.status(500).json({ message: "Error al eliminar función" });
  }
};
