const prisma = require('../config/db');

const getTrucks = async (req, res) => {
  const { branchId } = req.query;
  const where = branchId ? { branchId: parseInt(branchId) } : {};
  const trucks = await prisma.truck.findMany({
    where,
    include: {
      branch: { select: { id: true, name: true } },
      _count: { select: { sessions: true } },
    },
    orderBy: { name: 'asc' },
  });
  return res.json(trucks);
};

const getTruck = async (req, res) => {
  const truck = await prisma.truck.findUnique({
    where: { id: parseInt(req.params.id) },
    include: {
      branch: { select: { id: true, name: true } },
      users: { select: { id: true, name: true, username: true } },
    },
  });
  if (!truck) return res.status(404).json({ message: 'Truck not found' });
  return res.json(truck);
};

const createTruck = async (req, res) => {
  const { name, plateNumber, branchId } = req.body;
  if (!name || !branchId) return res.status(400).json({ message: 'name and branchId are required' });
  const truck = await prisma.truck.create({
    data: { name, plateNumber: plateNumber || null, branchId: parseInt(branchId) },
    include: { branch: { select: { id: true, name: true } } },
  });
  return res.status(201).json(truck);
};

const updateTruck = async (req, res) => {
  const { name, plateNumber, branchId, isActive } = req.body;
  const truck = await prisma.truck.update({
    where: { id: parseInt(req.params.id) },
    data: {
      name,
      plateNumber: plateNumber || null,
      branchId: branchId ? parseInt(branchId) : undefined,
      isActive,
    },
    include: { branch: { select: { id: true, name: true } } },
  });
  return res.json(truck);
};

module.exports = { getTrucks, getTruck, createTruck, updateTruck };
