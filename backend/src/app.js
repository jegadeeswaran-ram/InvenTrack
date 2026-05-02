require('dotenv').config();
const env = require('./config/env');
const express = require('express');
const cors = require('cors');
const path = require('path');

const errorHandler = require('./middleware/errorHandler');

const authRoutes     = require('./modules/auth/auth.routes');
const branchRoutes   = require('./modules/branches/branches.routes');
const userRoutes     = require('./modules/users/users.routes');
const productRoutes  = require('./modules/products/products.routes');
const stockRoutes    = require('./modules/stock/stock.routes');
const dispatchRoutes = require('./modules/dispatch/dispatch.routes');
const salesRoutes    = require('./modules/sales/sales.routes');
const closingRoutes  = require('./modules/closing/closing.routes');
const expenseRoutes  = require('./modules/expenses/expenses.routes');
const reportRoutes   = require('./modules/reports/reports.routes');
const settingsRoutes = require('./modules/settings/settings.routes');

const app = express();

// ─── CORS ─────────────────────────────────────────────────────────────────────
const isLocalhostOrigin = (o) => /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(o || '');

const allowedOrigins = [
  env.CORS_ORIGIN,
  ...env.WEB_ORIGINS.split(',').map((s) => s.trim()),
].filter(Boolean);

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || isLocalhostOrigin(origin) || allowedOrigins.includes(origin)) {
        return cb(null, true);
      }
      cb(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
    optionsSuccessStatus: 204,
  })
);

// ─── Body parsing ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── Static uploads (local fallback) ─────────────────────────────────────────
if (!env.USE_S3) {
  app.use('/static', express.static(path.resolve(env.LOCAL_UPLOAD_PATH)));
}

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/health', (_req, res) =>
  res.json({ success: true, app: 'Kulfi ICE InvenTrack API', version: '2.0.0' })
);

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth',     authRoutes);
app.use('/api/branches', branchRoutes);
app.use('/api/users',    userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/stock',    stockRoutes);
app.use('/api/dispatch', dispatchRoutes);
app.use('/api/sales',    salesRoutes);
app.use('/api/closing',  closingRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/reports',  reportRoutes);
app.use('/api/settings', settingsRoutes);

// ─── 404 ──────────────────────────────────────────────────────────────────────
app.use((_req, res) =>
  res.status(404).json({ success: false, code: 'NOT_FOUND', message: 'Route not found' })
);

// ─── Global error handler ─────────────────────────────────────────────────────
app.use(errorHandler);

// ─── Start ────────────────────────────────────────────────────────────────────
const PORT = parseInt(env.PORT, 10) || 4000;
app.listen(PORT, () => {
  console.log(`Kulfi ICE InvenTrack API running on port ${PORT} [${env.NODE_ENV}]`);
  console.log(`Storage: ${env.USE_S3 ? 'S3 bucket' : 'local /uploads'}`);
});

module.exports = app;
