// backend/controllers/showtimeController.js
const Showtime = require('../models/Showtime');
// 🛑 CORRECCIÓN: Importar los modelos necesarios para que Mongoose los registre (populate).
const Movie = require('../models/Movie'); 
const Hall = require('../models/Hall');   
const mongoose = require('mongoose'); 

// Duración del bloqueo en minutos
const LOCK_DURATION_MINUTES = 10; 

/**
 * Función auxiliar para obtener todos los asientos bloqueados y asientosBooked del showtime
 * @param {Object} showtime - El documento Showtime (puede ser lean).
 * @param {string} currentUserId - El ID del usuario actual.
 * @returns {{seatsLocked: string[], userLockedSeats: string[]}}
 */
const getLockedSeats = (showtime, currentUserId) => {
    let allLockedSeats = [];
    let userLockedSeats = [];

    const now = new Date();
    // Filtramos los locks expirados con defensividad
    const activeLocks = (showtime.seatsLocks || []).filter(lock => lock.expiresAt > now);
    
    for (const lock of activeLocks) {
        // Excluir los asientos que ya están permanentemente ocupados/booked con defensividad
        const validSeats = (lock.seats || []).filter(seat => !(showtime.seatsBooked || []).includes(seat));
        
        allLockedSeats.push(...validSeats);

        // Identificar los asientos bloqueados por el usuario actual
        if (currentUserId && lock.userId && lock.userId.toString() === currentUserId.toString()) {
            userLockedSeats.push(...validSeats);
        }
    }
    
    // Eliminar duplicados
    allLockedSeats = Array.from(new Set(allLockedSeats));

    return { seatsLocked: allLockedSeats, userLockedSeats: userLockedSeats };
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

// 🛑 CORRECCIÓN PRINCIPAL para el error 500 sin movieId
exports.list = async (req, res) => {
    try {
        const { movieId } = req.query; 
        let filter = { isActive: true };
        
        // Seguridad CRÍTICA: Solo crea el ObjectId si el parámetro existe Y es un formato válido.
        // Esto previene el error 500 cuando se llama a /api/showtimes sin parámetros.
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
            // Defensividad para la capacidad
            const capacity = st.hall && st.hall.capacity ? Number(st.hall.capacity) : 0;
            return { ...st, seatsBooked: seats, availableSeats: Math.max(0, capacity - seats.length) };
        });
        
        res.json(withAvailability);
    } catch (err) {
        // Muestra la traza de error completa en la consola del Backend
        console.error('showtimeController.list CRITICAL ERROR:', err); 
        res.status(500).json({ message: 'Error interno del servidor al listar horarios' });
    }
};

exports.get = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user ? req.user._id : null; 
        
        if (!id) return res.status(400).json({ message: 'ID es requerido' });
        
        // Populate Hall es vital para obtener la capacidad
        const showtime = await Showtime.findById(id).populate('movie').populate('hall').lean();
        
        if (!showtime) return res.status(404).json({ message: 'Función no encontrada' });
        
        const booked = Array.isArray(showtime.seatsBooked) ? showtime.seatsBooked.slice() : [];
        
        const { seatsLocked } = getLockedSeats(showtime, userId);
        
        const allOccupiedSeats = Array.from(new Set([...booked, ...seatsLocked]));

        sortSeats(allOccupiedSeats);

        const capacity = showtime.hall && showtime.hall.capacity ? Number(showtime.hall.capacity) : 0;
        
        res.json({ 
            ...showtime, 
            seatsBooked: booked, // Vendidos permanentemente
            seatsLocked: seatsLocked, // Bloqueados temporalmente por otros
            availableSeats: Math.max(0, capacity - allOccupiedSeats.length) 
        });
    } catch (err) {
        console.error('showtimeController.get error:', err);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};

// 🛑 ENDPOINT: Maneja el bloqueo temporal de asientos
exports.lockSeats = async (req, res) => {
    if (!req.user || !req.user._id) return res.status(401).json({ message: 'No autenticado' });

    const showtimeId = req.params.id;
    const userId = req.user._id;
    let seatIds = req.body.seatIds || [];

    if (!Array.isArray(seatIds)) seatIds = [];

    seatIds = seatIds.map(s => String(s).trim().toUpperCase()).filter(Boolean);
    seatIds = Array.from(new Set(seatIds));

    try {
        const showtime = await Showtime.findById(showtimeId);
        if (!showtime) return res.status(404).json({ message: 'Función no encontrada' });

        const booked = showtime.seatsBooked || [];
        // Al pasar el userId a getLockedSeats, obtenemos los bloqueos de TODOS EXCEPTO del usuario actual
        const { seatsLocked: currentlyLockedByOthers } = getLockedSeats(showtime.toObject(), userId);
        
        const unavailable = Array.from(new Set([...booked, ...currentlyLockedByOthers]));

        const validSeatsToLock = seatIds.filter(seat => !unavailable.includes(seat));
        
        const newExpirationTime = new Date(Date.now() + LOCK_DURATION_MINUTES * 60000);
        
        let userLockIndex = showtime.seatsLocks.findIndex(lock => lock.userId.toString() === userId.toString());

        if (validSeatsToLock.length > 0) {
            if (userLockIndex !== -1) {
                showtime.seatsLocks[userLockIndex].seats = validSeatsToLock;
                showtime.seatsLocks[userLockIndex].expiresAt = newExpirationTime;
            } else {
                showtime.seatsLocks.push({
                    userId: new mongoose.Types.ObjectId(userId),
                    seats: validSeatsToLock,
                    expiresAt: newExpirationTime,
                });
            }
        } else if (userLockIndex !== -1) {
            // Si no se seleccionaron asientos válidos, eliminar el bloqueo existente
            showtime.seatsLocks.splice(userLockIndex, 1);
        }

        await showtime.save();
        
        // Recalcular asientos bloqueados globalmente para la respuesta y el socket
        const { seatsLocked: finalLockedSeats, userLockedSeats: finalUserLockedSeats } = getLockedSeats(showtime.toObject(), userId);

        try {
            const io = req.app.locals.io;
            if (io) io.to(showtimeId).emit('seatsLocked', { showtimeId, seats: finalLockedSeats });
        } catch (e) {
            console.error('Error emitiendo seatsLocked:', e);
        }

        res.json({
            msg: 'Bloqueo actualizado',
            lockedSeats: finalLockedSeats,
            userLockedSeats: finalUserLockedSeats,
            expirationTime: finalUserLockedSeats.length > 0 ? newExpirationTime.toISOString() : null,
        });

    } catch (err) {
        console.error('showtimeController.lockSeats error:', err);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};

exports.reserveSeats = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user ? req.user._id : null;
        let { seats } = req.body;

        seats = seats.map((s) => String(s).trim().toUpperCase()).filter(Boolean);
        seats = Array.from(new Set(seats));

        // 1. Intentar la reserva atómica: solo si los asientos no están ya en seatsBooked
        const updated = await Showtime.findOneAndUpdate(
            { _id: id, seatsBooked: { $nin: seats } },
            { $push: { seatsBooked: { $each: seats } } },
            { new: true }
        )
        .populate('movie')
        .populate('hall')
        .lean();

        if (!updated) return res.status(409).json({ message: 'Alguno de los asientos ya está reservado o bloqueado.' });
        
        // 2. Limpiar el bloqueo del usuario tras la reserva exitosa
        const finalShowtime = await Showtime.findById(id);

        if (finalShowtime && userId) { 
             const userLockIndex = finalShowtime.seatsLocks.findIndex(lock => lock.userId && lock.userId.toString() === userId.toString());
             if (userLockIndex !== -1) {
                 finalShowtime.seatsLocks.splice(userLockIndex, 1);
                 await finalShowtime.save();
             }
        }
        
        // 3. Respuesta y emisión de socket
        const seatsArr = Array.isArray(updated.seatsBooked) ? updated.seatsBooked.slice() : [];
        sortSeats(seatsArr);

        const capacity = updated.hall && updated.hall.capacity ? Number(updated.hall.capacity) : 0;
        
        try {
            const io = req.app.locals.io;
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