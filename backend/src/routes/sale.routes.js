const express = require('express');
const router = express.Router();
const { getSales, createSale, updateSale, deleteSale } = require('../controllers/sale.controller');
const { verifyToken } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/role');

router.get('/', verifyToken, getSales);
router.post('/', verifyToken, createSale);
router.put('/:id', verifyToken, requireAdmin, updateSale);
router.delete('/:id', verifyToken, requireAdmin, deleteSale);

module.exports = router;
