const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const { loginController, registerController } = require("../controllers/authController");
const { recoverPassword, verifyEmail } = require("../controllers/recoverController");
const authMiddleware = require("./middleware/authMiddleware");
const Colab = require("../models/Colab");

const JWT_SECRET = process.env.JWT_SECRET || "clave_secreta";

// --- Rutas de Autenticación ---
router.post("/register", registerController);
router.post("/login", loginController);

// --- Rutas de compatibilidad heredadas ---
router.post("/login-admin", loginController);
router.post("/login-colaborador", loginController);

// --- Rutas de recuperación ---
router.post("/recover-password", recoverPassword);
router.get("/recover-password", verifyEmail);

// --- Verificación de token (admin panel, compatibilidad) ---
router.get("/verify", (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No autorizado" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return res.json(decoded);
  } catch (err) {
    return res.status(401).json({ message: "Token inválido o expirado" });
  }
});

// --- Ruta protegida para pruebas ---
router.get("/protegida", authMiddleware, (req, res) => {
  res.json({
    mensaje: "Acceso autorizado",
    userId: req.userId.userId,
    tipoUsuario: req.userId.tipoUsuario,
  });
});

module.exports = router;
