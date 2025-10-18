const express = require("express");
const router = express.Router();
const controller = require("../controllers/purchaseController");
// Nota: Aquí se deben importar y usar los middlewares de autenticación y roles
// const authMiddleware = require('./middleware/authMiddleware');
// const roleMiddleware = require('./middleware/roleMiddleware');

// ➕ Crear una compra/reserva (Protegida por authMiddleware)
router.post("/", controller.create);

// 📜 Obtener todas las compras (Admin)
// Nota: En un entorno real, esta ruta debería estar protegida con un middleware de rol (ej: roleMiddleware('admin'))
router.get("/", controller.listAll); // Usamos listAll, ya que fusionamos el list de mapa-asientos

// 👤 Obtener compras por usuario (Cliente)
// Nota: Usar el userId del token (req.user.userId) en el controlador es más seguro 
// que usar un parámetro de ruta, pero mantendremos el endpoint de tu rama.
router.get("/user/:userId", controller.listByUser);


module.exports = router;