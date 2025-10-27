const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

router.post('/create-payment-intent', paymentController.createPaymentIntent);
router.get('/payment-intent/:id', paymentController.retrievePaymentIntent);
router.post('/create-checkout-session', paymentController.createCheckoutSession);
router.get('/checkout-session/:id', paymentController.retrieveCheckoutSession);
router.post('/charge-with-token', paymentController.chargeWithToken);

module.exports = router;
