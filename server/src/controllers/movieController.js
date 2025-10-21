const Movie = require('../models/Movie');

exports.list = async (req, res) => {
  try {
    const movies = await Movie.find({ isActive: true }).sort({ createdAt: -1 }).lean();
    res.json(movies);
  } catch (err) {
    console.error('movieController.list error:', err);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

exports.getBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    if (!slug) return res.status(400).json({ message: 'Slug es requerido' });
    const movie = await Movie.findOne({ slug }).lean();
    if (!movie) return res.status(404).json({ message: 'Película no encontrada' });
    res.json(movie);
  } catch (err) {
    console.error('movieController.getBySlug error:', err);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

exports.create = async (req, res) => {
  try {
    const payload = req.body;
    // Slug generation si falta
    if (!payload.slug && payload.title) {
      payload.slug = payload.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    }
    const movie = await Movie.create(payload);
    res.status(201).json(movie);
  } catch (err) {
    console.error('movieController.create error:', err);
    res.status(400).json({ message: 'Datos inválidos para crear película' });
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await Movie.findByIdAndUpdate(id, req.body, { new: true });
    if (!updated) return res.status(404).json({ message: 'Película no encontrada' });
    res.json(updated);
  } catch (err) {
    console.error('movieController.update error:', err);
    res.status(400).json({ message: 'Datos inválidos para actualizar película' });
  }
};

exports.remove = async (req, res) => {
  try {
    const { id } = req.params;
    await Movie.findByIdAndDelete(id);
    res.status(204).end();
  } catch (err) {
    console.error('movieController.remove error:', err);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// Sincronizar desde el cliente: crear películas que el cliente considera válidas pero no existen en la BD
exports.syncFromClient = async (req, res) => {
  try {
    const items = Array.isArray(req.body) ? req.body : req.body?.movies || [];
    if (!Array.isArray(items)) return res.status(400).json({ message: 'Payload inválido' });

    const created = [];
    for (const it of items) {
      const title = it.title && String(it.title).trim();
      if (!title) continue;
      const slug = it.slug || (title ? title.toLowerCase().replace(/[^a-z0-9]+/g, '-') : undefined);
      // buscar por slug o por título exacto
      const exists = await Movie.findOne({ $or: [{ slug }, { title }] }).lean();
      if (exists) continue;
      const payload = { title, slug, posterUrl: it.image || it.posterUrl || '', description: it.description || '', isActive: true };
      try {
        const doc = await Movie.create(payload);
        created.push(doc);
      } catch (e) {
        console.warn('No se pudo crear película desde sync:', title, e.message || e);
      }
    }

    res.json({ createdCount: created.length, created: created.map(c => ({ id: c._id, title: c.title })) });
  } catch (err) {
    console.error('movieController.syncFromClient error:', err);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};
