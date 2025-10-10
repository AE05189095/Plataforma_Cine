// server/index.js

require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');



const authRoutes = require('./src/routes/auth.routes.js'); 

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;


app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
}));
app.use(express.json()); 


app.use('/api/auth', authRoutes);


mongoose.connect(MONGODB_URI)
    .then(() => {
        console.log('✅ Conectado a MongoDB');

        app.listen(PORT, () => {
            console.log(`🚀 Servidor Express escuchando en el puerto ${PORT}`);
        });
    })
    .catch(err => {
        
        console.error('❌ ERROR al conectar a MongoDB:', err.message);
        process.exit(1); 
    });


app.get('/', (req, res) => {
    res.send('Servidor de Plataforma Cine en línea.');
});