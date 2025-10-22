require('dotenv').config();
const mongoose = require('mongoose');
const Purchase = require('../models/Purchase');
const Showtime = require('../models/Showtime');

// Expira reservas que llevan más de X minutos en 'reserved'
const EXPIRE_MINUTES = process.env.RESERVATION_EXPIRE_MINUTES ? Number(process.env.RESERVATION_EXPIRE_MINUTES) : 15;

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI no configurada en .env');
    process.exit(1);
  }
  await mongoose.connect(uri);
  console.log(`Conectado para expirar reservas (> ${EXPIRE_MINUTES} min)`);

  const now = new Date();
  // Buscar compras en estado 'reserved' cuyo reservedUntil esté en el pasado
  const expired = await Purchase.find({ status: 'reserved', reservedUntil: { $lt: now } }).lean();
  console.log(`Encontradas ${expired.length} reservas a expirar`);

  for (const p of expired) {
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        // eliminar mapping entries y legacy seats
        await Showtime.findByIdAndUpdate(p.showtime, { $pull: { seatsBookedMap: { purchase: p._id }, seatsBooked: { $in: p.seats } } }, { session });
        // marcar compra como cancelled/expired
        await Purchase.findByIdAndUpdate(p._id, { $set: { status: 'cancelled', cancelledAt: new Date(), cancelReason: 'expired' } }, { session });
      });
      console.log(`Reserva ${p._id} cancelada y asientos liberados: ${p.seats.join(', ')}`);
      try {
        const fresh = await Showtime.findById(p.showtime).populate('hall').lean();
        const io = require('../../index').app ? null : null; // placeholder (we emit from server process normally)
      } catch (e) {}
    } catch (e) {
      console.error('Error expirando reserva', p._id, e);
    } finally {
      session.endSession();
    }
  }

  await mongoose.disconnect();
  console.log('Proceso de expiración completado');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
