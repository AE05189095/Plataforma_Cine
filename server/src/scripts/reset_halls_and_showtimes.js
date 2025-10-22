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
  console.log('Conectado para crear halls y showtimes limpios');

  // 1. Buscar la película The Shawshank Redemption
  const movie = await Movie.findOne({ slug: 'the-shawshank-redemption' });
  if (!movie) {
    console.error('No se encontró la película The Shawshank Redemption');
    process.exit(1);
  }

  // 2. Crear 5 halls si no existen
  const halls = [];
  for (let i = 1; i <= 5; i++) {
    let hall = await Hall.findOne({ name: `Sala ${i} - the-shawshank-redemption` });
    if (!hall) {
      hall = await Hall.create({
        name: `Sala ${i} - the-shawshank-redemption`,
        movie: movie._id,
        capacity: 64,
        isActive: true
      });
      console.log(`Hall creado: ${hall.name}`);
    } else {
      // Asegurar que esté asociada a la película
      if (String(hall.movie) !== String(movie._id)) {
        hall.movie = movie._id;
        await hall.save();
        console.log(`Hall actualizado: ${hall.name}`);
      }
    }
    halls.push(hall);
  }

  // 3. Eliminar todos los showtimes
  const deleted = await Showtime.deleteMany({});
  console.log(`Showtimes eliminados: ${deleted.deletedCount}`);

  // 4. Crear showtimes para cada hall de cada película
  const allMovies = await Movie.find({});
  for (const m of allMovies) {
    const movieHalls = await Hall.find({ movie: m._id });
    for (const hall of movieHalls) {
      // Crear 2 funciones por sala, horarios ejemplo
      const horarios = [
        new Date(Date.now() + 24 * 60 * 60 * 1000), // mañana
        new Date(Date.now() + 2 * 24 * 60 * 60 * 1000) // pasado mañana
      ];
      for (const startAt of horarios) {
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
  }

  await mongoose.disconnect();
  console.log('Proceso completado. Halls y showtimes actualizados.');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
