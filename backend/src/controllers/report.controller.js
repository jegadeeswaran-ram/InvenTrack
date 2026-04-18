const prisma = require('../config/db');

const dailyReport = async (req, res) => {
  const { date, from, to } = req.query;
  if (!date && !from) return res.status(400).json({ message: 'date or from/to query params required' });

  const start = new Date(from || date);
  const end = new Date(to || from || date);
  end.setDate(end.getDate() + 1);

  const [purchases, sales] = await Promise.all([
    prisma.purchase.findMany({
      where: { date: { gte: start, lt: end } },
      include: { product: { select: { id: true, name: true, emoji: true, imageUrl: true } } },
    }),
    prisma.sale.findMany({
      where: { date: { gte: start, lt: end } },
      include: { product: { select: { id: true, name: true, emoji: true, imageUrl: true } } },
    }),
  ]);

  const summary = {
    totalPurchaseCost: purchases.reduce((s, p) => s + p.totalCost, 0),
    totalRevenue: sales.reduce((s, p) => s + p.totalRevenue, 0),
    totalProfit: sales.reduce((s, p) => s + p.profit, 0),
    unitsPurchased: purchases.reduce((s, p) => s + p.quantity, 0),
    unitsSold: sales.reduce((s, p) => s + p.quantity, 0),
  };

  return res.json({
    date,
    purchases: purchases.map((p) => ({
      productId: p.productId,
      productName: p.product.name,
      emoji: p.product.emoji,
      quantity: p.quantity,
      totalCost: p.totalCost,
    })),
    sales: sales.map((s) => ({
      productId: s.productId,
      productName: s.product.name,
      imageUrl: s.product.imageUrl || null,
      quantity: s.quantity,
      totalRevenue: s.totalRevenue,
      profit: s.profit,
    })),
    summary,
  });
};

const monthlyReport = async (req, res) => {
  const { month } = req.query;
  if (!month) return res.status(400).json({ message: 'month query param required (YYYY-MM)' });

  const [year, mon] = month.split('-').map(Number);
  const start = new Date(year, mon - 1, 1);
  const end = new Date(year, mon, 1);

  const [purchases, sales] = await Promise.all([
    prisma.purchase.findMany({
      where: { date: { gte: start, lt: end } },
      include: { product: { select: { id: true, name: true, emoji: true } } },
      orderBy: { date: 'asc' },
    }),
    prisma.sale.findMany({
      where: { date: { gte: start, lt: end } },
      include: { product: { select: { id: true, name: true, emoji: true } } },
      orderBy: { date: 'asc' },
    }),
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
      productMap[key] = {
        productId: s.productId,
        productName: s.product.name,
        emoji: s.product.emoji,
        unitsSold: 0,
        totalRevenue: 0,
        totalProfit: 0,
      };
    }
    productMap[key].unitsSold += s.quantity;
    productMap[key].totalRevenue += s.totalRevenue;
    productMap[key].totalProfit += s.profit;
  });

  return res.json({
    month,
    dayWise: Object.values(dayMap).sort((a, b) => a.date.localeCompare(b.date)),
    productWise: Object.values(productMap),
    summary: {
      totalPurchaseCost: purchases.reduce((s, p) => s + p.totalCost, 0),
      totalRevenue: sales.reduce((s, p) => s + p.totalRevenue, 0),
      totalProfit: sales.reduce((s, p) => s + p.profit, 0),
    },
  });
};

const yearlyReport = async (req, res) => {
  const { year } = req.query;
  if (!year) return res.status(400).json({ message: 'year query param required (YYYY)' });

  const yr = parseInt(year);
  const start = new Date(yr, 0, 1);
  const end = new Date(yr + 1, 0, 1);

  const [purchases, sales] = await Promise.all([
    prisma.purchase.findMany({ where: { date: { gte: start, lt: end } } }),
    prisma.sale.findMany({ where: { date: { gte: start, lt: end } } }),
  ]);

  const months = Array.from({ length: 12 }, (_, i) => ({
    month: i + 1,
    label: new Date(yr, i, 1).toLocaleString('default', { month: 'long' }),
    purchaseCost: 0,
    revenue: 0,
    profit: 0,
  }));

  purchases.forEach((p) => {
    const m = new Date(p.date).getMonth();
    months[m].purchaseCost += p.totalCost;
  });
  sales.forEach((s) => {
    const m = new Date(s.date).getMonth();
    months[m].revenue += s.totalRevenue;
    months[m].profit += s.profit;
  });

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
    const avgCostPerUnit =
      p.purchases.length > 0
        ? p.purchases.reduce((s, x) => s + x.costPerUnit, 0) / p.purchases.length
        : 0;
    const avgSellPerUnit =
      p.sales.length > 0
        ? p.sales.reduce((s, x) => s + x.pricePerUnit, 0) / p.sales.length
        : 0;

    return {
      productId: p.id,
      productName: p.name,
      emoji: p.emoji,
      imageUrl: p.imageUrl || null,
      totalPurchased,
      totalSold,
      inHand,
      avgCostPerUnit,
      avgSellPerUnit,
    };
  });

  return res.json(report);
};

module.exports = { dailyReport, monthlyReport, yearlyReport, stockReport };
