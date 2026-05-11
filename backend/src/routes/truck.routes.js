const router = require('express').Router();
const { verifyToken } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/role');
const c = require('../controllers/truck.controller');

router.get('/', verifyToken, c.getTrucks);
router.get('/:id', verifyToken, c.getTruck);
router.post('/', verifyToken, requireAdmin, c.createTruck);
router.put('/:id', verifyToken, requireAdmin, c.updateTruck);

module.exports = router;
