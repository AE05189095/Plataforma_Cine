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
    // Calcular asientos disponibles y ordenar seatsBooked antes de enviar
    const withAvailability = showtimes.map((st) => {
      let seats = [];
      if (Array.isArray(st.seatsBookedMap) && st.seatsBookedMap.length) seats = st.seatsBookedMap.map(x => x.seat);
      else seats = Array.isArray(st.seatsBooked) ? st.seatsBooked.slice() : [];
      // orden sencillo: letras antes de números (A10 after A2)
      seats.sort((a, b) => {
        const pa = /^([A-Za-z]+)(\d+)$/.exec(String(a));
        const pb = /^([A-Za-z]+)(\d+)$/.exec(String(b));
        if (pa && pb) {
          if (pa[1] === pb[1]) return Number(pa[2]) - Number(pb[2]);
          return pa[1].localeCompare(pb[1]);
        }
        return String(a).localeCompare(String(b));
      });
      const capacity = st.hall && st.hall.capacity ? Number(st.hall.capacity) : 0;
      return { ...st, seatsBooked: seats, availableSeats: Math.max(0, capacity - seats.length) };
    });
    res.json(withAvailability);
  } catch (err) {
    console.error('showtimeController.list error:', err);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

exports.get = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ message: 'ID es requerido' });
    const showtime = await Showtime.findById(id).populate('movie').populate('hall').lean();
    if (!showtime) return res.status(404).json({ message: 'Función no encontrada' });
  let seats = [];
  if (Array.isArray(showtime.seatsBookedMap) && showtime.seatsBookedMap.length) seats = showtime.seatsBookedMap.map(x => x.seat);
  else seats = Array.isArray(showtime.seatsBooked) ? showtime.seatsBooked.slice() : [];
    seats.sort((a, b) => {
      const pa = /^([A-Za-z]+)(\d+)$/.exec(String(a));
      const pb = /^([A-Za-z]+)(\d+)$/.exec(String(b));
      if (pa && pb) {
        if (pa[1] === pb[1]) return Number(pa[2]) - Number(pb[2]);
        return pa[1].localeCompare(pb[1]);
      }
      return String(a).localeCompare(String(b));
    });
    const capacity = showtime.hall && showtime.hall.capacity ? Number(showtime.hall.capacity) : 0;
    res.json({ ...showtime, seatsBooked: seats, availableSeats: Math.max(0, capacity - seats.length) });
  } catch (err) {
    console.error('showtimeController.get error:', err);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// Reservar asientos: body { userId, seats: ['A1','A2'] }
exports.reserveSeats = async (req, res) => {
  try {
    const { id } = req.params; // showtime id
    let { seats } = req.body;
    if (!Array.isArray(seats) || seats.length === 0) return res.status(400).json({ message: 'Asientos inválidos' });

    // Normalizar entradas: strings, mayúsculas y sin espacios
    seats = seats.map((s) => String(s).trim().toUpperCase()).filter(Boolean);
    // eliminar duplicados locales
    seats = Array.from(new Set(seats));

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

    // ordenar seatsBooked y calcular availableSeats antes de responder
    const seatsArr = Array.isArray(updated.seatsBooked) ? updated.seatsBooked.slice() : [];
    seatsArr.sort((a, b) => {
      const pa = /^([A-Za-z]+)(\d+)$/.exec(String(a));
      const pb = /^([A-Za-z]+)(\d+)$/.exec(String(b));
      if (pa && pb) {
        if (pa[1] === pb[1]) return Number(pa[2]) - Number(pb[2]);
        return pa[1].localeCompare(pb[1]);
      }
      return String(a).localeCompare(String(b));
    });
    const capacity = updated.hall && updated.hall.capacity ? Number(updated.hall.capacity) : 0;
    // Emitir evento en tiempo real
    try {
      const io = req.app.locals.io;
      if (io) io.emit('showtimeUpdated', { _id: updated._id, seatsBooked: seatsArr, availableSeats: Math.max(0, capacity - seatsArr.length) });
    } catch (e) {
      console.error('Error emitiendo showtimeUpdated:', e);
    }

    res.json({ ...updated, seatsBooked: seatsArr, availableSeats: Math.max(0, capacity - seatsArr.length) });
  } catch (err) {
    console.error('showtimeController.reserveSeats error:', err);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};
