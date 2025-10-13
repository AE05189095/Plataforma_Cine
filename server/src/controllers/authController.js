const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs"); 
const User = require("../models/User");
const Admin = require("../models/Admin");
const Colab = require("../models/Colab");
const JWT_SECRET = process.env.JWT_SECRET || "clave_secreta";

// --- LOGIN CON BCRYPT Y MONGOOSE ---
const loginController = async (req, res) => {
    const { email, password } = req.body;
    try {
        // Buscar en User, Admin y Colab (en ese orden)
        let user = await User.findOne({ email });
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

        // 🔑 COMPARACIÓN con método del modelo
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: "Credenciales inválidas" });
        }

        // 🔐 Determinar tipoUsuario según origen
        const tipoUsuario = user.tipoUsuario || (
            source === 'Admin' ? 'admin' :
            source === 'Colab' ? 'colaborador' :
            'cliente'
        );

        // 🕒 Token con expiración de 30 minutos
        const token = jwt.sign(
            { userId: user._id, tipoUsuario },
            JWT_SECRET,
            { expiresIn: "30m" }
        );

        return res.json({
            token,
            message: "Inicio de sesión exitoso.",
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                tipoUsuario
            }
        });

    } catch (error) {
        console.error("Error durante el login:", error);
        res.status(500).json({ message: "Error interno del servidor." });
    }
};

// --- REGISTRO CON BCRYPT Y MONGOOSE ---
const registerController = async (req, res) => {
    const { username, email, password } = req.body;
    try {
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ message: "El correo ya está registrado." });
        }

        // 🔑 Hashing antes de guardar
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        user = new User({
            username,
            email,
            password: hashedPassword,
            tipoUsuario: "cliente"
        });

        await user.save(); 

        res.status(201).json({ 
            success: true,
            message: "Registro exitoso. Inicia sesión para continuar.",
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                tipoUsuario: user.tipoUsuario
            }
        });
        
    } catch (error) {
        console.error("Error durante el registro:", error);
        res.status(500).json({ message: "Error interno del servidor." });
    }
};

module.exports = { loginController, registerController };
