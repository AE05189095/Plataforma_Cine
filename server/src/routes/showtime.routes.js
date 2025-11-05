const express = require('express');
const router = express.Router();
const controller = require('../controllers/showtimeController');
const authMiddleware = require('./middleware/authMiddleware');
const adminMiddleware = require('./middleware/adminMiddleware');
const authorizeRoles = require('./middleware/authorizeRoles');

// Rutas públicas
router.get('/', controller.list);
router.get('/:id', controller.get);

// ADMIN CRUD (requiere autenticación y rol admin)
router.post('/', authMiddleware,adminMiddleware, controller.create);
router.patch('/:id', authMiddleware,authorizeRoles('admin','colaborador'), controller.update);
router.delete('/:id', authMiddleware, adminMiddleware,controller.remove);

// ADMIN: limpiar locks manualmente (limpia embebidos y colección SeatLock)
router.delete('/:id/locks', authMiddleware, controller.clearLocks);

// Bloqueo y reserva de asientos (protegidos)
router.post('/:id/lock-seats', authMiddleware, controller.lockSeats);
router.post('/:id/reserve', authMiddleware, controller.reserveSeats);

module.exports = router;
