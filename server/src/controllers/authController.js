const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET || "clave_secreta";


const loginController = (req, res) => {
  const { email, password } = req.body;

  
  if (email === "test@example.com" && password === "123456") {
    // 1. Generar el token (se incluye el rol 'cliente' en el payload)
    const token = jwt.sign({ userId: "usuario123", tipoUsuario: "cliente" }, JWT_SECRET, { expiresIn: "30m" });
    
    // 2. Devolver el token y los datos del usuario (incluyendo el rol)
    return res.json({ 
      token,
      message: "Inicio de sesión exitoso.",
      user: {
        id: "usuario123",
        username: "Usuario de Prueba",
        email: email,
        tipoUsuario: "cliente" // 💡 Necesario para que el frontend sepa a dónde redirigir
      } 
    });
  }

  // Credenciales inválidas
  res.status(401).json({ message: "Credenciales inválidas" });
};


const registerController = (req, res) => {
  // Simulación de registro exitoso (sin guardar en DB)
  res.status(201).json({ 
    success: true,
    message: "Registro exitoso. Ruta temporal de prueba." 
  });
};


module.exports = { loginController, registerController };