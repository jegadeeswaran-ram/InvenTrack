const router = require('express').Router();
const { verifyToken } = require('../middleware/auth');
const c = require('../controllers/bulk-order.controller');

router.get('/', verifyToken, c.getOrders);
router.get('/:id', verifyToken, c.getOrder);
router.post('/', verifyToken, c.createOrder);
router.put('/:id', verifyToken, c.updateOrder);
router.post('/:id/payments', verifyToken, c.addPayment);
router.delete('/:id', verifyToken, c.deleteOrder);

module.exports = router;
