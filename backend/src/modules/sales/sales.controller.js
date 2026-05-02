const svc = require('./sales.service');

const truckSale   = async (req, res, next) => { try { res.status(201).json({ success: true, data: await svc.truckSale(req.body, req.user.id) }); } catch(e){ next(e); } };
const shopSale    = async (req, res, next) => { try { res.status(201).json({ success: true, data: await svc.shopSale(req.body, req.user.id) }); } catch(e){ next(e); } };
const getLiveStock = async (req, res, next) => { try { res.json({ success: true, data: await svc.getLiveStock(req.params.sessionId) }); } catch(e){ next(e); } };
const getHistory  = async (req, res, next) => { try { res.json({ success: true, ...await svc.getHistory(req.query) }); } catch(e){ next(e); } };

module.exports = { truckSale, shopSale, getLiveStock, getHistory };
