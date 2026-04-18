const prisma = require('../config/db');

const getProducts = async (req, res) => {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
  });
  return res.json(products);
};

const createProduct = async (req, res) => {
  const { name, emoji, sellingPrice, imageUrl } = req.body;
  if (!name) return res.status(400).json({ message: 'Product name is required' });

  const product = await prisma.product.create({
    data: { name, emoji: emoji || '🍦', sellingPrice: parseFloat(sellingPrice) || 0, imageUrl: imageUrl || null },
  });
  return res.status(201).json(product);
};

const updateProduct = async (req, res) => {
  const { id } = req.params;
  const { name, emoji, sellingPrice, imageUrl } = req.body;

  const product = await prisma.product.update({
    where: { id: parseInt(id) },
    data: {
      ...(name && { name }),
      ...(emoji && { emoji }),
      ...(sellingPrice !== undefined && { sellingPrice: parseFloat(sellingPrice) }),
      imageUrl: imageUrl || null,
    },
  });
  return res.json(product);
};

const deleteProduct = async (req, res) => {
  const { id } = req.params;
  await prisma.product.update({
    where: { id: parseInt(id) },
    data: { isActive: false },
  });
  return res.json({ message: 'Product deactivated' });
};

module.exports = { getProducts, createProduct, updateProduct, deleteProduct };
