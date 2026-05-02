const prisma = require('../../config/db');

const getAll = async (query, user) => {
  const { category, dateFrom, dateTo, page = 1, limit = 20 } = query;
  let { branchId } = query;
  if (user.role === 'BRANCH_MANAGER') branchId = user.branchId;

  const where = {};
  if (branchId) where.branchId = parseInt(branchId);
  if (category) where.category = category;
  if (dateFrom || dateTo) {
    where.expenseDate = {};
    if (dateFrom) where.expenseDate.gte = new Date(dateFrom);
    if (dateTo)   where.expenseDate.lte = new Date(dateTo);
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [total, data] = await Promise.all([
    prisma.expense.count({ where }),
    prisma.expense.findMany({
      where, skip, take: parseInt(limit),
      include: {
        branch: { select: { id: true, name: true } },
        user:   { select: { id: true, name: true } },
      },
      orderBy: { expenseDate: 'desc' },
    }),
  ]);

  return { data, total, page: parseInt(page), limit: parseInt(limit) };
};

const create = (data, userId) =>
  prisma.expense.create({
    data: { ...data, userId, expenseDate: new Date(data.expenseDate) },
    include: { branch: { select: { id: true, name: true } } },
  });

const update = async (id, data, user) => {
  const expense = await prisma.expense.findUnique({ where: { id: parseInt(id) } });
  if (!expense) throw new Error('Expense not found');
  if (user.role === 'BRANCH_MANAGER' && expense.branchId !== user.branchId) {
    const { Errors } = require('../../utils/errors');
    throw Errors.BRANCH_FORBIDDEN();
  }
  return prisma.expense.update({ where: { id: parseInt(id) }, data });
};

const remove = (id) => prisma.expense.delete({ where: { id: parseInt(id) } });

module.exports = { getAll, create, update, remove };
