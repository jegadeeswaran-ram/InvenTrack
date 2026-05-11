const router = require('express').Router();
const { verifyToken } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/role');
const { getCustomRoles, createCustomRole, deleteCustomRole } = require('../controllers/custom-role.controller');

router.get('/', verifyToken, getCustomRoles);
router.post('/', verifyToken, requireAdmin, createCustomRole);
router.delete('/:name', verifyToken, requireAdmin, deleteCustomRole);

module.exports = router;
