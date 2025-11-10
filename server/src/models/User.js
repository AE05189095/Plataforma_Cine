// server/src/models/User.js

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    // Nombre de usuario
    username: { type: String, required: true, trim: true },
    // Correo electrónico (único)
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    // Contraseña encriptada
    password: { type: String, required: true },
    // Tipo de usuario: 'cliente' por defecto
    role: { type: String, enum: ["cliente","colaborador", "admin"], default: "cliente" },
  },
  {
    timestamps: true, // createdAt, updatedAt
  }
);

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const bcrypt = require('bcryptjs');
  this.password = await bcrypt.hash(this.password, 10);
  next();
});


// Método para comparar contraseñas (útil en el login)
userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Evitar devolver la contraseña en las respuestas JSON
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model("User", userSchema);
