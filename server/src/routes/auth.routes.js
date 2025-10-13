

const express = require('express');
const router = express.Router(); 


const { loginController, registerController } = require('../controllers/authController');


const { recoverPassword, verifyEmail } = require('../controllers/recoverController.js'); 

const authMiddleware = require('./middleware/authMiddleware');


router.post('/register', registerController);
router.post('/login', loginController);


router.post('/recover-password', recoverPassword); 


router.get('/recover-password', verifyEmail); 

router.get('/protegida', authMiddleware, (req, res) => {
  res.json({
    mensaje: 'Acceso autorizado',
    userId: req.userId.userId,
    tipoUsuario: req.userId.tipoUsuario
  });
});



module.exports = router;