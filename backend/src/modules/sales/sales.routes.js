const router = require('express').Router();
const auth = require('../../middleware/auth');
const { rbac } = require('../../middleware/rbac');
const { validate, truckSaleSchema, shopSaleSchema } = require('../../utils/validators');
const ctrl = require('./sales.controller');

router.post('/truck', auth, validate(truckSaleSchema), ctrl.truckSale);
router.post('/shop',  auth, rbac(['ADMIN', 'BRANCH_MANAGER']), validate(shopSaleSchema), ctrl.shopSale);
router.get('/live-stock/:sessionId', auth, ctrl.getLiveStock);
router.get('/history', auth, rbac(['ADMIN', 'BRANCH_MANAGER']), ctrl.getHistory);

module.exports = router;
