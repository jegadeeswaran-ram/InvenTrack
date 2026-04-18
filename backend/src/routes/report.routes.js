const express = require('express');
const router = express.Router();
const { dailyReport, monthlyReport, yearlyReport, stockReport } = require('../controllers/report.controller');
const { verifyToken } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/role');

router.get('/daily', verifyToken, requireAdmin, dailyReport);
router.get('/monthly', verifyToken, requireAdmin, monthlyReport);
router.get('/yearly', verifyToken, requireAdmin, yearlyReport);
router.get('/stock', verifyToken, requireAdmin, stockReport);

module.exports = router;
