const router = require('express').Router();
const { verifyToken } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/role');
const c = require('../controllers/expense.controller');

router.get('/', verifyToken, c.getExpenses);
router.get('/summary', verifyToken, c.getMonthlySummary);
router.post('/', verifyToken, c.createExpense);
router.put('/:id', verifyToken, c.updateExpense);
router.delete('/:id', verifyToken, requireAdmin, c.deleteExpense);

module.exports = router;
