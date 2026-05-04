const { AppError } = require('../utils/errors');

const errorHandler = (err, req, res, next) => {
  if (err instanceof AppError && err.isOperational) {
    return res.status(err.statusCode).json({
      success: false,
      code:    err.code,
      message: err.message,
      meta:    Object.keys(err.meta).length ? err.meta : undefined,
    });
  }

  if (err.name === 'ZodError') {
    return res.status(422).json({
      success: false,
      code:    'VALIDATION_ERROR',
      message: err.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join('; '),
      meta:    { fields: err.errors },
    });
  }

  if (err.code === 'P2002') {
    return res.status(409).json({
      success: false,
      code:    'DUPLICATE_ENTRY',
      message: `Duplicate value for: ${err.meta?.target?.join(', ')}`,
    });
  }

  if (err.code === 'P2025') {
    return res.status(404).json({
      success: false,
      code:    'NOT_FOUND',
      message: 'Record not found',
    });
  }

  console.error('[UNHANDLED ERROR]', err);

  return res.status(500).json({
    success: false,
    code:    'INTERNAL_ERROR',
    message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  });
};

module.exports = errorHandler;
