const path = require('path');
const { v4: uuidv4 } = require('crypto').randomUUID ? { v4: () => require('crypto').randomUUID() } : { v4: () => Date.now().toString() };
const prisma = require('../../config/db');
const { uploadFile } = require('../../config/s3');
const { Errors } = require('../../utils/errors');
const { audit } = require('../../utils/audit');

const buildWhere = ({ category, search, isActive }) => {
  const where = {};
  if (category) where.category = category;
  if (isActive !== undefined) where.isActive = isActive === 'true' || isActive === true;
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { sku:  { contains: search, mode: 'insensitive' } },
    ];
  }
  return where;
};

const getAll = async (query, userRole) => {
  const { page = 1, limit = 20, ...filters } = query;
  if (userRole === 'SALESPERSON') filters.isActive = 'true';

  const where = buildWhere(filters);
  const skip  = (parseInt(page) - 1) * parseInt(limit);

  const [total, products] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      skip,
      take: parseInt(limit),
      orderBy: { name: 'asc' },
    }),
  ]);

  return { data: products, total, page: parseInt(page), limit: parseInt(limit) };
};

const getById = async (id) => {
  const p = await prisma.product.findUnique({ where: { id } });
  if (!p) throw Errors.NOT_FOUND('Product');
  return p;
};

const create = async (data, file, userId) => {
  const existing = await prisma.product.findUnique({ where: { sku: data.sku } });
  if (existing) throw Errors.SKU_EXISTS(data.sku);

  let imageUrl = null;
  if (file) {
    const ext      = path.extname(file.originalname) || '.jpg';
    const filename = `products/${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
    imageUrl = await uploadFile(file.buffer, filename, file.mimetype);
  }

  const product = await prisma.product.create({
    data: {
      name:          data.name,
      category:      data.category,
      sku:           data.sku,
      price:         data.price,
      costPrice:     data.costPrice,
      unit:          data.unit || 'PCS',
      openingStock:  data.openingStock || 0,
      minStockAlert: data.minStockAlert || 5,
      description:   data.description || null,
      imageUrl,
      isActive:      data.isActive ?? true,
    },
  });

  const branches = await prisma.branch.findMany({ where: { isActive: true }, select: { id: true } });
  if (branches.length > 0) {
    await prisma.branchStock.createMany({
      data: branches.map((b) => ({
        branchId:  b.id,
        productId: product.id,
        quantity:  product.openingStock,
      })),
      skipDuplicates: true,
    });
  }

  await audit({ userId, action: 'CREATE', entity: 'Product', entityId: product.id, after: product });
  return product;
};

const update = async (id, data, file, userId) => {
  const existing = await getById(id);

  if (data.sku && data.sku !== existing.sku) {
    const skuConflict = await prisma.product.findUnique({ where: { sku: data.sku } });
    if (skuConflict) throw Errors.SKU_EXISTS(data.sku);
  }

  let imageUrl = existing.imageUrl;
  if (file) {
    const ext      = path.extname(file.originalname) || '.jpg';
    const filename = `products/${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
    imageUrl = await uploadFile(file.buffer, filename, file.mimetype);
  }

  const product = await prisma.product.update({
    where: { id },
    data: { ...data, imageUrl },
  });

  await audit({ userId, action: 'UPDATE', entity: 'Product', entityId: id, before: existing, after: product });
  return product;
};

const remove = async (id, userId) => {
  const existing = await getById(id);
  const product  = await prisma.product.update({ where: { id }, data: { isActive: false } });
  await audit({ userId, action: 'DELETE', entity: 'Product', entityId: id, before: existing, after: product });
  return product;
};

const getLowStock = async (branchId) => {
  const where = branchId ? { branchId: parseInt(branchId) } : {};
  const stocks = await prisma.branchStock.findMany({
    where,
    include: { product: true, branch: { select: { id: true, name: true } } },
  });
  return stocks
    .filter((s) => s.quantity < s.product.minStockAlert)
    .map((s) => ({
      ...s.product,
      branchId: s.branchId,
      branchName: s.branch.name,
      quantity: s.quantity,
      status: s.quantity === 0 ? 'OUT' : 'LOW',
    }));
};

module.exports = { getAll, getById, create, update, remove, getLowStock };
