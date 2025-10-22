// server/src/controllers/purchase.controller.js

const Purchase = require('../models/Purchase');
const Showtime = require('../models/Showtime');
const User = require('../models/User');
const { sendPurchaseConfirmation } = require('../utils/email');
const nodemailer = require('nodemailer');

// Genera un código de confirmación simple
const generateConfirmationCode = () => Math.random().toString(36).substring(2, 10).toUpperCase();

// Función auxiliar para ordenar asientos alfabéticamente/numéricamente
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

/**
 * Función principal para manejar la creación/actualización/liberación de holds (Bloqueo de asientos).
 * Esto mapea al endpoint POST /api/showtimes/:id/lock-seats.
 */
exports.handleSeatLock = async (req, res, next) => {
    const showtimeId = req.params.id;
    const userId = req.userId;
    const { seatIds: newSeats, holdMinutes } = req.body;

    if (!userId || !showtimeId) {
        return res.status(400).json({ message: 'Faltan ID de usuario o de showtime.' });
    }

    const seats = Array.isArray(newSeats) ? newSeats.map(s => String(s).trim().toUpperCase()).filter(Boolean) : [];

    const existingHold = await Purchase.findOne({
        user: userId,
        showtime: showtimeId,
        status: 'reserved'
    });

    // 1. CASO: LIBERAR HOLD (No hay asientos seleccionados)
    if (seats.length === 0) {
        if (!existingHold) {
            return res.json({ lockedSeats: [], expirationTime: null, message: 'No hay asientos seleccionados, hold no encontrado.' });
        }
        req.params.id = existingHold._id;
        return exports.release(req, res);
    }

    // Preparar el cuerpo para las funciones hold/updateHold
    req.body.seats = seats;
    req.body.showtimeId = showtimeId;
    req.body.holdMinutes = holdMinutes;

    // 2. CASO: ACTUALIZAR HOLD
    if (existingHold) {
        req.params.id = existingHold._id;
        return exports.updateHold(req, res);
    } else {
        // 3. CASO: CREAR HOLD
        return exports.hold(req, res);
    }
};

// ---------------------------------------------------------------------------------------------------
// FUNCIONES DE COMPRA Y MANEJO DE HOLD
// ---------------------------------------------------------------------------------------------------

/**
 * Crear una compra (reserva pagada) o convertir un hold a pagado.
 */
exports.create = async (req, res) => {
    const session = await Showtime.startSession();
    try {
        const userId = req.userId;
        const { showtimeId, paymentInfo, holdId } = req.body;
        let { seats } = req.body;

        if (!userId || !showtimeId || !Array.isArray(seats) || seats.length === 0) {
            return res.status(400).json({ message: 'Datos incompletos' });
        }

        seats = seats.map((s) => String(s).trim().toUpperCase()).filter(Boolean);
        let safePayment = {};
        let createdPurchase = null;
        let updatedShowtime = null;

        // Sanitizar paymentInfo
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
        let totalPrice = 0;

        // ----------------------------------------------------
        // 1. CONVERTIR HOLD A PAGADO
        // ----------------------------------------------------
        if (holdId) {
            await session.withTransaction(async () => {
                const existing = await Purchase.findById(holdId).session(session);
                if (!existing) throw { status: 404, message: 'Hold no encontrado' };
                if (String(existing.user) !== String(userId)) throw { status: 403, message: 'No autorizado' };
                if (existing.status !== 'reserved') throw { status: 409, message: 'El hold no está en estado reservado' };
                if (String(existing.showtime) !== String(showtimeId)) throw { status: 400, message: 'El hold no pertenece a este showtime' };

                const holdSeats = Array.isArray(existing.seats) ? existing.seats.map(s => String(s).toUpperCase()) : [];
                const normalizedSeats = seats.map(s => String(s).toUpperCase());
                const same = holdSeats.length === normalizedSeats.length && holdSeats.every(s => normalizedSeats.includes(s));
                if (!same) throw { status: 400, message: 'Los asientos indicados no coinciden con el hold' };

                const stCheck = await Showtime.findById(showtimeId).session(session);
                totalPrice = (stCheck && stCheck.price ? Number(stCheck.price) : 0) * seats.length;

                existing.status = 'paid';
                existing.paymentInfo = safePayment;
                existing.totalPrice = totalPrice;
                existing.confirmationCode = confirmationCode;
                existing.reservedUntil = undefined;
                await existing.save({ session });
                createdPurchase = existing;
                updatedShowtime = await Showtime.findById(showtimeId).session(session);
            });
        }
        // ----------------------------------------------------
        // 2. CREAR NUEVA COMPRA
        // ----------------------------------------------------
        else {
            await session.withTransaction(async () => {
                const stCheck = await Showtime.findOne({ _id: showtimeId }).session(session);
                const already = new Set();
                if (stCheck) {
                    if (Array.isArray(stCheck.seatsBookedMap)) stCheck.seatsBookedMap.forEach(x => x && x.seat && already.add(String(x.seat)));
                    if (Array.isArray(stCheck.seatsBooked)) stCheck.seatsBooked.forEach(s => s && already.add(String(s)));
                }
                for (const s of seats) if (already.has(String(s))) throw { status: 409, message: 'Alguno de los asientos ya está reservado' };

                totalPrice = (stCheck && stCheck.price ? Number(stCheck.price) : 0) * seats.length;

                const status = paymentInfo ? 'paid' : 'reserved';
                createdPurchase = await Purchase.create([{
                    user: userId,
                    showtime: showtimeId,
                    seats,
                    totalPrice,
                    status,
                    paymentInfo: safePayment,
                    confirmationCode: confirmationCode,
                    reservedUntil: status === 'reserved' ? new Date(Date.now() + 10 * 60 * 1000) : undefined
                }], { session });
                createdPurchase = Array.isArray(createdPurchase) ? createdPurchase[0] : createdPurchase;

                const mapEntries = seats.map(s => ({ seat: s, purchase: createdPurchase._id }));
                await Showtime.findByIdAndUpdate(showtimeId, { $push: { seatsBooked: { $each: seats }, seatsBookedMap: { $each: mapEntries } } }, { session });
                updatedShowtime = await Showtime.findById(showtimeId).session(session);
            });
        }

        // ----------------------------------------------------
        // 3. OBTENER ESTADO Y ENVIAR CORREO
        // ----------------------------------------------------

        const fresh = await Showtime.findById(showtimeId).populate('movie').populate('hall').lean();
        if (!fresh) {
            return res.status(404).json({ message: 'Showtime no encontrado' });
        }

        let seatsArr = [];
        if (Array.isArray(fresh.seatsBookedMap) && fresh.seatsBookedMap.length) seatsArr = fresh.seatsBookedMap.map(x => x.seat);
        else seatsArr = Array.isArray(fresh.seatsBooked) ? fresh.seatsBooked.slice() : [];

        sortSeats(seatsArr);

        const capacity = fresh.hall && fresh.hall.capacity ? Number(fresh.hall.capacity) : 0;

        // Enviar correo de confirmación (Simulación)
        if (createdPurchase && createdPurchase.status === 'paid') {
            try {
                const user = await User.findById(userId);
                const userEmail = (user && user.email) || 'default@example.com';

                const testAccount = await nodemailer.createTestAccount();
                const transporter = nodemailer.createTransport({
                    host: 'smtp.ethereal.email',
                    port: 587,
                    auth: { user: testAccount.user, pass: testAccount.pass }
                });

                const info = await transporter.sendMail({
                    from: '"Plataforma Cine" <no-reply@cine.com>',
                    to: userEmail,
                    subject: 'Confirmación de compra - Plataforma Cine',
                    html: `
                        <div style="background-color:#0D1B2A; color:#F8F9FA; padding:20px; font-family:sans-serif;">
                        <h2 style="color:#F1C40F;">🎬 Confirmación de compra - CineGT</h2>
                        <p>Hola,</p>
                        <p>Gracias por tu compra. Aquí están los detalles:</p>
                        <ul style="list-style:none; padding:0;">
                          <li><strong>Película:</strong> ${fresh.movie.title}</li>
                          <li><strong>Fecha:</strong> ${new Date(fresh.startAt).toLocaleDateString('es-ES')}</li>
                          <li><strong>Hora:</strong> ${new Date(fresh.startAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: false })}</li>
                          <li><strong>Sala:</strong> ${fresh.hall.name}</li>
                          <li><strong>Asientos:</strong> ${createdPurchase.seats.join(', ')}</li>
                          <li><strong>Total Pagado:</strong> $${createdPurchase.totalPrice}</li>
                          <li><strong>Código:</strong> <span style="color:#E63946;">${confirmationCode}</span></li>
                        </ul>
                        <p>Nos vemos en el cine 🍿</p>
                        </div>
                    `
                });

                await Purchase.findByIdAndUpdate(createdPurchase._id, { emailSent: true });
                console.log('Correo simulado enviado. Vista previa:', nodemailer.getTestMessageUrl(info));

            } catch (e) {
                console.error('Error al enviar correo simulado:', e);
            }
        }

        const responseShowtime = {
            ...fresh,
            seatsBooked: seatsArr,
            availableSeats: Math.max(0, capacity - seatsArr.length)
        };

        res.status(201).json({ purchase: createdPurchase, showtime: responseShowtime });

        try {
            const io = req.app.locals.io;
            if (io) io.emit('showtimeUpdated', { _id: fresh._id, seatsBooked: seatsArr, availableSeats: Math.max(0, capacity - seatsArr.length) });
        } catch (e) {
            console.error('Error emitiendo showtimeUpdated desde purchaseController:', e);
        }
    } catch (err) {
        if (err && err.status === 409) return res.status(409).json({ message: err.message });
        if (err && err.status) return res.status(err.status).json({ message: err.message });
        res.status(500).json({ message: err.message || String(err) });
    } finally {
        session.endSession();
    }
};

/**
 * Crear una reserva temporal (hold).
 */
exports.hold = async (req, res) => {
    const session = await Showtime.startSession();
    try {
        const userId = req.userId;
        const { showtimeId, seats, holdMinutes } = req.body;
        if (!userId || !showtimeId || !Array.isArray(seats) || seats.length === 0) {
            return res.status(400).json({ message: 'Datos incompletos' });
        }

        let minutes = typeof holdMinutes === 'number' && Number.isFinite(holdMinutes) ? Math.floor(holdMinutes) : 10;
        if (minutes < 1) minutes = 1;
        if (minutes > 60) minutes = 60;
        const reservedUntil = new Date(Date.now() + minutes * 60 * 1000);

        let createdPurchase = null;
        const confirmationCode = generateConfirmationCode();

        await session.withTransaction(async () => {
            const stCheck = await Showtime.findById(showtimeId).session(session);
            const already = new Set();
            if (stCheck) {
                if (Array.isArray(stCheck.seatsBookedMap)) stCheck.seatsBookedMap.forEach(x => x && x.seat && already.add(String(x.seat)));
                if (Array.isArray(stCheck.seatsBooked)) stCheck.seatsBooked.forEach(s => s && already.add(String(s)));
            }
            for (const s of seats) if (already.has(String(s))) throw { status: 409, message: 'Alguno de los asientos ya está reservado' };

            createdPurchase = await Purchase.create([{
                user: userId,
                showtime: showtimeId,
                seats,
                totalPrice: 0,
                status: 'reserved',
                reservedUntil,
                confirmationCode
            }], { session });
            createdPurchase = Array.isArray(createdPurchase) ? createdPurchase[0] : createdPurchase;

            const mapEntries = seats.map(s => ({ seat: s, purchase: createdPurchase._id }));
            await Showtime.findByIdAndUpdate(showtimeId, { $push: { seatsBooked: { $each: seats }, seatsBookedMap: { $each: mapEntries } } }, { session });
        });

        const fresh = await Showtime.findById(showtimeId).populate('movie').populate('hall').lean();

        let seatsArr = [];
        if (Array.isArray(fresh.seatsBookedMap) && fresh.seatsBookedMap.length) seatsArr = fresh.seatsBookedMap.map(x => x.seat);
        else seatsArr = Array.isArray(fresh.seatsBooked) ? fresh.seatsBooked.slice() : [];
        sortSeats(seatsArr);
        const capacity = fresh.hall && fresh.hall.capacity ? Number(fresh.hall.capacity) : 0;

        try {
            const io = req.app.locals.io;
            if (io) io.emit('showtimeUpdated', {
                _id: fresh._id,
                seatsBooked: seatsArr,
                availableSeats: Math.max(0, capacity - seatsArr.length)
            });
        } catch (e) {
            console.error('Error emitiendo showtimeUpdated desde hold:', e);
        }

        res.status(201).json({
            purchase: createdPurchase,
            lockedSeats: createdPurchase.seats,
            expirationTime: reservedUntil.toISOString(),
            holdId: createdPurchase._id,
            showtime: fresh,
            meta: { holdMinutes: minutes, reservedUntil: reservedUntil.toISOString() }
        });
    } catch (err) {
        if (err && err.status === 409) return res.status(409).json({ message: err.message });
        res.status(500).json({ message: err.message || String(err) });
    } finally {
        session.endSession();
    }
};

/**
 * Liberar un hold (cancelar reserva temporal).
 */
exports.release = async (req, res) => {
    const { id } = req.params;
    if (!id) return res.status(400).json({ message: 'ID es requerido' });
    try {
        const p = await Purchase.findById(id).lean();
        if (!p) return res.status(404).json({ message: 'Reserva no encontrada' });
        if (String(p.user) !== String(req.userId)) return res.status(403).json({ message: 'No autorizado' });
        if (p.status !== 'reserved') return res.status(409).json({ message: 'Solo se pueden liberar reservas temporales' });

        const session = await Showtime.startSession();
        try {
            await session.withTransaction(async () => {
                await Showtime.findByIdAndUpdate(p.showtime, {
                    $pull: {
                        seatsBookedMap: { purchase: p._id },
                        seatsBooked: { $in: p.seats }
                    }
                }, { session });
                await Purchase.findByIdAndUpdate(p._id, { $set: { status: 'cancelled', cancelledAt: new Date(), cancelReason: 'released' } }, { session });
            });
        } finally {
            session.endSession();
        }

        const fresh = await Showtime.findById(p.showtime).populate('hall').lean();
        let seatsArr = [];
        if (Array.isArray(fresh.seatsBookedMap) && fresh.seatsBookedMap.length) seatsArr = fresh.seatsBookedMap.map(x => x.seat);
        else seatsArr = Array.isArray(fresh.seatsBooked) ? fresh.seatsBooked.slice() : [];
        sortSeats(seatsArr);
        const capacity = fresh.hall && fresh.hall.capacity ? Number(fresh.hall.capacity) : 0;

        try {
            const io = req.app.locals.io;
            if (io) io.emit('showtimeUpdated', {
                _id: fresh._id,
                seatsBooked: seatsArr,
                availableSeats: Math.max(0, capacity - seatsArr.length)
            });
        } catch (e) {
            console.error('Error emitiendo showtimeUpdated desde release:', e);
        }

        res.json({
            message: 'Hold liberado',
            lockedSeats: [],
            expirationTime: null
        });
    } catch (err) {
        res.status(500).json({ message: err.message || String(err) });
    }
};

/**
 * Obtener compras de un usuario.
 */
exports.listByUser = async (req, res) => {
    try {
        const { userId } = req.params;
        if (!req.userId || String(req.userId) !== String(userId)) {
            return res.status(403).json({ message: 'No autorizado' });
        }
        const purchases = await Purchase.find({ user: userId }).populate('showtime').lean();
        res.json(purchases);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

/**
 * Actualizar un hold (cambiar asientos reservados temporalmente).
 */
exports.updateHold = async (req, res) => {
    const { id } = req.params;
    const userId = req.userId;
    const { seats, showtimeId, holdMinutes } = req.body;
    if (!id || !userId || !showtimeId || !Array.isArray(seats) || seats.length === 0) {
        return res.status(400).json({ message: 'Datos incompletos' });
    }

    let minutes = typeof holdMinutes === 'number' && Number.isFinite(holdMinutes) ? Math.floor(holdMinutes) : 10;
    if (minutes < 1) minutes = 1;
    if (minutes > 60) minutes = 60;
    const reservedUntil = new Date(Date.now() + minutes * 60 * 1000);

    const session = await Showtime.startSession();
    let purchase = null;
    try {
        await session.withTransaction(async () => {
            purchase = await Purchase.findById(id).session(session);
            if (!purchase) throw { status: 404, message: 'Reserva no encontrada' };
            if (String(purchase.user) !== String(userId)) throw { status: 403, message: 'No autorizado' };
            if (purchase.status !== 'reserved') throw { status: 409, message: 'Solo se pueden actualizar reservas temporales' };

            await Showtime.findByIdAndUpdate(purchase.showtime, {
                $pull: {
                    seatsBookedMap: { purchase: purchase._id },
                    seatsBooked: { $in: purchase.seats }
                }
            }, { session });

            const stCheck = await Showtime.findById(showtimeId).session(session);
            const already = new Set();
            if (stCheck) {
                if (Array.isArray(stCheck.seatsBookedMap)) stCheck.seatsBookedMap.forEach(x => x && x.seat && already.add(String(x.seat)));
                if (Array.isArray(stCheck.seatsBooked)) stCheck.seatsBooked.forEach(s => s && already.add(String(s)));
            }
            for (const s of seats) if (already.has(String(s))) throw { status: 409, message: 'Alguno de los asientos ya está reservado' };

            purchase.seats = seats;
            purchase.reservedUntil = reservedUntil;
            await purchase.save({ session });

            const mapEntries = seats.map(s => ({ seat: s, purchase: purchase._id }));
            await Showtime.findByIdAndUpdate(showtimeId, {
                $push: { seatsBooked: { $each: seats }, seatsBookedMap: { $each: mapEntries } }
            }, { session });
        });

        const fresh = await Showtime.findById(showtimeId).populate('hall').lean();
        let seatsArr = [];
        if (Array.isArray(fresh.seatsBookedMap) && fresh.seatsBookedMap.length) seatsArr = fresh.seatsBookedMap.map(x => x.seat);
        else seatsArr = Array.isArray(fresh.seatsBooked) ? fresh.seatsBooked.slice() : [];
        sortSeats(seatsArr);
        const capacity = fresh.hall && fresh.hall.capacity ? Number(fresh.hall.capacity) : 0;

        try {
            const io = req.app.locals.io;
            if (io) io.emit('showtimeUpdated', {
                _id: fresh._id,
                seatsBooked: seatsArr,
                availableSeats: Math.max(0, capacity - seatsArr.length)
            });
        } catch (e) {
            console.error('Error emitiendo showtimeUpdated desde updateHold:', e);
        }

        res.json({
            message: 'Reserva temporal actualizada',
            lockedSeats: seats,
            expirationTime: reservedUntil.toISOString(),
            holdId: purchase._id,
            meta: { holdMinutes: minutes, reservedUntil: reservedUntil.toISOString() }
        });
    } catch (err) {
        if (err && err.status) return res.status(err.status).json({ message: err.message });
        res.status(500).json({ message: err.message || String(err) });
    } finally {
        session.endSession();
    }
};