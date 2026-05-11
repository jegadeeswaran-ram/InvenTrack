const prisma = require('../config/db');

const MODULES = [
  'dashboard', 'purchase', 'sales', 'stock', 'reports',
  'products', 'branches', 'trucks', 'truck-sessions',
  'expenses', 'bulk-orders', 'settings', 'media',
];

const DEFAULTS = {
  ADMIN: { canView: true, canCreate: true, canEdit: true, canDelete: true },
  BRANCH_MANAGER: {
    dashboard:       { canView: true,  canCreate: false, canEdit: false, canDelete: false },
    purchase:        { canView: true,  canCreate: true,  canEdit: true,  canDelete: false },
    sales:           { canView: true,  canCreate: true,  canEdit: true,  canDelete: false },
    stock:           { canView: true,  canCreate: false, canEdit: false, canDelete: false },
    reports:         { canView: true,  canCreate: false, canEdit: false, canDelete: false },
    products:        { canView: true,  canCreate: false, canEdit: false, canDelete: false },
    branches:        { canView: true,  canCreate: false, canEdit: false, canDelete: false },
    trucks:          { canView: true,  canCreate: false, canEdit: false, canDelete: false },
    'truck-sessions':{ canView: true,  canCreate: true,  canEdit: true,  canDelete: false },
    expenses:        { canView: true,  canCreate: true,  canEdit: true,  canDelete: false },
    'bulk-orders':   { canView: true,  canCreate: true,  canEdit: true,  canDelete: false },
    settings:        { canView: false, canCreate: false, canEdit: false, canDelete: false },
    media:           { canView: true,  canCreate: false, canEdit: false, canDelete: false },
  },
  SALES: {
    dashboard:       { canView: true,  canCreate: false, canEdit: false, canDelete: false },
    purchase:        { canView: false, canCreate: false, canEdit: false, canDelete: false },
    sales:           { canView: true,  canCreate: true,  canEdit: false, canDelete: false },
    stock:           { canView: true,  canCreate: false, canEdit: false, canDelete: false },
    reports:         { canView: false, canCreate: false, canEdit: false, canDelete: false },
    products:        { canView: false, canCreate: false, canEdit: false, canDelete: false },
    branches:        { canView: false, canCreate: false, canEdit: false, canDelete: false },
    trucks:          { canView: false, canCreate: false, canEdit: false, canDelete: false },
    'truck-sessions':{ canView: true,  canCreate: true,  canEdit: false, canDelete: false },
    expenses:        { canView: false, canCreate: false, canEdit: false, canDelete: false },
    'bulk-orders':   { canView: false, canCreate: false, canEdit: false, canDelete: false },
    settings:        { canView: false, canCreate: false, canEdit: false, canDelete: false },
    media:           { canView: false, canCreate: false, canEdit: false, canDelete: false },
  },
};

async function seedDefaults() {
  for (const role of ['ADMIN', 'BRANCH_MANAGER', 'SALES']) {
    for (const module of MODULES) {
      const def = role === 'ADMIN'
        ? DEFAULTS.ADMIN
        : (DEFAULTS[role][module] || { canView: false, canCreate: false, canEdit: false, canDelete: false });
      await prisma.rolePermission.upsert({
        where: { role_module: { role, module } },
        update: {},
        create: { role, module, ...def },
      });
    }
  }
}

const getPermissions = async (req, res) => {
  let perms = await prisma.rolePermission.findMany({ orderBy: [{ role: 'asc' }, { module: 'asc' }] });
  if (perms.length === 0) {
    await seedDefaults();
    perms = await prisma.rolePermission.findMany({ orderBy: [{ role: 'asc' }, { module: 'asc' }] });
  }
  return res.json(perms);
};

const updatePermissions = async (req, res) => {
  const rows = req.body;
  if (!Array.isArray(rows)) return res.status(400).json({ message: 'Array expected' });
  const results = await Promise.all(rows.map(p =>
    prisma.rolePermission.upsert({
      where: { role_module: { role: p.role, module: p.module } },
      update: { canView: !!p.canView, canCreate: !!p.canCreate, canEdit: !!p.canEdit, canDelete: !!p.canDelete },
      create: { role: p.role, module: p.module, canView: !!p.canView, canCreate: !!p.canCreate, canEdit: !!p.canEdit, canDelete: !!p.canDelete },
    })
  ));
  return res.json(results);
};

const getMyPermissions = async (req, res) => {
  const role = req.user.role;
  let perms = await prisma.rolePermission.findMany({
    where: { role },
    orderBy: { module: 'asc' },
  });
  if (perms.length === 0) {
    await seedDefaults();
    perms = await prisma.rolePermission.findMany({ where: { role }, orderBy: { module: 'asc' } });
  }
  return res.json(perms);
};

module.exports = { getPermissions, updatePermissions, getMyPermissions };
