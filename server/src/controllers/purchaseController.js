// server/src/controllers/purchaseController.js
const mongoose = require('mongoose');
const Purchase = require('../models/Purchase');
const Showtime = require('../models/Showtime');
const Movie = require('../models/Movie'); // necesario para showtimes simulados
const { sendConfirmationEmail } = require('../utils/sendEmail');
const Stripe = require('stripe');
const stripe = process.env.STRIPE_SECRET_KEY ? Stripe(process.env.STRIPE_SECRET_KEY) : null;

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

    try {
      const io = req.app.get('io');
      if (io) io.emit('seatsLocked', { showtimeId, seats: lockedSeats });
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
    const { paymentIntentId } = req.body;
    let { showtimeId, seats } = req.body; // Estos vienen del cliente ahora

    if (!userId || !paymentIntentId) {
      await session.abortTransaction();
      return res.status(400).json({ message: 'Faltan datos del usuario o del pago.' });
    }

    seats = seats.map(s => String(s).trim().toUpperCase()).filter(Boolean);
    seats = Array.from(new Set(seats));

    let showtime = null;
    let movieTitle = null;
    let totalQ = 0;
    let paymentInfo = {};

    // Si el cliente pasó un paymentIntentId, validarlo con Stripe (fuente de verdad)
    if (paymentIntentId && stripe) {
      try {
        const pi = await stripe.paymentIntents.retrieve(paymentIntentId);
        if (pi.status !== 'succeeded') {
          await session.abortTransaction();
          return res.status(400).json({ message: 'Pago no confirmado' });
        }

        // Extraer metadatos guardados al crear el pago
        showtimeId = pi.metadata.showtimeId || showtimeId;
        seats = pi.metadata.seats ? pi.metadata.seats.split(',') : seats;
        totalQ = pi.amount / 100; // Stripe usa centavos

        const charge = pi.charges?.data[0];
        const cardLast4 = charge?.payment_method_details?.card?.last4;
        paymentInfo = { method: 'card', paymentIntentId, card: { last4: cardLast4 } };

      } catch (err) {
        console.error('Error verificando PaymentIntent:', err);
        await session.abortTransaction();
        return res.status(500).json({ message: 'Error verificando pago' });
      }
    }

    const isSimulated = !mongoose.Types.ObjectId.isValid(showtimeId) || showtimeId.includes('-gen-');

    if (isSimulated) {
      const slugMatch = showtimeId.match(/^(.+)-gen-/);
      const movieSlug = slugMatch ? slugMatch[1] : null;
      if (movieSlug) {
        const movieDoc = await Movie.findOne({ slug: movieSlug }).lean();
        movieTitle = movieDoc?.title || 'Película Desconocida';
      } else {
        movieTitle = 'Película Desconocida';
      }
      const todayStr = new Date().toISOString().split('T')[0];
      showtime = {
        _id: showtimeId,
        seatsBooked: [],
        price: 45,
        date: todayStr,
        time: '18:30',
        hall: { name: 'Sala Virtual', capacity: 100 },
        movie: { title: movieTitle },
        startAt: new Date(`${todayStr}T18:30`)
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
        .select('movie hall startAt date time price seatsBooked')
        .session(session);

      if (!showtime) {
        await session.abortTransaction();
        return res.status(404).json({ message: 'Showtime no encontrado' });
      }

      movieTitle = showtime.movie?.title || 'Película Desconocida';
    }

    const confirmationCode = Math.random().toString(36).substring(2, 10).toUpperCase();

    // Crear compra
    const createdPurchase = await Purchase.create([{
      user: userId,
      showtime: showtimeId,
      seats,
      totalPrice: totalQ,
      status: 'reserved',
      paymentInfo: paymentInfo,
      confirmationCode,
      emailSent: false,
    }], { session });

    await session.commitTransaction();

    // Emitir eventos de socket
    try {
      const io = req.app.get('io');
      if (io) {
        const freshShowtime = await Showtime.findById(showtimeId).lean();
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

    // ==========================================================
    // Preparar fecha y hora para correo
    // ==========================================================
    let showtimeDate = showtime.startAt instanceof Date && !isNaN(showtime.startAt)
      ? showtime.startAt
      : new Date(`${showtime.date}T${showtime.time}`);

    let formattedDate = showtimeDate.toLocaleDateString('es-GT', {
      day: 'numeric', month: 'long', year: 'numeric'
    });
    let formattedTime = showtimeDate.toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit', hour12: true });

    const userEmail = req.user?.email || 'correo@falso.com';

    // Enviar correo
    try {
      await sendConfirmationEmail(userEmail, {
        movie: movieTitle,
        date: formattedDate,
        time: formattedTime,
        room: showtime.hall?.name || 'Sala desconocida',
        seat: createdPurchase[0].seats.join(', '),
        total: totalQ.toFixed(2),
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
