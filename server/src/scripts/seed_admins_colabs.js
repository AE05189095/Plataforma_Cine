require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('../models/Admin');
const Colab = require('../models/Colab');

function randomPassword() {
  // contraseña legible para pruebas
  return Math.random().toString(36).slice(-8) + 'A1!';
}

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI no configurada en .env');
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log('Conectado para seed admins/colabs');

  // Limpiar colecciones específicas
  await Promise.all([Admin.deleteMany({}), Colab.deleteMany({})]);

  const admins = [];
  const colabs = [];

  for (let i = 1; i <= 5; i++) {
    const email = `admin${i}@cinegtdb.test`;
    const password = randomPassword();
    const user = await Admin.create({ username: `Admin ${i}`, email, password });
    admins.push({ email, password });
  }

  for (let i = 1; i <= 5; i++) {
    const email = `colab${i}@cinegtdb.test`;
    const password = randomPassword();
    const user = await Colab.create({ username: `Colab ${i}`, email, password });
    colabs.push({ email, password });
  }

  console.log('Admins creados:');
  console.table(admins);
  console.log('Colaboradores creados:');
  console.table(colabs);

  await mongoose.disconnect();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
