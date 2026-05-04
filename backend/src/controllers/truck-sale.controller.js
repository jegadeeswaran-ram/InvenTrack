const prisma = require('../config/db');

const getSales = async (req, res) => {
  const { sessionId } = req.params;
  const sales = await prisma.truckSale.findMany({
    where: { sessionId: parseInt(sessionId) },
    include: {
      items: {
        include: {
          product: { select: { id: true, name: true, emoji: true, sellingPrice: true } },
        },
      },
    },
    orderBy: { timestamp: 'desc' },
  });
  return res.json(sales);
};

const createSale = async (req, res) => {
  const { sessionId, items } = req.body;
  // items: [{ productId, quantity, price }]

  if (!sessionId || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: 'sessionId and items[] are required' });
  }

  const session = await prisma.truckSession.findUnique({ where: { id: parseInt(sessionId) } });
  if (!session) return res.status(404).json({ message: 'Session not found' });
  if (session.status === 'CLOSED') return res.status(400).json({ message: 'Session is closed — cannot add sales' });
  if (session.userId !== req.user.id) return res.status(403).json({ message: 'Not your session' });

  const totalAmount = items.reduce(
    (sum, item) => sum + parseFloat(item.price) * parseFloat(item.quantity),
    0
  );

  const sale = await prisma.truckSale.create({
    data: {
      sessionId: parseInt(sessionId),
      totalAmount,
      items: {
        create: items.map((item) => ({
          productId: parseInt(item.productId),
          quantity: parseFloat(item.quantity),
          price: parseFloat(item.price),
          total: parseFloat(item.price) * parseFloat(item.quantity),
        })),
      },
    },
    include: {
      items: {
        include: { product: { select: { id: true, name: true, emoji: true } } },
      },
    },
  });

  return res.status(201).json(sale);
};

const deleteSale = async (req, res) => {
  const { id } = req.params;
  const sale = await prisma.truckSale.findUnique({
    where: { id: parseInt(id) },
    include: { session: true },
  });
  if (!sale) return res.status(404).json({ message: 'Sale not found' });
  if (sale.session.status === 'CLOSED') {
    return res.status(400).json({ message: 'Cannot delete sale from a closed session' });
  }
  if (sale.session.userId !== req.user.id && req.user.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Not authorized' });
  }

  await prisma.truckSale.delete({ where: { id: parseInt(id) } });
  return res.json({ message: 'Sale deleted' });
};

module.exports = { getSales, createSale, deleteSale };
