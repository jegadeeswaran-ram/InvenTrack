const svc = require('./branches.service');

const getAll  = async (req, res, next) => { try { res.json({ success: true, data: await svc.getAll() }); } catch(e){ next(e); } };
const getById = async (req, res, next) => { try { res.json({ success: true, data: await svc.getById(+req.params.id) }); } catch(e){ next(e); } };
const create  = async (req, res, next) => { try { res.status(201).json({ success: true, data: await svc.create(req.body) }); } catch(e){ next(e); } };
const update  = async (req, res, next) => { try { res.json({ success: true, data: await svc.update(+req.params.id, req.body) }); } catch(e){ next(e); } };
const remove  = async (req, res, next) => { try { res.json({ success: true, data: await svc.remove(+req.params.id) }); } catch(e){ next(e); } };

module.exports = { getAll, getById, create, update, remove };
