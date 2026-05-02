const prisma = require('../config/db');

const SESSION_INCLUDE = {
  truck: { select: { id: true, name: true, plateNo: true } },
  branch: { select: { id: true, name: true } },
  user: { select: { id: true, name: true } },
};

const startDay = async (req, res) => {
  const { truckId, branchId } = req.body;
  const userId = req.user.id;

  if (!truckId || !branchId) {
    return res.status(400).json({ message: 'truckId and branchId are required' });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const existing = await prisma.truckSession.findFirst({
    where: { userId, startTime: { gte: today, lt: tomorrow } },
    include: SESSION_INCLUDE,
  });

  if (existing) {
    if (existing.status === 'OPEN') {
      return res.json({ session: existing, alreadyOpen: true });
    }
    return res.status(400).json({ message: 'A session already exists for today' });
  }

  const session = await prisma.truckSession.create({
    data: {
      userId,
      truckId: parseInt(truckId),
      branchId: parseInt(branchId),
    },
    include: SESSION_INCLUDE,
  });

  return res.status(201).json({ session });
};

const getTodaySession = async (req, res) => {
  const userId = req.user.id;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const session = await prisma.truckSession.findFirst({
    where: { userId, startTime: { gte: today, lt: tomorrow } },
    include: SESSION_INCLUDE,
  });

  return res.json({ session: session || null });
};

const getSessionById = async (req, res) => {
  const { id } = req.params;
  const session = await prisma.truckSession.findUnique({
    where: { id: parseInt(id) },
    include: {
      ...SESSION_INCLUDE,
      sales: {
        include: {
          items: {
            include: { product: { select: { id: true, name: true, emoji: true } } },
          },
        },
        orderBy: { timestamp: 'desc' },
      },
      closingStock: {
        include: { product: { select: { id: true, name: true, emoji: true } } },
      },
    },
  });
  if (!session) return res.status(404).json({ message: 'Session not found' });
  return res.json(session);
};

const closeDay = async (req, res) => {
  const { id } = req.params;
  const { closingStocks } = req.body;
  // closingStocks: [{ productId, closingQty }]

  if (!closingStocks || !Array.isArray(closingStocks) || closingStocks.length === 0) {
    return res.status(400).json({ message: 'closingStocks array is required' });
  }

  const sessionId = parseInt(id);
  const session = await prisma.truckSession.findUnique({
    where: { id: sessionId },
    include: { sales: { include: { items: true } } },
  });

  if (!session) return res.status(404).json({ message: 'Session not found' });
  if (session.status === 'CLOSED') return res.status(400).json({ message: 'Session already closed' });

  const isOwner = session.userId === req.user.id;
  const isPrivileged = req.user.role === 'ADMIN' || req.user.role === 'BRANCH_MANAGER';
  if (!isOwner && !isPrivileged) {
    return res.status(403).json({ message: 'Not authorized to close this session' });
  }

  // Aggregate sold qty per product across all sales
  const soldMap = {};
  for (const sale of session.sales) {
    for (const item of sale.items) {
      soldMap[item.productId] = (soldMap[item.productId] || 0) + item.quantity;
    }
  }

  const closingData = closingStocks.map(({ productId, closingQty }) => {
    const pid = parseInt(productId);
    const soldQty = soldMap[pid] || 0;
    const closing = parseFloat(closingQty);
    return {
      sessionId,
      productId: pid,
      soldQty,
      closingQty: closing,
      openingQty: soldQty + closing,
    };
  });

  const result = await prisma.$transaction(async (tx) => {
    await tx.closingStock.deleteMany({ where: { sessionId } });
    await tx.closingStock.createMany({ data: closingData });

    return tx.truckSession.update({
      where: { id: sessionId },
      data: { status: 'CLOSED', endTime: new Date() },
      include: {
        ...SESSION_INCLUDE,
        closingStock: {
          include: { product: { select: { id: true, name: true, emoji: true } } },
        },
      },
    });
  });

  return res.json(result);
};

const listSessions = async (req, res) => {
  const { branchId, date, userId: queryUserId } = req.query;
  const where = {};

  if (req.user.role === 'TRUCK_SALES') {
    where.userId = req.user.id;
  } else if (queryUserId) {
    where.userId = parseInt(queryUserId);
  }

  if (branchId) where.branchId = parseInt(branchId);

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
      ...SESSION_INCLUDE,
      _count: { select: { sales: true } },
    },
    orderBy: { startTime: 'desc' },
  });

  return res.json(sessions);
};

module.exports = { startDay, getTodaySession, getSessionById, closeDay, listSessions };
