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
  console.log('Conectado a MongoDB para ensure_halls_for_movies');

  const movies = await Movie.find({ isActive: true }).lean();
  const halls = await Hall.find({}).lean();

  console.log(`Películas activas: ${movies.length}, Salas existentes: ${halls.length}`);

  const needed = Math.max(0, movies.length - halls.length);
  if (needed === 0) {
    console.log('Ya hay suficientes salas. Nada que hacer.');
    await mongoose.disconnect();
    return;
  }

  const created = [];
  for (let i = 0; i < needed; i++) {
    const idx = halls.length + i + 1;
    const name = `Sala ${idx} - Generada`;
    const capacity = 80; // default
    const doc = await Hall.create({ name, capacity });
    created.push(doc);
    console.log('Creada sala:', doc._id.toString(), name);
  }

  console.log(`Se crearon ${created.length} salas.`);
  await mongoose.disconnect();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
