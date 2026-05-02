const prisma = require('../config/db');

const getSessionReport = async (req, res) => {
  const { id } = req.params;

  const session = await prisma.truckSession.findUnique({
    where: { id: parseInt(id) },
    include: {
      truck: { select: { id: true, name: true, plateNo: true } },
      branch: { select: { id: true, name: true } },
      user: { select: { id: true, name: true } },
      sales: {
        include: {
          items: {
            include: { product: { select: { id: true, name: true, emoji: true } } },
          },
        },
      },
      closingStock: {
        include: { product: { select: { id: true, name: true, emoji: true } } },
      },
    },
  });

  if (!session) return res.status(404).json({ message: 'Session not found' });

  // Build per-product summary
  const productMap = {};
  for (const sale of session.sales) {
    for (const item of sale.items) {
      const pid = item.productId;
      if (!productMap[pid]) {
        productMap[pid] = { product: item.product, soldQty: 0, totalAmount: 0 };
      }
      productMap[pid].soldQty += item.quantity;
      productMap[pid].totalAmount += item.total;
    }
  }

  const totalSalesAmount = session.sales.reduce((s, sale) => s + sale.totalAmount, 0);

  // Enrich closing stock with opening (from closingStock record)
  const stockSummary = session.closingStock.map((cs) => ({
    product: cs.product,
    openingQty: cs.openingQty,
    soldQty: cs.soldQty,
    closingQty: cs.closingQty,
    totalAmount: productMap[cs.productId]?.totalAmount || 0,
  }));

  return res.json({
    session: {
      id: session.id,
      status: session.status,
      startTime: session.startTime,
      endTime: session.endTime,
      truck: session.truck,
      branch: session.branch,
      user: session.user,
    },
    summary: {
      totalSalesAmount,
      totalTransactions: session.sales.length,
      productSummary: Object.values(productMap),
    },
    stockSummary,
  });
};

const getBranchReport = async (req, res) => {
  const { branchId } = req.params;
  const { date } = req.query;

  const where = { branchId: parseInt(branchId) };

  if (date) {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setDate(end.getDate() + 1);
    where.startTime = { gte: start, lt: end };
  }

  const sessions = await prisma.truckSession.findMany({
    where,
    include: {
      truck: { select: { id: true, name: true } },
      user: { select: { id: true, name: true } },
      sales: { select: { totalAmount: true } },
    },
    orderBy: { startTime: 'desc' },
  });

  const truckSalesTotal = sessions.reduce(
    (sum, s) => sum + s.sales.reduce((ss, sale) => ss + sale.totalAmount, 0),
    0
  );

  // Shop sales (regular Sale records) filtered by date
  const shopWhere = {};
  if (date) {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setDate(end.getDate() + 1);
    shopWhere.date = { gte: start, lt: end };
  }

  const shopSales = await prisma.sale.aggregate({
    where: shopWhere,
    _sum: { totalRevenue: true },
    _count: true,
  });

  const shopSalesTotal = shopSales._sum.totalRevenue || 0;

  return res.json({
    branchId: parseInt(branchId),
    date: date || null,
    shopSales: shopSalesTotal,
    shopSalesCount: shopSales._count,
    truckSales: truckSalesTotal,
    truckSessionsCount: sessions.length,
    combinedSales: shopSalesTotal + truckSalesTotal,
    sessions: sessions.map((s) => ({
      id: s.id,
      truck: s.truck,
      user: s.user,
      status: s.status,
      startTime: s.startTime,
      endTime: s.endTime,
      totalAmount: s.sales.reduce((ss, sale) => ss + sale.totalAmount, 0),
    })),
  });
};

const getAllSessions = async (req, res) => {
  const { date, status } = req.query;
  const where = {};

  if (date) {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setDate(end.getDate() + 1);
    where.startTime = { gte: start, lt: end };
  }

  if (status) where.status = status;

  const sessions = await prisma.truckSession.findMany({
    where,
    include: {
      truck: { select: { id: true, name: true } },
      branch: { select: { id: true, name: true } },
      user: { select: { id: true, name: true } },
      sales: { select: { totalAmount: true } },
      _count: { select: { sales: true } },
    },
    orderBy: { startTime: 'desc' },
  });

  return res.json(
    sessions.map((s) => ({
      ...s,
      totalAmount: s.sales.reduce((sum, sale) => sum + sale.totalAmount, 0),
      sales: undefined,
    }))
  );
};

module.exports = { getSessionReport, getBranchReport, getAllSessions };
