// server/index.js (CÓDIGO FINAL CORREGIDO)

require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path'); // 🖼️ Necesario para manejar rutas de archivos estáticos
const { helmet, apiLimiter } = require('./src/middleware/security');

const authRoutes = require('./src/routes/auth.routes.js');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;
const JWT_SECRET = process.env.JWT_SECRET;
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || '*';

// ==========================================================
// CONFIGURACIÓN DE MIDDLEWARES Y CORS
// ==========================================================

if (ALLOWED_ORIGIN === '*' && process.env.NODE_ENV === 'production') {
  console.warn('⚠️  ALLOWED_ORIGIN está en "*" en producción. Considere restringirlo.');
}

app.use(
  cors({
    origin: ALLOWED_ORIGIN,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: ALLOWED_ORIGIN !== '*',
  })
);

// Security middlewares
app.use(helmet());
// Aplicar rate limiter a rutas /api para proteger endpoints públicos
app.use('/api', apiLimiter);

// Middleware para procesar JSON
app.use(express.json());

// ==========================================================
// 🖼️ CONFIGURACIÓN DE ARCHIVOS ESTÁTICOS (IMÁGENES)
// ==========================================================
// Permite que el navegador acceda a archivos dentro de la carpeta 'uploads'
// Ejemplo: http://localhost:5000/uploads/poster.jpg
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ==========================================================
// RUTAS DE LA API
// ==========================================================

app.use('/api/auth', authRoutes);
const movieRoutes = require('./src/routes/movie.routes');
const showtimeRoutes = require('./src/routes/showtime.routes');
const purchaseRoutes = require('./src/routes/purchase.routes');

app.use('/api/movies', movieRoutes);
app.use('/api/showtimes', showtimeRoutes);
app.use('/api/purchases', purchaseRoutes);

app.get('/', (req, res) => {
  res.send('Servidor de Plataforma Cine en línea.');
});

// ==========================================================
// CONEXIÓN A MONGODB Y ARRANQUE DEL SERVIDOR
// ==========================================================

if (typeof MONGODB_URI !== 'string' || MONGODB_URI.trim() === '') {
  console.error('❌ ERROR: la variable de entorno MONGODB_URI no está definida o no es una cadena válida.');
  console.error('Asegúrate de crear un archivo .env en la carpeta server con una línea como:');
  console.error('    MONGODB_URI=mongodb://usuario:password@host:puerto/nombre_basedatos');
  process.exit(1);
}

if (typeof JWT_SECRET !== 'string' || JWT_SECRET.trim() === '') {
  console.error('❌ ERROR: la variable de entorno JWT_SECRET no está definida o es inválida.');
  console.error('Define JWT_SECRET en el archivo .env dentro de la carpeta server. Ej:');
  console.error('    JWT_SECRET=una_clave_muy_segura');
  process.exit(1);
}

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log('✅ Conectado a MongoDB');

    const server = http.createServer(app);
    const io = new Server(server, {
      cors: {
        origin: ALLOWED_ORIGIN === '*' ? true : ALLOWED_ORIGIN,
        methods: ['GET', 'POST'],
      },
    });

    app.locals.io = io;

    io.on('connection', (socket) => {
      console.log('Socket conectado:', socket.id);
      socket.on('disconnect', () => console.log('Socket desconectado:', socket.id));
    });

    server.listen(PORT, () => {
      console.log(`🚀 Servidor Express + Socket.IO escuchando en el puerto ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ ERROR al conectar a MongoDB:', err.message || err);
    process.exit(1);
  });