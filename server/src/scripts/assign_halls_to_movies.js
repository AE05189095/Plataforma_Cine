require('dotenv').config();
const mongoose = require('mongoose');
const Movie = require('../models/Movie');
const Hall = require('../models/Hall');

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI no configurada en .env');
    process.exit(1);
  }
  await mongoose.connect(uri);
  console.log('Conectado a MongoDB para assign_halls_to_movies');

  const movies = await Movie.find({}).lean();
  const bySlug = {};
  for (const m of movies) {
    if (m.slug) bySlug[String(m.slug).toLowerCase()] = m._id;
    else if (m.title) bySlug[String(m.title).toLowerCase().replace(/\s+/g, '-')] = m._id;
  }

  const halls = await Hall.find({}).lean();
  let updated = 0;
  for (const h of halls) {
    // intentar extraer slug del nombre: "Sala N - slug"
    const parts = String(h.name || '').split(' - ');
    const slugCandidate = parts[1] ? parts[1].toLowerCase() : null;
    if (slugCandidate && bySlug[slugCandidate]) {
      await Hall.findByIdAndUpdate(h._id, { $set: { movie: bySlug[slugCandidate] } });
      updated++;
      console.log(`Hall ${h._id} asignado a movie ${slugCandidate}`);
    }
  }

  console.log(`Total halls actualizados: ${updated}`);
  await mongoose.disconnect();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
