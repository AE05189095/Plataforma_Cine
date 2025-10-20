const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Limiter básico: 100 requests por 15 minutos por IP
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Demasiadas solicitudes desde esta IP, inténtalo más tarde.' },
});

module.exports = { helmet, apiLimiter };