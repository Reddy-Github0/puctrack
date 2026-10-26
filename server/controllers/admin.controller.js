const bcrypt = require("bcryptjs");
const { query } = require("../config/db");
const { getPucStatus } = require("../utils/pucStatus");
const { logAction } = require("../utils/auditLog");
const { sendExpiryReminders } = require("../utils/notifications");

/** Lists vehicle owners so the admin UI can offer an "existing owner" picker. */
async function listUsers(req, res, next) {
  try {
    const { rows } = await query(
      "SELECT id, name, email, role FROM users WHERE role = 'user' ORDER BY name"
    );
    res.json({ users: rows });
  } catch (err) {
    next(err);
  }
}

/**
 * Admin onboards a brand-new vehicle owner who doesn't have an account yet.
 * Returns the temp password so the admin can hand it to the owner.
 */
async function createUser(req, res, next) {
  try {
    const { name, email } = req.body;
    if (!name || !email) {
      return res.status(400).json({ error: "name and email are required" });
    }

    const existing = await query("SELECT id FROM users WHERE email = $1", [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: "An account with that email already exists" });
    }

    const tempPassword = Math.random().toString(36).slice(2, 10);
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    const { rows } = await query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, 'user') RETURNING id, name, email, role`,
      [name, email, passwordHash]
    );

    await logAction(req.user.id, "user_onboarded", "user", rows[0].id, { name, email });

    res.status(201).json({ user: rows[0], temp_password: tempPassword });
  } catch (err) {
    next(err);
  }
}

/** Fleet-wide counts for the admin dashboard's stat strip. */
async function getStats(req, res, next) {
  try {
    const { rows: vehicles } = await query(
      `SELECT v.id, p.expiry_date
       FROM vehicles v
       LEFT JOIN LATERAL (
         SELECT expiry_date FROM puc_records WHERE vehicle_id = v.id ORDER BY expiry_date DESC LIMIT 1
       ) p ON true`
    );

    let valid = 0, expiring = 0, expired = 0, noRecord = 0;
    vehicles.forEach((v) => {
      if (!v.expiry_date) return noRecord++;
      const status = getPucStatus(v.expiry_date);
      if (status === "valid") valid++;
      else if (status === "expiring") expiring++;
      else expired++;
    });

    const { rows: fineRows } = await query(
      "SELECT COUNT(*)::int AS unpaid_fines FROM fines WHERE status = 'unpaid'"
    );
    const { rows: slotRows } = await query(
      "SELECT status, COUNT(*)::int AS count FROM parking_slots GROUP BY status"
    );

    res.json({
      total_vehicles: vehicles.length,
      puc_valid: valid,
      puc_expiring: expiring,
      puc_expired: expired,
      puc_no_record: noRecord,
      unpaid_fines: fineRows[0].unpaid_fines,
      parking: Object.fromEntries(slotRows.map((r) => [r.status, r.count])),
    });
  } catch (err) {
    next(err);
  }
}

/** Weekly fines issued vs. paid, for the admin analytics bar chart. */
async function getFinesTimeline(req, res, next) {
  try {
    const { rows } = await query(
      `SELECT
         to_char(date_trunc('week', issued_at), 'Mon DD') AS week,
         COUNT(*)::int AS issued,
         COUNT(*) FILTER (WHERE status = 'paid')::int AS paid
       FROM fines
       WHERE issued_at > now() - INTERVAL '12 weeks'
       GROUP BY date_trunc('week', issued_at)
       ORDER BY date_trunc('week', issued_at)`
    );
    res.json({ timeline: rows });
  } catch (err) {
    next(err);
  }
}

/** Recent audit trail entries for the admin's audit log view. */
async function listAuditLog(req, res, next) {
  try {
    const { rows } = await query(
      `SELECT a.id, a.action, a.target_type, a.target_id, a.details, a.created_at,
              u.name AS actor_name, u.email AS actor_email
       FROM audit_log a
       LEFT JOIN users u ON u.id = a.actor_id
       ORDER BY a.created_at DESC
       LIMIT 100`
    );
    res.json({ entries: rows });
  } catch (err) {
    next(err);
  }
}

/** Manually fires the PUC-expiry email sweep on demand (same logic the daily cron runs). */
async function triggerExpiryReminders(req, res, next) {
  try {
    const result = await sendExpiryReminders({ actorId: req.user.id });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = { getStats, listUsers, createUser, getFinesTimeline, listAuditLog, triggerExpiryReminders };
