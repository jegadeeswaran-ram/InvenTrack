const prisma = require('../../config/db');
const { Errors } = require('../../utils/errors');
const { audit } = require('../../utils/audit');

const create = async ({ branchId, truckId, userId, sessionDate, items }, actorId) => {
  const date = new Date(sessionDate);
  const dateStart = new Date(date); dateStart.setHours(0, 0, 0, 0);
  const dateEnd   = new Date(date); dateEnd.setHours(23, 59, 59, 999);

  const existing = await prisma.truckSession.findFirst({
    where: {
      branchId,
      truckId,
      sessionDate: { gte: dateStart, lte: dateEnd },
      status: { in: ['ACTIVE', 'PENDING'] },
    },
  });
  if (existing) throw Errors.DUPLICATE_SESSION({ truckId, date: sessionDate });

  const productIds = items.map((i) => i.productId);
  const stocks = await prisma.branchStock.findMany({
    where: { branchId, productId: { in: productIds } },
    include: { product: true },
  });

  const stockMap = Object.fromEntries(stocks.map((s) => [s.productId, s]));

  for (const item of items) {
    const stock = stockMap[item.productId];
    if (!stock) throw Errors.NOT_FOUND(`Product ${item.productId} in branch stock`);
    if (item.dispatchQty > stock.quantity) {
      throw Errors.INSUFFICIENT_STOCK({
        available: stock.quantity,
        requested: item.dispatchQty,
        product:   stock.product.name,
      });
    }
  }

  const session = await prisma.$transaction(async (tx) => {
    const session = await tx.truckSession.create({
      data: { branchId, truckId, userId, sessionDate: date, status: 'ACTIVE' },
    });

    await tx.truckDispatch.createMany({
      data: items.map((i) => ({
        sessionId:   session.id,
        productId:   i.productId,
        dispatchQty: i.dispatchQty,
      })),
    });

    for (const item of items) {
      await tx.branchStock.update({
        where: { branchId_productId: { branchId, productId: item.productId } },
        data: { quantity: { decrement: item.dispatchQty } },
      });
    }

    await audit({
      userId: actorId, action: 'CREATE', entity: 'TruckSession',
      entityId: session.id, after: { session, items }, tx,
    });

    return session;
  });

  return getSession(session.id);
};

const getToday = async (branchId) => {
  const today = new Date();
  const start = new Date(today); start.setHours(0, 0, 0, 0);
  const end   = new Date(today); end.setHours(23, 59, 59, 999);

  return prisma.truckSession.findMany({
    where: { branchId: parseInt(branchId), sessionDate: { gte: start, lte: end } },
    include: {
      user: { select: { id: true, name: true } },
      dispatches: { include: { product: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
};

const getSession = async (sessionId) => {
  const session = await prisma.truckSession.findUnique({
    where: { id: parseInt(sessionId) },
    include: {
      branch: true,
      user:   { select: { id: true, name: true } },
      dispatches: {
        include: { product: true },
      },
    },
  });
  if (!session) throw Errors.SESSION_NOT_FOUND();

  return {
    ...session,
    dispatches: session.dispatches.map((d) => ({
      ...d,
      availableQty: d.dispatchQty - d.soldQty,
    })),
  };
};

const getMySession = async (userId) => {
  const today = new Date();
  const start = new Date(today); start.setHours(0, 0, 0, 0);
  const end   = new Date(today); end.setHours(23, 59, 59, 999);

  const session = await prisma.truckSession.findFirst({
    where: {
      userId,
      sessionDate: { gte: start, lte: end },
      status: 'ACTIVE',
    },
    include: {
      branch: true,
      dispatches: { include: { product: true } },
    },
  });

  if (!session) return null;

  return {
    ...session,
    dispatches: session.dispatches.map((d) => ({
      ...d,
      availableQty: d.dispatchQty - d.soldQty,
    })),
  };
};

module.exports = { create, getToday, getSession, getMySession };
