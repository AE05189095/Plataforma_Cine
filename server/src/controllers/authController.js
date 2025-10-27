const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const Log = require("../models/Log");
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

    // 🛑 BLOQUE 1: BÚSQUEDA DEL USUARIO EN LOS TRES MODELOS
    // Utilizamos la estructura de búsqueda que ya tenías, PERO añadimos .select('+password') para poder comparar.
    
    let user = await User.findOne({ email }).select('+password'); // Debe recuperar el hash de la contraseña
    let source = "User";
    
    if (!user) {
      user = await Admin.findOne({ email }).select('+password');
      source = user ? "Admin" : source;
    }
    
    if (!user) {
      user = await Colab.findOne({ email }).select('+password');
      source = user ? "Colab" : source;
    }

    if (!user) {
      return res.status(401).json({ message: "Credenciales inválidas" });
    }

    // 🛑 BLOQUE 2: COMPARACIÓN DE CONTRASEÑA
    // Este es el código correcto y crucial.
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Credenciales inválidas" });
    }
    
    // 🛑 BLOQUE 3: LÓGICA DE ROLES Y RUTA (DE LA RAMA BASE)
    // Determinar el rol (usamos el rol del modelo si existe, o el inferido por la búsqueda)
    const role =
      user.role ||
      (source === "Admin"
        ? "admin"
        : source === "Colab"
        ? "colaborador"
        : "cliente");

    // Validar acceso según la ruta actual (Importante para diferenciar logins)
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

// Registrar log de inicio de sesión
     await Log.create({
      usuario: user._id,
      role: user.role,
      accion: "inicio_sesion",
      descripcion: `El usuario ${user.username} inició sesión.`,
    });

    // Enviar respuesta
    return res.json({
      token,
      message: "Inicio de sesión exitoso.",
      user: {
        id: user._id, username: user.username, email: user.email, role: user.role,},
});
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
    // 🚨 CORRECCIÓN: Usamos la función de bcrypt, NO la de Mongoose aquí.
    const hashedPassword = await bcrypt.hash(password, salt); 

    let user;

// Crear en la colección correspondiente
if (role === "colaborador") {
  // 🚨 CORRECCIÓN: Si el modelo Colab/Admin tiene pre-save hook para hashear, no hasheamos aquí.
  // Si no lo tiene, es un bug que debe corregirse en el modelo. Asumo que el modelo lo maneja,
  // PERO si no lo hace, deberías pasar hashedPassword. Por simplicidad, asumimos que todos
  // los modelos aceptan 'password' y lo hashean.
  user = await Colab.create({username, email, password}); // Pasamos el password sin hashear (asumo hook)
} else if (role === "admin") {
  user = await Admin.create({username, email, password}); // Pasamos el password sin hashear (asumo hook)
} else {
  // Este modelo (User) SÍ necesita el hash si no tiene hook, pero si lo tiene, usamos 'password'
  user = await User.create({username, email, password, role});
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
    const user = await Model.findOne({ email }).select("+password");
    if (!user)
      return res.status(401).json({ message: "Credenciales inválidas" });

    const match = await user.comparePassword(password);
    if (!match)
      return res.status(401).json({ message: "Credenciales inválidas" });
//log inicio de sesion
try {
  await Log.create({
    usuario: user._id,
    role: fixedRole,
    accion: "inicio_sesion",
    descripcion: `El ${fixedRole} ${user.username || user.email} inició sesión.`,
  });
} catch (logErr) {
  console.error('Error al crear log de login:', logErr);
}


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
    return res.status(500).json({ message: "Error en el servidor czxcz" });
  }
};

// --- OBTENER DATOS DE USUARIO LOGUEADO (GET /me) ---
const meController = async (req, res) => {
    // 🚨 CORRECCIÓN: Ahora el ID viene de req.user (poblado por authMiddleware)
    const userId = req.user ? req.user._id : null; 

    if (!userId) {
        // Este caso solo debería ocurrir si el middleware falló o no se ejecutó, pero es buena defensa
        return res.status(401).json({ message: "No autenticado. ID de usuario no disponible." });
    }

    try {
        const [userResult, adminResult, colabResult] = await Promise.allSettled([
            User.findById(userId).select('-password'),
            Admin.findById(userId).select('-password'),
            Colab.findById(userId).select('-password')
        ]);
        // ... (el resto de la lógica de meController es correcta)
        let user = null;
        let role = 'cliente';

        if (userResult.status === 'fulfilled' && userResult.value) {
            user = userResult.value;
            role = 'cliente';
        } else if (adminResult.status === 'fulfilled' && adminResult.value) {
            user = adminResult.value;
            role = 'admin';
        } else if (colabResult.status === 'fulfilled' && colabResult.value) {
            user = colabResult.value;
            role = 'colaborador';
        }

        if (!user) {
            return res.status(404).json({ message: "Usuario asociado al token no encontrado." });
        }

        return res.status(200).json({
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role || role
            }
        });

    } catch (error) {
        console.error("Error al obtener datos del usuario /me:", error);
        return res.status(500).json({ message: "Error interno del servidor." });
    }
};

// --- CAMBIAR CONTRASEÑA (POST /change-password) ---
const changePasswordController = async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    // 🚨 CORRECCIÓN: El ID debe venir de req.user (poblado por authMiddleware)
    const userId = req.user ? req.user._id : null; 

    if (!userId) {
        return res.status(401).json({ message: "No autenticado. ID de usuario no disponible." });
    }
    
    if (!oldPassword || !newPassword) {
        return res.status(400).json({ message: "Faltan la contraseña actual o la nueva contraseña." });
    }
    
    if (oldPassword === newPassword) {
        return res.status(400).json({ message: "La nueva contraseña debe ser diferente a la anterior." });
    }

    try {
        const [userResult, adminResult, colabResult] = await Promise.allSettled([
            User.findById(userId).select('+password'),
            Admin.findById(userId).select('+password'),
            Colab.findById(userId).select('+password')
        ]);

        let user = null;

        if (userResult.status === 'fulfilled' && userResult.value) {
            user = userResult.value;
        } else if (adminResult.status === 'fulfilled' && adminResult.value) {
            user = adminResult.value;
        } else if (colabResult.status === 'fulfilled' && colabResult.value) {
            user = colabResult.value;
        }

        if (!user) {
            return res.status(404).json({ message: "Usuario no encontrado." });
        }

        const isMatch = await user.comparePassword(oldPassword);
        
        if (!isMatch) {
            return res.status(401).json({ message: "La contraseña actual es incorrecta." });
        }

        user.password = newPassword; 
        await user.save();

// Registra log de modificación
await Log.create({
  usuario: user._id,
  role: user.role || req.user?.role, 
  accion: "modificacion",
  descripcion: `El usuario ${user.username} cambió su contraseña.`,
});

        res.status(200).json({ message: "Contraseña cambiada exitosamente." });

    } catch (error) {
        console.error("Error al cambiar la contraseña:", error);
        res.status(500).json({ message: "Error interno del servidor." });
    }
};


module.exports = {loginController, registerController, loginAdmin, loginColab,meController, changePasswordController};
