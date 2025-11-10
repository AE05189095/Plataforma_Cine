// middleware/roleMiddleware.js
module.exports = function authorizeRoles(...rolesPermitidos) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'No autenticado' });
    }

    if (!rolesPermitidos.includes(req.user.role)) {
      return res.status(403).json({ message: 'Acceso denegado: rol no puede realizar esta accion.' });
    }

    next();
  };
};
