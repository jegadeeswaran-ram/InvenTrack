require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth.routes');
const productRoutes = require('./routes/product.routes');
const purchaseRoutes = require('./routes/purchase.routes');
const saleRoutes = require('./routes/sale.routes');
const reportRoutes = require('./routes/report.routes');
const userRoutes = require('./routes/user.routes');
const mediaRoutes = require('./routes/media.routes');
const truckRoutes = require('./routes/truck.routes');
const { bucketEnabled, ensureLocalUploadsDir } = require('./services/storage.service');

const app = express();
const PORT = process.env.PORT || 4000;

// CORS
const normalizeOrigin = (origin) => (origin || '').replace(/\/+$/, '').trim();
const envCorsOrigin = normalizeOrigin(process.env.CORS_ORIGIN);
const envOrigins = [
  envCorsOrigin,
  process.env.WEB_ORIGIN,
  ...(process.env.WEB_ORIGINS || '').split(','),
]
  .map(normalizeOrigin)
  .filter(Boolean);

const allowedOrigins = envOrigins.filter((origin) => origin !== '*');

const corsAllowAll = envCorsOrigin === '*' || (process.env.WEB_ORIGINS || '').includes('*');

// Allow any localhost port (Flutter web dev)
const isLocalhostOrigin = (origin) => /^https?:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin || '');

app.use(
  cors({
    origin: (origin, callback) => {
      const normalizedOrigin = normalizeOrigin(origin);
      if (corsAllowAll) {
        return callback(null, true);
      }
      if (!origin || allowedOrigins.includes(normalizedOrigin) || isLocalhostOrigin(normalizedOrigin)) {
        return callback(null, true);
      }

      const corsError = new Error(`Origin ${normalizedOrigin} is not allowed by CORS`);
      corsError.statusCode = 403;
      return callback(corsError);
    },
    credentials: !corsAllowAll,
    optionsSuccessStatus: 204,
  })
);

app.use(express.json());

// Serve uploaded images
const path = require('path');
if (!bucketEnabled) {
  ensureLocalUploadsDir();
  app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
}

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', app: 'Kulfi ICE InvenTrack' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/purchases', purchaseRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/users', userRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/truck', truckRoutes);

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  const status = err.statusCode || 500;
  res.status(status).json({ message: err.message || 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(`Kulfi ICE InvenTrack API running on port ${PORT}`);
});
