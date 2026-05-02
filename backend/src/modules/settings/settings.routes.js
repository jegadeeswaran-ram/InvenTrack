const router = require('express').Router();
const auth = require('../../middleware/auth');
const { rbac } = require('../../middleware/rbac');
const { validate, permissionsSchema } = require('../../utils/validators');
const ctrl = require('./settings.controller');

router.get('/permissions',         auth, rbac(['ADMIN']), ctrl.getPermissions);
router.put('/permissions',         auth, rbac(['ADMIN']), validate(permissionsSchema), ctrl.upsertPermissions);
router.get('/permissions/:role',   auth, ctrl.getPermissionsByRole);
router.get('/audit-log',           auth, rbac(['ADMIN']), ctrl.getAuditLog);

module.exports = router;
