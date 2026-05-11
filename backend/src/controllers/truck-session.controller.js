const prisma = require('../config/db');

const PRODUCT_SELECT = { id: true, name: true, emoji: true, imageUrl: true, sellingPrice: true, costPerUnit: true };

// Get sessions (admin sees all, others see own)
const getSessions = async (req, res) => {
  try {
    const { truckId, date, status } = req.query;
    const where = {};
    if (req.user.role === 'SALES') where.userId = req.user.id;
    if (truckId) where.truckId = parseInt(truckId);
    if (status) where.status = status;
    if (date) {
      const start = new Date(date);
      const end = new Date(date);
      end.setDate(end.getDate() + 1);
      where.date = { gte: start, lt: end };
    }

    const sessions = await prisma.truckSession.findMany({
      where,
      include: {
        truck: { select: { id: true, name: true, plateNumber: true } },
        user: { select: { id: true, name: true, username: true } },
        dispatches: { include: { product: { select: PRODUCT_SELECT } } },
        returns: { include: { product: { select: PRODUCT_SELECT } } },
        sales: { select: { id: true, productId: true, quantity: true, totalRevenue: true, profit: true } },
      },
      orderBy: { date: 'desc' },
    });

    const enriched = sessions.map((s) => {
      const dispatchMap = {};
      s.dispatches.forEach((d) => {
        dispatchMap[d.productId] = (dispatchMap[d.productId] || 0) + d.quantity;
      });
      const returnMap = {};
      s.returns.forEach((r) => {
        returnMap[r.productId] = (returnMap[r.productId] || 0) + r.quantity;
      });
      const soldMap = {};
      Object.keys(dispatchMap).forEach((pid) => {
        soldMap[pid] = dispatchMap[pid] - (returnMap[pid] || 0);
      });
      return {
        ...s,
        summary: {
          totalRevenue: s.sales.reduce((a, x) => a + x.totalRevenue, 0),
          totalProfit: s.sales.reduce((a, x) => a + x.profit, 0),
          soldMap,
        },
      };
    });

    return res.json(enriched);
  } catch (err) {
    console.error('getSessions error:', err);
    return res.status(500).json({ message: err.message || 'Failed to load sessions' });
  }
};

// Start a new session (morning dispatch)
const startSession = async (req, res) => {
  try {
    const { truckId, dispatches, notes } = req.body;
    if (!truckId || !dispatches?.length) {
      return res.status(400).json({ message: 'truckId and dispatches are required' });
    }
    if (dispatches.some(d => parseFloat(d.quantity) <= 0)) {
      return res.status(400).json({ message: 'Dispatch quantities must be greater than 0' });
    }

    // Check no open session for this truck today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const existing = await prisma.truckSession.findFirst({
      where: { truckId: parseInt(truckId), status: 'OPEN', date: { gte: today, lt: tomorrow } },
    });
    if (existing) {
      return res.status(409).json({ message: 'An open session already exists for this truck today', sessionId: existing.id });
    }

    // Sessions belong to the truck's assigned driver, not the manager who dispatches
    const truckDriver = await prisma.user.findFirst({
      where: { truckId: parseInt(truckId), isActive: true, saleType: 'TRUCK' },
    });
    if (!truckDriver) {
      return res.status(400).json({ message: 'No active truck driver assigned to this truck. Assign a driver first.' });
    }

    const session = await prisma.truckSession.create({
      data: {
        truckId: parseInt(truckId),
        userId: truckDriver.id,
        notes: notes || null,
        dispatches: {
          create: dispatches.map((d) => ({
            productId: parseInt(d.productId),
            quantity: parseFloat(d.quantity),
          })),
        },
      },
      include: {
        truck: { select: { id: true, name: true } },
        dispatches: { include: { product: { select: PRODUCT_SELECT } } },
      },
    });
    return res.status(201).json(session);
  } catch (err) {
    console.error('startSession error:', err);
    return res.status(500).json({ message: err.message || 'Failed to start session' });
  }
};

// Close session (evening return)
const closeSession = async (req, res) => {
  try {
    const { id } = req.params;
    const { returns, notes } = req.body;

    const session = await prisma.truckSession.findUnique({ where: { id: parseInt(id) } });
    if (!session) return res.status(404).json({ message: 'Session not found' });
    if (session.status === 'CLOSED') return res.status(409).json({ message: 'Session already closed' });
    if ((returns || []).some(r => parseFloat(r.quantity) < 0)) {
      return res.status(400).json({ message: 'Return quantities cannot be negative' });
    }

    const updated = await prisma.truckSession.update({
      where: { id: parseInt(id) },
      data: {
        status: 'CLOSED',
        notes: notes || session.notes,
        returns: {
          create: (returns || []).map((r) => ({
            productId: parseInt(r.productId),
            quantity: parseFloat(r.quantity),
          })),
        },
      },
      include: {
        truck: { select: { id: true, name: true } },
        dispatches: { include: { product: { select: PRODUCT_SELECT } } },
        returns: { include: { product: { select: PRODUCT_SELECT } } },
        sales: { select: { id: true, quantity: true, totalRevenue: true, profit: true } },
      },
    });
    return res.json(updated);
  } catch (err) {
    console.error('closeSession error:', err);
    return res.status(500).json({ message: err.message || 'Failed to close session' });
  }
};

// Get open session for the logged-in truck user (queries by truckId, not userId)
const getMyOpenSession = async (req, res) => {
  try {
    if (!req.user.truckId) return res.json(null);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const session = await prisma.truckSession.findFirst({
      where: { truckId: req.user.truckId, status: 'OPEN', date: { gte: today, lt: tomorrow } },
      include: {
        truck: { select: { id: true, name: true } },
        dispatches: { include: { product: { select: PRODUCT_SELECT } } },
        returns: { include: { product: { select: PRODUCT_SELECT } } },
        sales: { select: { id: true, productId: true, quantity: true, totalRevenue: true, profit: true } },
      },
    });
    if (!session) return res.json(null);

    const soldMap = {};
    session.sales.forEach((s) => {
      soldMap[s.productId] = (soldMap[s.productId] || 0) + s.quantity;
    });

    const totalRevenue = session.sales.reduce((a, x) => a + x.totalRevenue, 0);
    const totalProfit  = session.sales.reduce((a, x) => a + x.profit, 0);
    return res.json({ ...session, summary: { totalRevenue, totalProfit, soldMap } });
  } catch (err) {
    console.error('getMyOpenSession error:', err);
    return res.status(500).json({ message: err.message || 'Failed to load session' });
  }
};

// Record a sale against an open session
const recordSale = async (req, res) => {
  try {
    const sessionId = parseInt(req.params.id);
    const { productId, quantity, pricePerUnit, notes } = req.body;

    const session = await prisma.truckSession.findUnique({ where: { id: sessionId } });
    if (!session) return res.status(404).json({ message: 'Session not found' });
    if (session.status === 'CLOSED') return res.status(409).json({ message: 'Session already closed' });
    if (req.user.role === 'SALES' && req.user.truckId && session.truckId !== req.user.truckId) {
      return res.status(403).json({ message: 'This session does not belong to your truck' });
    }

    const qty = parseFloat(quantity) || 0;
    if (qty <= 0) return res.status(400).json({ message: 'quantity must be > 0' });

    const price = parseFloat(pricePerUnit);
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
        date: new Date(),
        productId: parseInt(productId),
        userId: req.user.id,
        quantity: qty,
        pricePerUnit: price,
        totalRevenue,
        avgCostUnit,
        profit: totalRevenue - qty * avgCostUnit,
        saleType: 'TRUCK',
        branchId: req.user.branchId || null,
        sessionId,
        notes: notes || null,
      },
      include: { product: { select: PRODUCT_SELECT } },
    });
    return res.status(201).json(sale);
  } catch (err) {
    console.error('recordSale error:', err);
    return res.status(500).json({ message: err.message || 'Failed to record sale' });
  }
};

module.exports = { getSessions, startSession, closeSession, getMyOpenSession, recordSale };
