// server/src/routes/movie.routes.js
const express = require('express');
const router = express.Router();
const controller = require('../controllers/movieController');

router.get('/', controller.list);
router.get('/:id', controller.getById); // ← Usaremos este (no getBySlug)
router.post('/', controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.remove);

module.exports = router;
