const prisma = require('../../config/db');
const { Errors } = require('../../utils/errors');

const truckSale = async ({ sessionId, items }, userId) => {
  const session = await prisma.truckSession.findUnique({ where: { id: sessionId } });
  if (!session) throw Errors.SESSION_NOT_FOUND();
  if (session.status === 'CLOSED') throw Errors.SESSION_LOCKED();
  if (session.status !== 'ACTIVE') throw Errors.SESSION_NOT_ACTIVE();

  const productIds = items.map((i) => i.productId);
  const dispatches = await prisma.truckDispatch.findMany({
    where: { sessionId, productId: { in: productIds } },
    include: { product: true },
  });
  const dispatchMap = Object.fromEntries(dispatches.map((d) => [d.productId, d]));

  for (const item of items) {
    const d = dispatchMap[item.productId];
    if (!d) throw Errors.NOT_FOUND(`Product ${item.productId} in dispatch`);
    const available = d.dispatchQty - d.soldQty;
    if (item.quantity > available) {
      throw Errors.EXCEEDS_AVAILABLE_STOCK({
        available,
        requested: item.quantity,
        product:   d.product.name,
      });
    }
  }

  const totalAmount = items.reduce((sum, item) => {
    const dispatch = dispatchMap[item.productId];
    return sum + item.quantity * Number(dispatch.product.price);
  }, 0);

  const sale = await prisma.$transaction(async (tx) => {
    const sale = await tx.sale.create({
      data: {
        sessionId,
        branchId:    session.branchId,
        userId,
        saleType:    'TRUCK',
        totalAmount,
        saleItems: {
          create: items.map((item) => ({
            productId:  item.productId,
            quantity:   item.quantity,
            unitPrice:  dispatchMap[item.productId].product.price,
            totalPrice: item.quantity * Number(dispatchMap[item.productId].product.price),
          })),
        },
      },
      include: { saleItems: { include: { product: true } } },
    });

    for (const item of items) {
      await tx.truckDispatch.update({
        where: { sessionId_productId: { sessionId, productId: item.productId } },
        data:  { soldQty: { increment: item.quantity } },
      });
    }

    return sale;
  });

  const updatedDispatches = await prisma.truckDispatch.findMany({
    where: { sessionId, productId: { in: productIds } },
  });

  return {
    sale,
    updatedStock: updatedDispatches.map((d) => ({
      productId:    d.productId,
      dispatchQty:  d.dispatchQty,
      soldQty:      d.soldQty,
      availableQty: d.dispatchQty - d.soldQty,
    })),
  };
};

const shopSale = async ({ branchId, items }, userId) => {
  const productIds = items.map((i) => i.productId);
  const stocks = await prisma.branchStock.findMany({
    where: { branchId, productId: { in: productIds } },
    include: { product: true },
  });
  const stockMap = Object.fromEntries(stocks.map((s) => [s.productId, s]));

  for (const item of items) {
    const s = stockMap[item.productId];
    if (!s) throw Errors.NOT_FOUND(`Product ${item.productId} in branch stock`);
    if (item.quantity > s.quantity) {
      throw Errors.INSUFFICIENT_BRANCH_STOCK({
        available: s.quantity,
        requested: item.quantity,
        product:   s.product.name,
      });
    }
  }

  const totalAmount = items.reduce((sum, item) => {
    const unitPrice = item.unitPrice ?? Number(stockMap[item.productId].product.price);
    return sum + item.quantity * unitPrice;
  }, 0);

  const sale = await prisma.$transaction(async (tx) => {
    const sale = await tx.sale.create({
      data: {
        branchId,
        userId,
        saleType:    'SHOP',
        totalAmount,
        saleItems: {
          create: items.map((item) => {
            const unitPrice = item.unitPrice ?? Number(stockMap[item.productId].product.price);
            return {
              productId:  item.productId,
              quantity:   item.quantity,
              unitPrice,
              totalPrice: item.quantity * unitPrice,
            };
          }),
        },
      },
      include: { saleItems: { include: { product: true } } },
    });

    for (const item of items) {
      await tx.branchStock.update({
        where: { branchId_productId: { branchId, productId: item.productId } },
        data:  { quantity: { decrement: item.quantity } },
      });
    }

    return sale;
  });

  return sale;
};

const getLiveStock = async (sessionId) => {
  const dispatches = await prisma.truckDispatch.findMany({
    where: { sessionId: parseInt(sessionId) },
    include: { product: true },
  });

  return dispatches.map((d) => ({
    productId:    d.productId,
    name:         d.product.name,
    imageUrl:     d.product.imageUrl,
    price:        d.product.price,
    dispatchQty:  d.dispatchQty,
    soldQty:      d.soldQty,
    availableQty: d.dispatchQty - d.soldQty,
  }));
};

const getHistory = async (query) => {
  const { branchId, userId, saleType, dateFrom, dateTo, page = 1, limit = 20 } = query;
  const where = {};
  if (branchId) where.branchId = parseInt(branchId);
  if (userId)   where.userId   = parseInt(userId);
  if (saleType) where.saleType = saleType;
  if (dateFrom || dateTo) {
    where.saleDate = {};
    if (dateFrom) where.saleDate.gte = new Date(dateFrom);
    if (dateTo)   where.saleDate.lte = new Date(dateTo);
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [total, sales] = await Promise.all([
    prisma.sale.count({ where }),
    prisma.sale.findMany({
      where,
      skip,
      take: parseInt(limit),
      include: {
        saleItems: { include: { product: true } },
        user:   { select: { id: true, name: true } },
        branch: { select: { id: true, name: true } },
      },
      orderBy: { saleDate: 'desc' },
    }),
  ]);

  return { data: sales, total, page: parseInt(page), limit: parseInt(limit) };
};

module.exports = { truckSale, shopSale, getLiveStock, getHistory };
