const bcrypt = require('bcryptjs');
const prisma = require('../config/db');

const getUsers = async (req, res) => {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, username: true, mobile: true, role: true, isActive: true, branchId: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  });
  return res.json(users);
};

const createUser = async (req, res) => {
  const { name, username, password, role, mobile, branchId } = req.body;
  if (!name || !username || !password || !role) {
    return res.status(400).json({ message: 'name, username, password, role are required' });
  }

  const exists = await prisma.user.findUnique({ where: { username } });
  if (exists) return res.status(409).json({ message: 'Username already taken' });

  if (mobile) {
    const mobileExists = await prisma.user.findUnique({ where: { mobile } });
    if (mobileExists) return res.status(409).json({ message: 'Mobile number already registered' });
  }

  const hashed = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      name,
      username,
      password: hashed,
      role,
      mobile: mobile || null,
      branchId: branchId ? parseInt(branchId) : null,
    },
    select: { id: true, name: true, username: true, mobile: true, role: true, isActive: true, branchId: true },
  });
  return res.status(201).json(user);
};

const updateUser = async (req, res) => {
  const { id } = req.params;
  const { name, username, password, role } = req.body;

  const existing = await prisma.user.findUnique({ where: { id: parseInt(id) } });
  if (!existing) return res.status(404).json({ message: 'User not found' });

  if (username && username !== existing.username) {
    const taken = await prisma.user.findUnique({ where: { username } });
    if (taken) return res.status(409).json({ message: 'Username already taken' });
  }

  const { mobile, branchId } = req.body;
  const data = {
    ...(name && { name }),
    ...(username && { username }),
    ...(role && { role }),
    ...(mobile !== undefined && { mobile: mobile || null }),
    ...(branchId !== undefined && { branchId: branchId ? parseInt(branchId) : null }),
  };
  if (password) data.password = await bcrypt.hash(password, 10);

  const user = await prisma.user.update({
    where: { id: parseInt(id) },
    data,
    select: { id: true, name: true, username: true, mobile: true, role: true, isActive: true, branchId: true },
  });
  return res.json(user);
};

const deleteUser = async (req, res) => {
  const { id } = req.params;
  const user = await prisma.user.findUnique({ where: { id: parseInt(id) } });
  if (!user) return res.status(404).json({ message: 'User not found' });
  if (user.username === 'admin') return res.status(403).json({ message: 'Cannot delete the main admin account' });

  await prisma.user.delete({ where: { id: parseInt(id) } });
  return res.json({ message: 'User deleted' });
};

const toggleUser = async (req, res) => {
  const { id } = req.params;
  const userId = parseInt(id);

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return res.status(404).json({ message: 'User not found' });
  if (user.role === 'ADMIN' && user.username === 'admin') {
    return res.status(403).json({ message: 'Cannot deactivate the main admin account' });
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { isActive: !user.isActive },
    select: { id: true, name: true, username: true, role: true, isActive: true },
  });
  return res.json(updated);
};

module.exports = { getUsers, createUser, updateUser, deleteUser, toggleUser };
