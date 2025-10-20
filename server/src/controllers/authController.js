const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs"); 
const User = require("../models/User");
const Admin = require("../models/Admin");
const Colab = require("../models/Colab");
const JWT_SECRET = process.env.JWT_SECRET || "clave_secreta";

// --- LOGIN CON BCYRPT Y MONGOOSE ---
const loginController = async (req, res) => {
    const { email, password } = req.body;
    try {
        let user = await User.findOne({ email }).select('+password'); 

        let source = 'User';
        if (!user) {
            user = await Admin.findOne({ email });
            source = user ? 'Admin' : source;
        }
        if (!user) {
            user = await Colab.findOne({ email });
            source = user ? 'Colab' : source;
        }

        if (!user) {
            return res.status(401).json({ message: "Credenciales inválidas" });
        }

        const isMatch = await user.comparePassword(password);

        if (!isMatch) {
            return res.status(401).json({ message: "Credenciales inválidas" });
        }

        const tipoUsuario = user.tipoUsuario || (source === 'Admin' ? 'admin' : (source === 'Colab' ? 'colaborador' : 'cliente'));

        const token = jwt.sign({ userId: user._id, tipoUsuario }, JWT_SECRET, { expiresIn: "30m" });

        return res.json({
            token,
            message: "Inicio de sesión exitoso.",
            user: { id: user._id, username: user.username, email: user.email, tipoUsuario }
        });

    } catch (error) {
        console.error("Error durante el login:", error);
        res.status(500).json({ message: "Error interno del servidor." });
    }
};

// --- REGISTRO CON BCYRPT Y MONGOOSE ---
const registerController = async (req, res) => {
    const { username, email, password } = req.body;
    try {
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ message: "El correo ya está registrado." });
        }

        user = new User({ username, email, password, tipoUsuario: "cliente" });
        await user.save();

        res.status(201).json({ 
            success: true,
            message: "Registro exitoso. Inicia sesión para continuar.",
            user: { id: user._id, username: user.username, email: user.email, tipoUsuario: user.tipoUsuario }
        });
        
    } catch (error) {
        console.error("Error durante el registro:", error);
        res.status(500).json({ message: "Error interno del servidor." });
    }
};

// ==========================================================
// FUNCIONES CORREGIDAS PARA JS
// ==========================================================

// --- OBTENER DATOS DE USUARIO LOGUEADO (GET /me) ---
const meController = async (req, res) => {
    // 🚨 CORRECCIÓN: Se elimina la aserción de tipo TypeScript '(req as any)'
    const userId = req.userId; 

    if (!userId) {
        return res.status(401).json({ message: "Token válido, pero ID de usuario no adjunto." });
    }

    try {
        const [userResult, adminResult, colabResult] = await Promise.allSettled([
            User.findById(userId).select('-password'),
            Admin.findById(userId).select('-password'),
            Colab.findById(userId).select('-password')
        ]);

        let user = null;
        let tipoUsuario = 'cliente';

        if (userResult.status === 'fulfilled' && userResult.value) {
            user = userResult.value;
            tipoUsuario = 'cliente';
        } else if (adminResult.status === 'fulfilled' && adminResult.value) {
            user = adminResult.value;
            tipoUsuario = 'admin';
        } else if (colabResult.status === 'fulfilled' && colabResult.value) {
            user = colabResult.value;
            tipoUsuario = 'colaborador';
        }

        if (!user) {
            return res.status(404).json({ message: "Usuario asociado al token no encontrado." });
        }

        return res.status(200).json({
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                tipoUsuario: user.tipoUsuario || tipoUsuario
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
    // 🚨 CORRECCIÓN: Se elimina la aserción de tipo TypeScript '(req as any)'
    const userId = req.userId; 

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

        res.status(200).json({ message: "Contraseña cambiada exitosamente." });

    } catch (error) {
        console.error("Error al cambiar la contraseña:", error);
        res.status(500).json({ message: "Error interno del servidor." });
    }
};


// EXPORTAR TODAS LAS FUNCIONES
module.exports = { 
    loginController, 
    registerController,
    meController, 
    changePasswordController 
};