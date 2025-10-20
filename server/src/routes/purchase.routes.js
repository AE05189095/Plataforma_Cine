const express = require('express');
const router = express.Router();

const purchaseController = require('../controllers/purchaseController');
const auth = require('./middleware/authMiddleware');

router.post('/', auth, purchaseController.create);
router.get('/user/:userId', purchaseController.listByUser);

module.exports = router;
