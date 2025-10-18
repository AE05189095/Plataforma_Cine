const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Admin = require("../models/Admin");
const Colab = require("../models/Colab");

const JWT_SECRET = process.env.JWT_SECRET || "clave_secreta";

/* ==========================================================
   🟢 LOGIN GENERAL (para clientes, admins y colaboradores)
   ========================================================== */
const loginController = async (req, res) => {
  const { email, password } = req.body;
  try {
    if (!email || !password) return res.status(400).json({ message: 'Email y password son requeridos' });
    // Buscar el usuario en los tres modelos
    let user = await User.findOne({ email });
    let source = "User";
    if (!user) {
      user = await Admin.findOne({ email });
      source = user ? "Admin" : source;
    }
    if (!user) {
      user = await Colab.findOne({ email });
      source = user ? "Colab" : source;
    }

    if (!user) {
      return res.status(401).json({ message: "Credenciales inválidas" });
    }

    // Comparar contraseña
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Credenciales inválidas" });
    }

    // Determinar el rol
    const role =
      user.role ||
      (source === "Admin"
        ? "admin"
        : source === "Colab"
        ? "colaborador"
        : "cliente");

    // Validar acceso según la ruta actual
    const currentPath = req.route.path;
    const routeRoleMap = {
      "/login": "cliente",
      "/login-admin": "admin",
      "/login-colaborador": "colaborador",
    };

    const allowedRole = routeRoleMap[currentPath];
    if (allowedRole && role !== allowedRole) {
      return res.status(403).json({
        message: `No tienes permisos para iniciar sesión en esta ruta (${currentPath}).`,
      });
    }  

    // Crear token JWT
    const token = jwt.sign({ userId: user._id, role }, JWT_SECRET, {
      expiresIn: "30m",
    });

    // Enviar respuesta
    return res.json({
      token,
      message: "Inicio de sesión exitoso.",
      user: {
        id: user._id, username: user.username, email: user.email, role,},});
  } catch (error) {
    console.error("Error durante el login:", error);
    res.status(500).json({ message: "Error interno del servidor." });
  }
};

/* ==========================================================
   🟣 REGISTRO (público para clientes / privado para admins)
   ========================================================== */
const registerController = async (req, res) => {
  const { username, email, password } = req.body;
  const token = req.headers.authorization?.split(" ")[1]; // <- Capturamos el token si existe

  try {
    if (!username || !email || !password) 
        return res.status(400).json({ message: 'username, email y password son requeridos' });

    // Validar formato de correo electrónico
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res
        .status(400)
        .json({ message: "El formato del correo electrónico no es válido." });
    }

    // Validar longitud mínima de contraseña
    if (password.length < 8) {
      return res.status(400).json({
        message: "La contraseña debe tener al menos 8 caracteres.",
      });
    }

    // Verificar si el correo ya está registrado en cualquiera de las colecciones
    const existsUser = await User.findOne({ email });
    const existsAdmin = await Admin.findOne({ email });
    const existsColab = await Colab.findOne({ email });

    if (existsUser || existsAdmin || existsColab) {
    return res.status(400).json({ message: "El correo ya está registrado en otra cuenta." });
}


    // Determinar el rol según quién hace el registro
    let role = "cliente"; // Por defecto, usuarios normales

    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        if (decoded.role === "admin") {
          role = "colaborador"; // Si el token pertenece a un admin
        }
      } catch (error) {
        console.warn("Token inválido o expirado. Se registrará como cliente.");
      }
    }

    // Hashear la contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    let user;

// Crear en la colección correspondiente
if (role === "colaborador") {
  user = await Colab.create({username, email, password, role});
} else if (role === "admin") {
  user = await Admin.create({username, email, password, role});
} else {
  user = await User.create({username, email, password: hashedPassword, role});
}

res.status(201).json({
  success: true,
  message:role === "colaborador" ? "Colaborador registrado exitosamente." : "Usuario registrado exitosamente.",
      user: { id: user._id, username: user.username, email: user.email, role: user.role,},
  });
  } catch (error) {
    console.error("Error durante el registro:", error);
    res.status(500).json({ message: "Error interno del servidor." });
  }
};


/* ==========================================================
 LOGIN SEPARADOS (si alguna vista específica los necesita)
   ========================================================== */
const loginAdmin = async (req, res) => {
  return loginByModel(req, res, Admin, "admin");
};

const loginColab = async (req, res) => {
  return loginByModel(req, res, Colab, "colaborador");
};

/* ==========================================================
    FUNCIÓN AUXILIAR COMPARTIDA PARA LOGIN POR MODELO
   ========================================================== */
const loginByModel = async (req, res, Model, fixedRole) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res
      .status(400)
      .json({ message: "Email y password son requeridos" });

  try {
    const user = await Model.findOne({ email });
    if (!user)
      return res.status(401).json({ message: "Credenciales inválidas" });

    const match = await user.comparePassword(password);
    if (!match)
      return res.status(401).json({ message: "Credenciales inválidas" });

    const token = jwt.sign(
      { userId: user._id, role: fixedRole },
      JWT_SECRET,
      { expiresIn: "30m" }
    );

    return res.json({
      token,
      message: `Inicio de sesión exitoso como ${fixedRole}`,
      user: user.toJSON(),
    });
  } catch (err) {
    return res.status(500).json({ message: "Error en el servidor" });
  }
};

module.exports = {loginController, registerController, loginAdmin, loginColab,};

