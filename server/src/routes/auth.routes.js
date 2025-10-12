const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const { loginController, registerController } = require("../controllers/authController"); 
const { recoverPassword, verifyEmail } = require("../controllers/recoverController");
const JWT_SECRET = process.env.JWT_SECRET;

// Ruta de Registro (¡Añadida manualmente!)
router.post("/register", registerController); 

// Ruta de login (Ya estaba)
router.post("/login", loginController);

// Ruta de recuperación de contraseña
router.post("/recover-password", recoverPassword);
// Ruta GET para verificar si el correo existe y dar alerta
router.get("/recover-password", verifyEmail);

const authMiddleware = require("./middleware/authMiddleware");

router.get("/privado", authMiddleware, (req, res) => {
  res.json({ message: "Acceso permitido", userId: req.userId });
});

module.exports = router;