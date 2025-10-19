import { createRequire } from 'module';
const require = createRequire(import.meta.url);


const Purchase = require('../models/Purchase');
const Showtime = require('../models/Showtime');


// Crear una compra (reserva) y bloquear asientos
exports.create = async (req, res) => {
  const session = await Showtime.startSession();
  try {
    // userId preferido desde token (auth middleware)
    const userId = req.userId || req.body.userId;
    const { showtimeId, paymentInfo } = req.body;
    let { seats } = req.body;
    if (!userId || !showtimeId || !Array.isArray(seats) || seats.length === 0) {
      return res.status(400).json({ message: 'Datos incompletos' });
    }

    // Normalizar asientos
    seats = seats.map((s) => String(s).trim().toUpperCase()).filter(Boolean);
    seats = Array.from(new Set(seats));

    let createdPurchase = null;
    let updatedShowtime = null;

    await session.withTransaction(async () => {
      // Intentar reservar los asientos de forma atómica
      const st = await Showtime.findOneAndUpdate(
        { _id: showtimeId, seatsBooked: { $nin: seats } },
        { $push: { seatsBooked: { $each: seats } } },
        { new: true, session }
      ).populate('hall');

      if (!st) {
        // Abortar la transacción lanzando error
        throw { status: 409, message: 'Alguno de los asientos ya está reservado' };
      }

      // Calcular total según precio del showtime
      const totalPrice = (st.price || 0) * seats.length;

      // Sanitizar paymentInfo: mantener solo campos no sensibles
      let safePayment = {};
      try {
        if (paymentInfo && typeof paymentInfo === 'object') {
          const m = paymentInfo.method;
          if (m === 'card' && paymentInfo.card) {
            const c = paymentInfo.card;
            safePayment = {
              method: 'card',
              card: {
                last4: c.last4 || (typeof c.number === 'string' ? String(c.number).slice(-4) : undefined),
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

      createdPurchase = await Purchase.create([{ user: userId, showtime: showtimeId, seats, totalPrice, status: 'reserved', paymentInfo: safePayment }], { session });
      // createdPurchase es un array cuando usamos create([...], {session})
      createdPurchase = Array.isArray(createdPurchase) ? createdPurchase[0] : createdPurchase;

      // obtener showtime actualizado (no lean) y poblar movie/hall fuera de la transacción para evitar problemas
      updatedShowtime = st;
    });

    // Obtener showtime con populate y ordenar seatsBooked antes de responder
    const fresh = await Showtime.findById(showtimeId).populate('movie').populate('hall').lean();
    const seatsArr = Array.isArray(fresh.seatsBooked) ? fresh.seatsBooked.slice() : [];
    seatsArr.sort((a, b) => {
      const pa = /^([A-Za-z]+)(\d+)$/.exec(String(a));
      const pb = /^([A-Za-z]+)(\d+)$/.exec(String(b));
      if (pa && pb) {
        if (pa[1] === pb[1]) return Number(pa[2]) - Number(pb[2]);
        return pa[1].localeCompare(pb[1]);
      }
      return String(a).localeCompare(String(b));
    });
    const capacity = fresh.hall && fresh.hall.capacity ? Number(fresh.hall.capacity) : 0;

    res.status(201).json({
      purchase: createdPurchase,
      showtime: { ...fresh, seatsBooked: seatsArr, availableSeats: Math.max(0, capacity - seatsArr.length) },
    });
    // Emitir evento showtimeUpdated
    try {
      const io = req.app.locals.io;
      if (io) io.emit('showtimeUpdated', { _id: fresh._id, seatsBooked: seatsArr, availableSeats: Math.max(0, capacity - seatsArr.length) });
    } catch (e) {
      console.error('Error emitiendo showtimeUpdated desde purchaseController:', e);
    }
  } catch (err) {
    if (err && err.status === 409) return res.status(409).json({ message: err.message });
    res.status(500).json({ message: err.message || String(err) });
  } finally {
    session.endSession();
  }
};
// Confirmar compra y enviar email de confirmación

const confirmPurchase = async (req, res) => {
  try {
    const { userEmail, movie, date, time, room, seat } = req.body;

    const code = generateConfirmationCode(); // tu función para generar código

    // Guardar la compra en la base de datos (si aplica)

    await sendConfirmationEmail(userEmail, { movie, date, time, room, seat, code });

    res.status(200).json({ message: 'Compra confirmada y correo enviado', code });
  } catch (error) {
    res.status(500).json({ error: 'Error al confirmar la compra' });
  }
};


// Obtener compras de un usuario
exports.listByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const purchases = await Purchase.find({ user: userId }).populate('showtime').lean();
    res.json(purchases);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
