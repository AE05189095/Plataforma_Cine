const express = require('express');
const router = express.Router();
const controller = require('../controllers/movieController');
const imageDomains = require('../controllers/imageDomainsController'); // para dominios de imágenes

// Rutas CRUD para películas
router.get('/', controller.list);
router.get('/:slug', controller.getBySlug);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.remove);

// Endpoint para obtener dominios de imágenes (posterUrl)
router.get('/_internal/image-domains', imageDomains.list);

module.exports = router;
