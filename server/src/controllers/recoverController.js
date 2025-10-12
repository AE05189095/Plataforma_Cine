const User = require('../models/User');
const jwt = require('jsonwebtoken');

exports.recoverPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'El correo es requerido.' });
  try {
    const user = await User.findOne({ email });
    // Mensaje genérico por seguridad: no confirmar existencia de cuentas en la respuesta
    if (!user) {
      return res.status(200).json({ message: 'Si la cuenta existe, recibirás un correo de recuperación.' });
    }

    // Generar token de recuperación (expira en 15 minutos). En producción se enviaría por email.
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || 'clave_secreta', { expiresIn: '15m' });

    // Aquí iría el envío real del correo de recuperación (placeholder)
    const responseBody = { message: 'Correo de recuperación enviado! Revisa tu bandeja de entrada.' };
    // Para entornos de desarrollo incluimos el token en la respuesta para facilitar pruebas
    if (process.env.NODE_ENV !== 'production') { responseBody.token = token; }

    return res.status(200).json(responseBody);
  } catch (err) {
    console.error('recoverPassword error:', err);
    return res.status(500).json({ message: 'Error en el servidor.' });
  }
};

// Controlador para verificar si el correo existe (GET)
exports.verifyEmail = async (req, res) => {
  const { email } = req.query;
  if (!email) return res.status(400).json({ message: 'El correo es requerido.' });
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'El correo no existe en la base de datos.' });
    }
    return res.status(200).json({ message: 'El correo existe. Puedes proceder con la recuperación.' });
  } catch (err) {
    console.error('verifyEmail error:', err);
    return res.status(500).json({ message: 'Error en el servidor.' });
  }
};

// Reset password: body { token, newPassword }
exports.resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword) return res.status(400).json({ message: 'Token y newPassword son requeridos.' });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'clave_secreta');
    const user = await User.findById(payload.userId);
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado.' });
    user.password = newPassword; // el pre('save') en User.js hará el hash
    await user.save();
    return res.status(200).json({ message: 'Contraseña actualizada correctamente.' });
  } catch (err) {
    if (err.name === 'TokenExpiredError') return res.status(400).json({ message: 'Token expirado.' });
    console.error('resetPassword error:', err);
    return res.status(500).json({ message: 'Error en el servidor.' });
  }
};
