const express = require("express");
const router = express.Router();
const Hall = require("../models/Hall");

router.get("/", async (req, res) => {
  try {
    const halls = await Hall.find();
    res.json(halls);
  } catch (error) {
    console.error("Error al obtener salas:", error);
    res.status(500).json({ message: "Error al obtener salas" });
  }
});

module.exports = router;
