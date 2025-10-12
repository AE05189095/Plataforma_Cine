const User = require('../models/User');

exports.recoverPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'El correo es requerido.' });
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'El correo no existe en la base de datos.' });
    }
    // Aquí iría el envío real del correo de recuperación
    // Generar token de recuperación (expira en 15 minutos). En producción enviar por email.
    const jwt = require('jsonwebtoken');
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || 'clave_secreta', { expiresIn: '15m' });
    return res.status(200).json({ message: 'Token de recuperación generado (en entorno real se enviaría por email).', token });
  } catch (err) {
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
    return res.status(500).json({ message: 'Error en el servidor.' });
  }
};

// Reset password: body { token, newPassword }
exports.resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword) return res.status(400).json({ message: 'Token y newPassword son requeridos.' });
  try {
    const jwt = require('jsonwebtoken');
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'clave_secreta');
    const user = await User.findById(payload.userId);
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado.' });
    user.password = newPassword; // el pre('save') en User.js hará el hash
    await user.save();
    return res.status(200).json({ message: 'Contraseña actualizada correctamente.' });
  } catch (err) {
    if (err.name === 'TokenExpiredError') return res.status(400).json({ message: 'Token expirado.' });
    return res.status(500).json({ message: 'Error en el servidor.' });
  }
};
