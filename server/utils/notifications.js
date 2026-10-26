const { query } = require("../config/db");
const { sendMail } = require("./mailer");
const { pucExpiryEmail } = require("./emailTemplates");
const { getPucStatus, daysUntil, EXPIRING_WINDOW_DAYS } = require("./pucStatus");
const { logAction } = require("./auditLog");

/**
 * Finds every vehicle whose latest PUC record is expiring soon or already
 * expired, and emails the owner. Used by both the admin's manual "send
 * reminders now" button and the daily cron job, so the two never drift
 * out of sync with each other.
 */
async function sendExpiryReminders({ actorId = null } = {}) {
  const { rows } = await query(`
    SELECT v.id AS vehicle_id, v.reg_number, u.name AS owner_name, u.email AS owner_email, p.expiry_date
    FROM vehicles v
    JOIN users u ON u.id = v.owner_id
    JOIN LATERAL (
      SELECT expiry_date FROM puc_records WHERE vehicle_id = v.id ORDER BY expiry_date DESC LIMIT 1
    ) p ON true
    WHERE p.expiry_date <= CURRENT_DATE + $1::int
  `, [EXPIRING_WINDOW_DAYS]);

  const candidates = rows.filter((r) => ["expiring", "expired"].includes(getPucStatus(r.expiry_date)));

  let sent = 0;
  let failed = 0;
  for (const v of candidates) {
    const result = await sendMail({
      to: v.owner_email,
      subject: `PUCTrack: ${v.reg_number} needs PUC attention`,
      html: pucExpiryEmail({
        ownerName: v.owner_name,
        regNumber: v.reg_number,
        expiryDate: v.expiry_date,
        daysLeft: daysUntil(v.expiry_date),
      }),
    });
    if (result.sent) sent++;
    else failed++;
  }

  await logAction(actorId, "expiry_reminders_sent", "system", null, {
    candidates: candidates.length,
    sent,
    failed,
  });

  return { checked: candidates.length, sent, failed };
}

module.exports = { sendExpiryReminders };
