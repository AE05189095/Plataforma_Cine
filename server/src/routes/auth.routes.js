<<<<<<< HEAD
// server/src/routes/auth.routes.js (VERSIÓN FINAL RESUELTA)

const express = require('express');
const router = express.Router(); 

// --- Importaciones de Controladores (Estructura Modular) ---
const { loginController, registerController } = require('../controllers/authController');
const { recoverPassword, verifyEmail } = require('../controllers/recoverController.js'); 
const authMiddleware = require('./middleware/authMiddleware'); // <--- SÓLO UNA DECLARACIÓN

// --- Rutas de Autenticación y Login ---
router.post('/register', registerController);
router.post('/login', loginController);
// Alias para compatibilidad (Se mantienen desde presentation/final-demo)
router.post('/login-admin', loginController);
router.post('/login-colaborador', loginController);

// --- Rutas de Recuperación (Se mantienen desde presentation/final-demo) ---
router.post('/recover-password', recoverPassword); 
router.get('/recover-password', verifyEmail); 

// --- Rutas Protegidas ---

// Mantenemos la ruta /protegida original de presentation/final-demo
router.get('/protegida', authMiddleware, (req, res) => {
    res.json({
        mensaje: 'Acceso autorizado',
        userId: req.userId.userId,
        tipoUsuario: req.userId.tipoUsuario
    });
});

// Nota: La ruta /comprar no fue incluida porque causaba inconsistencia en el uso de req.user/req.userId.
// La versión estable de /protegida fue la elegida.

module.exports = router;
=======
const express = require("express");
const router = express.Router();
const {
  loginController,
  registerController,
} = require("../controllers/authController");
const Admin = require("../models/Admin");
const Colab = require("../models/Colab");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "clave_secreta";

/** 🔹 LOGIN UNIFICADO (Admin, Colab, Cliente) */
router.post("/login", loginController);

/** 🔹 REGISTRO DE CLIENTES */
router.post("/register", registerController);

/** 🔹 LOGIN ADMINISTRADOR (compatibilidad) */
router.get("/verify", (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: "No autorizado" });

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return res.json(decoded);
  } catch (err) {
    return res.status(401).json({ message: "Token inválido o expirado" });
  }
});

/** 🔹 LOGIN COLABORADOR (compatibilidad) */
router.post("/login-colaborador", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ message: "Email y contraseña son requeridos." });

  try {
    const colab = await Colab.findOne({ email });
    if (!colab)
      return res.status(401).json({ message: "Credenciales inválidas (colaborador no encontrado)." });

    const match = await colab.comparePassword(password);
    if (!match)
      return res.status(401).json({ message: "Contraseña incorrecta." });

    const token = jwt.sign(
      {
        userId: colab._id,
        email: colab.email,
        username: colab.username,
        role: "colaborador",
      },
      JWT_SECRET,
      { expiresIn: "8h" }
    );

    res.json({
      message: "Inicio de sesión exitoso (colaborador).",
      token,
      user: {
        id: colab._id,
        username: colab.username,
        email: colab.email,
        role: "colaborador",
      },
    });
  } catch (error) {
    console.error("Error en login-colaborador:", error);
    res.status(500).json({ message: "Error interno del servidor." });
  }
});

module.exports = router;
>>>>>>> mapa-asientos
