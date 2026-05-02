const svc = require('./expenses.service');

const getAll = async (req, res, next) => { try { res.json({ success: true, ...await svc.getAll(req.query, req.user) }); } catch(e){ next(e); } };
const create = async (req, res, next) => { try { res.status(201).json({ success: true, data: await svc.create(req.body, req.user.id) }); } catch(e){ next(e); } };
const update = async (req, res, next) => { try { res.json({ success: true, data: await svc.update(req.params.id, req.body, req.user) }); } catch(e){ next(e); } };
const remove = async (req, res, next) => { try { res.json({ success: true, data: await svc.remove(req.params.id) }); } catch(e){ next(e); } };

module.exports = { getAll, create, update, remove };
