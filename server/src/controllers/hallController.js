const Hall = require('../models/Hall');
const Log = require ('../models/Log');

exports.list = async (req, res) => {
  try {
    const groupByMovie = req.query && (req.query.groupByMovie === '1' || req.query.groupByMovie === 'true');
    if (!groupByMovie) {
      const halls = await Hall.find({}).sort({ name: 1 }).lean();
      return res.json(halls);
    }

    // Obtener salas con la movie poblada
    const halls = await Hall.find({}).populate('movie').sort({ name: 1 }).lean();

    // Agrupar por movie (null => 'Unassigned')
    const groupsMap = new Map();
    for (const h of halls) {
      const movie = h.movie || null;
      const key = movie ? String(movie._id) : 'unassigned';
      if (!groupsMap.has(key)) groupsMap.set(key, { movie: movie, halls: [] });
      groupsMap.get(key).halls.push(h);
    }

    const groups = Array.from(groupsMap.values());
    return res.json({ groups });
  } catch (err) {
    console.error('Error listing halls:', err);
    res.status(500).json({ message: 'Error al obtener las salas' });
  }
};

// Crear sala
exports.create = async (req, res) => {
  // Creación deshabilitada: las salas son fijas y se gestionan desde el servidor
  return res.status(405).json({ message: 'Creación de salas deshabilitada. Las salas fijas se gestionan desde el sistema.' });
};

// Actualizar sala (incluye asociación movie)
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const payload = req.body || {};

    const hall = await Hall.findById(id);
    if (!hall) return res.status(404).json({ message: 'Sala no encontrada' });

    // Si la sala es fija, permitir actualizar `movie` e `isActive` (y opcionalmente name si se desea)
    if (hall.isFixed) {
      const allowed = {};
      if (Object.prototype.hasOwnProperty.call(payload, 'movie')) allowed.movie = payload.movie;
      if (Object.prototype.hasOwnProperty.call(payload, 'isActive')) allowed.isActive = payload.isActive;
      if (Object.prototype.hasOwnProperty.call(payload, 'name')) allowed.name = payload.name;
      // Aplicar cambios permitidos (no permitir cambiar capacity)
      Object.assign(hall, allowed);
      await hall.save();
      
      return res.json(hall);
    }
    try {
        await Log.create({
          usuario: req.user?._id,
          role: req.user?.role || 'admin',
          accion: 'modificacion',
          descripcion: `El administrador ${req.user?.username || 'desconocido'} modificó la sala "${hall.name}" asignando la película "${hall.movie?.title || 'sin asignar'}".`
        });
      } catch (logErr) {
        console.error('Error registrando log de modificación de sala:', logErr);
      }
    // Comportamiento normal para salas no fijas
    const updated = await Hall.findByIdAndUpdate(id, payload, { new: true });
    res.json(updated);
  } catch (err) {
    console.error('hallController.update error:', err);
    res.status(400).json({ message: 'Datos inválidos para actualizar sala' });
  }
};

// Eliminar sala
exports.remove = async (req, res) => {
  try {
  return res.status(405).json({ message: 'Eliminación de salas deshabilitada.' });
  } catch (err) {
    console.error('hallController.remove error:', err);
    res.status(500).json({ message: 'Error al eliminar sala' });
  }
};
