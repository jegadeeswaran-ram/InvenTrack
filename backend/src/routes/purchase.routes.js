const express = require('express');
const router = express.Router();
const { getPurchases, createPurchase, updatePurchase, deletePurchase } = require('../controllers/purchase.controller');
const { verifyToken } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/role');

router.get('/', verifyToken, requireAdmin, getPurchases);
router.post('/', verifyToken, requireAdmin, createPurchase);
router.put('/:id', verifyToken, requireAdmin, updatePurchase);
router.delete('/:id', verifyToken, requireAdmin, deletePurchase);

module.exports = router;
