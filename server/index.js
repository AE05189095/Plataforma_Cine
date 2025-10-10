// server/index.js

require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// Importación de rutas (Asegúrate de que todas las rutas del equipo estén aquí si las necesitas)
const authRoutes = require('./src/routes/auth.routes.js'); 
// const userRoutes = require('./src/routes/user.routes.js'); // Descomentar si la rama CIN-16 trajo rutas de usuario

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

// ==========================================================
// CONFIGURACIÓN DE MIDDLEWARES Y CORS
// ==========================================================

// Middleware CORS - Usamos el comodín '*' para evitar futuros problemas en desarrollo
app.use(cors({
    origin: '*', // Permite peticiones desde cualquier lugar (localhost:3000, 3001, etc.)
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true
}));

// Middleware para procesar JSON
app.use(express.json()); 


// ==========================================================
// RUTAS DE LA API
// ==========================================================

// Todas las rutas de autenticación irán bajo /api/auth
app.use('/api/auth', authRoutes); 
// app.use('/api/users', userRoutes); // Descomentar si es necesario

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
