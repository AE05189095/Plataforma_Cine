// server/src/routes/purchase.routes.js
const express = require('express');
const router = express.Router();
const purchaseController = require('../controllers/purchaseController');
const auth = require('./middleware/authMiddleware');

// Definir todas las rutas de purchases
router.post('/', auth, purchaseController.create);
router.post('/showtimes/:showtimeId/lock-seats', auth, purchaseController.lockSeats);
router.get('/user/:userId', auth, purchaseController.listByUser);

module.exports = router;