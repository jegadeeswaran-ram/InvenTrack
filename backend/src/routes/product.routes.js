const express = require('express');
const router = express.Router();
const { getProducts, createProduct, updateProduct, deleteProduct } = require('../controllers/product.controller');
const { verifyToken } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/role');

router.get('/', verifyToken, getProducts);
router.post('/', verifyToken, requireAdmin, createProduct);
router.put('/:id', verifyToken, requireAdmin, updateProduct);
router.delete('/:id', verifyToken, requireAdmin, deleteProduct);

module.exports = router;
