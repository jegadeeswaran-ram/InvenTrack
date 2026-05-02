const prisma = require('../../config/db');
const { audit } = require('../../utils/audit');

const getPermissions = () =>
  prisma.permission.findMany({ orderBy: [{ role: 'asc' }, { module: 'asc' }] });

const getPermissionsByRole = (role) =>
  prisma.permission.findMany({ where: { role } });

const upsertPermissions = async ({ permissions }, userId) => {
  const filtered = permissions.filter((p) => p.role !== 'ADMIN');

  await prisma.$transaction(
    filtered.map((p) =>
      prisma.permission.upsert({
        where:  { role_module: { role: p.role, module: p.module } },
        update: { canView: p.canView, canCreate: p.canCreate, canEdit: p.canEdit, canDelete: p.canDelete },
        create: p,
      })
    )
  );

  await audit({ userId, action: 'UPDATE', entity: 'Permission', entityId: 'matrix', after: { permissions: filtered } });
  return getPermissions();
};

const getAuditLog = async ({ userId, entity, dateFrom, dateTo, page = 1, limit = 50 }) => {
  const where = {};
  if (userId) where.userId = parseInt(userId);
  if (entity) where.entity = entity;
  if (dateFrom || dateTo) {
    where.timestamp = {};
    if (dateFrom) where.timestamp.gte = new Date(dateFrom);
    if (dateTo)   where.timestamp.lte = new Date(dateTo);
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [total, data] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where, skip, take: parseInt(limit),
      include: { user: { select: { id: true, name: true } } },
      orderBy: { timestamp: 'desc' },
    }),
  ]);

  return { data, total, page: parseInt(page), limit: parseInt(limit) };
};

module.exports = { getPermissions, getPermissionsByRole, upsertPermissions, getAuditLog };
