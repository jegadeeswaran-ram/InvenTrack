const fs = require('fs');
const path = require('path');
const multer = require('multer');

const UPLOADS_DIR = path.join(__dirname, '../../uploads');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const name = `${Date.now()}_${Math.random().toString(36).slice(2)}${ext}`;
    cb(null, name);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedExt = /\.(jpeg|jpg|png|gif|webp)$/i;
  const allowedMime = /^image\//;
  if (allowedExt.test(file.originalname) || allowedMime.test(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'));
  }
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });

const getBaseUrl = (req) => `${req.protocol}://${req.get('host')}`;

const listMedia = (req, res) => {
  const files = fs.existsSync(UPLOADS_DIR) ? fs.readdirSync(UPLOADS_DIR) : [];
  const media = files
    .filter(f => /\.(jpg|jpeg|png|gif|webp)$/i.test(f))
    .map(f => {
      const stat = fs.statSync(path.join(UPLOADS_DIR, f));
      return {
        filename: f,
        url: `${getBaseUrl(req)}/uploads/${f}`,
        size: stat.size,
        createdAt: stat.birthtime,
      };
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return res.json(media);
};

const uploadMedia = (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
  return res.status(201).json({
    filename: req.file.filename,
    url: `${getBaseUrl(req)}/uploads/${req.file.filename}`,
    size: req.file.size,
  });
};

const deleteMedia = (req, res) => {
  const { filename } = req.params;
  // Sanitize — no path traversal
  if (filename.includes('/') || filename.includes('..')) {
    return res.status(400).json({ message: 'Invalid filename' });
  }
  const filePath = path.join(UPLOADS_DIR, filename);
  if (!fs.existsSync(filePath)) return res.status(404).json({ message: 'File not found' });
  fs.unlinkSync(filePath);
  return res.json({ message: 'Deleted' });
};

module.exports = { upload, listMedia, uploadMedia, deleteMedia };
