// server/src/controllers/authController.js (CORREGIDO)

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Admin = require('../models/Admin');
const Colab = require('../models/Colab');

const JWT_SECRET = process.env.JWT_SECRET;
if (typeof JWT_SECRET !== 'string' || JWT_SECRET.trim() === '') {
    throw new Error('JWT_SECRET no está definido en las variables de entorno');
}

// --- LOGIN CON BCYRPT Y MONGOOSE ---
const loginController = async (req, res) => {
    const { email, password } = req.body;
    try {
        // Buscar en User, Admin y Colab (en ese orden)
    let user = await User.findOne({ email }).select('+password');
        let source = 'User';
        if (!user) {
            user = await Admin.findOne({ email }).select('+password');
            source = user ? 'Admin' : source;
        }
        if (!user) {
            user = await Colab.findOne({ email }).select('+password');
            source = user ? 'Colab' : source;
        }

        if (!user) {
            return res.status(401).json({ message: "Credenciales inválidas" });
        }

        // Usar el método del modelo para comparar la contraseña
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: "Credenciales inválidas" });
        }

        const tipoUsuario = user.tipoUsuario || (source === 'Admin' ? 'admin' : (source === 'Colab' ? 'colaborador' : 'cliente'));

    const token = jwt.sign({ userId: user._id, tipoUsuario }, JWT_SECRET, { expiresIn: '30m' });

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

        // Dejar que el pre-save hook del modelo haga el hash de la contraseña
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


// --- OBTENER DATOS DEL USUARIO (protegido) ---npm
const meController = async (req, res) => {
    try {
        const userId = req.userId;
        if (!userId) return res.status(401).json({ message: 'No autorizado' });

        // Buscar en User, Admin y Colab
        let user = await User.findById(userId).select('-password');
        if (!user) {
            user = await Admin.findById(userId).select('-password');
        }
        if (!user) {
            user = await Colab.findById(userId).select('-password');
        }

        if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

        return res.json({ user });
    } catch (err) {
        console.error('Error en meController', err);
        return res.status(500).json({ message: 'Error interno' });
    }
};

// --- CAMBIAR CONTRASEÑA (protegido) ---
const changePasswordController = async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    try {
        const userId = req.userId;
        if (!userId) return res.status(401).json({ message: 'No autorizado' });

        // Buscar en User, Admin y Colab (solicitamos password explícitamente porque está oculto por defecto)
        let user = await User.findById(userId).select('+password');
        let model = 'User';
        if (!user) {
            user = await Admin.findById(userId).select('+password');
            model = user ? 'Admin' : model;
        }
        if (!user) {
            user = await Colab.findById(userId).select('+password');
            model = user ? 'Colab' : model;
        }

        if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) return res.status(401).json({ message: 'Contraseña actual incorrecta' });

        user.password = newPassword; // el pre-save hook en User.js hará el hash
        await user.save();

        return res.json({ message: 'Contraseña actualizada correctamente' });
    } catch (err) {
        console.error('Error en changePasswordController', err);
        return res.status(500).json({ message: 'Error interno' });
    }
};

module.exports = { loginController, registerController, meController, changePasswordController };
