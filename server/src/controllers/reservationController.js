/*const Reservation = require('../models/Reservation.js');

exports.getReservations = async (req, res) => {
  const { movie, date, user, estado } = req.query;
  const filters = {};

  if (movie) filters['showtimeId.movieId.title'] = movie;
  if (date) filters['showtimeId.startTime'] = { $gte: new Date(date) };
  if (user) filters['userId.email'] = user;
  if (estado) filters.estado = estado;
  
  const reservations = await Reservation.find(filters)
      .populate('userId', 'email')
      .populate({
        path: 'showtimeId',
        populate: [
          { path: 'movieId', select: 'title' },
          { path: 'hallId', select: 'name' }
        ]
      });
      
      res.json(reservations);

  
      
};
*/

const Reservation = require('../models/Reservation.js');

exports.getReservations = async (req, res) => {
  const { movie, date, user, estado } = req.query;
  const filters = {};

  if (movie) filters['showtimeId.movieId.title'] = movie;
  if (date) filters['showtimeId.startTime'] = { $gte: new Date(date) };
  if (user) filters['userId.email'] = user;
  if (estado) filters.estado = estado;

  // Si no usás populate, usá esto:
  const reservations = await Reservation.find(filters);
  res.json(reservations);
};

// ✅ ESTA FUNCIÓN DEBE ESTAR FUERA, NO DENTRO DE getReservations
exports.getReservationsRaw = async (req, res) => {
  try {
    const reservations = await Reservation.find({ test: true });
    res.json(reservations);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener reservas embebidas' });
  }
};
