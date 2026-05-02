const router = require('express').Router();
const auth = require('../../middleware/auth');
const { rbac } = require('../../middleware/rbac');
const { validate, branchSchema } = require('../../utils/validators');
const ctrl = require('./branches.controller');

router.get('/',     auth, ctrl.getAll);
router.get('/:id',  auth, ctrl.getById);
router.post('/',    auth, rbac(['ADMIN']), validate(branchSchema), ctrl.create);
router.put('/:id',  auth, rbac(['ADMIN']), validate(branchSchema), ctrl.update);
router.delete('/:id', auth, rbac(['ADMIN']), ctrl.remove);

module.exports = router;
