const express = require('express');
const router = express.Router();
const controller = require('../controllers/showtimeController');
const authMiddleware = require('./middleware/authMiddleware');

// Rutas públicas
router.get('/', controller.list);
router.get('/:id', controller.get);

// ADMIN CRUD (requiere autenticación y rol admin)
router.post('/', authMiddleware, controller.create);
router.patch('/:id', authMiddleware, controller.update);
router.delete('/:id', authMiddleware, controller.remove);

// ADMIN: limpiar locks manualmente (limpia embebidos y colección SeatLock)
router.delete('/:id/locks', authMiddleware, controller.clearLocks);

// Bloqueo y reserva de asientos (protegidos)
router.post('/:id/lock-seats', authMiddleware, controller.lockSeats);
router.post('/:id/reserve', authMiddleware, controller.reserveSeats);

module.exports = router;
