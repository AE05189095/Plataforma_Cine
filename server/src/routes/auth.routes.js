const express = require('express');
const router = express.Router(); 


const { loginController, registerController, meController, changePasswordController } = require('../controllers/authController');

// 🚨 CORRECCIÓN CRÍTICA DE RUTA: 
// Se corrigió a './middleware/authMiddleware' para reflejar que está en una subcarpeta
const authMiddleware = require('./middleware/authMiddleware');


const { recoverPassword, verifyEmail } = require('../controllers/recoverController.js'); 


router.post('/register', registerController);
router.post('/login', loginController);
// Alias para compatibilidad con endpoints usados por el cliente
router.post('/login-admin', loginController);
router.post('/login-colaborador', loginController);


router.post('/recover-password', recoverPassword); 


router.get('/recover-password', verifyEmail); 

// 🚨 Rutas protegidas descomentadas y activadas
router.get('/me', authMiddleware, meController);
router.post('/change-password', authMiddleware, changePasswordController);

module.exports = router;

