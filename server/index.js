<<<<<<< HEAD
// server/index.js (CÓDIGO FINAL CORREGIDO)

require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// ==========================================================
// 🔑 IMPORTACIÓN DE RUTAS (Una sola vez para cada ruta) 🔑
// ==========================================================
const authRoutes = require('./src/routes/auth.routes.js');
const movieRoutes = require("./src/routes/movie.routes.js"); // <--- Mantenemos la primera importación
const showtimeRoutes = require('./src/routes/showtime.routes'); // <--- Importaciones movidas aquí
const purchaseRoutes = require('./src/routes/purchase.routes'); // <--- Importaciones movidas aquí
// const userRoutes = require('./src/routes/user.routes.js'); // Descomentar si es necesario

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

// ==========================================================
// CONFIGURACIÓN DE MIDDLEWARES Y CORS
// ==========================================================

// Middleware CORS
app.use(cors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true
}));

// Middleware para procesar JSON
app.use(express.json()); 


// ==========================================================
// 🚀 RUTAS DE LA API (Consolidado) 🚀
// ==========================================================

// Todas las rutas de autenticación irán bajo /api/auth
app.use('/api/auth', authRoutes);

// Rutas de contenido (Películas, funciones, compras)
app.use('/api/movies', movieRoutes); 
app.use('/api/showtimes', showtimeRoutes);
app.use('/api/purchases', purchaseRoutes);
// app.use('/api/users', userRoutes); // Descomentar si es necesario

// Ruta de prueba
app.get('/', (req, res) => {
    res.send('Servidor de Plataforma Cine en línea.');
});


// ==========================================================
// CONEXIÓN A MONGODB Y ARRANQUE DEL SERVIDOR
// ==========================================================

// Validar que la URI de MongoDB esté definida
if (typeof MONGODB_URI !== 'string' || MONGODB_URI.trim() === '') {
    console.error('❌ ERROR: la variable de entorno MONGODB_URI no está definida o no es una cadena válida.');
    console.error('Asegúrate de crear un archivo .env en la carpeta server con una línea como:');
    console.error('    MONGODB_URI=mongodb://usuario:password@host:puerto/nombre_basedatos');
    process.exit(1);
}

// Conectar a MongoDB
mongoose.connect(MONGODB_URI)
    .then(() => {
        console.log('✅ Conectado a MongoDB');

        app.listen(PORT, () => {
            console.log(`🚀 Servidor Express escuchando en el puerto ${PORT}`);
        });
    })
    .catch(err => {
        console.error('❌ ERROR al conectar a MongoDB:', err.message || err);
        process.exit(1);
    });
=======
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
>>>>>>> mapa-asientos
