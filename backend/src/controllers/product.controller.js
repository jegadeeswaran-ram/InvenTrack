const prisma = require('../config/db');

const _iceCreamImages = [
  'https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=400&q=80',
  'https://images.unsplash.com/photo-1587563871167-1ee9c731aefb?w=400&q=80',
  'https://images.unsplash.com/photo-1488900128323-21503983a07e?w=400&q=80',
  'https://images.unsplash.com/photo-1501443762994-82bd5dace89a?w=400&q=80',
  'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400&q=80',
  'https://images.unsplash.com/photo-1570197788417-0e82375c9371?w=400&q=80',
  'https://images.unsplash.com/photo-1576506295286-5cda18df43e7?w=400&q=80',
  'https://images.unsplash.com/photo-1605027991101-d60f0abe7f17?w=400&q=80',
  'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=400&q=80',
  'https://images.unsplash.com/photo-1629385701021-fcd90ece42af?w=400&q=80',
];

function _randomImage(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return _iceCreamImages[hash % _iceCreamImages.length];
}

const getProducts = async (req, res) => {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
  });
  return res.json(products);
};

const createProduct = async (req, res) => {
  const { name, emoji, sellingPrice, imageUrl, piecesPerPacket } = req.body;
  if (!name) return res.status(400).json({ message: 'Product name is required' });

  const product = await prisma.product.create({
    data: {
      name,
      emoji: emoji || '🍦',
      sellingPrice: parseFloat(sellingPrice) || 0,
      imageUrl: imageUrl || _randomImage(name),
      piecesPerPacket: parseInt(piecesPerPacket) || 1,
    },
  });
  return res.status(201).json(product);
};

const updateProduct = async (req, res) => {
  const { id } = req.params;
  const { name, emoji, sellingPrice, imageUrl, piecesPerPacket } = req.body;

  const product = await prisma.product.update({
    where: { id: parseInt(id) },
    data: {
      ...(name && { name }),
      ...(emoji && { emoji }),
      ...(sellingPrice !== undefined && { sellingPrice: parseFloat(sellingPrice) }),
      imageUrl: imageUrl !== undefined ? (imageUrl || null) : undefined,
      ...(piecesPerPacket !== undefined && { piecesPerPacket: parseInt(piecesPerPacket) || 1 }),
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
