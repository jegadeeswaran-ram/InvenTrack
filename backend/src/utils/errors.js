class AppError extends Error {
  constructor(statusCode, code, message, meta = {}) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.meta = meta;
    this.isOperational = true;
  }
}

const Errors = {
  TOKEN_INVALID:              (msg = 'Invalid token') =>
    new AppError(401, 'TOKEN_INVALID', msg),
  TOKEN_EXPIRED:              (msg = 'Token expired') =>
    new AppError(401, 'TOKEN_EXPIRED', msg),
  FORBIDDEN:                  (msg = 'Access denied') =>
    new AppError(403, 'FORBIDDEN', msg),
  BRANCH_FORBIDDEN:           (msg = 'Access to this branch is not allowed') =>
    new AppError(403, 'BRANCH_FORBIDDEN', msg),
  SESSION_LOCKED:             (msg = 'Session is closed and cannot be modified') =>
    new AppError(403, 'SESSION_LOCKED', msg),
  SESSION_NOT_FOUND:          (msg = 'Session not found') =>
    new AppError(404, 'SESSION_NOT_FOUND', msg),
  SESSION_NOT_ACTIVE:         (msg = 'Session is not active') =>
    new AppError(400, 'SESSION_NOT_ACTIVE', msg),
  INSUFFICIENT_STOCK:         (meta) =>
    new AppError(400, 'INSUFFICIENT_STOCK',
      `Only ${meta.available} units available for ${meta.product}`, meta),
  INSUFFICIENT_BRANCH_STOCK:  (meta) =>
    new AppError(400, 'INSUFFICIENT_BRANCH_STOCK',
      `Only ${meta.available} units in branch stock for ${meta.product}`, meta),
  EXCEEDS_AVAILABLE_STOCK:    (meta) =>
    new AppError(400, 'EXCEEDS_AVAILABLE_STOCK',
      `Only ${meta.available} units available on truck for ${meta.product}`, meta),
  RETURN_EXCEEDS_REMAINING:   (meta) =>
    new AppError(400, 'RETURN_EXCEEDS_REMAINING',
      `Return quantity exceeds system remaining for ${meta.product}`, meta),
  APPROVED_EXCEEDS_REMAINING: (meta) =>
    new AppError(400, 'APPROVED_EXCEEDS_REMAINING',
      `Approved return exceeds system remaining for ${meta.product}`, meta),
  APPROVED_EXCEEDS_DISPATCH:  (meta) =>
    new AppError(400, 'APPROVED_EXCEEDS_DISPATCH',
      `Approved return exceeds dispatch quantity for ${meta.product}`, meta),
  SKU_EXISTS:                 (sku) =>
    new AppError(409, 'SKU_EXISTS', `SKU '${sku}' already exists`),
  USER_NOT_FOUND:             (msg = 'User not found') =>
    new AppError(404, 'USER_NOT_FOUND', msg),
  INVALID_CREDENTIALS:        () =>
    new AppError(401, 'INVALID_CREDENTIALS', 'Invalid credentials'),
  VALIDATION_ERROR:           (msg, meta) =>
    new AppError(422, 'VALIDATION_ERROR', msg, meta),
  INTERNAL_ERROR:             (msg = 'Internal server error') =>
    new AppError(500, 'INTERNAL_ERROR', msg),
  DUPLICATE_SESSION:          (meta) =>
    new AppError(409, 'DUPLICATE_SESSION',
      `An active session already exists for truck ${meta.truckId} on ${meta.date}`, meta),
  NOT_FOUND:                  (entity) =>
    new AppError(404, 'NOT_FOUND', `${entity} not found`),
  ADJUSTMENT_REASON_REQUIRED: () =>
    new AppError(400, 'ADJUSTMENT_REASON_REQUIRED',
      'Reason is required when approved quantity differs from entered quantity'),
};

module.exports = { AppError, Errors };
