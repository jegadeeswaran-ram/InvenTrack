const prisma = require('../../config/db');

const dateFilter = (dateFrom, dateTo) => {
  const f = {};
  if (dateFrom) f.gte = new Date(dateFrom);
  if (dateTo)   f.lte = new Date(dateTo);
  return Object.keys(f).length ? f : undefined;
};

const truckSales = async ({ branchId, dateFrom, dateTo }) => {
  const where = { status: { in: ['PENDING', 'CLOSED'] } };
  if (branchId) where.branchId = parseInt(branchId);
  const df = dateFilter(dateFrom, dateTo);
  if (df) where.sessionDate = df;

  const sessions = await prisma.truckSession.findMany({
    where,
    include: {
      branch:    { select: { name: true } },
      user:      { select: { name: true } },
      dispatches:{ include: { product: true } },
      sales:     { include: { saleItems: true } },
    },
    orderBy: { sessionDate: 'desc' },
  });

  return sessions.map((s) => {
    const loadedQty  = s.dispatches.reduce((a, d) => a + d.dispatchQty, 0);
    const soldQty    = s.dispatches.reduce((a, d) => a + d.soldQty, 0);
    const returnQty  = s.dispatches.reduce((a, d) => a + d.returnQty, 0);
    const totalAmount= s.sales.reduce((a, sale) => a + Number(sale.totalAmount), 0);
    return {
      sessionId:   s.id,
      branch:      s.branch.name,
      truckId:     s.truckId,
      salesperson: s.user.name,
      date:        s.sessionDate,
      status:      s.status,
      loadedQty,
      soldQty,
      returnQty,
      differenceQty: loadedQty - soldQty - returnQty,
      totalAmount,
    };
  });
};

const branchSales = async ({ branchId, dateFrom, dateTo }) => {
  const where = {};
  if (branchId) where.branchId = parseInt(branchId);
  const df = dateFilter(dateFrom, dateTo);
  if (df) where.saleDate = df;

  const sales = await prisma.sale.findMany({
    where,
    include: { branch: { select: { name: true } } },
    orderBy: { saleDate: 'asc' },
  });

  const grouped = {};
  for (const s of sales) {
    const key  = `${s.branchId}_${s.saleDate.toISOString().slice(0, 10)}`;
    if (!grouped[key]) {
      grouped[key] = { branch: s.branch.name, date: s.saleDate.toISOString().slice(0, 10), shopTotal: 0, truckTotal: 0 };
    }
    if (s.saleType === 'SHOP')  grouped[key].shopTotal  += Number(s.totalAmount);
    if (s.saleType === 'TRUCK') grouped[key].truckTotal += Number(s.totalAmount);
  }

  return Object.values(grouped).map((r) => ({
    ...r,
    combinedTotal: r.shopTotal + r.truckTotal,
  }));
};

const inventory = async ({ branchId }) => {
  const where = branchId ? { branchId: parseInt(branchId) } : {};
  const stocks = await prisma.branchStock.findMany({
    where,
    include: {
      product: true,
      branch:  { select: { name: true } },
    },
  });

  const activeSessions = await prisma.truckDispatch.findMany({
    where: { session: { status: 'ACTIVE' } },
    include: { product: true, session: { include: { branch: { select: { name: true } } } } },
  });

  const truckMap = {};
  for (const d of activeSessions) {
    const key = `${d.session.branchId}_${d.productId}`;
    truckMap[key] = (truckMap[key] || 0) + (d.dispatchQty - d.soldQty);
  }

  return stocks.map((s) => {
    const truckQty = truckMap[`${s.branchId}_${s.productId}`] || 0;
    const status   = s.quantity === 0 ? 'OUT' : s.quantity < s.product.minStockAlert ? 'LOW' : 'OK';
    return {
      product:     s.product.name,
      category:    s.product.category,
      branch:      s.branch.name,
      branchStock: s.quantity,
      truckStock:  truckQty,
      minAlert:    s.product.minStockAlert,
      status,
    };
  });
};

const purchaseSalesList = async ({ branchId, userId, saleType, dateFrom, dateTo, page = 1, limit = 50 }) => {
  const where = {};
  if (branchId) where.branchId = parseInt(branchId);
  if (userId)   where.userId   = parseInt(userId);
  if (saleType) where.saleType = saleType;
  const df = dateFilter(dateFrom, dateTo);
  if (df) where.saleDate = df;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [total, sales] = await Promise.all([
    prisma.sale.count({ where }),
    prisma.sale.findMany({
      where, skip, take: parseInt(limit),
      include: {
        saleItems: { include: { product: true } },
        user:      { select: { name: true } },
        branch:    { select: { name: true } },
      },
      orderBy: { saleDate: 'desc' },
    }),
  ]);

  const rows = [];
  for (const sale of sales) {
    for (const item of sale.saleItems) {
      rows.push({
        date:      sale.saleDate,
        branch:    sale.branch.name,
        user:      sale.user.name,
        saleType:  sale.saleType,
        product:   item.product.name,
        quantity:  item.quantity,
        unitPrice: item.unitPrice,
        total:     item.totalPrice,
      });
    }
  }

  return { data: rows, total, page: parseInt(page), limit: parseInt(limit) };
};

module.exports = { truckSales, branchSales, inventory, purchaseSalesList };
