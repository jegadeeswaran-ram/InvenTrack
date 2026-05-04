const jwt = require('jsonwebtoken');
const env = require('../config/env');
const { Errors } = require('../utils/errors');

const auth = (req, res, next) => {
  const header = req.headers['authorization'];
  if (!header || !header.startsWith('Bearer ')) {
    return next(Errors.TOKEN_INVALID('No token provided'));
  }

  const token = header.split(' ')[1];
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    req.user = {
      id:       decoded.id,
      role:     decoded.role,
      branchId: decoded.branchId ?? null,
    };
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') return next(Errors.TOKEN_EXPIRED());
    return next(Errors.TOKEN_INVALID());
  }
};

module.exports = auth;
