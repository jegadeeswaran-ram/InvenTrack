const requireAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'ADMIN') return next();
  return res.status(403).json({ message: 'Admin access required' });
};

const requireManager = (req, res, next) => {
  if (req.user && (req.user.role === 'ADMIN' || req.user.role === 'BRANCH_MANAGER')) return next();
  return res.status(403).json({ message: 'Manager access required' });
};

module.exports = { requireAdmin, requireManager };
