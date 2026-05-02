const prisma = require('../../config/db');
const { Errors } = require('../../utils/errors');
const { audit } = require('../../utils/audit');

const submit = async ({ sessionId, returns }, userId) => {
  const session = await prisma.truckSession.findUnique({
    where: { id: sessionId },
    include: { dispatches: { include: { product: true } } },
  });
  if (!session) throw Errors.SESSION_NOT_FOUND();
  if (session.status === 'CLOSED') throw Errors.SESSION_LOCKED();
  if (session.status !== 'ACTIVE') throw Errors.SESSION_NOT_ACTIVE('Session is already submitted');

  const dispatchMap = Object.fromEntries(session.dispatches.map((d) => [d.productId, d]));
  const dispatchedIds = new Set(session.dispatches.map((d) => d.productId));
  const returnedIds   = new Set(returns.map((r) => r.productId));

  for (const id of dispatchedIds) {
    if (!returnedIds.has(id)) {
      const product = dispatchMap[id].product;
      throw Errors.VALIDATION_ERROR(`Missing return entry for product: ${product.name}`);
    }
  }

  for (const ret of returns) {
    const d = dispatchMap[ret.productId];
    if (!d) continue;
    const systemRemaining = d.dispatchQty - d.soldQty;
    if (ret.enteredReturnQty > systemRemaining) {
      throw Errors.RETURN_EXCEEDS_REMAINING({
        systemRemaining,
        entered:  ret.enteredReturnQty,
        product:  d.product.name,
      });
    }
  }

  const record = await prisma.$transaction(async (tx) => {
    const record = await tx.closingRecord.create({
      data: {
        sessionId,
        submittedBy: userId,
        status: 'PENDING',
        stockItems: {
          create: returns.map((ret) => {
            const d = dispatchMap[ret.productId];
            const systemRemaining = d.dispatchQty - d.soldQty;
            return {
              productId:        ret.productId,
              dispatchQty:      d.dispatchQty,
              soldQty:          d.soldQty,
              systemRemaining,
              enteredReturnQty: ret.enteredReturnQty,
              differenceQty:    systemRemaining - ret.enteredReturnQty,
            };
          }),
        },
      },
      include: { stockItems: { include: { product: true } } },
    });

    await tx.truckSession.update({ where: { id: sessionId }, data: { status: 'PENDING' } });
    return record;
  });

  return record;
};

const getPending = async (branchId) => {
  const where = { status: 'PENDING' };
  if (branchId) {
    where.session = { branchId: parseInt(branchId) };
  }

  return prisma.closingRecord.findMany({
    where,
    include: {
      session: {
        include: { branch: true, user: { select: { id: true, name: true } } },
      },
      submitter:  { select: { id: true, name: true } },
      stockItems: { include: { product: true } },
    },
    orderBy: { submittedAt: 'desc' },
  });
};

const getById = async (id, user) => {
  const record = await prisma.closingRecord.findUnique({
    where: { id: parseInt(id) },
    include: {
      session: { include: { branch: true, user: { select: { id: true, name: true } } } },
      submitter: { select: { id: true, name: true } },
      reviewer:  { select: { id: true, name: true } },
      stockItems: { include: { product: true } },
    },
  });
  if (!record) throw Errors.NOT_FOUND('ClosingRecord');

  if (user.role === 'SALESPERSON' && record.submittedBy !== user.id) {
    throw Errors.FORBIDDEN();
  }
  return record;
};

const approve = async (id, { adjustments }, userId) => {
  const record = await prisma.closingRecord.findUnique({
    where: { id: parseInt(id) },
    include: { stockItems: { include: { product: true } }, session: true },
  });
  if (!record) throw Errors.NOT_FOUND('ClosingRecord');

  const itemMap = Object.fromEntries(record.stockItems.map((i) => [i.productId, i]));

  for (const adj of adjustments) {
    const item = itemMap[adj.productId];
    if (!item) continue;

    if (adj.approvedReturnQty > item.systemRemaining) {
      throw Errors.APPROVED_EXCEEDS_REMAINING({
        systemRemaining: item.systemRemaining,
        product: item.product.name,
      });
    }
    if (adj.approvedReturnQty > item.dispatchQty) {
      throw Errors.APPROVED_EXCEEDS_DISPATCH({ product: item.product.name });
    }
    if (adj.approvedReturnQty !== item.enteredReturnQty && !adj.reason) {
      throw Errors.ADJUSTMENT_REASON_REQUIRED();
    }
  }

  const updated = await prisma.$transaction(async (tx) => {
    for (const adj of adjustments) {
      const item = itemMap[adj.productId];
      if (!item) continue;

      const before = { quantity: null };
      const stock  = await tx.branchStock.findUnique({
        where: { branchId_productId: { branchId: record.session.branchId, productId: adj.productId } },
      });
      if (stock) before.quantity = stock.quantity;

      await tx.closingStockItem.update({
        where: { id: item.id },
        data:  { approvedReturnQty: adj.approvedReturnQty },
      });

      await tx.branchStock.upsert({
        where: { branchId_productId: { branchId: record.session.branchId, productId: adj.productId } },
        update: { quantity: { increment: adj.approvedReturnQty } },
        create: { branchId: record.session.branchId, productId: adj.productId, quantity: adj.approvedReturnQty },
      });

      await audit({
        userId, action: 'APPROVE_RETURN', entity: 'BranchStock',
        entityId: `${record.session.branchId}-${adj.productId}`,
        before,
        after: { quantity: (before.quantity || 0) + adj.approvedReturnQty, reason: adj.reason },
        tx,
      });
    }

    const closingRecord = await tx.closingRecord.update({
      where: { id: parseInt(id) },
      data: { status: 'CLOSED', reviewedBy: userId, reviewedAt: new Date() },
      include: {
        stockItems: { include: { product: true } },
        reviewer:   { select: { id: true, name: true } },
      },
    });

    await tx.truckSession.update({
      where: { id: record.sessionId },
      data:  { status: 'CLOSED' },
    });

    return closingRecord;
  });

  return updated;
};

const getStatus = async (sessionId, userId) => {
  const session = await prisma.truckSession.findUnique({
    where: { id: parseInt(sessionId) },
    include: { closingRecord: { include: { reviewer: { select: { id: true, name: true } }, stockItems: { include: { product: true } } } } },
  });
  if (!session) throw Errors.SESSION_NOT_FOUND();
  if (session.userId !== userId) throw Errors.FORBIDDEN();
  return session;
};

module.exports = { submit, getPending, getById, approve, getStatus };
