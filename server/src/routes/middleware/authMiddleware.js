// backend/routes/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');

// Importante: Debes tener instalado 'cookie-parser' en tu backend para que req.cookies funcione.

const JWT_SECRET = process.env.JWT_SECRET;

if (typeof JWT_SECRET !== 'string' || JWT_SECRET.trim() === '') {
    // Dejamos la verificación al inicio del archivo
    throw new Error('JWT_SECRET no está definido en las variables de entorno');
}

/**
 * Middleware para autenticar al usuario usando JWT.
 * Intenta leer el token primero de la cookie 'jwt' y luego del encabezado 'Authorization: Bearer'.
 */
const authMiddleware = (req, res, next) => {
    let token = null;
    
    // 1. Intentar leer el token desde la cookie 'jwt' (prioridad para el frontend)
    if (req.cookies && req.cookies.jwt) {
        token = req.cookies.jwt;
    } 
    
    // 2. Si no hay token en la cookie, intentar leerlo del encabezado Authorization
    if (!token) {
        const authHeader = req.headers.authorization;

        if (authHeader) {
            const parts = authHeader.split(' ');
            // Asegurarse de que el formato sea "Bearer token"
            if (parts.length === 2 && parts[0] === 'Bearer') {
                token = parts[1];
            }
        }
    }
    
    // 3. Si no se encontró el token, denegar acceso
    if (!token) {
        return res.status(401).json({ message: 'No autenticado: Token no proporcionado o formato inválido.' });
    }

    // 4. Verificar y decodificar el token
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        
        // Adjuntar el ID del usuario y el rol a req.user
        req.user = { 
            _id: decoded.userId,
            role: decoded.role 
        }; 
        
        // Opcional: También guardamos el userId directamente para compatibilidad
        req.userId = decoded.userId;

        next();
    } catch (err) {
        console.error("JWT Verification Error:", err.message); 
        return res.status(401).json({ message: 'Sesión expirada o token inválido.' });
    }
};

module.exports = authMiddleware;
