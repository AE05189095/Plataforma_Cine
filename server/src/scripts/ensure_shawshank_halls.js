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
  console.log('Conectado a MongoDB');

  // 1) Eliminar película de prueba creada por sync
  try {
    const res = await Movie.deleteMany({ title: /Prueba Sync Movie/i });
    console.log('Películas "Prueba Sync Movie" eliminadas:', res.deletedCount);
  } catch (e) {
    console.warn('Error eliminando Prueba Sync Movie', e);
  }

  // 2) Encontrar todas las películas que correspondan a Shawshank
  const candidates = await Movie.find({ title: /shawshank/i }).sort({ createdAt: 1 }).lean();
  if (candidates.length === 0) {
    console.error('No se encontró película "The Shawshank Redemption" en la BD. Abortando.');
    await mongoose.disconnect();
    return;
  }

  // Mantener la primera (más antigua) como canonical
  const canonical = candidates[0];
  const duplicates = candidates.slice(1);
  console.log(`Encontradas ${candidates.length} películas con "shawshank" — manteniendo id=${canonical._id}`);

  // Reasignar showtimes de duplicados a canonical y eliminar duplicados
  for (const dup of duplicates) {
    try {
      const res = await Showtime.updateMany({ movie: dup._id }, { $set: { movie: canonical._id } });
      console.log(`Reasignados ${res.nModified ?? res.modifiedCount} showtimes de movie ${dup._id} -> ${canonical._id}`);
      await Movie.findByIdAndDelete(dup._id);
      console.log(`Eliminada película duplicada ${dup._id}`);
    } catch (e) {
      console.warn('Error reasignando/eliminando duplicado', dup._id, e);
    }
  }

  // 3) Asegurar que existan 5 salas para la película canonical
  const existingHalls = await Hall.find({ movie: canonical._id }).lean();
  console.log('Salas ya asociadas a canonical:', existingHalls.map(h => ({ id: h._id.toString(), name: h.name }))); 

  const hallNames = [];
  for (let i = 1; i <= 5; i++) {
    hallNames.push(`Sala ${i} - ${canonical.slug || canonical.title}`);
  }

  const created = [];
  for (const name of hallNames) {
    const found = existingHalls.find(h => h.name && h.name.toLowerCase() === name.toLowerCase());
    if (found) continue;
    // crear la sala con capacidad por defecto 80, excepto primeras 3 con variados
    const cap = (name.includes('Sala 1') ? 120 : (name.includes('Sala 2') ? 60 : (name.includes('Sala 3') ? 90 : 80)));
    try {
      const doc = await Hall.create({ name, capacity: cap, movie: canonical._id });
      created.push(doc);
      console.log('Creada sala:', doc._id.toString(), name);
    } catch (e) {
      console.warn('Error creando sala', name, e.message || e);
    }
  }

  // refrescar lista de halls
  const finalHalls = await Hall.find({ movie: canonical._id }).lean();
  console.log(`Total salas asociadas a "${canonical.title}": ${finalHalls.length}`);

  // 4) Reasignar showtimes que tengan movie canonical pero hall null o no perteneciente a esta movie
  const hallIds = finalHalls.map(h => String(h._id));
  const showtimes = await Showtime.find({ movie: canonical._id }).lean();
  let reassigned = 0;
  for (let i = 0; i < showtimes.length; i++) {
    const st = showtimes[i];
    if (!st.hall || !hallIds.includes(String(st.hall))) {
      const pick = finalHalls[i % finalHalls.length];
      try {
        await Showtime.findByIdAndUpdate(st._id, { $set: { hall: pick._id } });
        reassigned++;
        console.log(`Showtime ${st._id} reasignado a hall ${pick._id}`);
      } catch (e) {
        console.warn('Error reasignando showtime', st._id, e.message || e);
      }
    }
  }

  console.log(`Reasignados ${reassigned} showtimes a halls de la película canonical.`);

  await mongoose.disconnect();
  console.log('Proceso completado.');
}

main().catch(err => {
  console.error('Error en ensure_shawshank_halls.js', err);
  process.exit(1);
});
