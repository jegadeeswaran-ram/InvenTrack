const router = require('express').Router();
const auth = require('../../middleware/auth');
const { rbac, branchGuard } = require('../../middleware/rbac');
const { validate, stockAdjustSchema } = require('../../utils/validators');
const ctrl = require('./stock.controller');

router.get('/branch/:branchId', auth, rbac(['ADMIN', 'BRANCH_MANAGER']), branchGuard, ctrl.getByBranch);
router.get('/truck/:sessionId', auth, ctrl.getTruckStock);
router.post('/adjust', auth, rbac(['ADMIN']), validate(stockAdjustSchema), ctrl.adjust);

module.exports = router;
