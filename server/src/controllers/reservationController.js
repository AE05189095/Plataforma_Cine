const Reservation = require('../models/Reservation');

exports.getAllReservations = async (req, res) => {
  try {
    const reservations = await Reservation.find({})
      .populate({
        path: 'showtimeId',
        populate: [
          { path: 'movie', model: 'Movie', select: 'title' },
          { path: 'hall', model: 'Hall', select: 'name' }
        ]
      })
      .populate('userId', 'email') // Trae solo el email del usuario
      .sort({ createdAt: -1 });

    res.json(reservations);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener las reservas', error: error.message });
  }
};