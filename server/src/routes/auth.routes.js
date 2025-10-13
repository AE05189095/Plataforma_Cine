

const express = require('express');
const router = express.Router(); 


const { loginController, registerController } = require('../controllers/authController');


const { recoverPassword, verifyEmail } = require('../controllers/recoverController.js'); 


router.post('/register', registerController);
router.post('/login', loginController);
// Alias para compatibilidad con endpoints usados por el cliente
router.post('/login-admin', loginController);
router.post('/login-colaborador', loginController);


router.post('/recover-password', recoverPassword); 


router.get('/recover-password', verifyEmail); 



module.exports = router;


