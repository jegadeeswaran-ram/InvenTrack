const svc = require('./stock.service');
const { validate, stockAdjustSchema } = require('../../utils/validators');

const getByBranch  = async (req, res, next) => { try { res.json({ success: true, data: await svc.getByBranch(req.params.branchId) }); } catch(e){ next(e); } };
const getTruckStock = async (req, res, next) => { try { res.json({ success: true, data: await svc.getTruckStock(req.params.sessionId) }); } catch(e){ next(e); } };
const adjust = async (req, res, next) => {
  try {
    res.json({ success: true, data: await svc.adjust(req.body, req.user.id) });
  } catch(e){ next(e); }
};

module.exports = { getByBranch, adjust, getTruckStock };
