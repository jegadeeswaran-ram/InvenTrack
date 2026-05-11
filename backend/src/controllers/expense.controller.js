const prisma = require('../config/db');

const CATEGORIES = ['SALARY', 'INCENTIVE', 'ELECTRICITY', 'RENT', 'MAINTENANCE', 'TRANSPORT', 'MISC'];

const getExpenses = async (req, res) => {
  const { branchId, month, year } = req.query;
  const where = {};
  if (branchId) where.branchId = parseInt(branchId);
  if (month) where.month = parseInt(month);
  if (year) where.year = parseInt(year);

  // Branch managers can only see their own branch
  if (req.user.role === 'BRANCH_MANAGER' && req.user.branchId) {
    where.branchId = req.user.branchId;
  }

  const expenses = await prisma.expense.findMany({
    where,
    include: { branch: { select: { id: true, name: true } } },
    orderBy: [{ year: 'desc' }, { month: 'desc' }, { createdAt: 'desc' }],
  });
  return res.json(expenses);
};

const createExpense = async (req, res) => {
  const { branchId, category, amount, month, year, notes } = req.body;
  if (!branchId || !category || amount == null || !month || !year) {
    return res.status(400).json({ message: 'branchId, category, amount, month, year are required' });
  }
  if (!CATEGORIES.includes(category)) {
    return res.status(400).json({ message: `category must be one of: ${CATEGORIES.join(', ')}` });
  }
  if (parseFloat(amount) < 0) return res.status(400).json({ message: 'Amount cannot be negative' });

  const expense = await prisma.expense.create({
    data: {
      branchId: parseInt(branchId),
      category,
      amount: parseFloat(amount),
      month: parseInt(month),
      year: parseInt(year),
      notes: notes || null,
    },
    include: { branch: { select: { id: true, name: true } } },
  });
  return res.status(201).json(expense);
};

const updateExpense = async (req, res) => {
  const { category, amount, month, year, notes } = req.body;
  if (amount != null && parseFloat(amount) < 0) return res.status(400).json({ message: 'Amount cannot be negative' });
  const expense = await prisma.expense.update({
    where: { id: parseInt(req.params.id) },
    data: { category, amount: parseFloat(amount), month: parseInt(month), year: parseInt(year), notes },
    include: { branch: { select: { id: true, name: true } } },
  });
  return res.json(expense);
};

const deleteExpense = async (req, res) => {
  await prisma.expense.delete({ where: { id: parseInt(req.params.id) } });
  return res.json({ message: 'Expense deleted' });
};

const getMonthlySummary = async (req, res) => {
  const { branchId, month, year } = req.query;
  if (!month || !year) return res.status(400).json({ message: 'month and year required' });

  const where = { month: parseInt(month), year: parseInt(year) };
  if (branchId) where.branchId = parseInt(branchId);
  if (req.user.role === 'BRANCH_MANAGER' && req.user.branchId) {
    where.branchId = req.user.branchId;
  }

  const expenses = await prisma.expense.findMany({ where });

  const summary = {};
  CATEGORIES.forEach((c) => { summary[c] = 0; });
  expenses.forEach((e) => { summary[e.category] = (summary[e.category] || 0) + e.amount; });

  const [yr, mon] = [parseInt(year), parseInt(month)];
  const start = new Date(yr, mon - 1, 1);
  const end = new Date(yr, mon, 1);

  const salesData = await prisma.sale.findMany({
    where: { date: { gte: start, lt: end }, ...(where.branchId ? { branchId: where.branchId } : {}) },
    select: { totalRevenue: true, profit: true },
  });

  const totalRevenue = salesData.reduce((s, x) => s + x.totalRevenue, 0);
  const grossProfit = salesData.reduce((s, x) => s + x.profit, 0);
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const netProfit = grossProfit - totalExpenses;

  return res.json({ month: parseInt(month), year: parseInt(year), breakdown: summary, totalExpenses, totalRevenue, grossProfit, netProfit });
};

module.exports = { getExpenses, createExpense, updateExpense, deleteExpense, getMonthlySummary };
