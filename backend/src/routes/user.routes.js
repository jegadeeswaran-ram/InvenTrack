const express = require('express');
const router = express.Router();
const { getUsers, createUser, updateUser, deleteUser, toggleUser } = require('../controllers/user.controller');
const { verifyToken } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/role');

router.get('/', verifyToken, requireAdmin, getUsers);
router.post('/', verifyToken, requireAdmin, createUser);
router.put('/:id', verifyToken, requireAdmin, updateUser);
router.delete('/:id', verifyToken, requireAdmin, deleteUser);
router.patch('/:id/toggle', verifyToken, requireAdmin, toggleUser);

module.exports = router;
