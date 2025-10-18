// server/src/routes/movie.routes.js

const express = require('express');
const router = express.Router();
const controller = require('../controllers/movieController');
// Nota: Aquí se deben importar los middlewares de autenticación y roles si se usan en POST/PUT/DELETE
// const authMiddleware = require('./middleware/authMiddleware');
// const roleMiddleware = require('./middleware/roleMiddleware');

router.get('/', controller.list);
// Usamos :id, ya que el controlador fusionado (getById) maneja IDs y Slugs
router.get('/:id', controller.getById); 
router.post('/', controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.remove);

module.exports = router;