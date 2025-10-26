const Movie = require('../models/Movie');

// Devuelve la lista de dominios únicos que aparecen en posterUrl de las películas
exports.list = async (req, res) => {
  try {
    const movies = await Movie.find({}).select('posterUrl images').lean();
    const hosts = new Set();

    movies.forEach(m => {
      const candidates = [];
      if (m.posterUrl && typeof m.posterUrl === 'string') candidates.push(m.posterUrl);
      if (m.images && Array.isArray(m.images)) candidates.push(...m.images.filter(Boolean));
      candidates.forEach(urlStr => {
        try {
          const u = new URL(urlStr);
          if (u.protocol === 'http:' || u.protocol === 'https:') hosts.add(u.hostname);
        } catch (e) {
          // ignore non-URL values
        }
      });
    });

    res.json(Array.from(hosts).sort());
  } catch (err) {
    console.error('imageDomainsController.list error:', err);
    res.status(500).json({ message: 'Error interno al obtener dominios' });
  }
};
