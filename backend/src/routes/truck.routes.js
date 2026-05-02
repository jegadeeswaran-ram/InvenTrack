const express = require('express');
const router = express.Router();

const { getBranches, createBranch, updateBranch, getTrucks, createTruck, updateTruck } = require('../controllers/truck.controller');
const { startDay, getTodaySession, getSessionById, closeDay, listSessions } = require('../controllers/truck-session.controller');
const { getSales, createSale, deleteSale } = require('../controllers/truck-sale.controller');
const { getSessionReport, getBranchReport, getAllSessions } = require('../controllers/truck-report.controller');
const { verifyToken } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/role');

// Branches
router.get('/branches', verifyToken, getBranches);
router.post('/branches', verifyToken, requireAdmin, createBranch);
router.put('/branches/:id', verifyToken, requireAdmin, updateBranch);

// Trucks
router.get('/trucks', verifyToken, getTrucks);
router.post('/trucks', verifyToken, requireAdmin, createTruck);
router.put('/trucks/:id', verifyToken, requireAdmin, updateTruck);

// Sessions
router.get('/sessions', verifyToken, listSessions);
router.post('/sessions/start', verifyToken, startDay);
router.get('/sessions/today', verifyToken, getTodaySession);
router.get('/sessions/:id', verifyToken, getSessionById);
router.post('/sessions/:id/close', verifyToken, closeDay);

// Sales (within a session)
router.get('/sessions/:sessionId/sales', verifyToken, getSales);
router.post('/sales', verifyToken, createSale);
router.delete('/sales/:id', verifyToken, deleteSale);

// Reports
router.get('/reports/sessions', verifyToken, getAllSessions);
router.get('/reports/session/:id', verifyToken, getSessionReport);
router.get('/reports/branch/:branchId', verifyToken, getBranchReport);

module.exports = router;
