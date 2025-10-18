const express = require("express");
const router = express.Router();
const showtimeController = require("../controllers/showtimeController");

// 📍 Listar todas las funciones
router.get("/", showtimeController.list);

// 🪑 Obtener mapa de asientos
router.get("/:id/seats", showtimeController.getSeats);

// 🎬 Obtener función específica
router.get("/:id", showtimeController.get);

// 🔒 Reservar asientos de forma atómica
router.post("/:id/reserve", showtimeController.reserveSeats);

// ➕ Crear nueva función
router.post("/", showtimeController.create);

// ✏️ Actualizar función
router.put("/:id", showtimeController.update);

// ❌ Eliminar función
router.delete("/:id", showtimeController.remove);

module.exports = router;
