import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const crypto = require('crypto'); // o usa uuid si prefieres
const Purchase = require('../models/Purchase');
const Showtime = require('../models/Showtime');
const sendConfirmationEmail = require('../utils/sendConfirmationEmail'); // asegúrate de tener esta función lista

const generateConfirmationCode = () => crypto.randomBytes(4).toString('hex').toUpperCase();

exports.create = async (req, res) => {
  const session = await Showtime.startSession();
  try {
    const userId = req.userId || req.body.userId;
    const { showtimeId, paymentInfo } = req.body;
    let { seats } = req.body;

    if (!userId || !showtimeId || !Array.isArray(seats) || seats.length === 0) {
      return res.status(400).json({ message: 'Datos incompletos' });
    }

    seats = seats.map((s) => String(s).trim().toUpperCase()).filter(Boolean);
    seats = Array.from(new Set(seats));

    let createdPurchase = null;
    let updatedShowtime = null;

    await session.withTransaction(async () => {
      const st = await Showtime.findOneAndUpdate(
        { _id: showtimeId, seatsBooked: { $nin: seats } },
        { $push: { seatsBooked: { $each: seats } } },
        { new: true, session }
      ).populate('hall').populate('movie'); // <- Asegúrate de tener movie

      if (!st) throw { status: 409, message: 'Alguno de los asientos ya está reservado' };

      const totalPrice = (st.price || 0) * seats.length;

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

      const confirmationCode = generateConfirmationCode();

      createdPurchase = await Purchase.create(
        [{
          user: userId,
          showtime: showtimeId,
          seats,
          totalPrice,
          status: 'reserved',
          paymentInfo: safePayment,
          confirmationCode,
          emailSent: false
        }],
        { session }
      );

      createdPurchase = Array.isArray(createdPurchase) ? createdPurchase[0] : createdPurchase;
      updatedShowtime = st;
    });

    // Enviar correo una vez fuera de la transacción
    try {
      const user = req.user || {};
      const userEmail = user.email || req.body.userEmail;
      const movie = updatedShowtime.movie?.title || 'Película';
      const room = updatedShowtime.hall?.name || 'Sala';
      const date = updatedShowtime.date?.toLocaleDateString() || '';
      const time = updatedShowtime.time || '';
      const seatList = seats.join(', ');
      const code = createdPurchase.confirmationCode;

      await sendConfirmationEmail(userEmail, {
        movie,
        date,
        time,
        room,
        seat: seatList,
        code
      });

      createdPurchase.emailSent = true;
      await createdPurchase.save();
    } catch (err) {
      console.error('Error al enviar el correo de confirmación:', err);
    }

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

