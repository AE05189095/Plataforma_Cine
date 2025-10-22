const express = require('express');
const router = express.Router();

const purchaseController = require('../controllers/purchaseController');
const auth = require('./middleware/authMiddleware'); // Asegúrate de que esta ruta sea correcta

// ==========================================================
// Rutas de Compra y Gestión de Holds
// ==========================================================

// [POST] /api/purchases -> Crea una compra final (o convierte un hold a pagado)
router.post('/', auth, purchaseController.create);

// [POST] /api/purchases/hold -> Crea una reserva temporal (hold)
router.post('/hold', auth, purchaseController.hold);

// [PUT] /api/purchases/:id/update-hold -> Actualiza los asientos y/o el tiempo de un hold existente
router.put('/:id/update-hold', auth, purchaseController.updateHold);

// [DELETE] /api/purchases/:id/release -> Libera/Cancela una reserva temporal (hold)
router.delete('/:id/release', auth, purchaseController.release);

// [GET] /api/purchases/user/:userId -> Obtiene todas las compras/reservas de un usuario específico
// Nota: La autorización dentro del controller protege que solo el dueño vea sus compras.
router.get('/user/:userId', auth, purchaseController.listByUser);

module.exports = router;