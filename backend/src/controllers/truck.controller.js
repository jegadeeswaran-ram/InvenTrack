const prisma = require('../config/db');

// ─── Branches ────────────────────────────────────────────────────────────────

const getBranches = async (req, res) => {
  const branches = await prisma.branch.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
  });
  return res.json(branches);
};

const createBranch = async (req, res) => {
  const { name, address } = req.body;
  if (!name) return res.status(400).json({ message: 'Branch name is required' });
  const branch = await prisma.branch.create({ data: { name, address: address || null } });
  return res.status(201).json(branch);
};

const updateBranch = async (req, res) => {
  const { id } = req.params;
  const { name, address, isActive } = req.body;
  const branch = await prisma.branch.update({
    where: { id: parseInt(id) },
    data: {
      ...(name !== undefined && { name }),
      ...(address !== undefined && { address }),
      ...(isActive !== undefined && { isActive }),
    },
  });
  return res.json(branch);
};

// ─── Trucks ───────────────────────────────────────────────────────────────────

const getTrucks = async (req, res) => {
  const { branchId } = req.query;
  const where = { isActive: true };
  if (branchId) where.branchId = parseInt(branchId);

  const trucks = await prisma.truck.findMany({
    where,
    include: { branch: { select: { id: true, name: true } } },
    orderBy: { name: 'asc' },
  });
  return res.json(trucks);
};

const createTruck = async (req, res) => {
  const { name, plateNo, branchId } = req.body;
  if (!name || !branchId) return res.status(400).json({ message: 'name and branchId are required' });

  const truck = await prisma.truck.create({
    data: { name, plateNo: plateNo || null, branchId: parseInt(branchId) },
    include: { branch: { select: { id: true, name: true } } },
  });
  return res.status(201).json(truck);
};

const updateTruck = async (req, res) => {
  const { id } = req.params;
  const { name, plateNo, branchId, isActive } = req.body;
  const truck = await prisma.truck.update({
    where: { id: parseInt(id) },
    data: {
      ...(name !== undefined && { name }),
      ...(plateNo !== undefined && { plateNo }),
      ...(branchId !== undefined && { branchId: parseInt(branchId) }),
      ...(isActive !== undefined && { isActive }),
    },
    include: { branch: { select: { id: true, name: true } } },
  });
  return res.json(truck);
};

module.exports = { getBranches, createBranch, updateBranch, getTrucks, createTruck, updateTruck };
