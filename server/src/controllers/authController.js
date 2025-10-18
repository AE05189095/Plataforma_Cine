const jwt = require("jsonwebtoken");
// Eliminamos la dependencia 'bcryptjs' ya que el hashing se manejará en los modelos
const User = require("../models/User");
const Admin = require("../models/Admin");
const Colab = require("../models/Colab");

const JWT_SECRET = process.env.JWT_SECRET || "clave_secreta";
// Expiración del token unificada a 8 horas
const JWT_EXPIRES = "8h"; 

// --- LOGIN UNIFICADO (Cliente, Colaborador, Admin) ---
const loginController = async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password)
        return res.status(400).json({ message: "Email y contraseña son requeridos." });

    try {
        // Buscar en todas las colecciones
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

        // Usuario no encontrado
        if (!user)
            return res.status(401).json({ message: "Credenciales inválidas (usuario no encontrado)." });

        // Comparar contraseña usando método del modelo (comparePassword)
        const isMatch = await user.comparePassword(password);
        if (!isMatch)
            return res.status(401).json({ message: "Credenciales inválidas (contraseña incorrecta)." });

        // Determinar el rol/tipoUsuario
        const role =
            user.tipoUsuario ||
            (source === "Admin"
                ? "admin"
                : source === "Colab"
                ? "colaborador"
                : "cliente");

        // Crear token con información útil para el frontend
        const token = jwt.sign(
            {
                userId: user._id,
                email: user.email,
                username: user.username,
                role,
            },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES }
        );

        return res.json({
            message: "Inicio de sesión exitoso.",
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role,
            },
        });
    } catch (error) {
        console.error("Error durante el login:", error);
        res.status(500).json({ message: "Error interno del servidor." });
    }
};

// --- REGISTRO DE CLIENTES ---
const registerController = async (req, res) => {
    const { username, email, password } = req.body;
    if (!username || !email || !password)
        return res.status(400).json({ message: "Todos los campos son requeridos." });

    try {
        let existing = await User.findOne({ email });
        if (existing)
            return res.status(400).json({ message: "El correo ya está registrado." });

        // Creamos el usuario. El hashing de la contraseña se maneja en el hook pre('save') del modelo.
        const user = new User({
            username,
            email,
            password,
            tipoUsuario: "cliente",
        });

        await user.save();

        // Generamos el token inmediatamente después del registro
        const token = jwt.sign(
            { 
                userId: user._id, 
                email: user.email, 
                username: user.username, 
                role: user.tipoUsuario 
            },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES }
        );

        return res.status(201).json({
            success: true,
            message: "Registro exitoso. Inicia sesión para continuar.",
            token,
            user: user.toJSON(), 
        });
    } catch (error) {
        console.error("Error durante el registro:", error);
        res.status(500).json({ message: "Error interno del servidor." });
    }
};

module.exports = { loginController, registerController };
