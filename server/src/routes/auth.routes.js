// server/src/routes/auth.routes.js

const express = require('express');
const router = express.Router(); 

// --- Importaciones de controladores ---
const { loginController, registerController } = require('../controllers/authController');
const { recoverPassword, verifyEmail } = require('../controllers/recoverController.js'); 
const authMiddleware = require('./middleware/authMiddleware'); 

// --- Rutas de registro y login ---
router.post('/register', registerController);
router.post('/login', loginController);

// Alias para compatibilidad (login unificado)
router.post('/login-admin', loginController);
router.post('/login-colaborador', loginController);

// --- Rutas de recuperación de contraseña ---
router.post('/recover-password', recoverPassword); 
router.get('/recover-password', verifyEmail); 

// --- Ruta protegida de ejemplo ---
router.get('/protegida', authMiddleware, (req, res) => {
  res.json({
    mensaje: 'Acceso autorizado',
    userId: req.userId, // El middleware asigna solo el ID
    // Para más datos, el middleware debería asignarlos a req.user
  });
});

module.exports = router;
