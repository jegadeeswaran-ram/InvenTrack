const prisma = require('../config/db');

const PRODUCT_SELECT = { id: true, name: true, emoji: true, imageUrl: true, costPerUnit: true, piecesPerPacket: true };

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
    include: { product: { select: PRODUCT_SELECT } },
    orderBy: { date: 'desc' },
  });
  return res.json(purchases);
};

const createPurchase = async (req, res) => {
  const { date, productId, manufacturer, quantity, packets, costPerUnit, notes } = req.body;

  if (!date || !productId) {
    return res.status(400).json({ message: 'date and productId are required' });
  }

  const product = await prisma.product.findUnique({ where: { id: parseInt(productId) }, select: { piecesPerPacket: true, costPerUnit: true } });

  // Resolve pieces: either direct quantity or packets × piecesPerPacket
  let pieces = parseFloat(quantity) || 0;
  if (packets != null && parseFloat(packets) > 0) {
    pieces = parseFloat(packets) * (product?.piecesPerPacket ?? 1);
  }

  // Fall back to product's default cost if not provided
  const resolvedCost = costPerUnit != null ? parseFloat(costPerUnit) : (product?.costPerUnit ?? 0);

  if (pieces <= 0) return res.status(400).json({ message: 'quantity or packets is required and must be > 0' });

  const totalCost = pieces * resolvedCost;

  const purchase = await prisma.purchase.create({
    data: {
      date: new Date(date),
      productId: parseInt(productId),
      manufacturer: manufacturer || '',
      quantity: pieces,
      costPerUnit: resolvedCost,
      totalCost,
      notes: notes || null,
    },
    include: { product: { select: PRODUCT_SELECT } },
  });
  return res.status(201).json(purchase);
};

const updatePurchase = async (req, res) => {
  const { id } = req.params;
  const { date, productId, manufacturer, quantity, packets, costPerUnit, notes } = req.body;

  let pieces = parseFloat(quantity) || 0;
  let productData = null;
  if (packets != null && parseFloat(packets) > 0) {
    productData = await prisma.product.findUnique({ where: { id: parseInt(productId) }, select: { piecesPerPacket: true, costPerUnit: true } });
    pieces = parseFloat(packets) * (productData?.piecesPerPacket ?? 1);
  } else {
    productData = await prisma.product.findUnique({ where: { id: parseInt(productId) }, select: { costPerUnit: true } });
  }

  const cost = costPerUnit != null ? parseFloat(costPerUnit) : (productData?.costPerUnit ?? 0);
  const purchase = await prisma.purchase.update({
    where: { id: parseInt(id) },
    data: {
      date: new Date(date),
      productId: parseInt(productId),
      manufacturer: manufacturer || '',
      quantity: pieces,
      costPerUnit: cost,
      totalCost: pieces * cost,
      notes: notes || null,
    },
    include: { product: { select: PRODUCT_SELECT } },
  });
  return res.json(purchase);
};

const deletePurchase = async (req, res) => {
  const { id } = req.params;
  await prisma.purchase.delete({ where: { id: parseInt(id) } });
  return res.json({ message: 'Purchase deleted' });
};

module.exports = { getPurchases, createPurchase, updatePurchase, deletePurchase };
