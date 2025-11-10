const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const auth = require('./middleware/authMiddleware');

router.post('/create-payment-intent', paymentController.createPaymentIntent);
router.get('/payment-intent/:id', paymentController.retrievePaymentIntent);
router.post('/create-checkout-session', paymentController.createCheckoutSession);
router.get('/checkout-session/:id', paymentController.retrieveCheckoutSession);
// Proteger el cargo directo con token para poder validar rol
router.post('/charge-with-token', auth, paymentController.chargeWithToken);

module.exports = router;
