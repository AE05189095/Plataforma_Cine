// backend/routes/showtime.routes.js
const express = require('express');
const router = express.Router();
const controller = require('../controllers/showtimeController');
const authMiddleware = require('../routes/middleware/authMiddleware'); // 🛑 Importar middleware

router.get('/', controller.list);
router.get('/:id', controller.get);

// 🛑 NUEVA RUTA PROTEGIDA para el bloqueo de asientos
router.post('/:id/lock-seats', authMiddleware, controller.lockSeats); 

router.post('/:id/reserve', authMiddleware, controller.reserveSeats); // 🛑 Asegurar que la reserva también esté protegida

module.exports = router;