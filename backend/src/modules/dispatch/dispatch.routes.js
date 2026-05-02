const router = require('express').Router();
const auth = require('../../middleware/auth');
const { rbac, branchGuard } = require('../../middleware/rbac');
const { validate, dispatchSchema } = require('../../utils/validators');
const ctrl = require('./dispatch.controller');

router.post('/',                    auth, rbac(['ADMIN', 'BRANCH_MANAGER']), validate(dispatchSchema), ctrl.create);
router.get('/my-session',           auth, rbac(['SALESPERSON']), ctrl.getMySession);
router.get('/today/:branchId',      auth, rbac(['ADMIN', 'BRANCH_MANAGER']), branchGuard, ctrl.getToday);
router.get('/session/:sessionId',   auth, ctrl.getSession);

module.exports = router;
