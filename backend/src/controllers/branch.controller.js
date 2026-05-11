const prisma = require('../config/db');

const getBranches = async (req, res) => {
  const branches = await prisma.branch.findMany({
    include: {
      _count: { select: { users: true, trucks: true } },
    },
    orderBy: { name: 'asc' },
  });
  return res.json(branches);
};

const getBranch = async (req, res) => {
  const branch = await prisma.branch.findUnique({
    where: { id: parseInt(req.params.id) },
    include: {
      users: { select: { id: true, name: true, username: true, role: true, isActive: true } },
      trucks: { select: { id: true, name: true, plateNumber: true, isActive: true } },
    },
  });
  if (!branch) return res.status(404).json({ message: 'Branch not found' });
  return res.json(branch);
};

const createBranch = async (req, res) => {
  const { name, location } = req.body;
  if (!name) return res.status(400).json({ message: 'name is required' });
  const branch = await prisma.branch.create({ data: { name, location: location || '' } });
  return res.status(201).json(branch);
};

const updateBranch = async (req, res) => {
  const { name, location, isActive } = req.body;
  const branch = await prisma.branch.update({
    where: { id: parseInt(req.params.id) },
    data: { name, location, isActive },
  });
  return res.json(branch);
};

const deleteBranch = async (req, res) => {
  await prisma.branch.update({
    where: { id: parseInt(req.params.id) },
    data: { isActive: false },
  });
  return res.json({ message: 'Branch deactivated' });
};

module.exports = { getBranches, getBranch, createBranch, updateBranch, deleteBranch };
