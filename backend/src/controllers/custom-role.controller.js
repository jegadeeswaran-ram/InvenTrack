const prisma = require('../config/db');

const MODULES = [
  'dashboard', 'purchase', 'sales', 'stock', 'reports',
  'products', 'branches', 'trucks', 'truck-sessions',
  'expenses', 'bulk-orders', 'settings', 'media',
];

const getCustomRoles = async (req, res) => {
  const roles = await prisma.customRole.findMany({ where: { isActive: true }, orderBy: { createdAt: 'asc' } });
  return res.json(roles);
};

const createCustomRole = async (req, res) => {
  const { name, label, color } = req.body;
  if (!name || !label) return res.status(400).json({ message: 'name and label are required' });

  const key = name.trim().toUpperCase().replace(/\s+/g, '_');
  const existing = await prisma.customRole.findUnique({ where: { name: key } });
  if (existing) return res.status(409).json({ message: `Role "${key}" already exists` });

  const role = await prisma.customRole.create({ data: { name: key, label: label.trim(), color: color || '#6B7280' } });

  // Seed empty permissions for every module
  await Promise.all(MODULES.map(module =>
    prisma.rolePermission.upsert({
      where: { role_module: { role: key, module } },
      update: {},
      create: { role: key, module, canView: false, canCreate: false, canEdit: false, canDelete: false },
    })
  ));

  return res.status(201).json(role);
};

const deleteCustomRole = async (req, res) => {
  const { name } = req.params;
  await prisma.customRole.updateMany({ where: { name }, data: { isActive: false } });
  await prisma.rolePermission.deleteMany({ where: { role: name } });
  return res.json({ message: 'Role removed' });
};

module.exports = { getCustomRoles, createCustomRole, deleteCustomRole };
