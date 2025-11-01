const express = require('express');
const router = express.Router();
const reservationController = require('../controllers/reservationController');

router.get('/', reservationController.getAllReservations);
//router.get('/raw', reservationController.getReservationsRaw); // ✅ activada correctamente

module.exports = router;