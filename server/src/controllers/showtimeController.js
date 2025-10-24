const mongoose = require('mongoose');
const Showtime = require('../models/Showtime');
const Hall = require('../models/Hall'); // ✅ Importar modelo Hall

// Duración del bloqueo en minutos
const LOCK_DURATION_MINUTES = 10;

// Función para ordenar asientos tipo "A1, A2, B1"
const sortSeats = (seats) => {
  seats.sort((a, b) => {
    const pa = /^([A-Za-z]+)(\d+)$/.exec(String(a));
    const pb = /^([A-Za-z]+)(\d+)$/.exec(String(b));
    if (pa && pb) {
      if (pa[1] === pb[1]) return Number(pa[2]) - Number(pb[2]);
      return pa[1].localeCompare(pb[1]);
    }
    return String(a).localeCompare(String(b));
  });
};

// Obtener asientos bloqueados y del usuario
const getLockedSeats = (showtime, currentUserId) => {
  let allLockedSeats = [];
  let userLockedSeats = [];

  const now = new Date();
  const activeLocks = (showtime.seatsLocks || []).filter(lock => lock.expiresAt > now);

  for (const lock of activeLocks) {
    const lockUserIdString = lock.userId ? lock.userId.toString() : null;
    const validSeats = (lock.seats || []).filter(seat => !(showtime.seatsBooked || []).includes(seat));
    allLockedSeats.push(...validSeats);
    if (currentUserId && lockUserIdString === currentUserId.toString()) {
      userLockedSeats.push(...validSeats);
    }
  }

  return {
    seatsLocked: Array.from(new Set(allLockedSeats)),
    userLockedSeats: Array.from(new Set(userLockedSeats))
  };
};

// ==========================================================
// LISTAR FUNCIONES
// ==========================================================
exports.list = async (req, res) => {
  try {
    const showtimes = await Showtime.find({ isActive: true })
      .populate('movie')
      .populate('hall') // ✅ Ahora Hall está registrado
      .sort({ startAt: 1 })
      .lean();

    const withAvailability = showtimes.map(st => {
      const seats = Array.isArray(st.seatsBooked) ? st.seatsBooked.slice() : [];
      sortSeats(seats);
      const capacity = st.hall?.capacity || 0;
      return {
        ...st,
        seatsBooked: seats,
        availableSeats: Math.max(0, capacity - seats.length)
      };
    });

    res.json(withAvailability);
  } catch (err) {
    console.error('showtimeController.list ERROR:', err);
    res.status(500).json({ message: 'Error interno del servidor al listar horarios' });
  }
};

// ==========================================================
// OBTENER UNA FUNCION POR ID O SLUG
// ==========================================================
exports.get = async (req, res) => {
  try {
    const { id } = req.params;
    let showtime;

    if (mongoose.isValidObjectId(id)) {
      showtime = await Showtime.findById(id).populate('movie').populate('hall').lean();
    } else {
      showtime = await Showtime.findOne({ slug: id }).populate('movie').populate('hall').lean();
    }

    if (!showtime) return res.status(404).json({ message: 'Función no encontrada' });

    const booked = showtime.seatsBooked || [];
    const { seatsLocked } = getLockedSeats(showtime, req.user?._id);
    const allOccupiedSeats = Array.from(new Set([...booked, ...seatsLocked]));
    sortSeats(allOccupiedSeats);

    const capacity = showtime.hall?.capacity || 0;

    res.json({
      ...showtime,
      seatsBooked: booked,
      seatsLocked,
      availableSeats: Math.max(0, capacity - allOccupiedSeats.length)
    });
  } catch (err) {
    console.error('showtimeController.get ERROR:', err);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// ==========================================================
// BLOQUEO DE ASIENTOS
// ==========================================================
exports.lockSeats = async (req, res) => {
  try {
    if (!req.user || !req.user._id) return res.status(401).json({ message: 'No autenticado' });

    const showtimeId = req.params.id;
    if (!showtimeId) return res.status(400).json({ message: 'ID de showtime inválido.' });

    let seatIds = req.body.seatIds || [];
    if (!Array.isArray(seatIds)) seatIds = [];
    seatIds = Array.from(new Set(seatIds.map(s => String(s).trim().toUpperCase()).filter(Boolean)));

    let showtime;
    if (mongoose.isValidObjectId(showtimeId)) {
      showtime = await Showtime.findById(showtimeId);
    } else {
      showtime = await Showtime.findOne({ slug: showtimeId });
    }

    if (!showtime) return res.status(404).json({ message: 'Función no encontrada' });

    const booked = showtime.seatsBooked || [];
    const currentlyLockedByOthers = (showtime.seatsLocks || [])
      .filter(lock => lock.expiresAt > new Date() && lock.userId.toString() !== req.user._id.toString())
      .flatMap(lock => lock.seats);

    const unavailable = Array.from(new Set([...booked, ...currentlyLockedByOthers]));
    const validSeatsToLock = seatIds.filter(seat => !unavailable.includes(seat));
    const newExpiration = new Date(Date.now() + LOCK_DURATION_MINUTES * 60000);

    if (validSeatsToLock.length > 0) {
      const updated = await Showtime.findOneAndUpdate(
        { _id: showtime._id, 'seatsLocks.userId': req.user._id },
        { $set: { 'seatsLocks.$.seats': validSeatsToLock, 'seatsLocks.$.expiresAt': newExpiration } },
        { new: true }
      );

      if (!updated) {
        await Showtime.findByIdAndUpdate(showtime._id, {
          $push: { seatsLocks: { userId: req.user._id, seats: validSeatsToLock, expiresAt: newExpiration } }
        });
      }
    } else {
      await Showtime.findByIdAndUpdate(showtime._id, { $pull: { seatsLocks: { userId: req.user._id } } });
    }

    const freshShowtime = await Showtime.findById(showtime._id).lean();
    const { seatsLocked, userLockedSeats } = getLockedSeats(freshShowtime, req.user._id);

    res.json({
      lockedSeats: seatsLocked,
      userLockedSeats,
      expirationTime: userLockedSeats.length > 0 ? newExpiration.toISOString() : null
    });

  } catch (err) {
    console.error('showtimeController.lockSeats ERROR:', err);
    res.status(500).json({ message: 'Error interno del servidor al bloquear asientos' });
  }
};

// ==========================================================
// RESERVAR ASIENTOS
// ==========================================================
exports.reserveSeats = async (req, res) => {
  try {
    if (!req.user || !req.user._id) return res.status(401).json({ message: 'No autenticado' });

    const showtimeId = req.params.id;
    let seats = req.body.seats || [];
    seats = Array.from(new Set(seats.map(s => String(s).trim().toUpperCase()).filter(Boolean)));

    let showtime;
    if (mongoose.isValidObjectId(showtimeId)) {
      showtime = await Showtime.findById(showtimeId);
    } else {
      showtime = await Showtime.findOne({ slug: showtimeId });
    }

    if (!showtime) return res.status(404).json({ message: 'Función no encontrada' });

    const updated = await Showtime.findOneAndUpdate(
      { _id: showtime._id, seatsBooked: { $nin: seats } },
      { $push: { seatsBooked: { $each: seats } }, $pull: { seatsLocks: { userId: req.user._id } } },
      { new: true }
    ).populate('movie').populate('hall').lean();

    if (!updated) return res.status(409).json({ message: 'Algunos asientos ya están reservados.' });

    const seatsArr = updated.seatsBooked.slice();
    sortSeats(seatsArr);
    const capacity = updated.hall?.capacity || 0;

    res.json({ ...updated, seatsBooked: seatsArr, availableSeats: Math.max(0, capacity - seatsArr.length) });

  } catch (err) {
    console.error('showtimeController.reserveSeats ERROR:', err);
    res.status(500).json({ message: 'Error interno del servidor al reservar asientos' });
  }
};
