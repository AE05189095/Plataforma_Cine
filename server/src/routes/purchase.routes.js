const express = require("express");
const router = express.Router();
const controller = require("../controllers/purchaseController");
const authMiddleware = require("./middleware/authMiddleware");
router.post("/", authMiddleware, controller.create);


router.get("/me", authMiddleware, controller.listByUser);


router.get("/", controller.list);
router.post("/", controller.create);

module.exports = router;
