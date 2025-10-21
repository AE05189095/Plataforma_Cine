require('dotenv').config();
const mongoose = require('mongoose');
const Showtime = require('../models/Showtime');
const Purchase = require('../models/Purchase');

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI no configurada en .env');
    process.exit(1);
  }
  await mongoose.connect(uri);
  console.log('Conectado para limpieza de asientos bloqueados');

  // 1. Obtener todas las compras activas (status: paid o reserved)
  const activePurchases = await Purchase.find({ status: { $in: ['paid', 'reserved'] } }).lean();
  const validPurchaseIds = new Set(activePurchases.map(p => String(p._id)));

  // 2. Obtener todos los showtimes
  const showtimes = await Showtime.find({}).lean();
  let totalShowtimes = 0, totalSeatsRemoved = 0, totalMapRemoved = 0;

  for (const st of showtimes) {
    let changed = false;
    // Limpiar seatsBookedMap: solo dejar los que tengan purchase activa
    const originalMap = Array.isArray(st.seatsBookedMap) ? st.seatsBookedMap : [];
    const filteredMap = originalMap.filter(entry => validPurchaseIds.has(String(entry.purchase)));
    if (filteredMap.length !== originalMap.length) {
      changed = true;
      totalMapRemoved += (originalMap.length - filteredMap.length);
    }
    // Limpiar seatsBooked: solo dejar los asientos que estén en seatsBookedMap filtrado
    const validSeats = new Set(filteredMap.map(entry => entry.seat));
    const originalSeats = Array.isArray(st.seatsBooked) ? st.seatsBooked : [];
    const filteredSeats = originalSeats.filter(seat => validSeats.has(seat));
    if (filteredSeats.length !== originalSeats.length) {
      changed = true;
      totalSeatsRemoved += (originalSeats.length - filteredSeats.length);
    }
    if (changed) {
      await Showtime.findByIdAndUpdate(st._id, { $set: { seatsBookedMap: filteredMap, seatsBooked: filteredSeats } });
      totalShowtimes++;
      console.log(`Showtime ${st._id}: limpiado`);
    }
  }

  await mongoose.disconnect();
  console.log(`Limpieza completada. Showtimes modificados: ${totalShowtimes}, asientos eliminados: ${totalSeatsRemoved}, mapeos eliminados: ${totalMapRemoved}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
