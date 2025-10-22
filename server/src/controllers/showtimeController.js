// server/src/controllers/showtimeController.js

const Showtime = require('../models/Showtime');
// Asumiendo que el modelo Showtime ya tiene las referencias a Movie y Hall

// Función auxiliar para calcular asientos (necesaria para exports.get)
const calculateSeats = (showtime) => {
    const capacity = showtime.hall ? Number(showtime.hall.capacity) : 0;
    let seatsArr = [];
    if (Array.isArray(showtime.seatsBookedMap) && showtime.seatsBookedMap.length) seatsArr = showtime.seatsBookedMap.map(x => x.seat);
    else seatsArr = Array.isArray(showtime.seatsBooked) ? showtime.seatsBooked.slice() : [];
    
    return {
        seatsBooked: seatsArr,
        availableSeats: Math.max(0, capacity - seatsArr.length)
    };
};

/**
 * Obtener la lista completa de showtimes (cartelera).
 */
exports.list = async (req, res) => {
    try {
        const showtimes = await Showtime.find({})
            .populate('movie')
            .populate('hall')
            .sort({ startAt: 1 })
            .lean();

        if (!showtimes || showtimes.length === 0) {
            return res.status(200).json([]);
        }

        res.json(showtimes);
    } catch (err) {
        console.error('Error al obtener la lista de showtimes:', err);
        res.status(500).json({ message: 'Error interno del servidor al cargar la cartelera.', error: err.message });
    }
};

/**
 * Obtener un showtime específico por ID.
 */
exports.get = async (req, res) => {
    try {
        const showtime = await Showtime.findById(req.params.id)
            .populate('movie')
            .populate('hall')
            .lean();

        if (!showtime) {
            return res.status(404).json({ message: 'Showtime no encontrado' });
        }
        
        const { seatsBooked, availableSeats } = calculateSeats(showtime);

        res.json({
            ...showtime,
            seatsBooked, 
            availableSeats
        });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

/**
 * Función placeholder para la ruta /reserve.
 * Es necesaria como función para que el router no arroje un TypeError.
 */
exports.reserveSeats = (req, res) => {
    // Devuelve un 501 (Not Implemented) para forzar el uso del flujo correcto (lock-seats/purchase)
    return res.status(501).json({ message: 'La ruta /reserve está obsoleta. Use el flujo de /lock-seats y /purchase.' });
};