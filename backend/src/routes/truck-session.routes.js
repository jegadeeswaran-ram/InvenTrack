const router = require('express').Router();
const { verifyToken } = require('../middleware/auth');
const c = require('../controllers/truck-session.controller');

router.get('/', verifyToken, c.getSessions);
router.get('/my-session', verifyToken, c.getMyOpenSession);
router.post('/start', verifyToken, c.startSession);
router.post('/:id/sale', verifyToken, c.recordSale);
router.put('/:id/close', verifyToken, c.closeSession);

module.exports = router;
