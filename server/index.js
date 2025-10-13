// server/index.js

require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// Importación de rutas
const authRoutes = require('./src/routes/auth.routes.js');
const movieRoutes = require("./src/routes/movie.routes.js");
// const userRoutes = require('./src/routes/user.routes.js'); // Descomentar si es necesario

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

// ==========================================================
// CONFIGURACIÓN DE MIDDLEWARES Y CORS
// ==========================================================

// Middleware CORS - Usamos el comodín '*' para evitar problemas en desarrollo
app.use(cors({
    origin: '*', // Permite peticiones desde cualquier lugar (localhost:3000, 3001, etc.)
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true
}));

// Middleware para procesar JSON
app.use(express.json()); 


// ==========================================================
// RUTAS DE LA API
app.use('/api/auth', authRoutes);
app.use('/api/movies', movieRoutes);
// ==========================================================

// Todas las rutas de autenticación irán bajo /api/auth
app.use('/api/auth', authRoutes);
// Rutas de contenido
const movieRoutes = require('./src/routes/movie.routes');
const showtimeRoutes = require('./src/routes/showtime.routes');
const purchaseRoutes = require('./src/routes/purchase.routes');

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
    console.error('    MONGODB_URI=mongodb://usuario:password@host:puerto/nombre_basedatos');
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