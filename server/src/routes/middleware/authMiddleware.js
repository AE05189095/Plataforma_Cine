// backend/routes/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

if (typeof JWT_SECRET !== 'string' || JWT_SECRET.trim() === '') {
    // Es mejor lanzar el error al inicio de la aplicación, no dentro del middleware de solicitud
    throw new Error('JWT_SECRET no está definido en las variables de entorno');
}

/**
 * Middleware para autenticar al usuario usando JWT.
 * Intenta leer el token primero de la cookie 'jwt' y luego del encabezado 'Authorization: Bearer'.
 */
const authMiddleware = (req, res, next) => {
    let token = null;
    
    // 1. INTENTAR leer el token desde la cookie (¡La corrección clave para el 401!)
    if (req.cookies && req.cookies.jwt) {
        token = req.cookies.jwt;
    } 
    
    // 2. Si no hay token en la cookie, INTENTAR leerlo del encabezado Authorization (para clientes API)
    else {
        const authHeader = req.headers.authorization;

        if (authHeader) {
            const parts = authHeader.split(' ');
            // Asegurarse de que el formato sea "Bearer token"
            if (parts.length === 2 && parts[0] === 'Bearer') {
                token = parts[1];
            }
        }
    }
    
    // 3. Si no se encontró el token en ningún lado, denegar acceso.
    if (!token) {
        return res.status(401).json({ message: 'No autenticado: Token no proporcionado o formato inválido.' });
    }

    // 4. Verificar y decodificar el token
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        
        // 🛑 CORRECCIÓN: Adjuntar el ID del usuario (y cualquier otro dato esencial) a req.user.
        // Asegúrate de que tu token tenga un campo 'id' o 'userId' para referenciar al usuario.
        // Usaremos 'id' aquí, ajústalo si tu token usa 'userId' u otro nombre.
        req.user = { 
            _id: decoded.id || decoded.userId,
            // Puedes añadir otros campos como role: decoded.role si existen
        }; 
        
        next();
    } catch (err) {
        // Loguear el error solo en el servidor para debugging.
        console.error("JWT Verification Error:", err.message); 
        return res.status(401).json({ message: 'Sesión expirada o token inválido.' });
    }
};

module.exports = authMiddleware;
module.exports = authMiddleware;