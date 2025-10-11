const User = require("../models/User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const JWT_SECRET = process.env.JWT_SECRET || "clave_secreta";

//Logica del controlador para registro de usuario 
const registerController = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    // Validar campos requeridos
    if (!username || !email || !password) {
      return res.status(400).json({ message: "Todos los campos son obligatorios." });
    }

    //Verificar longitud de contraseña
       if (password.length < 8) {
      return res.status(400).json({ message: "La contraseña debe tener al menos 8 caracteres." });
    }

    // Verificar si el correo ya está registrado
    const userExistente = await User.findOne({ email });
    if (userExistente) {
      return res.status(400).json({ message: "El correo ya está registrado." });
    }

    // Encriptar la contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Crear el nuevo usuario
    const nuevoUsuario = new User({
      username,
      email,
      password: hashedPassword,
      tipoUsuario: "cliente", // valor por defecto
    });

    await nuevoUsuario.save();

    // Responder sin devolver la contraseña
    res.status(201).json({
      message: "Usuario registrado exitosamente.",
      user: nuevoUsuario,
    });

  } catch (error) {
    console.error("Error en el registro:", error);
    res.status(500).json({ message: "Error al registrar el usuario." });
  }
};

const loginController = (req, res) => {
  const { email, password } = req.body;

  // Simulación de usuario válido
  if (email === "test@example.com" && password === "123456") {
    const token = jwt.sign({ userId: "usuario123" }, JWT_SECRET, { expiresIn: "30m" });
    return res.json({ token });
  }

  res.status(401).json({ message: "Credenciales inválidas" });
};

module.exports = { loginController, registerController };
