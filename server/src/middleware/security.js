const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// En desarrollo, subimos el límite para mejorar la DX; en producción mantenemos 100/15m
const maxPerWindow = process.env.NODE_ENV === 'production' ? 100 : 1000;

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: maxPerWindow,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Demasiadas solicitudes desde esta IP, inténtalo más tarde.' },
  skipSuccessfulRequests: false, // mantener conteo parejo
});

module.exports = { helmet, apiLimiter };
