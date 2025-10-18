const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

// --- Middlewares ---
app.use(cors());
app.use(express.json());

// ✅ Servir imágenes desde client/public/images
app.use(
  "/images",
  express.static(
    path.join(__dirname, "../client/public/images")
  )
);

// --- Importar rutas ---
const authRoutes = require("./src/routes/auth.routes");
const movieRoutes = require("./src/routes/movie.routes");
const showtimeRoutes = require("./src/routes/showtime.routes");
const purchaseRoutes = require("./src/routes/purchase.routes");
const hallRoutes = require("./src/routes/hall.routes");

// --- Registrar rutas con prefijo /api ---
app.use("/api/auth", authRoutes);
app.use("/api/movies", movieRoutes);
app.use("/api/showtimes", showtimeRoutes);
app.use("/api/purchases", purchaseRoutes);
app.use("/api/halls", hallRoutes);

// --- Conexión a MongoDB ---
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("✅ Conectado a MongoDB Atlas");
    app.listen(PORT, () =>
      console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`)
    );
  })
  .catch((err) =>
    console.error("❌ Error al conectar MongoDB:", err.message)
  );
