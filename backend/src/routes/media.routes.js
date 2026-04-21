const express = require('express');
const router = express.Router();
const { upload, listMedia, uploadMedia, getMediaFile, deleteMedia } = require('../controllers/media.controller');
const { verifyToken } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/role');

router.get('/', verifyToken, listMedia);
router.get('/file/:filename', getMediaFile);
router.post(
  '/upload',
  verifyToken,
  requireAdmin,
  upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'file', maxCount: 1 },
  ]),
  uploadMedia
);
router.delete('/:filename', verifyToken, requireAdmin, deleteMedia);

module.exports = router;
