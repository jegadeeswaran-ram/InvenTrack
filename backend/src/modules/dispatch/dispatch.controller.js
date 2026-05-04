const svc = require('./dispatch.service');

const create = async (req, res, next) => {
  try {
    res.status(201).json({ success: true, data: await svc.create(req.body, req.user.id) });
  } catch (e) { next(e); }
};

const getToday = async (req, res, next) => {
  try {
    res.json({ success: true, data: await svc.getToday(req.params.branchId) });
  } catch (e) { next(e); }
};

const getSession = async (req, res, next) => {
  try {
    res.json({ success: true, data: await svc.getSession(req.params.sessionId) });
  } catch (e) { next(e); }
};

const getMySession = async (req, res, next) => {
  try {
    res.json({ success: true, data: await svc.getMySession(req.user.id) });
  } catch (e) { next(e); }
};

module.exports = { create, getToday, getSession, getMySession };
