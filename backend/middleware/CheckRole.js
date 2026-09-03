const checkRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Permission insuffisante pour cette action' });
    }
    next();
  };
};

module.exports = checkRole;