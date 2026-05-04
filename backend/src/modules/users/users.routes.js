const router = require('express').Router();
const auth = require('../../middleware/auth');
const { rbac } = require('../../middleware/rbac');
const { validate, userCreateSchema, userUpdateSchema } = require('../../utils/validators');
const ctrl = require('./users.controller');

router.get('/',     auth, rbac(['ADMIN', 'BRANCH_MANAGER']), ctrl.getAll);
router.get('/:id',  auth, rbac(['ADMIN', 'BRANCH_MANAGER']), ctrl.getById);
router.post('/',    auth, rbac(['ADMIN']), validate(userCreateSchema), ctrl.create);
router.put('/:id',  auth, rbac(['ADMIN']), validate(userUpdateSchema), ctrl.update);
router.delete('/:id', auth, rbac(['ADMIN']), ctrl.remove);

module.exports = router;
