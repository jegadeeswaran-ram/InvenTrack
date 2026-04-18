const prisma = require('../config/db');

const getPurchases = async (req, res) => {
  const { date } = req.query;
  let where = {};

  if (date) {
    const start = new Date(date);
    const end = new Date(date);
    end.setDate(end.getDate() + 1);
    where.date = { gte: start, lt: end };
  }

  const purchases = await prisma.purchase.findMany({
    where,
    include: { product: { select: { id: true, name: true, emoji: true, imageUrl: true } } },
    orderBy: { date: 'desc' },
  });
  return res.json(purchases);
};

const createPurchase = async (req, res) => {
  const { date, productId, manufacturer, quantity, costPerUnit, notes } = req.body;

  if (!date || !productId || !manufacturer || quantity == null || costPerUnit == null) {
    return res.status(400).json({ message: 'date, productId, manufacturer, quantity, costPerUnit are required' });
  }

  const totalCost = parseFloat(quantity) * parseFloat(costPerUnit);

  const purchase = await prisma.purchase.create({
    data: {
      date: new Date(date),
      productId: parseInt(productId),
      manufacturer,
      quantity: parseFloat(quantity),
      costPerUnit: parseFloat(costPerUnit),
      totalCost,
      notes: notes || null,
    },
    include: { product: { select: { id: true, name: true, emoji: true, imageUrl: true } } },
  });
  return res.status(201).json(purchase);
};

const updatePurchase = async (req, res) => {
  const { id } = req.params;
  const { date, productId, manufacturer, quantity, costPerUnit, notes } = req.body;
  const qty = parseFloat(quantity);
  const cost = parseFloat(costPerUnit);
  const purchase = await prisma.purchase.update({
    where: { id: parseInt(id) },
    data: {
      date: new Date(date),
      productId: parseInt(productId),
      manufacturer,
      quantity: qty,
      costPerUnit: cost,
      totalCost: qty * cost,
      notes: notes || null,
    },
    include: { product: { select: { id: true, name: true, emoji: true, imageUrl: true } } },
  });
  return res.json(purchase);
};

const deletePurchase = async (req, res) => {
  const { id } = req.params;
  await prisma.purchase.delete({ where: { id: parseInt(id) } });
  return res.json({ message: 'Purchase deleted' });
};

module.exports = { getPurchases, createPurchase, updatePurchase, deletePurchase };
