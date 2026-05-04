const requireAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'ADMIN') return next();
  return res.status(403).json({ message: 'Admin access required' });
};

const requireAdminOrManager = (req, res, next) => {
  if (req.user && (req.user.role === 'ADMIN' || req.user.role === 'BRANCH_MANAGER')) return next();
  return res.status(403).json({ message: 'Admin or Branch Manager access required' });
};

const requireTruckAccess = (req, res, next) => {
  const allowed = ['ADMIN', 'BRANCH_MANAGER', 'TRUCK_SALES'];
  if (req.user && allowed.includes(req.user.role)) return next();
  return res.status(403).json({ message: 'Truck access required' });
};

module.exports = { requireAdmin, requireAdminOrManager, requireTruckAccess };
