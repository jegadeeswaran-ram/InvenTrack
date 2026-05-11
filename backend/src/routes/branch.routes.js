const router = require('express').Router();
const { verifyToken } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/role');
const c = require('../controllers/branch.controller');

router.get('/', verifyToken, c.getBranches);
router.get('/:id', verifyToken, c.getBranch);
router.post('/', verifyToken, requireAdmin, c.createBranch);
router.put('/:id', verifyToken, requireAdmin, c.updateBranch);
router.delete('/:id', verifyToken, requireAdmin, c.deleteBranch);

module.exports = router;
