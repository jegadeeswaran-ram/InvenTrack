const svc = require('./reports.service');

const respond = (res, data, query) => {
  if (query.export === 'csv') {
    const rows = Array.isArray(data) ? data : data.data || [];
    if (!rows.length) return res.status(204).end();
    const headers = Object.keys(rows[0]).join(',');
    const lines   = rows.map((r) => Object.values(r).map((v) => `"${v ?? ''}"`).join(','));
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="report.csv"');
    return res.send([headers, ...lines].join('\n'));
  }
  res.json({ success: true, data });
};

const truckSales       = async (req, res, next) => { try { respond(res, await svc.truckSales(req.query), req.query); } catch(e){ next(e); } };
const branchSales      = async (req, res, next) => { try { respond(res, await svc.branchSales(req.query), req.query); } catch(e){ next(e); } };
const inventory        = async (req, res, next) => { try { respond(res, await svc.inventory(req.query), req.query); } catch(e){ next(e); } };
const purchaseSalesList = async (req, res, next) => { try { respond(res, await svc.purchaseSalesList(req.query), req.query); } catch(e){ next(e); } };

module.exports = { truckSales, branchSales, inventory, purchaseSalesList };
