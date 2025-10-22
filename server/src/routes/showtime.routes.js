// backend/routes/showtime.routes.js

const express = require('express');
const router = express.Router();

// Importar el controlador de showtime
const showtimeController = require('../controllers/showtimeController');
// 💡 CORRECCIÓN DE LA RUTA: Cambiado a purchaseController (sin el punto)
// Esto asume que el archivo en /controllers/ se llama purchaseController.js
const purchaseController = require('../controllers/purchaseController');

// Importar la función de middleware para rutas protegidas
const verifyToken = require('./middleware/authMiddleware');

router.get('/', showtimeController.list);
router.get('/:id', showtimeController.get);

// RUTA CORREGIDA: Bloqueo de asientos
router.post('/:id/lock-seats', verifyToken, purchaseController.handleSeatLock);

// RUTA Placeholder: (Debe ser una función para evitar el TypeError)
router.post('/:id/reserve', verifyToken, showtimeController.reserveSeats);

module.exports = router;