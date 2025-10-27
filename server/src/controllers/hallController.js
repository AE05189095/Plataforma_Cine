const Hall = require('../models/Hall');

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
  try {
    const payload = req.body || {};
    const hall = await Hall.create(payload);
    res.status(201).json(hall);
  } catch (err) {
    console.error('hallController.create error:', err);
    res.status(400).json({ message: 'Datos inválidos para crear sala' });
  }
};

// Actualizar sala (incluye asociación movie)
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await Hall.findByIdAndUpdate(id, req.body, { new: true });
    if (!updated) return res.status(404).json({ message: 'Sala no encontrada' });
    res.json(updated);
  } catch (err) {
    console.error('hallController.update error:', err);
    res.status(400).json({ message: 'Datos inválidos para actualizar sala' });
  }
};

// Eliminar sala
exports.remove = async (req, res) => {
  try {
    const { id } = req.params;
    await Hall.findByIdAndDelete(id);
    res.status(204).end();
  } catch (err) {
    console.error('hallController.remove error:', err);
    res.status(500).json({ message: 'Error al eliminar sala' });
  }
};
