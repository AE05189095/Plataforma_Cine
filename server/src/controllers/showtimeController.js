// backend/controllers/showtimeController.js
const Showtime = require('../models/Showtime');
const Movie = require('../models/Movie'); 
const Hall = require('../models/Hall');   
const mongoose = require('mongoose'); 

// ==========================================================
// FUNCIÓN AUXILIAR
// ==========================================================

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
// LISTAR FUNCIONES
// ==========================================================

exports.list = async (req, res) => {
    try {
        const { movieId } = req.query; 
        let filter = { isActive: true };
        
        // Filtrar por movieId si se proporciona (Lógica de la derecha)
        if (movieId && mongoose.isValidObjectId(movieId)) { 
            filter.movie = new mongoose.Types.ObjectId(movieId); 
        }

        const showtimes = await Showtime.find(filter) 
            .populate('movie')
            .populate('hall')
            .sort({ startAt: 1 })
            .lean();

        // Calcular asientos disponibles usando seatsBookedMap (Lógica de la izquierda)
        const withAvailability = showtimes.map((st) => {
            let seats = [];
            // Priorizar seatsBookedMap que es usado para holds en purchaseController
            if (Array.isArray(st.seatsBookedMap) && st.seatsBookedMap.length) seats = st.seatsBookedMap.map(x => x.seat);
            // Fallback por si acaso (aunque seatsBookedMap debería ser la fuente de verdad)
            else seats = Array.from(new Set(Array.isArray(st.seatsBooked) ? st.seatsBooked.slice() : []));
            
            sortSeats(seats);
            const capacity = st.hall && st.hall.capacity ? Number(st.hall.capacity) : 0;
            return { 
                ...st, 
                seatsBooked: seats, // Contiene asientos Pagados + Asientos Hold
                availableSeats: Math.max(0, capacity - seats.length) 
            };
        });
        
        res.json(withAvailability);
    } catch (err) {
        console.error('showtimeController.list error:', err); 
        res.status(500).json({ message: 'Error interno del servidor al listar horarios' });
    }
};

// ==========================================================
// OBTENER FUNCIÓN POR ID
// ==========================================================

exports.get = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Validación de ID (Lógica de la derecha)
        if (!id || !mongoose.isValidObjectId(id)) {
            return res.status(400).json({ message: 'ID de showtime inválido o no proporcionado.' });
        }
        
        // Nota: req.user ya no es necesario aquí porque la lógica de bloqueo se movió a purchaseController
        
        const showtime = await Showtime.findById(id).populate('movie').populate('hall').lean();
        
        if (!showtime) return res.status(404).json({ message: 'Función no encontrada' });
        
        // Recalcular asientos reservados/bloqueados usando seatsBookedMap (Lógica de la izquierda)
        let seats = [];
        if (Array.isArray(showtime.seatsBookedMap) && showtime.seatsBookedMap.length) seats = showtime.seatsBookedMap.map(x => x.seat);
        else seats = Array.from(new Set(Array.isArray(showtime.seatsBooked) ? showtime.seatsBooked.slice() : []));

        sortSeats(seats);

        const capacity = showtime.hall && showtime.hall.capacity ? Number(showtime.hall.capacity) : 0;
        
        // seatsBooked contiene tanto los pagados como los reservados/holds
        res.json({ 
            ...showtime, 
            seatsBooked: seats, // Asientos permanentemente ocupados + temporalmente holdeados
            availableSeats: Math.max(0, capacity - seats.length) 
        });
    } catch (err) {
        console.error('showtimeController.get error:', err);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};

// 🛑 NOTA: Los endpoints 'lockSeats' y 'reserveSeats' de la rama 'test/semana3' 
// han sido eliminados en la fusión. Su funcionalidad está ahora cubierta 
// por los endpoints 'hold', 'updateHold', 'release' y 'create' en el 'purchaseController'.
// Esto asegura que la lógica de bloqueo/reserva se realiza de manera atómica
// dentro de una transacción que involucra al modelo Purchase (la reserva temporal).