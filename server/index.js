// server/index.js (VERSIÓN FINAL UNIFICADA)

require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

// ==========================================================
// 🔑 IMPORTACIÓN DE RUTAS
// ==========================================================
const authRoutes = require("./src/routes/auth.routes");
const movieRoutes = require("./src/routes/movie.routes");
const showtimeRoutes = require("./src/routes/showtime.routes");
const purchaseRoutes = require("./src/routes/purchase.routes");
const hallRoutes = require("./src/routes/hall.routes"); // ✅ nueva ruta

// ==========================================================
// CONFIGURACIÓN DE MIDDLEWARES
// ==========================================================
app.use(cors({
  origin: "*",
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  credentials: true
}));

app.use(express.json());

// ==========================================================
// 🚀 RUTAS DE LA API
// ==========================================================
app.use("/api/auth", authRoutes);
app.use("/api/movies", movieRoutes);
app.use("/api/showtimes", showtimeRoutes);
app.use("/api/purchases", purchaseRoutes);
app.use("/api/halls", hallRoutes);

// Ruta de prueba
app.get("/", (req, res) => {
  res.send("Servidor de Plataforma Cine en línea.");
});

// ==========================================================
// CONEXIÓN A MONGODB Y ARRANQUE DEL SERVIDOR
// ==========================================================
if (typeof MONGODB_URI !== "string" || MONGODB_URI.trim() === "") {
  console.error("❌ ERROR: MONGODB_URI no está definida o es inválida.");
  console.error("Crea un archivo .env con:");
  console.error("    MONGODB_URI=mongodb://usuario:password@host:puerto/nombre_basedatos");
  process.exit(1);
}

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log("✅ Conectado a MongoDB");
    app.listen(PORT, () => {
      console.log(`🚀 Servidor Express escuchando en el puerto ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ ERROR al conectar a MongoDB:", err.message || err);
    process.exit(1);
  });
