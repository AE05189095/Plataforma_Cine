// server/src/routes/auth.routes.js (CORREGIDO)

const express = require('express');
const router = express.Router(); // ⬅️ 1. CREAMOS EL ROUTER

// 2. Importamos las funciones de los controladores
const { loginController, registerController } = require('../controllers/authController');

// 3. ASIGNAMOS las funciones a las rutas
router.post('/register', registerController);
router.post('/login', loginController);

// 4. 🚨 EXPORTAMOS EL OBJETO ROUTER 🚨 (Soluciona el TypeError)
module.exports = router;