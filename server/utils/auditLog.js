const { query } = require("../config/db");

/**
 * Records an action to the audit trail. Never throws — a logging failure
 * should never break the actual request that triggered it, so errors are
 * swallowed and just printed to the server console.
 *
 * @param {number|null} actorId  who did it (null for system/cron actions)
 * @param {string} action        short verb key, e.g. 'fine_issued'
 * @param {string} targetType    e.g. 'vehicle' | 'fine' | 'puc_record' | 'user'
 * @param {number|null} targetId the affected row's id
 * @param {object} details       small JSON blob with human-readable context
 */
async function logAction(actorId, action, targetType, targetId, details = {}) {
  try {
    await query(
      `INSERT INTO audit_log (actor_id, action, target_type, target_id, details)
       VALUES ($1, $2, $3, $4, $5)`,
      [actorId, action, targetType, targetId, JSON.stringify(details)]
    );
  } catch (err) {
    console.error("[audit] failed to record action:", err.message);
  }
}

module.exports = { logAction };
