const prisma = require('../config/db');

const getCustomers = async (req, res) => {
  const { branchId, search } = req.query;
  const where = { isActive: true };
  if (branchId) where.branchId = parseInt(branchId);
  if (req.user.role === 'BRANCH_MANAGER' && req.user.branchId) where.branchId = req.user.branchId;
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { phone: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ];
  }
  const customers = await prisma.customer.findMany({
    where,
    include: { branch: { select: { id: true, name: true } }, _count: { select: { bulkOrders: true } } },
    orderBy: { createdAt: 'desc' },
  });
  return res.json(customers);
};

const getCustomer = async (req, res) => {
  const customer = await prisma.customer.findUnique({
    where: { id: parseInt(req.params.id) },
    include: {
      branch: { select: { id: true, name: true } },
      bulkOrders: { orderBy: { createdAt: 'desc' }, select: { id: true, orderNumber: true, totalAmount: true, paidAmount: true, status: true, createdAt: true } },
    },
  });
  if (!customer) return res.status(404).json({ message: 'Customer not found' });
  return res.json(customer);
};

const createCustomer = async (req, res) => {
  const { name, phone, email, address, city, gstin, notes, branchId } = req.body;
  if (!name) return res.status(400).json({ message: 'name is required' });
  const customer = await prisma.customer.create({
    data: {
      name: name.trim(),
      phone: phone || null,
      email: email || null,
      address: address || '',
      city: city || '',
      gstin: gstin || null,
      notes: notes || null,
      branchId: branchId ? parseInt(branchId) : null,
    },
    include: { branch: { select: { id: true, name: true } } },
  });
  return res.status(201).json(customer);
};

const updateCustomer = async (req, res) => {
  const { name, phone, email, address, city, gstin, notes, branchId } = req.body;
  const customer = await prisma.customer.update({
    where: { id: parseInt(req.params.id) },
    data: {
      ...(name !== undefined && { name: name.trim() }),
      phone: phone || null,
      email: email || null,
      address: address || '',
      city: city || '',
      gstin: gstin || null,
      notes: notes || null,
      branchId: branchId ? parseInt(branchId) : null,
    },
    include: { branch: { select: { id: true, name: true } } },
  });
  return res.json(customer);
};

const deleteCustomer = async (req, res) => {
  await prisma.customer.update({ where: { id: parseInt(req.params.id) }, data: { isActive: false } });
  return res.json({ message: 'Customer removed' });
};

module.exports = { getCustomers, getCustomer, createCustomer, updateCustomer, deleteCustomer };
