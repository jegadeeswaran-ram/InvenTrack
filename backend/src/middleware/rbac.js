const { Errors } = require('../utils/errors');

/**
 * Role-based access control middleware factory.
 * @param {string[]} allowedRoles
 */
const rbac = (allowedRoles) => (req, res, next) => {
  if (!req.user) return next(Errors.TOKEN_INVALID());
  if (!allowedRoles.includes(req.user.role)) return next(Errors.FORBIDDEN());
  next();
};

/**
 * Branch guard — ensures BRANCH_MANAGER can only access their own branch.
 * ADMIN can access any branch.
 * Reads branchId from req.params, req.query, or req.body (in that order).
 */
const branchGuard = (req, res, next) => {
  if (!req.user) return next(Errors.TOKEN_INVALID());
  if (req.user.role === 'ADMIN') return next();

  const requestedBranchId =
    parseInt(req.params.branchId ?? req.query.branchId ?? req.body.branchId, 10);

  if (!requestedBranchId) return next();

  if (req.user.branchId !== requestedBranchId) {
    return next(Errors.BRANCH_FORBIDDEN());
  }
  next();
};

module.exports = { rbac, branchGuard };
