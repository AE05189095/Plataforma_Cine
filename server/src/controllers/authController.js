// server/src/controllers/authController.js (CORREGIDO)

const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs"); 
const User = require("../models/User"); // Asegúrate de que esta ruta sea correcta
const JWT_SECRET = process.env.JWT_SECRET || "clave_secreta";

// --- LOGIN CON BCYRPT Y MONGOOSE ---
const loginController = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: "Credenciales inválidas" });
        }

        // 🔑 COMPARACIÓN CORRECTA con bcrypt
        //const isMatch = await bcrypt.compare(password, user.password);
        console.log("Contraseña enviada:", password);
        console.log("Contraseña guardada:", user.password);
        const isMatch = await user.comparePassword(password);
        console.log("¿Contraseña coincide?", isMatch);

        if (!isMatch) {
            return res.status(401).json({ message: "Credenciales inválidas" });
        }

        const token = jwt.sign({ userId: user._id, tipoUsuario: user.tipoUsuario }, JWT_SECRET, { expiresIn: "15m" });
        
        return res.json({ 
            token,
            message: "Inicio de sesión exitoso.",
            user: { id: user._id, username: user.username, email: user.email, tipoUsuario: user.tipoUsuario || "cliente" } 
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

        // 🔑 HASHING antes de guardar (Si User.js no lo hace automáticamente)
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        user = new User({ username, email, password: hashedPassword, tipoUsuario: "cliente" });

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


module.exports = { loginController, registerController };