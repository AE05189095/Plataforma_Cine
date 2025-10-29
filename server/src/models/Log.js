const mongoose = require("mongoose");

const logSchema = new mongoose.Schema({
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // Puede apuntar a User, Admin o Colab (los 3 usan ObjectId)
    required: true,
  },
  role: {
    type: String,
    enum: ["cliente", "admin", "colaborador"],
    required: true,
  },
  accion: {
    type: String,
    enum: [
      "inicio_sesion", "cierre_sesion", "compra", "cancelacion", "modificacion","creacion","eliminacion",],
    required: true,
  },
  descripcion: {
    type: String,
    required: true,
     maxlength: 300
  },
  fecha: {
    type: Date,
    default: Date.now,
  },
});

// Crear índice TTL en el campo fecha
logSchema.index({ fecha: 1 }, { expireAfterSeconds: 31536000 }); // 12 meses

module.exports = mongoose.model("Log", logSchema);
