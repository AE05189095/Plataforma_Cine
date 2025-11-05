const Movie = require('../models/Movie');
const { spawn } = require('child_process');
const path = require('path');
const Log = require("../models/Log");


// Ejecuta el script de sincronización de dominios si la variable de entorno
// SYNC_IMAGE_DOMAINS está activada. Se ejecuta de forma asíncrona y no bloquea la respuesta HTTP.
function runSyncScriptIfEnabled(reason) {
  const enabled = process.env.SYNC_IMAGE_DOMAINS === '1' || process.env.SYNC_IMAGE_DOMAINS === 'true';
  if (!enabled || process.env.NODE_ENV === 'production') return;

  const scriptPath = path.resolve(__dirname, '..', '..', '..', 'scripts', 'sync-image-domains.js');
  try {
    const child = spawn(process.execPath || 'node', [scriptPath], {
      env: process.env,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    child.stdout.on('data', (d) => console.log(`[sync-image-domains stdout] ${d.toString().trim()}`));
    child.stderr.on('data', (d) => console.error(`[sync-image-domains stderr] ${d.toString().trim()}`));
    child.on('close', (code) => console.log(`[sync-image-domains] finished (code=${code}) reason=${reason}`));
  } catch (err) {
    console.error('Error al lanzar sync-image-domains:', err);
  }
}

exports.list = async (req, res) => {
  try {
    const isAdminView = req.query && (req.query.admin === '1' || req.query.admin === 'true');
    const filter = isAdminView ? {} : { isActive: true };
    const movies = await Movie.find(filter).sort({ createdAt: -1 }).lean();
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
    if (!payload.slug && payload.title) {
      payload.slug = payload.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    }
    const movie = await Movie.create(payload);

    // Ejecutar script de sincronización si pedimos (solo si hay posterUrl)
    try {
      if (payload && payload.posterUrl && typeof payload.posterUrl === 'string' && payload.posterUrl.trim() !== '') {
        runSyncScriptIfEnabled('create');
      }
    } catch (e) {
      console.error('Error lanzando sync script tras create:', e);
    }
    //Log de creación pelicula
   await Log.create({
      usuario: req.user?._id,
      role: 'admin',
      accion: 'creacion',
      descripcion: `El administrador ${req.user?.username || 'desconocido'} agregó la película "${movie.title}".`
    });
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

    if (req.user && req.user._id) {
    try {
    const log = await Log.create({
      usuario: req.user._id,
      role: req.user?.role || 'admin',
      accion: "modificacion",
      descripcion: `El usuario ${req.user.username || 'desconocido'} modificó la película "${updated.title}".`,
    });
    console.log("Log creado:", log);
  } catch (e) {
    console.error("Error creando Log:", e);
  }
}
    // Si se actualizó posterUrl o se proporcionó en el body, lanzar sincronización
    try {
      const posterFromBody = req.body && req.body.posterUrl;
      const posterNow = updated && updated.posterUrl;
      if ((posterFromBody && posterFromBody.trim() !== '') || (posterNow && posterNow.trim() !== '')) {
        runSyncScriptIfEnabled('update');
      }
    } catch (e) {
      console.error('Error lanzando sync script tras update:', e);
    }

    res.json(updated);
  } catch (err) {
    console.error('movieController.update error:', err);
    res.status(400).json({ message: 'Datos inválidos para actualizar película' });
  }
};

exports.remove = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Movie.findByIdAndDelete(id);

    if (!deleted) return res.status(404).json({ message: 'Película no encontrada' });

    // Log de eliminación de película
    if (req.user && req.user._id) {
      try {
        const log = await Log.create({
          usuario: req.user._id,
          role: 'admin',
          accion: 'eliminacion',
          descripcion: `El administrador ${req.user.username || 'desconocido'} eliminó la película "${deleted.title}".`,
        });
        console.log('Log de eliminación creado:', log);
      } catch (e) {
        console.error('Error creando log de eliminación:', e);
      }
    }

    res.status(204).end();
  } catch (err) {
    console.error('movieController.remove error:', err);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};
