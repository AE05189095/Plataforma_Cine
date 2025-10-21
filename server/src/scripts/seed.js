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


  // Películas reales (no ficticias) - datos mínimos
  const moviesData = [
    { title: 'Inception', slug: 'inception', description: 'Un thriller de ciencia ficción dirigido por Christopher Nolan.', genres: ['Sci-Fi', 'Thriller'], duration: 148, director: 'Christopher Nolan', releaseDate: new Date('2010-07-16'), posterUrl: 'https://m.media-amazon.com/images/M/MV5BNTQxYmM1NzQtY2FiZS00MzRhLTljZDYtZjRmMGNiMWI3NTQxXkEyXkFqcGc@._V1_.jpg' },
    { title: 'Interstellar', slug: 'interstellar', description: 'Exploración espacial y drama familiar.', genres: ['Sci-Fi', 'Drama'], duration: 169, director: 'Christopher Nolan', releaseDate: new Date('2014-11-07'), posterUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS0zt0lp-O3XdL8zzdrEvyzmcl6kOwfgbv4xQ&s' },
    { title: 'Parasite', slug: 'parasite', description: 'Thriller surcoreano que mezcla géneros.', genres: ['Drama', 'Thriller'], duration: 132, director: 'Bong Joon-ho', releaseDate: new Date('2019-05-30'), posterUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTcyJYd_sWzQdj87gwIiDRpi6JtzfY6-XLG-w&s' },
    { title: 'La La Land', slug: 'la-la-land', description: 'Musical romántico moderno.', genres: ['Musical', 'Romance'], duration: 128, director: 'Damien Chazelle', releaseDate: new Date('2016-12-09'), posterUrl: 'https://m.media-amazon.com/images/M/MV5BYmI2MDIyYWYtZWY0MC00MWFkLTkxMjYtMWQ3N2Y1Zjk1MmM5XkEyXkFqcGc@._V1_.jpg' },
    { title: 'The Shawshank Redemption', slug: 'the-shawshank-redemption', description: 'Drama carcelario basado en Stephen King.', genres: ['Drama'], duration: 142, director: 'Frank Darabont', releaseDate: new Date('1994-09-22'), posterUrl: 'https://m.media-amazon.com/images/M/MV5BMDAyY2FhYjctNDc5OS00MDNlLThiMGUtY2UxYWVkNGY2ZjljXkEyXkFqcGc@._V1_FMjpg_UX1000_.jpg' },
  ];

  const movies = [];
  const allHalls = [];
  for (const m of moviesData) {
    const created = await Movie.create(m);
    movies.push(created);
    // Crear 5 salas exclusivas para cada película
    for (let i = 1; i <= 5; i++) {
      const hall = await Hall.create({ name: `Sala ${i} - ${created.title}`, capacity: 64 });
      allHalls.push({ hall, movieId: created._id });
    }
  }

  // Horarios plausibles (5 por película): horarios típicos del cine
  const timeStrings = ['11:00', '14:30', '17:00', '19:45', '22:15'];

  // Generar showtimes para cada película, evitando solapamientos por sala
  const createdShowtimesMeta = []; // { hall: String, startAt: Date, endAt: Date }

  const today = new Date();
  // Empezar desde mañana para evitar horarios pasados
  const startDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

  const bufferMinutes = 15; // tiempo de limpieza entre funciones
  const maxDayAdvance = 7; // buscar hasta 7 días adelante si no hay sala libre

  function minutesToMs(m) { return m * 60 * 1000; }

  function overlaps(aStart, aEnd, bStart, bEnd, bufferMin = 0) {
    const bufferMs = minutesToMs(bufferMin);
    return aStart < (bEnd.getTime() + bufferMs) && bStart.getTime() < (aEnd.getTime() + bufferMs);
  }

  for (let mi = 0; mi < movies.length; mi++) {
    const movie = movies[mi];
    const movieDuration = movie.duration || 120; // minutos
    // Obtener las 5 salas exclusivas de esta película
    const movieHalls = allHalls.filter(h => String(h.movieId) === String(movie._id)).map(h => h.hall);

    for (let si = 0; si < timeStrings.length; si++) {
      const [hourStr, minStr] = timeStrings[si].split(':');
      // Asignar cada showtime a una de las 5 salas de la película, rotando
      const assignedHall = movieHalls[si % movieHalls.length];
      const chosenStart = new Date(startDay.getFullYear(), startDay.getMonth(), startDay.getDate(), Number(hourStr), Number(minStr));
      const price = Number((4.5 + (movie.duration ? Math.round(movie.duration / 30) * 0.5 : 1) + (si * 0.2)).toFixed(2));

      const st = await Showtime.create({
        movie: movie._id,
        hall: assignedHall._id,
        startAt: chosenStart,
        price,
      });

      // registrar meta para futuras comprobaciones (opcional, ya no se usa para conflictos)
      const endAt = new Date(chosenStart.getTime() + minutesToMs(movieDuration));
      createdShowtimesMeta.push({ hall: String(assignedHall._id), startAt: chosenStart, endAt });
    }
  }

  console.log('Seed completado:');
  console.log('Usuarios creados:', user._id.toString());
  console.log('Salas creadas:', allHalls.map(h => ({ id: h.hall._id.toString(), name: h.hall.name, pelicula: movies.find(m => String(m._id) === String(h.movieId))?.title })));
  console.log('Películas creadas:', movies.map(m => ({ id: m._id.toString(), title: m.title })));
  console.log('Showtimes creados (ejemplo 5 por película):', createdShowtimesMeta.length);

  await mongoose.disconnect();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
