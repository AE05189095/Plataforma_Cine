
// server/index.js

require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const cookieParser = require('cookie-parser');
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

// CONFIGURACIÓN DE CORS
app.use(
  cors({
    origin: ALLOWED_ORIGIN,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    // CLAVE: Permite el envío de cookies/tokens JWT por el cliente
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

// Security middlewares
app.use(helmet());
// Aplicar rate limiter a rutas /api
app.use('/api', apiLimiter);

// Middleware para procesar JSON
app.use(express.json());

// Middleware para procesar cookies (req.cookies)
app.use(cookieParser());

// ==========================================================
// CONFIGURACIÓN DE ARCHIVOS ESTÁTICOS (IMÁGENES/UPLOADS)
// ==========================================================
// Sirve archivos desde la carpeta 'uploads'. Ej: http://localhost:5000/uploads/poster.jpg
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
// VERIFICACIÓN DE VARIABLES DE ENTORNO
// ==========================================================

if (typeof MONGODB_URI !== 'string' || MONGODB_URI.trim() === '') {
  console.error('❌ ERROR: la variable de entorno MONGODB_URI no está definida o no es una cadena válida.');
  process.exit(1);
}

if (typeof JWT_SECRET !== 'string' || JWT_SECRET.trim() === '') {
  console.error('❌ ERROR: la variable de entorno JWT_SECRET no está definida o es inválida.');
  process.exit(1);
}

// ==========================================================
// CONEXIÓN A MONGODB Y ARRANQUE DEL SERVIDOR
// ==========================================================

// Conectar a MongoDB
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('✅ Conectado a MongoDB');

    const server = http.createServer(app);
    
    // Lógica condicional para deshabilitar Socket.IO (tomada de HU6-Semana-2)
    const disableSockets = (process.env.DISABLE_SOCKETS || '').toLowerCase() === '1' || (process.env.DISABLE_SOCKETS || '').toLowerCase() === 'true';

    if (!disableSockets) {
        const io = new Server(server, {
            cors: {
                // Usa true si el origen es '*', de lo contrario usa la URL específica
                origin: ALLOWED_ORIGIN === '*' ? true : ALLOWED_ORIGIN,
                methods: ['GET', 'POST']
            }
        });

        // Guardar io en app.locals para que otros módulos (e.g., rutas) puedan emitir eventos
        app.locals.io = io;

        io.on('connection', (socket) => {
            console.log('Socket conectado:', socket.id);
            socket.on('disconnect', () => console.log('Socket desconectado:', socket.id));
        });

        server.listen(PORT, () => {
            console.log(`🚀 Servidor Express + Socket.IO escuchando en el puerto ${PORT}`);
        });
    } else {
        // Iniciar servidor sin socket.io
        server.listen(PORT, () => {
            console.log(`🚀 Servidor Express (sockets DESHABILITADOS) escuchando en el puerto ${PORT}`);
        });
    }
  })
  .catch(err => {
    console.error('❌ ERROR al conectar a MongoDB:', err.message || err);
    process.exit(1);
  });