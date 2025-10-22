const mongoose = require('mongoose');
const Purchase = require('../models/Purchase');
const Showtime = require('../models/Showtime');
const SeatLock = require('../models/SeatLock');

// Lock/Unlock de asientos
exports.lockSeats = async (req, res) => {
  try {
    const { showtimeId } = req.params;
    const { seatIds } = req.body;
    const userId = req.user.id;

    console.log(`Lock seats request - User: ${userId}, Showtime: ${showtimeId}, Seats:`, seatIds);

    if (!showtimeId) {
      return res.status(400).json({ message: 'Showtime ID es requerido' });
    }

    // Verificar que el showtime existe
    const showtime = await Showtime.findById(showtimeId);
    if (!showtime) {
      return res.status(404).json({ message: 'Showtime no encontrado' });
    }

    // Normalizar seatIds
    const normalizedSeatIds = Array.isArray(seatIds) 
      ? seatIds.map(s => String(s).trim().toUpperCase()).filter(Boolean)
      : [];

    // Para modo demo - simular locks sin base de datos
    const lockedSeats = normalizedSeatIds;
    const userLockedSeats = normalizedSeatIds;
    const expirationTime = new Date(Date.now() + 10 * 60 * 1000); // 10 minutos

    // Emitir evento de sockets para actualizar otros clientes
    try {
      const io = req.app.get('io');
      if (io) {
        io.emit('seatsLocked', {
          showtimeId,
          seats: lockedSeats
        });
      }
    } catch (e) {
      console.error('Error emitiendo seatsLocked:', e);
    }

    res.json({
      lockedSeats,
      userLockedSeats,
      expirationTime: expirationTime.toISOString()
    });

  } catch (err) {
    console.error('Error in lockSeats:', err);
    res.status(500).json({ 
      message: err.message || 'Error interno del servidor al procesar locks' 
    });
  }
};

// Crear una compra (reserva)
exports.create = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const userId = req.user.id;
    const { showtimeId, paymentInfo } = req.body;
    let { seats } = req.body;

    if (!userId || !showtimeId || !Array.isArray(seats) || seats.length === 0) {
      await session.abortTransaction();
      return res.status(400).json({ message: 'Datos incompletos' });
    }

    // Normalizar asientos
    seats = seats.map((s) => String(s).trim().toUpperCase()).filter(Boolean);
    seats = Array.from(new Set(seats));

    let createdPurchase = null;

    // Verificar que el showtime existe
    const showtime = await Showtime.findById(showtimeId).session(session);
    if (!showtime) {
      await session.abortTransaction();
      return res.status(404).json({ message: 'Showtime no encontrado' });
    }

    // Verificar que los asientos no estén ya ocupados
    const occupiedSeats = showtime.seatsBooked || [];
    const alreadyOccupied = seats.filter(seat => occupiedSeats.includes(seat));
    
    if (alreadyOccupied.length > 0) {
      await session.abortTransaction();
      return res.status(409).json({ 
        message: `Los siguientes asientos ya están ocupados: ${alreadyOccupied.join(', ')}` 
      });
    }

    // Actualizar showtime - agregar asientos a seatsBooked
    const updatedShowtime = await Showtime.findByIdAndUpdate(
      showtimeId,
      { $push: { seatsBooked: { $each: seats } } },
      { new: true, session }
    ).populate('movie').populate('hall');

    // Calcular total según precio del showtime
    const totalPrice = (updatedShowtime.price || 45) * seats.length;

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
              last4: c.last4 || (typeof c.number === 'string' ? String(c.number).slice(-4) : undefined),
              name: c.name || undefined,
              expMonth: c.expMonth || undefined,
              expYear: c.expYear || undefined,
            },
          };
        } else if (m === 'paypal' && paymentInfo.paypal) {
          safePayment = { 
            method: 'paypal', 
            paypal: { email: paymentInfo.paypal.email || '' } 
          };
        }
      }
    } catch (e) {
      console.warn('Error sanitizando paymentInfo:', e);
      safePayment = {};
    }

    const confirmationCode = Math.random().toString(36).substring(2, 10).toUpperCase();
    
    // Crear la compra
    createdPurchase = await Purchase.create([{
      user: userId,
      showtime: showtimeId,
      seats,
      totalPrice,
      status: 'reserved',
      paymentInfo: safePayment,
      confirmationCode,
      emailSent: false
    }], { session });

    createdPurchase = createdPurchase[0];

    await session.commitTransaction();

    // Obtener showtime actualizado para la respuesta
    const freshShowtime = await Showtime.findById(showtimeId)
      .populate('movie')
      .populate('hall')
      .lean();

    const capacity = freshShowtime.hall?.capacity || 0;
    const seatsArr = Array.isArray(freshShowtime.seatsBooked) ? freshShowtime.seatsBooked.slice() : [];
    
    // Ordenar asientos
    seatsArr.sort((a, b) => {
      const pa = /^([A-Za-z]+)(\d+)$/.exec(String(a));
      const pb = /^([A-Za-z]+)(\d+)$/.exec(String(b));
      if (pa && pb) {
        if (pa[1] === pb[1]) return Number(pa[2]) - Number(pb[2]);
        return pa[1].localeCompare(pb[1]);
      }
      return String(a).localeCompare(String(b));
    });

    // Enviar correo (simulado con ethereal)
    try {
      const nodemailer = require('nodemailer');
      const testAccount = await nodemailer.createTestAccount();
      
      const transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      });

      const info = await transporter.sendMail({
        from: '"Plataforma Cine" <no-reply@cine.com>',
        to: req.user.email || 'cliente@example.com',
        subject: 'Confirmación de compra - Plataforma Cine',
        html: `
          <div style="background-color:#0D1B2A; color:#F8F9FA; padding:20px; font-family:sans-serif;">
            <h2 style="color:#F1C40F;">🎬 Confirmación de compra - CineGT</h2>
            <p>Hola,</p>
            <p>Gracias por tu compra. Aquí están los detalles:</p>
            <ul style="list-style:none; padding:0;">
              <li><strong>Película:</strong> ${freshShowtime.movie?.title || 'N/A'}</li>
              <li><strong>Fecha:</strong> ${new Date(freshShowtime.startAt).toLocaleDateString('es-ES')}</li>
              <li><strong>Hora:</strong> ${new Date(freshShowtime.startAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</li>
              <li><strong>Sala:</strong> ${freshShowtime.hall?.name || 'N/A'}</li>
              <li><strong>Asientos:</strong> ${seats.join(', ')}</li>
              <li><strong>Código de confirmación:</strong> <span style="color:#E63946;">${confirmationCode}</span></li>
            </ul>
            <p>Nos vemos en el cine 🍿</p>
          </div>
        `
      });

      await Purchase.findByIdAndUpdate(createdPurchase._id, { emailSent: true });
      console.log('Correo simulado enviado:', nodemailer.getTestMessageUrl(info));
    } catch (e) {
      console.error('Error al enviar correo:', e);
    }

    // Emitir eventos de socket
    try {
      const io = req.app.get('io');
      if (io) {
        io.emit('showtimeUpdated', { 
          _id: freshShowtime._id, 
          seatsBooked: seatsArr, 
          availableSeats: Math.max(0, capacity - seatsArr.length) 
        });
        
        // Emitir actualización de locks
        io.emit('seatsLocked', {
          showtimeId,
          seats: [] // Limpiar locks después de la compra
        });
      }
    } catch (e) {
      console.error('Error emitiendo eventos:', e);
    }

    res.status(201).json({
      purchase: createdPurchase,
      showtime: { 
        ...freshShowtime, 
        seatsBooked: seatsArr, 
        availableSeats: Math.max(0, capacity - seatsArr.length) 
      },
    });

  } catch (err) {
    await session.abortTransaction();
    console.error('Error in create purchase:', err);
    
    if (err.message && err.message.includes('ocupados')) {
      return res.status(409).json({ message: err.message });
    }
    
    res.status(500).json({ 
      message: err.message || 'Error interno del servidor al crear compra' 
    });
  } finally {
    session.endSession();
  }
};

// Obtener compras de un usuario
exports.listByUser = async (req, res) => {
  try {
    const userId = req.user.id;
    const purchases = await Purchase.find({ user: userId })
      .populate('showtime')
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