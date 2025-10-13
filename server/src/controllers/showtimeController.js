const Showtime = require('../models/Showtime');
const Movie = require('../models/Movie');
const Hall = require('../models/Hall');

exports.list = async (req, res) => {
  try {
    const showtimes = await Showtime.find({ isActive: true })
      .populate('movie')
      .populate('hall')
      .sort({ startAt: 1 })
      .lean();
    res.json(showtimes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.get = async (req, res) => {
  try {
    const { id } = req.params;
    const showtime = await Showtime.findById(id).populate('movie').populate('hall').lean();
    if (!showtime) return res.status(404).json({ message: 'Función no encontrada' });
    res.json(showtime);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Reservar asientos: body { userId, seats: ['A1','A2'] }
exports.reserveSeats = async (req, res) => {
  try {
    const { id } = req.params; // showtime id
    const { seats } = req.body;
    if (!Array.isArray(seats) || seats.length === 0) return res.status(400).json({ message: 'Asientos inválidos' });

    // Hacer la reserva de forma atómica: sólo actualizar si ninguno de los asientos ya está en seatsBooked
    const updated = await Showtime.findOneAndUpdate(
      { _id: id, seatsBooked: { $nin: seats } }, // condición: ninguno de los seats está reservado
      { $push: { seatsBooked: { $each: seats } } },
      { new: true }
    )
      .populate('movie')
      .populate('hall')
      .lean();

    if (!updated) return res.status(409).json({ message: 'Alguno de los asientos ya está reservado' });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
