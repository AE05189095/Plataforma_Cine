// server/src/controllers/showtimeController.js
const mongoose = require('mongoose');
const Showtime = require('../models/Showtime');
const Movie = require('../models/Movie');
const Hall = require('../models/Hall');

const LOCK_DURATION_MINUTES = 10;
const CLEANUP_INTERVAL_MS = 30 * 1000; // cada 30 segundos limpiar locks expirados

// Ordena asientos tipo "A1, A2, B1"
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

  return { seatsLocked: Array.from(new Set(allLockedSeats)), userLockedSeats: Array.from(new Set(userLockedSeats)) };
};

// ==========================================================
// LIMPIEZA AUTOMÁTICA DE LOCKS EXPIRADOS
// ==========================================================
const cleanupExpiredLocks = async () => {
  const now = new Date();
  try {
    const showtimes = await Showtime.find({ 'seatsLocks.0': { $exists: true } });
    for (const showtime of showtimes) {
      const originalLocks = showtime.seatsLocks.length;
      showtime.seatsLocks = (showtime.seatsLocks || []).filter(lock => lock.expiresAt > now);
      if (showtime.seatsLocks.length !== originalLocks) {
        await showtime.save();
        // Emitir evento a todos los clientes conectados para actualizar UI
        if (showtime?.hall && showtime?.movie) {
          const io = require('../../index').io || showtime.io || null;
          if (io) {
            io.emit(`updateLockedSeats-${showtime._id}`, getLockedSeats(showtime));
          }
        }
      }
    }
  } catch (err) {
    console.error('Error limpiando locks expirados:', err);
  }
};

// Ejecutar limpieza automática cada intervalo
setInterval(cleanupExpiredLocks, CLEANUP_INTERVAL_MS);

// ==========================================================
// LISTAR FUNCIONES
// ==========================================================
exports.list = async (req, res) => {
  try {
    const showtimes = await Showtime.find({ isActive: true })
      .populate('movie')
      .populate('hall')
      .sort({ startAt: 1 })
      .lean();

    const withAvailability = showtimes.map(st => {
      const seats = Array.isArray(st.seatsBooked) ? st.seatsBooked.slice() : [];
      sortSeats(seats);
      const capacity = st.hall?.capacity || 0;
      return { ...st, seatsBooked: seats, availableSeats: Math.max(0, capacity - seats.length) };
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
      availableSeats: Math.max(0, capacity - allOccupiedSeats.length),
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

    // Emitir evento a todos los clientes conectados
    if (req.app.locals.io) {
      req.app.locals.io.emit(`updateLockedSeats-${showtime._id}`, { seatsLocked });
    }

    res.json({
      lockedSeats: seatsLocked,
      userLockedSeats,
      expirationTime: userLockedSeats.length > 0 ? newExpiration.toISOString() : null,
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

    // Emitir evento a todos los clientes conectados
    if (req.app.locals.io) {
      req.app.locals.io.emit(`updateReservedSeats-${showtime._id}`, { seatsBooked: seatsArr });
    }

    res.json({ ...updated, seatsBooked: seatsArr, availableSeats: Math.max(0, capacity - seatsArr.length) });

  } catch (err) {
    console.error('showtimeController.reserveSeats ERROR:', err);
    res.status(500).json({ message: 'Error interno del servidor al reservar asientos' });
  }
};

// ==========================================================
// CREAR / ACTUALIZAR / ELIMINAR SHOWTIME (ADMIN)
// ==========================================================

// Helper para formatear date/time
const toYMD = (d) => d.toISOString().slice(0, 10);
const toHHmm = (d) => d.toISOString().slice(11, 16);

// Comprueba solapamiento entre dos intervalos
const overlaps = (aStart, aEnd, bStart, bEnd) => {
  return aStart < bEnd && bStart < aEnd;
};

// Duración por defecto si la película no tiene duration (minutos)
const DEFAULT_DURATION_MIN = 120;

exports.create = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'admin') return res.status(403).json({ message: 'Acceso denegado' });

    const { movie: movieId, hall: hallId, startAt: startAtRaw, price } = req.body;
    if (!movieId || !hallId || !startAtRaw) return res.status(400).json({ message: 'movie, hall y startAt son requeridos' });

    const movie = await Movie.findById(movieId);
    const hall = await Hall.findById(hallId);
    if (!movie) return res.status(404).json({ message: 'Película no encontrada' });
    if (!hall) return res.status(404).json({ message: 'Sala no encontrada' });

    const startAt = new Date(startAtRaw);
    if (isNaN(startAt.getTime())) return res.status(400).json({ message: 'startAt inválido' });

    const durationMin = typeof movie.duration === 'number' && movie.duration > 0 ? movie.duration : DEFAULT_DURATION_MIN;
    const endAt = new Date(startAt.getTime() + durationMin * 60000);

    const existing = await Showtime.find({ hall: hall._id, isActive: true }).populate('movie').lean();
    for (const st of existing) {
      const sStart = new Date(st.startAt);
      const sEnd = st.endAt ? new Date(st.endAt) : new Date(sStart.getTime() + ((st.movie && st.movie.duration) ? st.movie.duration * 60000 : DEFAULT_DURATION_MIN * 60000));
      if (overlaps(startAt, endAt, sStart, sEnd)) {
        return res.status(409).json({ message: `Overlap con otra función en la misma sala (${sStart.toISOString()} - ${sEnd.toISOString()})` });
      }
    }

    const doc = new Showtime({
      movie: movie._id,
      hall: hall._id,
      startAt,
      endAt,
      date: toYMD(startAt),
      time: toHHmm(startAt),
      price: typeof price === 'number' ? price : 0,
      isActive: true,
    });

    await doc.save();
    const populated = await Showtime.findById(doc._id).populate('movie').populate('hall').lean();
    res.status(201).json(populated);
  } catch (err) {
    console.error('showtimeController.create ERROR:', err);
    res.status(500).json({ message: 'Error interno al crear función' });
  }
};

exports.update = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'admin') return res.status(403).json({ message: 'Acceso denegado' });

    const { id } = req.params;
    if (!id) return res.status(400).json({ message: 'ID es requerido' });

    const payload = req.body || {};

    const existing = await Showtime.findById(id);
    if (!existing) return res.status(404).json({ message: 'Función no encontrada' });

    const movieId = payload.movie || existing.movie;
    const hallId = payload.hall || existing.hall;
    const startAt = payload.startAt ? new Date(payload.startAt) : new Date(existing.startAt);

    const movie = await Movie.findById(movieId);
    const hall = await Hall.findById(hallId);
    if (!movie) return res.status(404).json({ message: 'Película no encontrada' });
    if (!hall) return res.status(404).json({ message: 'Sala no encontrada' });

    const durationMin = typeof movie.duration === 'number' && movie.duration > 0 ? movie.duration : DEFAULT_DURATION_MIN;
    const endAt = new Date(startAt.getTime() + durationMin * 60000);

    const others = await Showtime.find({ hall: hallId, isActive: true, _id: { $ne: existing._id } }).populate('movie').lean();
    for (const st of others) {
      const sStart = new Date(st.startAt);
      const sEnd = st.endAt ? new Date(st.endAt) : new Date(sStart.getTime() + ((st.movie && st.movie.duration) ? st.movie.duration * 60000 : DEFAULT_DURATION_MIN * 60000));
      if (overlaps(startAt, endAt, sStart, sEnd)) {
        return res.status(409).json({ message: `Overlap con otra función en la misma sala (${sStart.toISOString()} - ${sEnd.toISOString()})` });
      }
    }

    existing.movie = movie._id;
    existing.hall = hall._id;
    existing.startAt = startAt;
    existing.endAt = endAt;
    existing.date = toYMD(startAt);
    existing.time = toHHmm(startAt);
    if (typeof payload.price === 'number') existing.price = payload.price;
    if (typeof payload.isActive === 'boolean') existing.isActive = payload.isActive;

    await existing.save();
    const populated = await Showtime.findById(existing._id).populate('movie').populate('hall').lean();
    res.json(populated);
  } catch (err) {
    console.error('showtimeController.update ERROR:', err);
    res.status(500).json({ message: 'Error interno al actualizar función' });
  }
};

exports.remove = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'admin') return res.status(403).json({ message: 'Acceso denegado' });

    const { id } = req.params;
    if (!id) return res.status(400).json({ message: 'ID es requerido' });

    const existing = await Showtime.findById(id);
    if (!existing) return res.status(404).json({ message: 'Función no encontrada' });

    existing.isActive = false;
    await existing.save();

    res.json({ message: 'Función desactivada' });
  } catch (err) {
    console.error('showtimeController.remove ERROR:', err);
    res.status(500).json({ message: 'Error interno al eliminar función' });
  }
};
