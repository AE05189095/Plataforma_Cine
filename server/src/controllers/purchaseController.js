const Purchase = require('../models/Purchase');
const Showtime = require('../models/Showtime');

// Crear una compra (reserva) y bloquear asientos
exports.create = async (req, res) => {
  try {
    const { userId, showtimeId, seats } = req.body;
    if (!userId || !showtimeId || !Array.isArray(seats) || seats.length === 0) {
      return res.status(400).json({ message: 'Datos incompletos' });
    }

    // Verificar disponibilidad atómicamente similar al reserveSeats
    // Operación atómica: reservar asientos si están disponibles
    const showtime = await Showtime.findOneAndUpdate(
      { _id: showtimeId, seatsBooked: { $nin: seats } },
      { $push: { seatsBooked: { $each: seats } } },
      { new: true }
    ).lean();

    if (!showtime) return res.status(409).json({ message: 'Alguno de los asientos ya está reservado' });

    // Calcular total según precio del showtime
    const totalPrice = (showtime.price || 0) * seats.length;
    const purchase = await Purchase.create({ user: userId, showtime: showtimeId, seats, totalPrice, status: 'reserved' });
    res.status(201).json(purchase);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Obtener compras de un usuario
exports.listByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const purchases = await Purchase.find({ user: userId }).populate('showtime').lean();
    res.json(purchases);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
