// server/src/controllers/recoverControllers.js (CORREGIDO)

const User = require('../models/User');

const recoverPassword = async (req, res) => { // ⬅️ Cambiado a const para la exportación final
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'El correo es requerido.' });
    try {
        const user = await User.findOne({ email });
        if (!user) {
            // Mensaje genérico por seguridad, aunque el frontend puede necesitar 404
            return res.status(200).json({ message: 'Si la cuenta existe, recibirás un correo de recuperación.' });
        }
        // Aquí iría el envío real del correo de recuperación
        return res.status(200).json({ message: '¡Correo de recuperación enviado! Revisa tu bandeja de entrada.' });
    } catch (err) {
        return res.status(500).json({ message: 'Error en el servidor.' });
    }
};

const verifyEmail = async (req, res) => { // ⬅️ Cambiado a const
    const { email } = req.query;
    if (!email) return res.status(400).json({ message: 'El correo es requerido.' });
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'El correo no existe en la base de datos.' });
        }
        return res.status(200).json({ message: 'El correo existe. Puedes proceder con la recuperación.' });
    } catch (err) {
        return res.status(500).json({ message: 'Error en el servidor.' });
    }
};

// 🚨 EXPORTACIÓN UNIFICADA (consistente con authController.js) 🚨
module.exports = { recoverPassword, verifyEmail };