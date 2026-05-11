const express = require('express');
const router = express.Router();
const { dailyReport, monthlyReport, yearlyReport, stockReport, branchComparison } = require('../controllers/report.controller');
const { verifyToken } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/role');

router.get('/daily', verifyToken, requireAdmin, dailyReport);
router.get('/monthly', verifyToken, monthlyReport);
router.get('/yearly', verifyToken, requireAdmin, yearlyReport);
router.get('/stock', verifyToken, stockReport);
router.get('/branch-comparison', verifyToken, requireAdmin, branchComparison);

module.exports = router;
