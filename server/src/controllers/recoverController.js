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
    return res.status(200).json({ message: '¡Correo de recuperación enviado! Revisa tu bandeja de entrada.' });
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
