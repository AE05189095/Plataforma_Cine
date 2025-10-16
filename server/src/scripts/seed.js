require('dotenv').config();
const mongoose = require('mongoose');

const User = require('../models/User');
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
  console.log('Conectado para seed');

  // Limpiar colecciones (cuidado en prod)
  await Promise.all([
    User.deleteMany({}),
    Movie.deleteMany({}),
    Hall.deleteMany({}),
    Showtime.deleteMany({}),
  ]);

  // Crear usuario de prueba
  const user = await User.create({
    username: 'cliente_prueba',
    email: 'cliente@ejemplo.com',
    password: 'password123',
  });

  // Crear sala
  const hall = await Hall.create({ name: 'Sala 1', capacity: 80 });

  // Crear película
  const movie = await Movie.create({
    title: 'Película de Prueba',
    slug: 'pelicula-de-prueba',
    description: 'Sinopsis de la película de prueba',
    genres: ['Drama'],
    duration: 120,
  });

  // Crear función
  const showtime = await Showtime.create({
    movie: movie._id,
    hall: hall._id,
    startAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // mañana
    price: 5.0,
  });

  console.log('Seed completado:', { user: user._id, movie: movie._id, hall: hall._id, showtime: showtime._id });

  await mongoose.disconnect();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
