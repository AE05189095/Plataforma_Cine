const express = require('express');
const router = express.Router();
const controller = require('../controllers/movieController');
const imageDomains = require('../controllers/imageDomainsController'); // para dominios de imágenes
const authMiddleware= require('./middleware/authMiddleware');
const adminMiddleware = require('./middleware/adminMiddleware');

// Rutas CRUD para películas
router.get('/', controller.list);
router.get('/:slug', controller.getBySlug);
router.post('/', authMiddleware,adminMiddleware,controller.create);
router.put('/:id',authMiddleware,adminMiddleware,controller.update);
router.delete('/:id',authMiddleware,adminMiddleware,controller.remove);

// Endpoint para obtener dominios de imágenes (posterUrl)
router.get('/_internal/image-domains', imageDomains.list);

module.exports = router;
