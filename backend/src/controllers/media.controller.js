const path = require('path');
const multer = require('multer');
const {
  bucketEnabled,
  ensureLocalUploadsDir,
  uploadBuffer,
  listFiles,
  deleteFile,
  getFile,
} = require('../services/storage.service');

if (!bucketEnabled) {
  ensureLocalUploadsDir();
}

const fileFilter = (req, file, cb) => {
  const allowedExt = /\.(jpeg|jpg|png|gif|webp|pdf|txt|csv|doc|docx|xls|xlsx|zip)$/i;
  const allowedMime =
    /^image\//.test(file.mimetype) ||
    [
      'application/pdf',
      'text/plain',
      'text/csv',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/zip',
      'application/x-zip-compressed',
    ].includes(file.mimetype);
  if (allowedExt.test(file.originalname) || allowedMime) {
    cb(null, true);
  } else {
    cb(new Error('Only image/document/archive files are allowed'));
  }
};

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
});

const getBaseUrl = (req) => `${req.protocol}://${req.get('host')}`;
const getUploadedFile = (req) => req.file || req.files?.image?.[0] || req.files?.file?.[0] || null;
const isImage = (filename = '') => /\.(jpg|jpeg|png|gif|webp)$/i.test(filename);
const sanitizeFileName = (name = 'file') => name.replace(/[^a-zA-Z0-9._-]/g, '_');
const buildMediaFileUrl = (req, filename) =>
  `${getBaseUrl(req)}/api/media/file/${encodeURIComponent(filename)}`;
const guessMimeType = (filename = '') => {
  const ext = path.extname(filename).toLowerCase();
  const map = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.pdf': 'application/pdf',
    '.txt': 'text/plain',
    '.csv': 'text/csv',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.xls': 'application/vnd.ms-excel',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.zip': 'application/zip',
  };
  return map[ext] || 'application/octet-stream';
};

const listMedia = async (req, res, next) => {
  try {
    const files = await listFiles();
    const media = files
      .map((f) => {
        return {
          filename: f.key,
          url: buildMediaFileUrl(req, f.key),
          size: f.size,
          createdAt: f.createdAt,
          isImage: isImage(f.key),
        };
      })
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    return res.json(media);
  } catch (error) {
    return next(error);
  }
};

const uploadMedia = async (req, res, next) => {
  const file = getUploadedFile(req);
  if (!file) return res.status(400).json({ message: 'No file uploaded' });

  const ext = path.extname(file.originalname || '').toLowerCase();
  const originalWithoutExt = path.basename(file.originalname || 'file', ext);
  const safeOriginalName = sanitizeFileName(originalWithoutExt);
  const filename = `${Date.now()}_${Math.random().toString(36).slice(2)}_${safeOriginalName}${ext}`;

  try {
    await uploadBuffer({
      key: filename,
      buffer: file.buffer,
      contentType: file.mimetype,
    });

    return res.status(201).json({
      filename,
      url: buildMediaFileUrl(req, filename),
      size: file.size,
      mimeType: file.mimetype,
      isImage: isImage(filename),
    });
  } catch (error) {
    return next(error);
  }
};

const getMediaFile = async (req, res, next) => {
  const { filename } = req.params;
  if (filename.includes('/') || filename.includes('..')) {
    return res.status(400).json({ message: 'Invalid filename' });
  }
  try {
    const file = await getFile(filename);
    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }
    res.setHeader('Content-Type', file.contentType || guessMimeType(filename));
    res.setHeader('Content-Length', String(file.size || 0));
    res.setHeader('Cache-Control', 'public, max-age=86400');
    return res.send(file.buffer);
  } catch (error) {
    return next(error);
  }
};

const deleteMedia = async (req, res, next) => {
  const { filename } = req.params;
  if (filename.includes('/') || filename.includes('..')) {
    return res.status(400).json({ message: 'Invalid filename' });
  }
  try {
    const deleted = await deleteFile(filename);
    if (!deleted && !bucketEnabled) return res.status(404).json({ message: 'File not found' });
    return res.json({ message: 'Deleted' });
  } catch (error) {
    return next(error);
  }
};

module.exports = { upload, listMedia, uploadMedia, getMediaFile, deleteMedia };
