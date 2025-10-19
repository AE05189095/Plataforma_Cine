require('dotenv').config();
const mongoose = require('mongoose');

const User = require('../models/User');
const Admin = require('../models/Admin');
const Colab = require('../models/Colab');

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI no configurada en .env');
    process.exit(1);
  }
  await mongoose.connect(uri);

  const [,, email, newPassword] = process.argv;
  if (!email || !newPassword) {
    console.error('Uso: node reset_password.js <email> <newPassword>');
    await mongoose.disconnect();
    process.exit(1);
  }

  // Buscar en User, Admin, Colab
  let user = await User.findOne({ email });
  let modelName = 'User';
  if (!user) {
    user = await Admin.findOne({ email });
    modelName = user ? 'Admin' : modelName;
  }
  if (!user) {
    user = await Colab.findOne({ email });
    modelName = user ? 'Colab' : modelName;
  }

  if (!user) {
    console.error('Usuario no encontrado con email:', email);
    await mongoose.disconnect();
    process.exit(1);
  }

  user.password = newPassword; // el pre-save hook en cada modelo hará el hash
  await user.save();

  console.log(`Contraseña actualizada para ${email} en modelo ${modelName}`);
  await mongoose.disconnect();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
