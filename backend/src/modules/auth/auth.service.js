const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const prisma = require('../../config/db');
const env = require('../../config/env');
const { Errors } = require('../../utils/errors');

const signAccess = (payload) =>
  jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });

const signRefresh = (payload) =>
  jwt.sign(payload, env.JWT_REFRESH_SECRET, { expiresIn: env.JWT_REFRESH_EXPIRES_IN });

const login = async ({ login, password }) => {
  const isEmail = login.includes('@');
  const user = await prisma.user.findFirst({
    where: isEmail ? { email: login } : { mobile: login },
  });

  if (!user || !user.isActive) throw Errors.INVALID_CREDENTIALS();

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw Errors.INVALID_CREDENTIALS();

  const payload = { id: user.id, role: user.role, branchId: user.branchId };
  const accessToken  = signAccess(payload);
  const refreshToken = signRefresh(payload);

  const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await prisma.refreshToken.create({
    data: { userId: user.id, token: tokenHash, expiresAt },
  });

  return {
    accessToken,
    refreshToken,
    user: { id: user.id, name: user.name, role: user.role, branchId: user.branchId },
  };
};

const refresh = async ({ refreshToken }) => {
  let decoded;
  try {
    decoded = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET);
  } catch {
    throw Errors.TOKEN_INVALID('Invalid refresh token');
  }

  const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
  const stored = await prisma.refreshToken.findUnique({ where: { token: tokenHash } });

  if (!stored || stored.expiresAt < new Date()) {
    throw Errors.TOKEN_EXPIRED('Refresh token expired or revoked');
  }

  const user = await prisma.user.findUnique({ where: { id: decoded.id } });
  if (!user || !user.isActive) throw Errors.INVALID_CREDENTIALS();

  const payload = { id: user.id, role: user.role, branchId: user.branchId };
  const newAccessToken  = signAccess(payload);
  const newRefreshToken = signRefresh(payload);
  const newHash = crypto.createHash('sha256').update(newRefreshToken).digest('hex');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await prisma.$transaction([
    prisma.refreshToken.delete({ where: { token: tokenHash } }),
    prisma.refreshToken.create({ data: { userId: user.id, token: newHash, expiresAt } }),
  ]);

  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
};

const logout = async ({ refreshToken }) => {
  const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
  await prisma.refreshToken.deleteMany({ where: { token: tokenHash } });
};

module.exports = { login, refresh, logout };
