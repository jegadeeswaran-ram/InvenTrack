const prisma = require('../config/db');

const PRODUCT_SELECT = { id: true, name: true, emoji: true, imageUrl: true, costPerUnit: true, piecesPerPacket: true };

const getSales = async (req, res) => {
  const { date, branchId, saleType } = req.query;
  const where = {};

  if (req.user.role === 'SALES') where.userId = req.user.id;
  if (req.user.role === 'BRANCH_MANAGER' && req.user.branchId) where.branchId = req.user.branchId;
  if (branchId) where.branchId = parseInt(branchId);
  if (saleType) where.saleType = saleType;

  if (date) {
    const start = new Date(date);
    const end = new Date(date);
    end.setDate(end.getDate() + 1);
    where.date = { gte: start, lt: end };
  }

  const sales = await prisma.sale.findMany({
    where,
    include: {
      product: { select: PRODUCT_SELECT },
      user: { select: { id: true, name: true, username: true } },
      branch: { select: { id: true, name: true } },
    },
    orderBy: { date: 'desc' },
  });
  return res.json(sales);
};

const createSale = async (req, res) => {
  const { date, productId, quantity, pricePerUnit, notes, saleType, branchId, sessionId } = req.body;

  if (!date || !productId || pricePerUnit == null) {
    return res.status(400).json({ message: 'date, productId, pricePerUnit are required' });
  }

  const qty = parseFloat(quantity) || 0;
  if (qty <= 0) return res.status(400).json({ message: 'quantity must be > 0' });

  const price = parseFloat(pricePerUnit);
  if (price < 0) return res.status(400).json({ message: 'Price per unit cannot be negative' });
  const totalRevenue = qty * price;

  const purchases = await prisma.purchase.findMany({
    where: { productId: parseInt(productId) },
    select: { costPerUnit: true },
  });

  const avgCostUnit = purchases.length > 0
    ? purchases.reduce((s, p) => s + p.costPerUnit, 0) / purchases.length
    : 0;

  const sale = await prisma.sale.create({
    data: {
      date: new Date(date),
      productId: parseInt(productId),
      userId: req.user.id,
      quantity: qty,
      pricePerUnit: price,
      totalRevenue,
      avgCostUnit,
      profit: (price - avgCostUnit) * qty,
      saleType: saleType || 'SHOP',
      branchId: branchId ? parseInt(branchId) : (req.user.branchId || null),
      sessionId: sessionId ? parseInt(sessionId) : null,
      notes: notes || null,
    },
    include: {
      product: { select: PRODUCT_SELECT },
      user: { select: { id: true, name: true, username: true } },
      branch: { select: { id: true, name: true } },
    },
  });
  return res.status(201).json(sale);
};

const updateSale = async (req, res) => {
  const { id } = req.params;
  const { date, productId, quantity, pricePerUnit, notes, saleType, branchId } = req.body;

  const qty = parseFloat(quantity) || 0;
  const price = parseFloat(pricePerUnit);
  if (qty < 0 || price < 0) return res.status(400).json({ message: 'Quantity and price cannot be negative' });

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
      totalRevenue: qty * price,
      avgCostUnit,
      profit: (price - avgCostUnit) * qty,
      saleType: saleType || 'SHOP',
      branchId: branchId ? parseInt(branchId) : undefined,
      notes: notes || null,
    },
    include: {
      product: { select: PRODUCT_SELECT },
      user: { select: { id: true, name: true, username: true } },
      branch: { select: { id: true, name: true } },
    },
  });
  return res.json(sale);
};

const deleteSale = async (req, res) => {
  await prisma.sale.delete({ where: { id: parseInt(req.params.id) } });
  return res.json({ message: 'Sale deleted' });
};

module.exports = { getSales, createSale, updateSale, deleteSale };
