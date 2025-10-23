const express = require('express');
const router = express.Router();
const controller = require('../controllers/showtimeController');
const authMiddleware = require('./middleware/authMiddleware');

router.get('/', controller.list);
router.get('/:id', controller.get);

// Bloqueo y reserva protegidos
router.post('/:id/lock-seats', authMiddleware, controller.lockSeats);
router.post('/:id/reserve', authMiddleware, controller.reserveSeats);

module.exports = router;
