<<<<<<< HEAD
const express = require('express');
const router = express.Router();
const controller = require('../controllers/movieController');

router.get('/', controller.list);
router.get('/:slug', controller.getBySlug);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.remove);
=======
// server/src/routes/movie.routes.js
const express = require("express");
const router = express.Router();
const controller = require("../controllers/movieController");

// 🎬 Rutas de películas
// Todas responden bajo el prefijo /api/movies (definido en index.js)

// 📍 Obtener todas las películas
// Devuelve las películas con URLs absolutas de imagen (gracias al controlador)
router.get("/", controller.list);

// 🎞️ Obtener una película por ID o slug
router.get("/:id", controller.getById);

// ➕ Crear una nueva película
router.post("/", controller.create);

// ✏️ Actualizar película existente
router.put("/:id", controller.update);

// ❌ Eliminar película
router.delete("/:id", controller.remove);
>>>>>>> mapa-asientos

module.exports = router;
