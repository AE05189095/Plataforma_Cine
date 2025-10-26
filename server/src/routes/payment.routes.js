const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

router.post('/create-payment-intent', paymentController.createPaymentIntent);
router.get('/payment-intent/:id', paymentController.retrievePaymentIntent);

module.exports = router;
