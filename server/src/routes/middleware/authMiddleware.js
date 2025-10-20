// backend/routes/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

if (typeof JWT_SECRET !== 'string' || JWT_SECRET.trim() === '') {
    throw new Error('JWT_SECRET no está definido en las variables de entorno');
}

const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ message: 'Token no proporcionado' });
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
        return res.status(401).json({ message: 'Formato de token inválido' });
    }

    const token = parts[1];

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        // 🛑 CORRECCIÓN: Adjuntar el ID del usuario a req.user._id para ser usado por el controlador.
        // Asumo que tu token tiene un campo 'userId'.
        req.user = { _id: decoded.userId }; 
        next();
    } catch (err) {
        return res.status(401).json({ message: 'Token expirado o inválido' });
    }
};

module.exports = authMiddleware;