// server/src/middleware/authMiddleware.js
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET.trim() === "") {
  throw new Error("JWT_SECRET no está definido en las variables de entorno");
}

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Token no proporcionado o mal formado" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    // Guarda solo los datos necesarios (p. ej. id y rol)
    req.user = { id: decoded.userId, role: decoded.role };
    req.userId = decoded.userId;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Token expirado o inválido" });
  }
};

module.exports = authMiddleware;
