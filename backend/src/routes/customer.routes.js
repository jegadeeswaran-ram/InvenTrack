const router = require('express').Router();
const { verifyToken } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/role');
const c = require('../controllers/customer.controller');

router.get('/', verifyToken, c.getCustomers);
router.get('/:id', verifyToken, c.getCustomer);
router.post('/', verifyToken, c.createCustomer);
router.put('/:id', verifyToken, c.updateCustomer);
router.delete('/:id', verifyToken, requireAdmin, c.deleteCustomer);

module.exports = router;
