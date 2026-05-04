const bcrypt = require('bcryptjs');
const prisma = require('../../config/db');
const { Errors } = require('../../utils/errors');

const safeUser = (u) => {
  const { passwordHash, ...rest } = u;
  return rest;
};

const getAll = async ({ role, branchId, isActive } = {}) => {
  const where = {};
  if (role)     where.role = role;
  if (branchId) where.branchId = parseInt(branchId);
  if (isActive !== undefined) where.isActive = isActive === 'true';

  const users = await prisma.user.findMany({
    where,
    include: { branch: { select: { id: true, name: true } } },
    orderBy: { name: 'asc' },
  });
  return users.map(safeUser);
};

const getById = async (id) => {
  const user = await prisma.user.findUnique({
    where: { id },
    include: { branch: { select: { id: true, name: true } } },
  });
  if (!user) throw Errors.USER_NOT_FOUND();
  return safeUser(user);
};

const create = async (data) => {
  const hash = await bcrypt.hash(data.password, 10);
  const user = await prisma.user.create({
    data: {
      name:         data.name,
      email:        data.email || null,
      mobile:       data.mobile || null,
      passwordHash: hash,
      role:         data.role,
      branchId:     data.branchId || null,
      isActive:     data.isActive ?? true,
    },
  });
  return safeUser(user);
};

const update = async (id, data) => {
  await getById(id);
  const updateData = { ...data };
  delete updateData.password;

  if (data.password) {
    updateData.passwordHash = await bcrypt.hash(data.password, 10);
  }

  const user = await prisma.user.update({ where: { id }, data: updateData });
  return safeUser(user);
};

const remove = async (id) => {
  await getById(id);
  return safeUser(await prisma.user.update({ where: { id }, data: { isActive: false } }));
};

module.exports = { getAll, getById, create, update, remove };
