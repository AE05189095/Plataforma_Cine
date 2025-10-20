// server/src/routes/auth.routes.js 

const express = require('express');
const router = express.Router(); 

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


// Mantenemos la ruta /protegida original de presentation/final-demo
router.get('/protegida', authMiddleware, (req, res) => {
    res.json({
        mensaje: 'Acceso autorizado',
        userId: req.userId.userId,
        role: req.userId.role
    });
});

module.exports = router;