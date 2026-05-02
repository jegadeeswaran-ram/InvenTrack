const svc = require('./products.service');
const { productSchema } = require('../../utils/validators');
const { Errors } = require('../../utils/errors');

const getAll = async (req, res, next) => {
  try {
    const result = await svc.getAll(req.query, req.user.role);
    res.json({ success: true, ...result });
  } catch (e) { next(e); }
};

const getById = async (req, res, next) => {
  try {
    res.json({ success: true, data: await svc.getById(+req.params.id) });
  } catch (e) { next(e); }
};

const create = async (req, res, next) => {
  try {
    const parsed = productSchema.safeParse(req.body);
    if (!parsed.success) {
      const msgs = parsed.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join('; ');
      return next(Errors.VALIDATION_ERROR(msgs));
    }
    const product = await svc.create(parsed.data, req.file, req.user.id);
    res.status(201).json({ success: true, data: product });
  } catch (e) { next(e); }
};

const update = async (req, res, next) => {
  try {
    const parsed = productSchema.partial().safeParse(req.body);
    if (!parsed.success) {
      const msgs = parsed.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join('; ');
      return next(Errors.VALIDATION_ERROR(msgs));
    }
    const product = await svc.update(+req.params.id, parsed.data, req.file, req.user.id);
    res.json({ success: true, data: product });
  } catch (e) { next(e); }
};

const remove = async (req, res, next) => {
  try {
    const product = await svc.remove(+req.params.id, req.user.id);
    res.json({ success: true, data: product });
  } catch (e) { next(e); }
};

const getLowStock = async (req, res, next) => {
  try {
    res.json({ success: true, data: await svc.getLowStock(req.query.branchId) });
  } catch (e) { next(e); }
};

module.exports = { getAll, getById, create, update, remove, getLowStock };
