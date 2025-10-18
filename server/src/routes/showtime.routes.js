<<<<<<< HEAD
const express = require('express');
const router = express.Router();
const controller = require('../controllers/showtimeController');

router.get('/', controller.list);
router.get('/:id', controller.get);
router.post('/:id/reserve', controller.reserveSeats);
=======
const express = require("express");
const router = express.Router();
const showtimeController = require("../controllers/showtimeController");

// Listar todas las funciones
router.get("/", showtimeController.list);

// 🆕 Obtener mapa de asientos (antes que get/:id)
router.get("/:id/seats", showtimeController.getSeats);

// Obtener función específica
router.get("/:id", showtimeController.get);

// Crear nueva función
router.post("/", showtimeController.create);

// Actualizar función
router.put("/:id", showtimeController.update);

// Eliminar función
router.delete("/:id", showtimeController.remove);
>>>>>>> mapa-asientos

module.exports = router;
