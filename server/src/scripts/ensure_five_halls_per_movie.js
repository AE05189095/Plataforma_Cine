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
  console.log('Conectado a MongoDB para ensure_five_halls_per_movie');

  const movies = await Movie.find({ isActive: true }).lean();
  for (const movie of movies) {
    // buscar halls ya creados que indiquen que pertenecen a esta movie (por nombre)
    const existing = await Hall.find({ name: new RegExp(`^Sala .* - ${movie.slug || movie.title || movie._id}$`, 'i') }).lean();
    const toCreate = Math.max(0, 5 - existing.length);
    const created = [];
    for (let i = 0; i < toCreate; i++) {
      const idx = existing.length + i + 1;
      const name = `Sala ${idx} - ${movie.slug || movie.title}`;
      const capacity = 64;
      const doc = await Hall.create({ name, capacity, movie: movie._id });
      created.push(doc);
      console.log(`Creada sala para ${movie.slug || movie.title}: ${doc._id} - ${name}`);
    }

    // Recolectar todas las salas para esta movie (nuevas + existentes)
    // actualizar existentes que no tengan movie asignado
    for (const eh of existing) {
      if (!eh.movie) {
        await Hall.findByIdAndUpdate(eh._id, { $set: { movie: movie._id } });
      }
    }
    const allHalls = await Hall.find({ movie: movie._id }).lean();

    // Reasignar showtimes de esta movie que actualmente apunten a halls que no son de esta movie
    const showtimes = await Showtime.find({ movie: movie._id }).lean();
    for (let i = 0; i < showtimes.length; i++) {
      const st = showtimes[i];
      const hallId = st.hall ? String(st.hall) : null;
      const hallIsOwned = allHalls.some(h => String(h._id) === hallId);
      if (!hallIsOwned) {
        // elegir una de las halls de la movie por rotación
        const newHall = allHalls[i % allHalls.length];
        await Showtime.findByIdAndUpdate(st._id, { $set: { hall: newHall._id } });
        console.log(`Showtime ${st._id} re-asignado a hall ${newHall._id}`);
      }
    }
  }

  await mongoose.disconnect();
  console.log('Proceso completado: 5 halls por película aseguradas');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
