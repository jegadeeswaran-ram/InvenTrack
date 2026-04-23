const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/db');

const login = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }

  const user = await prisma.user.findUnique({ where: { username } });
  if (!user || !user.isActive) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  return res.json({
    token,
    user: { id: user.id, name: user.name, username: user.username, role: user.role },
  });
};

const me = async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { id: true, name: true, username: true, email: true, photo: true, role: true, isActive: true },
  });
  if (!user) return res.status(404).json({ message: 'User not found' });
  return res.json(user);
};

const updateProfile = async (req, res) => {
  const { name, username, email, password, photo } = req.body;
  const userId = req.user.id;

  // Check username uniqueness if changing
  if (username) {
    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing && existing.id !== userId) {
      return res.status(400).json({ message: 'Username already taken' });
    }
  }

  const data = {};
  if (name !== undefined) data.name = name;
  if (username !== undefined) data.username = username;
  if (email !== undefined) data.email = email;
  if (photo !== undefined) data.photo = photo;
  if (password) {
    if (password.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters' });
    data.password = await bcrypt.hash(password, 10);
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data,
    select: { id: true, name: true, username: true, email: true, photo: true, role: true },
  });

  return res.json(updated);
};

module.exports = { login, me, updateProfile };
