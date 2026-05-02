const svc = require('./closing.service');

const submit     = async (req, res, next) => { try { res.status(201).json({ success: true, data: await svc.submit(req.body, req.user.id) }); } catch(e){ next(e); } };
const getPending = async (req, res, next) => { try { res.json({ success: true, data: await svc.getPending(req.query.branchId) }); } catch(e){ next(e); } };
const getById    = async (req, res, next) => { try { res.json({ success: true, data: await svc.getById(req.params.id, req.user) }); } catch(e){ next(e); } };
const approve    = async (req, res, next) => { try { res.json({ success: true, data: await svc.approve(req.params.id, req.body, req.user.id) }); } catch(e){ next(e); } };
const getStatus  = async (req, res, next) => { try { res.json({ success: true, data: await svc.getStatus(req.params.sessionId, req.user.id) }); } catch(e){ next(e); } };

module.exports = { submit, getPending, getById, approve, getStatus };
