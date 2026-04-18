const express = require('express');
const router = express.Router();
const { upload, listMedia, uploadMedia, deleteMedia } = require('../controllers/media.controller');
const { verifyToken } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/role');

router.get('/', verifyToken, listMedia);
router.post('/upload', verifyToken, requireAdmin, upload.single('image'), uploadMedia);
router.delete('/:filename', verifyToken, requireAdmin, deleteMedia);

module.exports = router;
