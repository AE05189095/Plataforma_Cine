// server/src/models/User.js - CORREGIDO con bcrypt en pre('save')

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

// 🚨 MODIFICACIÓN CLAVE: Middleware para hashear la contraseña antes de guardar
userSchema.pre("save", async function (next) {
  // Solo hashear si la contraseña ha sido modificada (o es nueva)
  if (!this.isModified("password")) {
    return next();
  }

  try {
    // Hashear la contraseña
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});


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