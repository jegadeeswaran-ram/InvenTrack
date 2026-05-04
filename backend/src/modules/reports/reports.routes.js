const router = require('express').Router();
const auth = require('../../middleware/auth');
const { rbac } = require('../../middleware/rbac');
const ctrl = require('./reports.controller');

router.use(auth, rbac(['ADMIN', 'BRANCH_MANAGER']));
router.get('/truck-sales',      ctrl.truckSales);
router.get('/branch-sales',     ctrl.branchSales);
router.get('/inventory',        ctrl.inventory);
router.get('/purchase-sales',   ctrl.purchaseSalesList);

module.exports = router;
