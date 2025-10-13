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