// server/src/controllers/showtimeController.js
const Showtime = require('../models/Showtime');
const Movie = require('../models/Movie'); 
const Hall = require('../models/Hall');   
const mongoose = require('mongoose'); 

// Duración del bloqueo en minutos
const LOCK_DURATION_MINUTES = 10; 

/**
 * Función auxiliar para obtener todos los asientos bloqueados y asientosBooked del showtime
 * @param {Object} showtime - El documento Showtime (puede ser lean).
 * @param {string | null} currentUserId - El ID del usuario actual. Si es null, devuelve todos los locks activos.
 * @returns {{seatsLocked: string[], userLockedSeats: string[]}}
 */
const getLockedSeats = (showtime, currentUserId) => {
    let allLockedSeats = [];
    let userLockedSeats = [];

    const now = new Date();
    // Filtramos los locks expirados con defensividad
    const activeLocks = (showtime.seatsLocks || []).filter(lock => lock.expiresAt > now);
    
    for (const lock of activeLocks) {
        // Aseguramos que lock.userId se compare correctamente.
        const lockUserIdString = lock.userId ? lock.userId.toString() : null;
        
        // Excluir los asientos que ya están permanentemente ocupados/booked
        const validSeats = (lock.seats || []).filter(seat => !(showtime.seatsBooked || []).includes(seat));
        
        allLockedSeats.push(...validSeats);

        // Identificar los asientos bloqueados por el usuario actual
        if (currentUserId && lockUserIdString && lockUserIdString === currentUserId.toString()) {
            userLockedSeats.push(...validSeats);
        }
    }
    
    // Eliminar duplicados
    allLockedSeats = Array.from(new Set(allLockedSeats));

    return { seatsLocked: allLockedSeats, userLockedSeats: Array.from(new Set(userLockedSeats)) };
};


/**
 * Lógica de ordenación de asientos (e.g., A1, A2, B1, B2)
 * @param {string[]} seats - Array de IDs de asientos.
 */
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

// ==========================================================
// LISTAR Y OBTENER FUNCIONES
// ==========================================================

exports.list = async (req, res) => {
    try {
        const { movieId } = req.query; 
        let filter = { isActive: true };
        
        if (movieId && mongoose.isValidObjectId(movieId)) { 
            filter.movie = new mongoose.Types.ObjectId(movieId); 
        }

        const showtimes = await Showtime.find(filter) 
            .populate('movie')
            .populate('hall')
            .sort({ startAt: 1 })
            .lean();

        const withAvailability = showtimes.map((st) => {
            const seats = Array.isArray(st.seatsBooked) ? st.seatsBooked.slice() : [];
            sortSeats(seats);
            const capacity = st.hall && st.hall.capacity ? Number(st.hall.capacity) : 0;
            return { ...st, seatsBooked: seats, availableSeats: Math.max(0, capacity - seats.length) };
        });
        
        res.json(withAvailability);
    } catch (err) {
        console.error('showtimeController.list CRITICAL ERROR:', err); 
        res.status(500).json({ message: 'Error interno del servidor al listar horarios' });
    }
};

exports.get = async (req, res) => {
    try {
        const { id } = req.params;
        
        // VALIDACION DE ID
        if (!id || !mongoose.isValidObjectId(id)) {
            return res.status(400).json({ message: 'ID de showtime inv\u00e1lido o no proporcionado.' });
        }
        
        const userId = req.user ? req.user._id : null; 
        
        const showtime = await Showtime.findById(id).populate('movie').populate('hall').lean();
        
        if (!showtime) return res.status(404).json({ message: 'Función no encontrada' });
        
        const booked = Array.isArray(showtime.seatsBooked) ? showtime.seatsBooked.slice() : [];
        
        const { seatsLocked } = getLockedSeats(showtime, userId);
        
        const allOccupiedSeats = Array.from(new Set([...booked, ...seatsLocked]));

        sortSeats(allOccupiedSeats);

        const capacity = showtime.hall && showtime.hall.capacity ? Number(showtime.hall.capacity) : 0;
        
        res.json({ 
            ...showtime, 
            seatsBooked: booked, 
            seatsLocked: seatsLocked, 
            availableSeats: Math.max(0, capacity - allOccupiedSeats.length) 
        });
    } catch (err) {
        console.error('showtimeController.get error:', err);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};

// ==========================================================
// BLOQUEO DE ASIENTOS (VERSIÓN ATÓMICA FINAL)
// ==========================================================

exports.lockSeats = async (req, res) => {
    if (!req.user || !req.user._id) return res.status(401).json({ message: 'No autenticado' });

    const showtimeId = req.params.id;
    
    if (!showtimeId || !mongoose.isValidObjectId(showtimeId)) {
        return res.status(400).json({ message: 'ID de showtime inv\u00e1lido o no proporcionado.' });
    }
    
    const userId = req.user._id;
    let seatIds = req.body.seatIds || []; 

    if (!Array.isArray(seatIds)) seatIds = [];
    seatIds = Array.from(new Set(seatIds.map(s => String(s).trim().toUpperCase()).filter(Boolean)));
    
    try {
        // 1. Obtener el documento actual para validación (lean)
        const showtimeDoc = await Showtime.findById(showtimeId).lean();
        if (!showtimeDoc) return res.status(404).json({ message: 'Función no encontrada' });

        const booked = showtimeDoc.seatsBooked || [];
        
        // Identificar locks activos de OTROS (excluyendo el lock del usuario actual)
        const currentlyLockedByOthers = (showtimeDoc.seatsLocks || [])
            .filter(lock => lock.expiresAt > new Date() && lock.userId && lock.userId.toString() !== userId.toString())
            .flatMap(lock => lock.seats);
        
        const unavailable = Array.from(new Set([...booked, ...currentlyLockedByOthers]));

        // Asientos que el usuario QUIERE y que están DISPONIBLES.
        const validSeatsToLock = seatIds.filter(seat => !unavailable.includes(seat));
        
        const newExpirationTime = new Date(Date.now() + LOCK_DURATION_MINUTES * 60000);

        let updatedShowtime;

        if (validSeatsToLock.length > 0) {
            // OPERACIÓN ATÓMICA: Intenta actualizar el lock existente con $set.
            const arrayFilters = [{ 'userLock.userId': new mongoose.Types.ObjectId(userId) }];

            updatedShowtime = await Showtime.findOneAndUpdate(
                { _id: showtimeId, 'seatsLocks.userId': new mongoose.Types.ObjectId(userId) },
                {
                    $set: {
                        'seatsLocks.$[userLock].seats': validSeatsToLock,
                        'seatsLocks.$[userLock].expiresAt': newExpirationTime,
                    }
                },
                { 
                    new: true,
                    arrayFilters: arrayFilters,
                }
            );

            // Si no se encontró un lock existente para actualizar, hacemos un PUSH (creación).
            if (!updatedShowtime) {
                updatedShowtime = await Showtime.findByIdAndUpdate(
                    showtimeId,
                    {
                        $push: {
                            seatsLocks: {
                                userId: new mongoose.Types.ObjectId(userId),
                                seats: validSeatsToLock,
                                expiresAt: newExpirationTime,
                            }
                        }
                    },
                    { new: true }
                );
            }

        } else {
            // Caso de deselección total o lista vacía: ELIMINAR el lock del usuario
            updatedShowtime = await Showtime.findByIdAndUpdate(
                showtimeId,
                { $pull: { seatsLocks: { userId: new mongoose.Types.ObjectId(userId) } } },
                { new: true } // Obtenemos el documento después de la eliminación.
            );
        }
        
        
        if (!updatedShowtime) return res.status(404).json({ message: 'Función no encontrada después de actualizar' });

        // 4. Recalcular asientos bloqueados del documento actualizado para la respuesta
        const { seatsLocked: finalLockedSeats, userLockedSeats: finalUserLockedSeats } = getLockedSeats(updatedShowtime.toObject(), userId);

        // 5. Emisión de Socket
        try {
            const io = req.app.locals.io;
            if (io) io.to(showtimeId).emit('seatsLocked', { showtimeId, seats: finalLockedSeats });
        } catch (e) {
            console.error('Error emitiendo seatsLocked:', e);
        }

        // 6. Respuesta al cliente: enviamos la lista corregida al frontend.
        return res.json({
            msg: 'Bloqueo actualizado',
            lockedSeats: finalLockedSeats,
            userLockedSeats: finalUserLockedSeats, 
            expirationTime: finalUserLockedSeats.length > 0 ? newExpirationTime.toISOString() : null,
        });

    } catch (err) {
        console.error('showtimeController.lockSeats CRITICAL ERROR:', err);
        return res.status(500).json({ message: 'Error interno del servidor' });
    }
};

// ==========================================================
// RESERVA DE ASIENTOS
// ==========================================================

exports.reserveSeats = async (req, res) => {
    try {
        const { id } = req.params;
        
        // VALIDACION DE ID
        if (!id || !mongoose.isValidObjectId(id)) {
            return res.status(400).json({ message: 'ID de showtime inv\u00e1lido o no proporcionado.' });
        }
        
        const userId = req.user ? req.user._id : null;
        let { seats } = req.body;

        seats = seats.map((s) => String(s).trim().toUpperCase()).filter(Boolean);
        seats = Array.from(new Set(seats));

        const updated = await Showtime.findOneAndUpdate(
            { _id: id, seatsBooked: { $nin: seats } },
            { $push: { seatsBooked: { $each: seats } } },
            { new: true }
        )
        .populate('movie')
        .populate('hall')
        .lean();

        if (!updated) return res.status(409).json({ message: 'Alguno de los asientos ya est\u00e1 reservado.' });
        
        // Después de la reserva exitosa, eliminamos el lock temporal del usuario
        await Showtime.findByIdAndUpdate(id, { $pull: { seatsLocks: { userId: new mongoose.Types.ObjectId(userId) } } });
        
        const finalShowtime = await Showtime.findById(id); 

        const seatsArr = Array.isArray(updated.seatsBooked) ? updated.seatsBooked.slice() : [];
        sortSeats(seatsArr);

        const capacity = updated.hall && updated.hall.capacity ? Number(updated.hall.capacity) : 0;
        
        try {
            const io = req.app.locals.io;
            // Recalculamos los locks del documento recién actualizado
            const { seatsLocked: currentLockedSeats } = finalShowtime ? getLockedSeats(finalShowtime.toObject(), userId) : { seatsLocked: [] };
            
            if (io) io.emit('showtimeUpdated', { 
                _id: updated._id, 
                seatsBooked: seatsArr, 
                seatsLocked: currentLockedSeats,
                availableSeats: Math.max(0, capacity - seatsArr.length - currentLockedSeats.length) 
            });
        } catch (e) {
            console.error('Error emitiendo showtimeUpdated:', e);
        }

        res.json({ ...updated, seatsBooked: seatsArr, availableSeats: Math.max(0, capacity - seatsArr.length) });
    } catch (err) {
        console.error('showtimeController.reserveSeats error:', err);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};