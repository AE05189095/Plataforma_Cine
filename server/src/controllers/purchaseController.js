// server/src/controllers/purchaseController.js
const mongoose = require('mongoose');
const Purchase = require('../models/Purchase');
const Showtime = require('../models/Showtime');
const SeatLock = require('../models/SeatLock');

// Lock/Unlock de asientos
exports.lockSeats = async (req, res) => {
  try {
    const { showtimeId } = req.params;
    const { seatIds } = req.body;
    const userId = req.user._id;

    if (!showtimeId) return res.status(400).json({ message: 'Showtime ID es requerido' });

    // Para modo demo - si showtimeId es simulado
    let showtimeExists = true;
    if (showtimeId.includes('-gen-')) showtimeExists = false;
    else {
      const showtimeCheck = await Showtime.findById(showtimeId);
      if (!showtimeCheck) return res.status(404).json({ message: 'Showtime no encontrado' });
    }

    const normalizedSeatIds = Array.isArray(seatIds)
      ? seatIds.map(s => String(s).trim().toUpperCase()).filter(Boolean)
      : [];

    const lockedSeats = normalizedSeatIds;
    const userLockedSeats = normalizedSeatIds;
    const expirationTime = new Date(Date.now() + 10 * 60 * 1000); // 10 minutos

    // Emitir evento sockets
    try {
      const io = req.app.get('io');
      if (io) {
        io.emit('seatsLocked', { showtimeId, seats: lockedSeats });
      }
    } catch (e) {
      console.error('Error emitiendo seatsLocked:', e);
    }

    res.json({
      lockedSeats,
      userLockedSeats,
      expirationTime: expirationTime.toISOString(),
    });
  } catch (err) {
    console.error('Error in lockSeats:', err);
    res.status(500).json({ message: err.message || 'Error interno del servidor al procesar locks' });
  }
};

// Crear una compra (reserva)
exports.create = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const userId = req.user._id;
    const { showtimeId, paymentInfo } = req.body;
    let { seats } = req.body;

    if (!userId || !showtimeId || !Array.isArray(seats) || seats.length === 0) {
      await session.abortTransaction();
      return res.status(400).json({ message: 'Datos incompletos' });
    }

    // Normalizar asientos
    seats = seats.map(s => String(s).trim().toUpperCase()).filter(Boolean);
    seats = Array.from(new Set(seats));

    // ===============================
    // Manejo de showtime simulado
    // ===============================
    let showtime = null;
    if (showtimeId.includes('-gen-')) {
      showtime = {
        _id: showtimeId,
        seatsBooked: [],
        price: 45,
        hall: { name: 'Sala Demo', capacity: 100 },
        movie: { title: 'Película Demo' },
      };
    } else {
      showtime = await Showtime.findById(showtimeId).session(session);
      if (!showtime) {
        await session.abortTransaction();
        return res.status(404).json({ message: 'Showtime no encontrado' });
      }
    }

    // Verificar que los asientos no estén ocupados
    const occupiedSeats = showtime.seatsBooked || [];
    const alreadyOccupied = seats.filter(seat => occupiedSeats.includes(seat));
    if (alreadyOccupied.length > 0) {
      await session.abortTransaction();
      return res.status(409).json({
        message: `Los siguientes asientos ya están ocupados: ${alreadyOccupied.join(', ')}`,
      });
    }

    // Actualizar showtime real si no es simulado
    if (!showtimeId.includes('-gen-')) {
      await Showtime.findByIdAndUpdate(
        showtimeId,
        { $push: { seatsBooked: { $each: seats } } },
        { new: true, session }
      );
    }

    // Calcular total
    const totalPrice = (showtime.price || 45) * seats.length;

    // Sanitizar paymentInfo
    let safePayment = {};
    try {
      if (paymentInfo && typeof paymentInfo === 'object') {
        const m = paymentInfo.method;
        if (m === 'card' && paymentInfo.card) {
          const c = paymentInfo.card;
          safePayment = {
            method: 'card',
            card: {
              last4: c.number ? String(c.number).slice(-4) : undefined,
              name: c.name || undefined,
              expMonth: c.expMonth || undefined,
              expYear: c.expYear || undefined,
            },
          };
        } else if (m === 'paypal' && paymentInfo.paypal) {
          safePayment = { method: 'paypal', paypal: { email: paymentInfo.paypal.email || '' } };
        }
      }
    } catch (e) {
      console.warn('Error sanitizando paymentInfo:', e);
      safePayment = {};
    }

    const confirmationCode = Math.random().toString(36).substring(2, 10).toUpperCase();

    // Crear compra
    const createdPurchase = await Purchase.create([{
      user: userId,
      showtime: showtimeId,
      seats,
      totalPrice,
      status: 'reserved',
      paymentInfo: safePayment,
      confirmationCode,
      emailSent: false,
    }], { session });

    await session.commitTransaction();

    // Emitir eventos de socket
    try {
      const io = req.app.get('io');
      if (io) {
        const seatsArr = [...occupiedSeats, ...seats];
        io.emit('showtimeUpdated', {
          _id: showtimeId,
          seatsBooked: seatsArr,
          availableSeats: Math.max(0, (showtime.hall?.capacity || 0) - seatsArr.length),
        });
        io.emit('seatsLocked', { showtimeId, seats: [] });
      }
    } catch (e) {
      console.error('Error emitiendo eventos:', e);
    }

    res.status(201).json({
      purchase: createdPurchase[0],
      showtime: showtime,
    });

  } catch (err) {
    await session.abortTransaction();
    console.error('Error in create purchase:', err);
    res.status(500).json({ message: err.message || 'Error interno al crear compra' });
  } finally {
    session.endSession();
  }
};

// Obtener compras de un usuario
exports.listByUser = async (req, res) => {
  try {
    const userId = req.user._id;
    const purchases = await Purchase.find({ user: userId })
      .populate({
        path: 'showtime',
        populate: [
          { path: 'movie', model: 'Movie' },
          { path: 'hall', model: 'Hall' }
        ]
      })
      .sort({ createdAt: -1 })
      .lean();

    res.json(purchases);
  } catch (err) {
    console.error('Error listing user purchases:', err);
    res.status(500).json({ message: 'Error al obtener las compras' });
  }
};
