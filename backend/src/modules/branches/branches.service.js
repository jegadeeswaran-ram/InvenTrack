const prisma = require('../../config/db');
const { Errors } = require('../../utils/errors');

const getAll = () =>
  prisma.branch.findMany({ orderBy: { name: 'asc' } });

const getById = async (id) => {
  const branch = await prisma.branch.findUnique({ where: { id } });
  if (!branch) throw Errors.NOT_FOUND('Branch');
  return branch;
};

const create = (data) =>
  prisma.branch.create({ data });

const update = async (id, data) => {
  await getById(id);
  return prisma.branch.update({ where: { id }, data });
};

const remove = async (id) => {
  await getById(id);
  return prisma.branch.update({ where: { id }, data: { isActive: false } });
};

module.exports = { getAll, getById, create, update, remove };
