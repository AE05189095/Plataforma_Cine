const express = require('express');
const router = express.Router();
const controller = require('../controllers/showtimeController');

router.get('/', controller.list);
router.get('/:id', controller.get);
router.post('/:id/reserve', controller.reserveSeats);

module.exports = router;
