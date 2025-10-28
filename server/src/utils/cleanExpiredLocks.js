// server/src/utils/cleanExpiredLocks.js
const Showtime = require('../models/Showtime');

async function cleanExpiredLocks(io) {
  try {
    const now = new Date();

    // Buscar todos los showtimes con locks expirados
    const showtimes = await Showtime.find({
      'seatsLocks.expiresAt': { $lte: now }
    });

    for (const st of showtimes) {
      const beforeCount = st.seatsLocks.length;
      
      // Filtrar locks que NO hayan expirado
      st.seatsLocks = (st.seatsLocks || []).filter(lock => lock.expiresAt > now);

      if (st.seatsLocks.length !== beforeCount) {
        await st.save();
        // Emitir evento para actualizar UI
        if (io) {
          io.emit('showtimeUpdated', {
            _id: st._id,
            seatsBooked: st.seatsBooked || [],
            seatsLocked: st.seatsLocks.flatMap(l => l.seats),
            availableSeats: Math.max(0, (st.hall?.capacity || 0) - ((st.seatsBooked || []).length + st.seatsLocks.flatMap(l => l.seats).length))
          });
        }
      }
    }
  } catch (err) {
    console.error('Error limpiando locks expirados:', err);
  }
}

module.exports = cleanExpiredLocks;
