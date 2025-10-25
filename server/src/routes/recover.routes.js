const express = require('express');
const router = express.Router();
const { recoverPassword } = require('../controllers/recoverController');

router.post('/recover-password', recoverPassword);

module.exports = router;
