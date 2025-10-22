require('dotenv').config();
const mongoose = require('mongoose');
const Movie = require('../models/Movie');
const Hall = require('../models/Hall');
const Showtime = require('../models/Showtime');

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI no configurada en .env');
    process.exit(1);
  }
  await mongoose.connect(uri);
  console.log('Conectado para limpiar y recrear halls y showtimes');

  // 1. Eliminar todos los halls y showtimes
  const deletedHalls = await Hall.deleteMany({});
  const deletedShowtimes = await Showtime.deleteMany({});
  console.log(`Halls eliminados: ${deletedHalls.deletedCount}`);
  console.log(`Showtimes eliminados: ${deletedShowtimes.deletedCount}`);

  // 2. Crear 5 halls y 1 showtime por hall para cada película
  const allMovies = await Movie.find({});
  for (const m of allMovies) {
    const halls = [];
    for (let i = 1; i <= 5; i++) {
      const hall = await Hall.create({
        name: `Sala ${i} - ${m.slug}`,
        movie: m._id,
        capacity: 64,
        isActive: true
      });
      halls.push(hall);
      console.log(`Hall creado: ${hall.name}`);
    }
    for (const hall of halls) {
      const startAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // mañana
      await Showtime.create({
        movie: m._id,
        hall: hall._id,
        startAt,
        price: 7,
        seatsBooked: [],
        seatsBookedMap: [],
        isActive: true
      });
      console.log(`Showtime creado para ${m.title} en ${hall.name} a las ${startAt}`);
    }
  }

  await mongoose.disconnect();
  console.log('Proceso completado. Solo 5 halls y 5 showtimes por película.');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
