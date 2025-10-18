// server/index.js (CÓDIGO FINAL CONSOLIDADO)

require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// ==========================================================
// 🔑 IMPORTACIÓN DE RUTAS 🔑
// ==========================================================
const authRoutes = require('./src/routes/auth.routes.js');
const movieRoutes = require("./src/routes/movie.routes.js");
const showtimeRoutes = require('./src/routes/showtime.routes.js');
const purchaseRoutes = require('./src/routes/purchase.routes.js');
const hallRoutes = require("./src/routes/hall.routes.js"); // 🆕 Rutas de Salas

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

// ==========================================================
// CONFIGURACIÓN DE MIDDLEWARES Y CORS
// ==========================================================
app.use(cors({
  origin: '*',
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true
}));

app.use(express.json()); // Middleware para procesar JSON

// ==========================================================
// 🚀 MONTAJE DE RUTAS DE LA API 🚀
// ==========================================================
app.use('/api/auth', authRoutes);
app.use('/api/movies', movieRoutes); 
app.use('/api/showtimes', showtimeRoutes);
app.use('/api/purchases', purchaseRoutes);
app.use("/api/halls", hallRoutes); // Ruta de Salas

// Ruta de prueba
app.get('/', (req, res) => {
  res.send('Servidor de Plataforma Cine en línea.');
});

// ==========================================================
// CONEXIÓN A MONGODB Y ARRANQUE DEL SERVIDOR
// ==========================================================
if (typeof MONGODB_URI !== 'string' || MONGODB_URI.trim() === '') {
  console.error('❌ ERROR: la variable de entorno MONGODB_URI no está definida o no es válida.');
  console.error('Crea un archivo .env en la carpeta server con la URI de tu base de datos.');
  process.exit(1);
}

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
