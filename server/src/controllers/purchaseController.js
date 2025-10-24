// server/src/controllers/purchaseController.js
const mongoose = require('mongoose');
const Purchase = require('../models/Purchase');
const Showtime = require('../models/Showtime');
const Movie = require('../models/Movie'); // 🛑 Import necesario
// correo de confirmación
const { sendConfirmationEmail } = require('../utils/sendEmail');

// ==========================================================
// LOCK DE ASIENTOS
// ==========================================================
exports.lockSeats = async (req, res) => {
  try {
    const { showtimeId } = req.params;
    const { seatIds } = req.body;
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ message: 'No autenticado' });
    if (!showtimeId) return res.status(400).json({ message: 'Showtime ID es requerido' });

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

// ==========================================================
// CREAR COMPRA (RESERVA)
// ==========================================================
exports.create = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const userId = req.user?._id;
    const { showtimeId, paymentInfo } = req.body;
    let { seats } = req.body;

    if (!userId || !showtimeId || !Array.isArray(seats) || seats.length === 0) {
      await session.abortTransaction();
      return res.status(400).json({ message: 'Datos incompletos' });
    }

    seats = seats.map(s => String(s).trim().toUpperCase()).filter(Boolean);
    seats = Array.from(new Set(seats));

    let showtime = null;
    let movieTitle = null; // 🛑 Nuevo: título real de la película
    const isSimulated = !mongoose.Types.ObjectId.isValid(showtimeId) || showtimeId.includes('-gen-');

    if (isSimulated) {
      // Extraer slug real de showtime simulado
      const slugMatch = showtimeId.match(/^(.+)-gen-/);
      const movieSlug = slugMatch ? slugMatch[1] : null;

      if (movieSlug) {
        const movieDoc = await Movie.findOne({ slug: movieSlug }).lean();
        movieTitle = movieDoc?.title || 'Película Desconocida';
      } else {
        movieTitle = 'Película Desconocida';
      }

      showtime = {
        _id: showtimeId,
        seatsBooked: [],
        price: 45,
        date: '2025-10-23',
        time: '18:30',
        hall: { name: 'Sala Virtual', capacity: 100 },
        movie: { title: movieTitle },
      };
    } else {
      await Showtime.findByIdAndUpdate(
        showtimeId,
        { $push: { seatsBooked: { $each: seats } } },
        { session }
      );

      showtime = await Showtime.findById(showtimeId)
        .populate('movie')
        .populate('hall')
        .select('movie hall date time price seatsBooked')
        .session(session);

      if (!showtime) {
        await session.abortTransaction();
        return res.status(404).json({ message: 'Showtime no encontrado' });
      }

      movieTitle = showtime.movie?.title || 'Película Desconocida';
    }

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
        let freshShowtime = await Showtime.findById(showtimeId).lean();
        const occupiedSeats = freshShowtime?.seatsBooked || [];

        io.emit('showtimeUpdated', {
          _id: showtimeId,
          seatsBooked: [...occupiedSeats],
          availableSeats: Math.max(0, (showtime.hall?.capacity || 0) - occupiedSeats.length),
        });
        io.emit('seatsLocked', { showtimeId, seats: [] });
      }
    } catch (e) {
      console.error('Error emitiendo eventos:', e);
    }

    // Enviar correo de confirmación
    const fresh = {
      movie: showtime.movie,
      hall: showtime.hall,
      startAt: new Date(`${showtime.date}T${showtime.time}`),
    };

    const userEmail = req.user?.email || 'correo@falso.com';

    try {
      await sendConfirmationEmail(userEmail, {
        movie: movieTitle,
        date: fresh.startAt.toLocaleDateString('es-ES'),
        time: fresh.startAt.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: false }),
        room: fresh.hall.name,
        seat: createdPurchase[0].seats.join(', '),
        total: createdPurchase[0].totalPrice,
        code: confirmationCode
      });
      await Purchase.findByIdAndUpdate(createdPurchase[0]._id, { emailSent: true });
    } catch (emailErr) {
      console.error('❌ Error al enviar correo de confirmación:', emailErr);
    }

    res.status(201).json({ purchase: createdPurchase[0] });
  } catch (err) {
    console.error('Error creando compra:', err);
    await session.abortTransaction();
    res.status(500).json({ message: err.message || 'Error interno del servidor al crear compra' });
  } finally {
    session.endSession();
  }
};

// ==========================================================
// OBTENER COMPRAS DE UN USUARIO
// ==========================================================
exports.listByUser = async (req, res) => {
  try {
    const userId = req.user?._id;
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
