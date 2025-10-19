const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Admin = require('../models/Admin');
const Colab = require('../models/Colab');

const JWT_SECRET = process.env.JWT_SECRET;
if (typeof JWT_SECRET !== 'string' || JWT_SECRET.trim() === '') {
  throw new Error('JWT_SECRET no está definido en las variables de entorno');
}

// Login: busca usuario por email y compara contraseña
const loginController = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Email y password son requeridos' });
  try {
  const user = await User.findOne({ email }).select('+password');
    if (!user) return res.status(401).json({ message: 'Credenciales inválidas' });

    const match = await user.comparePassword(password);
    if (!match) return res.status(401).json({ message: 'Credenciales inválidas' });

    const token = jwt.sign({ userId: user._id, tipoUsuario: user.tipoUsuario }, JWT_SECRET, { expiresIn: '30m' });

    return res.json({ token, user: user.toJSON() });
  } catch (err) {
    console.error('authControllerV2.loginController error:', err);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// Registro: crea un usuario en la DB
const registerController = async (req, res) => {
  const { username, email, password, tipoUsuario } = req.body;
  if (!username || !email || !password) return res.status(400).json({ message: 'username, email y password son requeridos' });
  try {
    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ message: 'El correo ya está registrado' });

    const user = await User.create({ username, email, password, tipoUsuario });
    const token = jwt.sign({ userId: user._id, tipoUsuario: user.tipoUsuario }, JWT_SECRET, { expiresIn: '30m' });
    return res.status(201).json({ token, user: user.toJSON() });
  } catch (err) {
    console.error('authControllerV2.registerController error:', err);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// Login para administradores
const loginAdmin = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Email y password son requeridos' });
  try {
  const admin = await Admin.findOne({ email }).select('+password');
    if (!admin) return res.status(401).json({ message: 'Credenciales inválidas' });
    const match = await admin.comparePassword(password);
    if (!match) return res.status(401).json({ message: 'Credenciales inválidas' });
    const token = jwt.sign({ userId: admin._id, tipoUsuario: 'admin' }, JWT_SECRET, { expiresIn: '30m' });
    return res.json({ token, user: admin.toJSON() });
  } catch (err) {
    console.error('authControllerV2.loginAdmin error:', err);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// Login para colaboradores
const loginColab = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Email y password son requeridos' });
  try {
  const colab = await Colab.findOne({ email }).select('+password');
    if (!colab) return res.status(401).json({ message: 'Credenciales inválidas' });
    const match = await colab.comparePassword(password);
    if (!match) return res.status(401).json({ message: 'Credenciales inválidas' });
    const token = jwt.sign({ userId: colab._id, tipoUsuario: 'colaborador' }, JWT_SECRET, { expiresIn: '30m' });
    return res.json({ token, user: colab.toJSON() });
  } catch (err) {
    console.error('authControllerV2.loginColab error:', err);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

module.exports = { loginController, registerController, loginAdmin, loginColab };

