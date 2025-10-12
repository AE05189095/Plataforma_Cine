const express = require("express");
const router = express.Router();
const { loginController, registerController } = require('../controllers/authControllerV2');
const { recoverPassword, verifyEmail, resetPassword } = require('../controllers/recoverController');

// Ruta de Registro (¡Añadida manualmente!)
router.post("/register", registerController); 

// Ruta de login (Ya estaba)
router.post('/login', loginController);
// Login específico para administradores y colaboradores
router.post('/login-admin', require('../controllers/authControllerV2').loginAdmin);
router.post('/login-colaborador', require('../controllers/authControllerV2').loginColab);

// Ruta de recuperación de contraseña
router.post("/recover-password", recoverPassword);
// Ruta GET para verificar si el correo existe y dar alerta
router.get("/recover-password", verifyEmail);
// Ruta para resetear contraseña usando token
router.post('/reset-password', resetPassword);

const authMiddleware = require("./middleware/authMiddleware");

router.get("/privado", authMiddleware, (req, res) => {
  res.json({ message: "Acceso permitido", userId: req.userId });
});

module.exports = router;
