// server/index.js

require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path'); // 🖼️ Manejo de archivos estáticos
const cookieParser = require('cookie-parser'); // 🛑 Necesario para cookies
const { helmet, apiLimiter } = require('./src/middleware/security');

const authRoutes = require('./src/routes/auth.routes.js');
const movieRoutes = require('./src/routes/movie.routes');
const showtimeRoutes = require('./src/routes/showtime.routes');
const purchaseRoutes = require('./src/routes/purchase.routes');
const hallRoutes = require('./src/routes/hall.routes');

const http = require('http');
const { Server } = require('socket.io');

const Showtime = require('./src/models/Showtime'); // 🛑 IMPORTANTE para limpieza de locks

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;
const JWT_SECRET = process.env.JWT_SECRET;
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || '*';

// ==========================================================
// CONFIGURACIÓN DE MIDDLEWARES
// ==========================================================
if (ALLOWED_ORIGIN === '*' && process.env.NODE_ENV === 'production') {
  console.warn('⚠️ ALLOWED_ORIGIN está en "*" en producción. Considera restringirlo.');
}

app.use(
  cors({
    origin: ALLOWED_ORIGIN === '*' ? true : ALLOWED_ORIGIN,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

app.use(helmet());
app.use('/api', apiLimiter);
app.use(express.json());
app.use(cookieParser());

// Archivos estáticos
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ==========================================================
// RUTAS
// ==========================================================
app.use('/api/auth', authRoutes);
app.use('/api/movies', movieRoutes);
app.use('/api/showtimes', showtimeRoutes);
app.use('/api/purchases', purchaseRoutes);
app.use('/api/halls', hallRoutes);

app.get('/', (req, res) => {
  res.send('Servidor de Plataforma Cine en línea.');
});

// ==========================================================
// FUNCIÓN PARA LIMPIAR LOCKS EXPIRADOS
// ==========================================================
const LOCK_CLEAN_INTERVAL_MS = 30 * 1000; // Cada 30 segundos

const cleanExpiredLocks = async () => {
  const now = new Date();
  try {
    const expiredShowtimes = await Showtime.find({ 'seatsLocks.expiresAt': { $lt: now } }).populate('hall');
    for (const st of expiredShowtimes) {
      const oldLocks = st.seatsLocks.filter(lock => lock.expiresAt < now);
      if (oldLocks.length > 0) {
        st.seatsLocks = st.seatsLocks.filter(lock => lock.expiresAt >= now);
        await st.save();

        if (app.locals.io) {
          const seatsLocked = st.seatsLocks.flatMap(l => l.seats);
          const seatsBooked = st.seatsBooked || [];
          const availableSeats = Math.max(0, (st.hall?.capacity || 0) - (seatsBooked.length + seatsLocked.length));

          // Emitir eventos específicos por showtime
          app.locals.io.emit(`updateLockedSeats-${st._id}`, { seatsLocked });
          app.locals.io.emit(`updateReservedSeats-${st._id}`, { seatsBooked });
          app.locals.io.emit(`updateAvailableSeats-${st._id}`, { availableSeats });
        }
      }
    }
  } catch (err) {
    console.error('❌ Error limpiando locks expirados:', err);
  }
};

// ==========================================================
// CONEXIÓN A MONGODB Y ARRANQUE DEL SERVIDOR
// ==========================================================
if (!MONGODB_URI || !MONGODB_URI.trim()) {
  console.error('❌ ERROR: MONGODB_URI no está definido en .env');
  process.exit(1);
}
if (!JWT_SECRET || !JWT_SECRET.trim()) {
  console.error('❌ ERROR: JWT_SECRET no está definido en .env');
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

    // 🚀 Iniciar limpieza automática de locks
    setInterval(cleanExpiredLocks, LOCK_CLEAN_INTERVAL_MS);

    server.listen(PORT, () => {
      console.log(`🚀 Servidor Express + Socket.IO escuchando en el puerto ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ ERROR al conectar a MongoDB:', err.message || err);
    process.exit(1);
  });
