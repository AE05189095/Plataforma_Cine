<<<<<<< HEAD
const express = require('express');
const router = express.Router();
const controller = require('../controllers/purchaseController');

router.post('/', controller.create);
router.get('/user/:userId', controller.listByUser);
=======
const express = require("express");
const router = express.Router();
const controller = require("../controllers/purchaseController");
const authMiddleware = require("./middleware/authMiddleware");
router.post("/", authMiddleware, controller.create);


router.get("/me", authMiddleware, controller.listByUser);


router.get("/", controller.list);
router.post("/", controller.create);
>>>>>>> mapa-asientos

module.exports = router;
