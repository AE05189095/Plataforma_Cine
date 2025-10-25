const Reservation = require('../models/Reserva.js');

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
