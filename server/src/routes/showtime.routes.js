const express = require("express");
const router = express.Router();
const controller = require("../controllers/showtimeController"); // Usaremos 'controller' para consistencia
// const authMiddleware = require('./middleware/authMiddleware'); // Si se usa en rutas POST/PUT/DELETE

// 🎬 Listar todas las funciones
router.get("/", controller.list);

// 💺 Obtener mapa de asientos (para la vista de selección)
// Debe ir antes de /:id para que Express no confunda 'seats' con un ID.
router.get("/:id/seats", controller.getSeats);

// 🎞️ Obtener función específica por ID
router.get("/:id", controller.get);

// ➕ Crear nueva función (Admin)
router.post("/", controller.create);

// ✏️ Actualizar función (Admin)
router.put("/:id", controller.update);

// ❌ Eliminar función (Admin)
router.delete("/:id", controller.remove);

module.exports = router;