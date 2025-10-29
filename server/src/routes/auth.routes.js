// server/src/routes/auth.routes.js 

const express = require('express');
const router = express.Router(); 
const Log = require("../models/Log.js");

// --- Importaciones de Controladores (Estructura Modular) ---
const { loginController, registerController, loginAdmin, loginColab, meController, changePasswordController } = require('../controllers/authController');
const { recoverPassword, verifyEmail } = require('../controllers/recoverController.js'); 
const authMiddleware = require('./middleware/authMiddleware'); // <--- SÓLO UNA DECLARACIÓN

// --- Rutas de Autenticación y Login ---
router.post('/register', registerController);
router.post('/login', loginController);
// Alias para compatibilidad (Se mantienen desde presentation/final-demo)
router.post('/login-admin', loginAdmin);
router.post('/login-colaborador', loginColab);

// --- Rutas de Recuperación (Se mantienen desde presentation/final-demo) ---
router.post('/recover-password', recoverPassword); 
router.get('/recover-password', verifyEmail); 

// --- Rutas Protegidas ---
router.get("/me", authMiddleware, meController);
router.post("/change-password", authMiddleware, changePasswordController);

//ruta cerrar sesion
router.post("/logout", async (req, res) => {
  const { userId, role } = req.body;
  if (!userId || !role) {
    return res.status(400).json({ message: "Usuario no autenticado" });
  }
  try {
    await Log.create({usuario: userId, role, accion: "cierre_sesion",
      descripcion: `El usuario cerró sesión.`,
    });
    // Borrar cookie de sesión si existe
    try { res.clearCookie('jwt', { path: '/' }); } catch (e) { /* ignore */ }
    res.json({ message: "Sesión cerrada correctamente." });
  } catch (error) {
    console.error("Error al registrar cierre de sesión:", error);
    res.json({ message: "Sesión cerrada correctamente, aunque el log falló." });
  }
});


// Mantenemos la ruta /protegida original de presentation/final-demo
router.get('/protegida', authMiddleware, (req, res) => {
    res.json({
        mensaje: 'Acceso autorizado',
        userId: req.userId.userId,
        role: req.userId.role
    });
});

module.exports = router;
