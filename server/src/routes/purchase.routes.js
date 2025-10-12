const express = require('express');
const router = express.Router();
const controller = require('../controllers/purchaseController');

router.post('/', controller.create);
router.get('/user/:userId', controller.listByUser);

module.exports = router;
