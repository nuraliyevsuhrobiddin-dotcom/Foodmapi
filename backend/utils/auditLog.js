const AuditLog = require('../models/AuditLog');

const createAuditLog = async ({
  actor,
  actorRole,
  action,
  entityType,
  entityId,
  message,
  metadata = {},
}) => {
  try {
    await AuditLog.create({
      actor: actor || null,
      actorRole: actorRole || '',
      action,
      entityType,
      entityId: entityId ? String(entityId) : '',
      message: message || '',
      metadata,
    });
  } catch (error) {
    console.error('Audit log write failed', error);
  }
};

module.exports = { createAuditLog };
