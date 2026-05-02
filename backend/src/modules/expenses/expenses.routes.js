const router = require('express').Router();
const auth = require('../../middleware/auth');
const { rbac } = require('../../middleware/rbac');
const { validate, expenseSchema } = require('../../utils/validators');
const ctrl = require('./expenses.controller');

router.get('/',     auth, rbac(['ADMIN', 'BRANCH_MANAGER']), ctrl.getAll);
router.post('/',    auth, rbac(['ADMIN', 'BRANCH_MANAGER']), validate(expenseSchema), ctrl.create);
router.put('/:id',  auth, rbac(['ADMIN', 'BRANCH_MANAGER']), ctrl.update);
router.delete('/:id', auth, rbac(['ADMIN']), ctrl.remove);

module.exports = router;
