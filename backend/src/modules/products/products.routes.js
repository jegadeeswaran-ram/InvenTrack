const router = require('express').Router();
const auth = require('../../middleware/auth');
const { rbac } = require('../../middleware/rbac');
const upload = require('./upload');
const ctrl = require('./products.controller');

router.get('/low-stock', auth, ctrl.getLowStock);
router.get('/',          auth, ctrl.getAll);
router.get('/:id',       auth, ctrl.getById);

router.post('/',
  auth, rbac(['ADMIN', 'BRANCH_MANAGER']),
  upload.single('image'),
  ctrl.create
);

router.put('/:id',
  auth, rbac(['ADMIN', 'BRANCH_MANAGER']),
  upload.single('image'),
  ctrl.update
);

router.delete('/:id', auth, rbac(['ADMIN']), ctrl.remove);

module.exports = router;
