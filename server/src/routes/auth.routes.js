

const express = require('express');
const router = express.Router(); 


const { loginController, registerController, meController, changePasswordController } = require('../controllers/authController');

const authMiddleware = require('./middleware/authMiddleware');


const { recoverPassword, verifyEmail } = require('../controllers/recoverController.js'); 


router.post('/register', registerController);
router.post('/login', loginController);
// Alias para compatibilidad con endpoints usados por el cliente
router.post('/login-admin', loginController);
router.post('/login-colaborador', loginController);


router.post('/recover-password', recoverPassword); 


router.get('/recover-password', verifyEmail); 

// Rutas protegidas
router.get('/me', authMiddleware, meController);
router.post('/change-password', authMiddleware, changePasswordController);


// Confirmar correo
router.get('/confirm-email/:token', async (req, res) => {
  try {
      const { token } = req.params;

          const user = await require('../models/User').findOne({ confirmationToken: token });
              if (!user) {
                    return res.status(400).send('Token inválido o expirado');
                        }

                            user.emailConfirmed = true;
                                user.confirmationToken = null;
                                    await user.save();

                                        res.send('Correo confirmado correctamente');
                                          } catch (error) {
                                              console.error(error);
                                                  res.status(500).send('Error en el servidor');
                                                    }
                                                    });
                                                    

module.exports = router;


                                                    


