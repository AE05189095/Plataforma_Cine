require('dotenv').config();
const mongoose = require('mongoose');

const User = require('../models/User');
const Movie = require('../models/Movie');
const Hall = require('../models/Hall');
const Showtime = require('../models/Showtime');
const Purchase = require('../models/Purchase');
const Review = require('../models/Review');

async function inspect() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI no configurada en .env');
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log('Conectado para inspección');

  const [users, movies, halls, showtimes, purchases, reviews] = await Promise.all([
    User.find({}).lean(),
    Movie.find({}).lean(),
    Hall.find({}).lean(),
    Showtime.find({}).lean(),
    Purchase.find({}).lean(),
    Review.find({}).lean(),
  ]);

  console.log('\n--- Users ---');
  console.log(JSON.stringify(users, null, 2));

  console.log('\n--- Movies ---');
  console.log(JSON.stringify(movies, null, 2));

  console.log('\n--- Halls ---');
  console.log(JSON.stringify(halls, null, 2));

  console.log('\n--- Showtimes ---');
  console.log(JSON.stringify(showtimes, null, 2));

  console.log('\n--- Purchases ---');
  console.log(JSON.stringify(purchases, null, 2));

  console.log('\n--- Reviews ---');
  console.log(JSON.stringify(reviews, null, 2));

  await mongoose.disconnect();
}

inspect().catch(err => {
  console.error(err);
  process.exit(1);
});
