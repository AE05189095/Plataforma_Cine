const express = require('express');
const router = express.Router();
const controller = require('../controllers/hallController');
const authMiddleware = require('./middleware/authMiddleware');
const adminMiddleware = require('./middleware/adminMiddleware');
const authorizeRoles = require('./middleware/authorizeRoles');

// GET /api/halls - lista todas las salas
router.get('/', controller.list);
router.post('/', controller.create);
router.put('/:id',authMiddleware,authorizeRoles('admin','colaborador'), controller.update);
router.delete('/:id', controller.remove);

module.exports = router;
