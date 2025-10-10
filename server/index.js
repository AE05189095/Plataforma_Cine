// server/index.js

require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors'); // La librería necesaria para CORS


const authRoutes = require('./src/routes/auth.routes.js'); 

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

// ==========================================================
// CONFIGURACIÓN DE MIDDLEWARES Y CORS
// ==========================================================

// Solución definitiva al error CORS en desarrollo: usamos '*'
// Esto permite peticiones desde cualquier origen (localhost:3001, localhost:3000, etc.)
app.use(cors({
    origin: '*', 
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE', 
    credentials: true
}));

// Middleware para procesar JSON (debe ir después de CORS)
app.use(express.json()); 


// ==========================================================
// RUTAS DE LA API
// ==========================================================

// Todas las rutas de autenticación irán bajo /api/auth
app.use('/api/auth', authRoutes);

// Ruta de prueba
app.get('/', (req, res) => {
    res.send('Servidor de Plataforma Cine en línea.');
});


// ==========================================================
// CONEXIÓN A MONGODB Y ARRANQUE DEL SERVIDOR
// ==========================================================

mongoose.connect(MONGODB_URI)
    .then(() => {
        console.log('✅ Conectado a MongoDB');

        app.listen(PORT, () => {
            console.log(`🚀 Servidor Express escuchando en el puerto ${PORT}`);
        });
    })
    .catch(err => {
        
        console.error('❌ ERROR al conectar a MongoDB:', err.message);
        // Termina el proceso si la conexión a la DB falla
        process.exit(1); 
    });




mongoose.connect(MONGODB_URI)
    .then(() => {
        console.log('✅ Conectado a MongoDB');

        app.listen(PORT, () => {
            console.log(`🚀 Servidor Express escuchando en el puerto ${PORT}`);
        });
    })
    .catch(err => {
        
        console.error('❌ ERROR al conectar a MongoDB:', err.message);
        // Termina el proceso si la conexión a la DB falla
        process.exit(1); 
    });