const prisma = require('../config/db');

const applyBranchFilter = (req, query) => {
  if (req.user.role === 'BRANCH_MANAGER' && req.user.branchId) {
    query.branchId = req.user.branchId;
  } else if (req.query.branchId) {
    query.branchId = parseInt(req.query.branchId);
  }
  return query;
};

const dailyReport = async (req, res) => {
  const { date, from, to } = req.query;
  if (!date && !from) return res.status(400).json({ message: 'date or from/to query params required' });

  const start = new Date(from || date);
  const end = new Date(to || from || date);
  end.setDate(end.getDate() + 1);

  const saleWhere = applyBranchFilter(req, { date: { gte: start, lt: end } });

  const [purchases, sales] = await Promise.all([
    prisma.purchase.findMany({
      where: { date: { gte: start, lt: end } },
      include: { product: { select: { id: true, name: true, emoji: true, imageUrl: true } } },
    }),
    prisma.sale.findMany({
      where: saleWhere,
      include: { product: { select: { id: true, name: true, emoji: true, imageUrl: true } } },
    }),
  ]);

  const summary = {
    totalPurchaseCost: purchases.reduce((s, p) => s + p.totalCost, 0),
    totalRevenue: sales.reduce((s, p) => s + p.totalRevenue, 0),
    totalProfit: sales.reduce((s, p) => s + p.profit, 0),
    unitsPurchased: purchases.reduce((s, p) => s + p.quantity, 0),
    unitsSold: sales.reduce((s, p) => s + p.quantity, 0),
    shopSales: sales.filter((s) => s.saleType === 'SHOP').reduce((s, p) => s + p.totalRevenue, 0),
    truckSales: sales.filter((s) => s.saleType === 'TRUCK').reduce((s, p) => s + p.totalRevenue, 0),
  };

  return res.json({ date, purchases, sales, summary });
};

const monthlyReport = async (req, res) => {
  const { month } = req.query;
  if (!month) return res.status(400).json({ message: 'month query param required (YYYY-MM)' });

  const [year, mon] = month.split('-').map(Number);
  const start = new Date(year, mon - 1, 1);
  const end = new Date(year, mon, 1);

  const saleWhere = applyBranchFilter(req, { date: { gte: start, lt: end } });
  const expWhere = applyBranchFilter(req, { month: mon, year });

  const [purchases, sales, expenses] = await Promise.all([
    prisma.purchase.findMany({
      where: { date: { gte: start, lt: end } },
      include: { product: { select: { id: true, name: true, emoji: true } } },
      orderBy: { date: 'asc' },
    }),
    prisma.sale.findMany({
      where: saleWhere,
      include: { product: { select: { id: true, name: true, emoji: true } } },
      orderBy: { date: 'asc' },
    }),
    prisma.expense.findMany({ where: expWhere }),
  ]);

  // Day-wise breakdown
  const dayMap = {};
  purchases.forEach((p) => {
    const d = p.date.toISOString().split('T')[0];
    if (!dayMap[d]) dayMap[d] = { date: d, purchaseCost: 0, revenue: 0, profit: 0 };
    dayMap[d].purchaseCost += p.totalCost;
  });
  sales.forEach((s) => {
    const d = s.date.toISOString().split('T')[0];
    if (!dayMap[d]) dayMap[d] = { date: d, purchaseCost: 0, revenue: 0, profit: 0 };
    dayMap[d].revenue += s.totalRevenue;
    dayMap[d].profit += s.profit;
  });

  // Product-wise summary
  const productMap = {};
  sales.forEach((s) => {
    const key = s.productId;
    if (!productMap[key]) {
      productMap[key] = { productId: s.productId, productName: s.product.name, emoji: s.product.emoji, unitsSold: 0, totalRevenue: 0, totalProfit: 0 };
    }
    productMap[key].unitsSold += s.quantity;
    productMap[key].totalRevenue += s.totalRevenue;
    productMap[key].totalProfit += s.profit;
  });

  // Sale type breakdown
  const shopRevenue = sales.filter((s) => s.saleType === 'SHOP').reduce((a, s) => a + s.totalRevenue, 0);
  const truckRevenue = sales.filter((s) => s.saleType === 'TRUCK').reduce((a, s) => a + s.totalRevenue, 0);

  // Expense summary
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const totalRevenue = sales.reduce((s, p) => s + p.totalRevenue, 0);
  const grossProfit = sales.reduce((s, p) => s + p.profit, 0);
  const netProfit = grossProfit - totalExpenses;

  return res.json({
    month,
    dayWise: Object.values(dayMap).sort((a, b) => a.date.localeCompare(b.date)),
    productWise: Object.values(productMap),
    summary: {
      totalPurchaseCost: purchases.reduce((s, p) => s + p.totalCost, 0),
      totalRevenue,
      grossProfit,
      totalExpenses,
      netProfit,
      shopRevenue,
      truckRevenue,
    },
  });
};

const yearlyReport = async (req, res) => {
  const { year } = req.query;
  if (!year) return res.status(400).json({ message: 'year query param required (YYYY)' });

  const yr = parseInt(year);
  const start = new Date(yr, 0, 1);
  const end = new Date(yr + 1, 0, 1);

  const saleWhere = applyBranchFilter(req, { date: { gte: start, lt: end } });

  const [purchases, sales, expenses] = await Promise.all([
    prisma.purchase.findMany({ where: { date: { gte: start, lt: end } } }),
    prisma.sale.findMany({ where: saleWhere }),
    prisma.expense.findMany({ where: applyBranchFilter(req, { year: yr }) }),
  ]);

  const months = Array.from({ length: 12 }, (_, i) => ({
    month: i + 1,
    label: new Date(yr, i, 1).toLocaleString('default', { month: 'long' }),
    purchaseCost: 0,
    revenue: 0,
    profit: 0,
    expenses: 0,
    netProfit: 0,
  }));

  purchases.forEach((p) => { months[new Date(p.date).getMonth()].purchaseCost += p.totalCost; });
  sales.forEach((s) => {
    const m = new Date(s.date).getMonth();
    months[m].revenue += s.totalRevenue;
    months[m].profit += s.profit;
  });
  expenses.forEach((e) => {
    if (e.month >= 1 && e.month <= 12) {
      months[e.month - 1].expenses += e.amount;
    }
  });
  months.forEach((m) => { m.netProfit = m.profit - m.expenses; });

  return res.json({ year: yr, months });
};

const stockReport = async (req, res) => {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    include: {
      purchases: { select: { quantity: true, costPerUnit: true } },
      sales: { select: { quantity: true, pricePerUnit: true } },
    },
  });

  const report = products.map((p) => {
    const totalPurchased = p.purchases.reduce((s, x) => s + x.quantity, 0);
    const totalSold = p.sales.reduce((s, x) => s + x.quantity, 0);
    const inHand = totalPurchased - totalSold;
    const avgCostPerUnit = p.purchases.length > 0
      ? p.purchases.reduce((s, x) => s + x.costPerUnit, 0) / p.purchases.length : 0;
    const avgSellPerUnit = p.sales.length > 0
      ? p.sales.reduce((s, x) => s + x.pricePerUnit, 0) / p.sales.length : 0;

    return {
      productId: p.id,
      productName: p.name,
      emoji: p.emoji,
      imageUrl: p.imageUrl || null,
      piecesPerPacket: p.piecesPerPacket,
      totalPurchased,
      totalSold,
      inHand,
      avgCostPerUnit,
      avgSellPerUnit,
    };
  });

  return res.json(report);
};

// Branch comparison
const branchComparison = async (req, res) => {
  const { from, to } = req.query;
  if (!from || !to) return res.status(400).json({ message: 'from and to dates required' });

  const start = new Date(from);
  const end = new Date(to);
  end.setDate(end.getDate() + 1);

  const branches = await prisma.branch.findMany({ where: { isActive: true } });

  const result = await Promise.all(branches.map(async (b) => {
    const sales = await prisma.sale.findMany({
      where: { branchId: b.id, date: { gte: start, lt: end } },
      select: { totalRevenue: true, profit: true, saleType: true },
    });

    return {
      branchId: b.id,
      branchName: b.name,
      totalRevenue: sales.reduce((s, x) => s + x.totalRevenue, 0),
      totalProfit: sales.reduce((s, x) => s + x.profit, 0),
      shopRevenue: sales.filter((s) => s.saleType === 'SHOP').reduce((s, x) => s + x.totalRevenue, 0),
      truckRevenue: sales.filter((s) => s.saleType === 'TRUCK').reduce((s, x) => s + x.totalRevenue, 0),
      salesCount: sales.length,
    };
  }));

  return res.json(result);
};

module.exports = { dailyReport, monthlyReport, yearlyReport, stockReport, branchComparison };
