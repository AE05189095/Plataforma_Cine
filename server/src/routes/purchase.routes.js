const express = require("express");
const router = express.Router();
const controller = require("../controllers/purchaseController");
const authMiddleware = require("./middleware/authMiddleware");

// 🔒 Crear una compra (requiere autenticación)
router.post("/", authMiddleware, controller.create);

// 📜 Obtener compras del usuario autenticado
router.get("/me", authMiddleware, controller.listByUser);

// 📜 Obtener todas las compras (admin/debug)
router.get("/", controller.list);
