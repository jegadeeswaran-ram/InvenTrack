const router = require('express').Router();
const { verifyToken } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/role');
const { getSettings, updateSettings } = require('../controllers/setting.controller');

router.get('/', verifyToken, getSettings);
router.put('/', verifyToken, requireAdmin, updateSettings);

module.exports = router;
