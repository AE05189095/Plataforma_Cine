// server/src/models/User.js

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    // Nombre de usuario tal como lo envía el frontend (campo "username")
    username: { type: String, required: true, trim: true },
    // Correo electrónico (único)
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    // Contraseña encriptada (no guardar texto plano)
    password: { type: String, required: true },
    // Tipo de usuario: por ahora 'cliente' por defecto, puede ser 'admin' en el futuro
    tipoUsuario: { type: String, enum: ["cliente", "admin"], default: "cliente" },
  },
  {
    timestamps: true, // createdAt, updatedAt
  }
);

// Método para comparar contraseñas (útil en el login)
userSchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Evitar devolver la contraseña en las respuestas JSON
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model("User", userSchema);
