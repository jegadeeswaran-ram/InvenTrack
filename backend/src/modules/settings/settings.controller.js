const svc = require('./settings.service');

const getPermissions       = async (req, res, next) => { try { res.json({ success: true, data: await svc.getPermissions() }); } catch(e){ next(e); } };
const getPermissionsByRole = async (req, res, next) => { try { res.json({ success: true, data: await svc.getPermissionsByRole(req.params.role) }); } catch(e){ next(e); } };
const upsertPermissions    = async (req, res, next) => { try { res.json({ success: true, data: await svc.upsertPermissions(req.body, req.user.id) }); } catch(e){ next(e); } };
const getAuditLog          = async (req, res, next) => { try { res.json({ success: true, ...await svc.getAuditLog(req.query) }); } catch(e){ next(e); } };

module.exports = { getPermissions, getPermissionsByRole, upsertPermissions, getAuditLog };
