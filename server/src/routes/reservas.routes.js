const express = require('express');
const router = express.Router();
const { getReservations } = require('../controllers/reservationController');

router.get('/', getReservations);

module.exports = router;
