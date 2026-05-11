const prisma = require('../config/db');

const PRODUCT_SELECT = { id: true, name: true, emoji: true, sellingPrice: true };

const getOrders = async (req, res) => {
  const { branchId, status } = req.query;
  const where = {};
  if (branchId) where.branchId = parseInt(branchId);
  if (status) where.status = status;
  if (req.user.role === 'BRANCH_MANAGER' && req.user.branchId) {
    where.branchId = req.user.branchId;
  }

  const orders = await prisma.bulkOrder.findMany({
    where,
    include: {
      branch: { select: { id: true, name: true } },
      customer: { select: { id: true, name: true, phone: true, email: true, address: true, city: true, gstin: true } },
      items: { include: { product: { select: PRODUCT_SELECT } } },
      payments: true,
    },
    orderBy: { createdAt: 'desc' },
  });
  return res.json(orders);
};

const getOrder = async (req, res) => {
  const order = await prisma.bulkOrder.findUnique({
    where: { id: parseInt(req.params.id) },
    include: {
      branch: { select: { id: true, name: true } },
      customer: { select: { id: true, name: true, phone: true, email: true, address: true, city: true, gstin: true } },
      items: { include: { product: { select: PRODUCT_SELECT } } },
      payments: { orderBy: { paidAt: 'asc' } },
    },
  });
  if (!order) return res.status(404).json({ message: 'Order not found' });
  return res.json(order);
};

const createOrder = async (req, res) => {
  const { customerName, customerPhone, customerEmail, customerId, eventDate, branchId, discount, notes, items } = req.body;
  if (!customerName || !branchId || !items?.length) {
    return res.status(400).json({ message: 'customerName, branchId, items are required' });
  }

  // Generate order number: BO-YYYYMMDD-XXXX
  const count = await prisma.bulkOrder.count();
  const orderNumber = `BO-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(count + 1).padStart(4, '0')}`;

  const disc = parseFloat(discount) || 0;
  if (disc < 0 || disc > 100) return res.status(400).json({ message: 'Discount must be between 0 and 100' });
  const invalidItem = items.find(i => parseFloat(i.quantity) <= 0 || parseFloat(i.pricePerUnit) < 0);
  if (invalidItem) return res.status(400).json({ message: 'Item quantity must be > 0 and price cannot be negative' });
  const itemsWithTotals = items.map((item) => ({
    productId: parseInt(item.productId),
    quantity: parseFloat(item.quantity),
    pricePerUnit: parseFloat(item.pricePerUnit),
    totalPrice: parseFloat(item.quantity) * parseFloat(item.pricePerUnit),
  }));

  const subtotal = itemsWithTotals.reduce((s, i) => s + i.totalPrice, 0);
  const totalAmount = subtotal * (1 - disc / 100);

  const order = await prisma.bulkOrder.create({
    data: {
      orderNumber,
      customerName,
      customerPhone: customerPhone || null,
      customerEmail: customerEmail || null,
      customerId: customerId ? parseInt(customerId) : null,
      eventDate: eventDate ? new Date(eventDate) : null,
      branchId: parseInt(branchId),
      discount: disc,
      notes: notes || null,
      totalAmount,
      items: { create: itemsWithTotals },
    },
    include: {
      branch: { select: { id: true, name: true } },
      customer: { select: { id: true, name: true, phone: true, email: true, address: true, city: true, gstin: true } },
      items: { include: { product: { select: PRODUCT_SELECT } } },
      payments: true,
    },
  });
  return res.status(201).json(order);
};

const updateOrder = async (req, res) => {
  const { status, customerName, customerPhone, customerEmail, customerId, eventDate, discount, notes } = req.body;
  const order = await prisma.bulkOrder.update({
    where: { id: parseInt(req.params.id) },
    data: {
      ...(status !== undefined && { status }),
      ...(customerName !== undefined && { customerName }),
      ...(customerPhone !== undefined && { customerPhone }),
      ...(customerEmail !== undefined && { customerEmail }),
      ...(customerId !== undefined && { customerId: customerId ? parseInt(customerId) : null }),
      ...(eventDate !== undefined && { eventDate: eventDate ? new Date(eventDate) : null }),
      ...(discount != null && { discount: parseFloat(discount) }),
      ...(notes !== undefined && { notes }),
    },
    include: {
      branch: { select: { id: true, name: true } },
      customer: { select: { id: true, name: true, phone: true, email: true, address: true, city: true, gstin: true } },
      items: { include: { product: { select: PRODUCT_SELECT } } },
      payments: true,
    },
  });
  return res.json(order);
};

const addPayment = async (req, res) => {
  const { amount, type, notes } = req.body;
  if (!amount || !type) return res.status(400).json({ message: 'amount and type are required' });
  if (parseFloat(amount) <= 0) return res.status(400).json({ message: 'Payment amount must be greater than 0' });

  const orderId = parseInt(req.params.id);
  const payment = await prisma.payment.create({
    data: { orderId, amount: parseFloat(amount), type, notes: notes || null },
  });

  // Update paidAmount
  const allPayments = await prisma.payment.findMany({ where: { orderId } });
  const paidAmount = allPayments.reduce((s, p) => s + p.amount, 0);
  const order = await prisma.bulkOrder.findUnique({ where: { id: orderId } });

  let newStatus = order.status;
  if (paidAmount >= order.totalAmount && order.status !== 'PAID') newStatus = 'PAID';

  await prisma.bulkOrder.update({
    where: { id: orderId },
    data: { paidAmount, status: newStatus },
  });

  return res.status(201).json(payment);
};

const deleteOrder = async (req, res) => {
  await prisma.bulkOrder.update({
    where: { id: parseInt(req.params.id) },
    data: { status: 'CANCELLED' },
  });
  return res.json({ message: 'Order cancelled' });
};

module.exports = { getOrders, getOrder, createOrder, updateOrder, addPayment, deleteOrder };
