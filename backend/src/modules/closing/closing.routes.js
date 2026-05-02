const router = require('express').Router();
const auth = require('../../middleware/auth');
const { rbac } = require('../../middleware/rbac');
const { validate, closingSubmitSchema, closingApproveSchema } = require('../../utils/validators');
const ctrl = require('./closing.controller');

router.post('/submit',          auth, rbac(['SALESPERSON']), validate(closingSubmitSchema), ctrl.submit);
router.get('/pending',          auth, rbac(['ADMIN', 'BRANCH_MANAGER']), ctrl.getPending);
router.get('/status/:sessionId',auth, rbac(['SALESPERSON']), ctrl.getStatus);
router.get('/:id',              auth, ctrl.getById);
router.post('/approve/:id',     auth, rbac(['ADMIN', 'BRANCH_MANAGER']), validate(closingApproveSchema), ctrl.approve);

module.exports = router;
