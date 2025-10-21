const express = require('express');
const router = express.Router();
const controller = require('../controllers/purchaseController');
const auth = require('./middleware/authMiddleware');

router.post('/', auth, controller.create);
router.post('/hold', auth, controller.hold);
router.delete('/:id/release', auth, controller.release);
// proteger listado de compras por usuario: sólo el usuario dueño puede ver sus compras
router.get('/user/:userId', auth, controller.listByUser);
// actualizar un hold temporal
router.put('/:id/update-hold', auth, controller.updateHold);

module.exports = router;
