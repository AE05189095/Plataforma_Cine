const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET || "clave_secreta";

const loginController = (req, res) => {
  const { email, password } = req.body;

  // Simulación de usuario válido
  if (email === "test@example.com" && password === "123456") {
    const token = jwt.sign({ userId: "usuario123" }, JWT_SECRET, { expiresIn: "30m" });
    return res.json({ token });
  }

  res.status(401).json({ message: "Credenciales inválidas" });
};

module.exports = { loginController };
