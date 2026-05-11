const router = require('express').Router();
const { verifyToken } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/role');
const { getPermissions, updatePermissions, getMyPermissions } = require('../controllers/permission.controller');

router.get('/me', verifyToken, getMyPermissions);
router.get('/', verifyToken, getPermissions);
router.put('/', verifyToken, requireAdmin, updatePermissions);

module.exports = router;
