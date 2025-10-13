const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET || "clave_secreta";

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  /*if (!authHeader) {
    return res.status(401).json({ message: "Token no proporcionado" });
  }*/
 if (!authHeader || !authHeader.startsWith("Bearer ")) {
  return res.status(401).json({ message: "Token no proporcionado o mal formado" });
}


  const token = authHeader.split(" ")[1];

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: "Token expirado o inválido" });
    }

    req.userId = decoded;
    next();
  });
};

module.exports = authMiddleware;
