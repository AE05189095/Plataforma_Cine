const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const { loginController, registerController } = require("../controllers/authController"); // ¡Añadir registerController aquí!
const JWT_SECRET = process.env.JWT_SECRET;

// Ruta de Registro (¡Añadida manualmente!)
router.post("/register", registerController); // <-- Línea de Registro

// Ruta de login (Ya estaba)
router.post("/login", loginController);

const authMiddleware = require("./middleware/authMiddleware");

router.get("/privado", authMiddleware, (req, res) => {
  res.json({ message: "Acceso permitido", userId: req.userId });
});

module.exports = router;