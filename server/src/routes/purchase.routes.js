const express = require('express');
const router = express.Router();
const controller = require('../controllers/purchaseController');
const auth = require('./middleware/authMiddleware');

router.post('/', auth, controller.create);
router.get('/user/:userId', controller.listByUser);

module.exports = router;
