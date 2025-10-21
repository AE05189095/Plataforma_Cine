require('dotenv').config();
const mongoose = require('mongoose');
const Movie = require('../models/Movie');

const posters = {
  'the-shawshank-redemption': 'https://m.media-amazon.com/images/M/MV5BMDAyY2FhYjctNDc5OS00MDNlLThiMGUtY2UxYWVkNGY2ZjljXkEyXkFqcGc@._V1_FMjpg_UX1000_.jpg',
  'la-la-land': 'https://m.media-amazon.com/images/M/MV5BYmI2MDIyYWYtZWY0MC00MWFkLTkxMjYtMWQ3N2Y1Zjk1MmM5XkEyXkFqcGc@._V1_.jpg',
  'parasite': 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTcyJYd_sWzQdj87gwIiDRpi6JtzfY6-XLG-w&s',
  'interstellar': 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS0zt0lp-O3XdL8zzdrEvyzmcl6kOwfgbv4xQ&s',
  'inception': 'https://m.media-amazon.com/images/M/MV5BNTQxYmM1NzQtY2FiZS00MzRhLTljZDYtZjRmMGNiMWI3NTQxXkEyXkFqcGc@._V1_.jpg',
};

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI no configurada en .env');
    process.exit(1);
  }
  await mongoose.connect(uri);
  console.log('Conectado a MongoDB');

  for (const [slug, url] of Object.entries(posters)) {
    const updated = await Movie.findOneAndUpdate(
      { slug },
      { posterUrl: url },
      { new: true }
    );
    if (updated) {
      console.log(`Poster actualizado para ${slug}`);
    } else {
      console.warn(`No se encontró película con slug: ${slug}`);
    }
  }

  await mongoose.disconnect();
  console.log('Actualización de posters completada.');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
