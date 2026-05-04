const prisma = require('../../config/db');
const { Errors } = require('../../utils/errors');
const { audit } = require('../../utils/audit');

const stockStatus = (qty, minAlert) => {
  if (qty === 0) return 'OUT';
  if (qty < minAlert) return 'LOW';
  return 'OK';
};

const getByBranch = async (branchId) => {
  const stocks = await prisma.branchStock.findMany({
    where: { branchId: parseInt(branchId) },
    include: { product: true },
    orderBy: { product: { name: 'asc' } },
  });

  return stocks.map((s) => ({
    productId:    s.productId,
    product:      s.product,
    quantity:     s.quantity,
    minAlert:     s.product.minStockAlert,
    status:       stockStatus(s.quantity, s.product.minStockAlert),
    updatedAt:    s.updatedAt,
  }));
};

const adjust = async ({ branchId, productId, adjustment, reason }, userId) => {
  const stock = await prisma.branchStock.findUnique({
    where: { branchId_productId: { branchId, productId } },
    include: { product: true },
  });

  if (!stock) throw Errors.NOT_FOUND('BranchStock');

  const newQty = stock.quantity + adjustment;
  if (newQty < 0) {
    throw Errors.INSUFFICIENT_BRANCH_STOCK({
      available: stock.quantity,
      requested: Math.abs(adjustment),
      product: stock.product.name,
    });
  }

  const updated = await prisma.$transaction(async (tx) => {
    const updated = await tx.branchStock.update({
      where: { branchId_productId: { branchId, productId } },
      data: { quantity: newQty },
    });
    await audit({
      userId, action: 'ADJUST', entity: 'BranchStock',
      entityId: `${branchId}-${productId}`,
      before: { quantity: stock.quantity },
      after: { quantity: newQty, reason },
      tx,
    });
    return updated;
  });

  return updated;
};

const getTruckStock = async (sessionId) => {
  const dispatches = await prisma.truckDispatch.findMany({
    where: { sessionId: parseInt(sessionId) },
    include: { product: true },
  });

  return dispatches.map((d) => ({
    productId:    d.productId,
    product:      d.product,
    dispatchQty:  d.dispatchQty,
    soldQty:      d.soldQty,
    availableQty: d.dispatchQty - d.soldQty,
  }));
};

module.exports = { getByBranch, adjust, getTruckStock };
