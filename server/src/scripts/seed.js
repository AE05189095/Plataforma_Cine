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

  // Crear varias salas reales
  const hallsData = [
    { name: 'Sala 1 - Principal', capacity: 120 },
    { name: 'Sala 2 - VIP', capacity: 60 },
    { name: 'Sala 3 - 3D', capacity: 90 },
  ];
  const halls = await Hall.insertMany(hallsData);

  // Películas reales (no ficticias) - datos mínimos
  const moviesData = [
    { title: 'Inception', slug: 'inception', description: 'Un thriller de ciencia ficción dirigido por Christopher Nolan.', genres: ['Sci-Fi', 'Thriller'], duration: 148, director: 'Christopher Nolan', releaseDate: new Date('2010-07-16') },
    { title: 'Interstellar', slug: 'interstellar', description: 'Exploración espacial y drama familiar.', genres: ['Sci-Fi', 'Drama'], duration: 169, director: 'Christopher Nolan', releaseDate: new Date('2014-11-07') },
    { title: 'Parasite', slug: 'parasite', description: 'Thriller surcoreano que mezcla géneros.', genres: ['Drama', 'Thriller'], duration: 132, director: 'Bong Joon-ho', releaseDate: new Date('2019-05-30') },
    { title: 'La La Land', slug: 'la-la-land', description: 'Musical romántico moderno.', genres: ['Musical', 'Romance'], duration: 128, director: 'Damien Chazelle', releaseDate: new Date('2016-12-09') },
    { title: 'The Shawshank Redemption', slug: 'the-shawshank-redemption', description: 'Drama carcelario basado en Stephen King.', genres: ['Drama'], duration: 142, director: 'Frank Darabont', releaseDate: new Date('1994-09-22') },
  ];

  const movies = [];
  for (const m of moviesData) {
    const created = await Movie.create(m);
    movies.push(created);
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

    for (let si = 0; si < timeStrings.length; si++) {
      const [hourStr, minStr] = timeStrings[si].split(':');

      let assignedHall = null;
      let chosenStart = null;

      // Buscar una sala y día sin conflicto
      for (let dayOffset = 0; dayOffset <= maxDayAdvance && !assignedHall; dayOffset++) {
        for (let hi = 0; hi < halls.length && !assignedHall; hi++) {
          const hall = halls[hi];
          const candidateStart = new Date(startDay.getFullYear(), startDay.getMonth(), startDay.getDate() + dayOffset, Number(hourStr), Number(minStr));
          const candidateEnd = new Date(candidateStart.getTime() + minutesToMs(movieDuration));

          // Comprobar conflictos con los showtimes ya creados en esa sala
          const conflict = createdShowtimesMeta.some((c) => {
            if (String(c.hall) !== String(hall._id)) return false;
            const existingStart = c.startAt;
            const existingEnd = c.endAt;
            return overlaps(candidateStart, candidateEnd, existingStart, existingEnd, bufferMinutes);
          });

          if (!conflict) {
            assignedHall = hall;
            chosenStart = candidateStart;
            break;
          }
        }
      }

      // Si no encontró sala en el rango, aplicar fallback: asignar por rotación y desplazar 30 min hasta encontrar
      if (!assignedHall) {
        let fallbackHall = halls[(mi + si) % halls.length];
        let trialStart = new Date(startDay.getFullYear(), startDay.getMonth(), startDay.getDate(), Number(hourStr), Number(minStr));
        let attempts = 0;
        const maxAttempts = 48; // hasta 12 horas en intervalos de 15min
        while (attempts < maxAttempts && !assignedHall) {
          const trialEnd = new Date(trialStart.getTime() + minutesToMs(movieDuration));
          const conflict = createdShowtimesMeta.some((c) => String(c.hall) === String(fallbackHall._id) && overlaps(trialStart, trialEnd, c.startAt, c.endAt, bufferMinutes));
          if (!conflict) {
            assignedHall = fallbackHall;
            chosenStart = trialStart;
            break;
          }
          // desplazar 15 minutos
          trialStart = new Date(trialStart.getTime() + minutesToMs(15));
          attempts++;
        }
        // si aún no hay, asignar la primera sala y dejar el primer horario (aceptando posible conflicto)
        if (!assignedHall) {
          assignedHall = fallbackHall;
          chosenStart = new Date(startDay.getFullYear(), startDay.getMonth(), startDay.getDate(), Number(hourStr), Number(minStr));
        }
      }

      const price = Number((4.5 + (movie.duration ? Math.round(movie.duration / 30) * 0.5 : 1) + (si * 0.2)).toFixed(2));

      const st = await Showtime.create({
        movie: movie._id,
        hall: assignedHall._id,
        startAt: chosenStart,
        price,
      });

      // registrar meta para futuras comprobaciones
      const endAt = new Date(chosenStart.getTime() + minutesToMs(movieDuration));
      createdShowtimesMeta.push({ hall: String(assignedHall._id), startAt: chosenStart, endAt });
    }
  }

  console.log('Seed completado:');
  console.log('Usuarios creados:', user._id.toString());
  console.log('Salas creadas:', halls.map(h => ({ id: h._id.toString(), name: h.name })));
  console.log('Películas creadas:', movies.map(m => ({ id: m._id.toString(), title: m.title })));
  console.log('Showtimes creados (ejemplo 5 por película):', createdShowtimesMeta.length);

  await mongoose.disconnect();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
