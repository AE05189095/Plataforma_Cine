const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const { loginController } = require("../controllers/authController"); // Ajusta la ruta si es necesario
const JWT_SECRET = process.env.JWT_SECRET;

// Ruta de login
router.post("/login", loginController);

const authMiddleware = require("./middleware/authMiddleware");

router.get("/privado", authMiddleware, (req, res) => {
  res.json({ message: "Acceso permitido", userId: req.userId });
});

module.exports = router;
