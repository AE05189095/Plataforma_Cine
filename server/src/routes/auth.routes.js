

const express = require('express');
const router = express.Router(); 


const { loginController, registerController } = require('../controllers/authController');


const { recoverPassword, verifyEmail } = require('../controllers/recoverController.js'); 


router.post('/register', registerController);
router.post('/login', loginController);


router.post('/recover-password', recoverPassword); 


router.get('/recover-password', verifyEmail); 


module.exports = router;
