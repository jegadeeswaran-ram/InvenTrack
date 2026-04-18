const prisma = require('../config/db');

const getSales = async (req, res) => {
  const { date } = req.query;
  let where = {};

  // SALES role can only see their own entries
  if (req.user.role !== 'ADMIN') {
    where.userId = req.user.id;
  }

  if (date) {
    const start = new Date(date);
    const end = new Date(date);
    end.setDate(end.getDate() + 1);
    where.date = { gte: start, lt: end };
  }

  const sales = await prisma.sale.findMany({
    where,
    include: {
      product: { select: { id: true, name: true, emoji: true, imageUrl: true } },
      user: { select: { id: true, name: true, username: true } },
    },
    orderBy: { date: 'desc' },
  });
  return res.json(sales);
};

const createSale = async (req, res) => {
  const { date, productId, quantity, pricePerUnit, notes } = req.body;

  if (!date || !productId || quantity == null || pricePerUnit == null) {
    return res.status(400).json({ message: 'date, productId, quantity, pricePerUnit are required' });
  }

  const qty = parseFloat(quantity);
  const price = parseFloat(pricePerUnit);
  const totalRevenue = qty * price;

  // Compute average cost from all purchases for this product
  const purchases = await prisma.purchase.findMany({
    where: { productId: parseInt(productId) },
    select: { costPerUnit: true },
  });

  let avgCostUnit = 0;
  if (purchases.length > 0) {
    avgCostUnit = purchases.reduce((sum, p) => sum + p.costPerUnit, 0) / purchases.length;
  }

  const profit = (price - avgCostUnit) * qty;

  const sale = await prisma.sale.create({
    data: {
      date: new Date(date),
      productId: parseInt(productId),
      userId: req.user.id,
      quantity: qty,
      pricePerUnit: price,
      totalRevenue,
      avgCostUnit,
      profit,
      notes: notes || null,
    },
    include: {
      product: { select: { id: true, name: true, emoji: true, imageUrl: true } },
      user: { select: { id: true, name: true, username: true } },
    },
  });
  return res.status(201).json(sale);
};

const updateSale = async (req, res) => {
  const { id } = req.params;
  const { date, productId, quantity, pricePerUnit, notes } = req.body;
  const qty = parseFloat(quantity);
  const price = parseFloat(pricePerUnit);
  const totalRevenue = qty * price;

  const purchases = await prisma.purchase.findMany({
    where: { productId: parseInt(productId) },
    select: { costPerUnit: true },
  });
  const avgCostUnit = purchases.length > 0
    ? purchases.reduce((s, p) => s + p.costPerUnit, 0) / purchases.length : 0;

  const sale = await prisma.sale.update({
    where: { id: parseInt(id) },
    data: {
      date: new Date(date),
      productId: parseInt(productId),
      quantity: qty,
      pricePerUnit: price,
      totalRevenue,
      avgCostUnit,
      profit: (price - avgCostUnit) * qty,
      notes: notes || null,
    },
    include: {
      product: { select: { id: true, name: true, emoji: true, imageUrl: true } },
      user: { select: { id: true, name: true, username: true } },
    },
  });
  return res.json(sale);
};

const deleteSale = async (req, res) => {
  const { id } = req.params;
  await prisma.sale.delete({ where: { id: parseInt(id) } });
  return res.json({ message: 'Sale deleted' });
};

module.exports = { getSales, createSale, updateSale, deleteSale };
