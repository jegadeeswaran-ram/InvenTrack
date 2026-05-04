const prisma = require('../config/db');

/**
 * Write an audit log entry.
 * @param {object} opts
 * @param {number}  opts.userId
 * @param {string}  opts.action   - e.g. 'CREATE', 'UPDATE', 'DELETE', 'APPROVE'
 * @param {string}  opts.entity   - e.g. 'Product', 'BranchStock', 'ClosingRecord'
 * @param {string|number} opts.entityId
 * @param {object}  [opts.before]
 * @param {object}  [opts.after]
 * @param {object}  [opts.tx]     - optional Prisma transaction client
 */
const audit = async ({ userId, action, entity, entityId, before, after, tx }) => {
  const client = tx || prisma;
  await client.auditLog.create({
    data: {
      userId,
      action,
      entity,
      entityId: String(entityId),
      before:   before ?? undefined,
      after:    after  ?? undefined,
    },
  });
};

module.exports = { audit };
