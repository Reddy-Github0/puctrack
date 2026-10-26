const { query } = require("../config/db");
const { getPucStatus, daysUntil } = require("../utils/pucStatus");
const { logAction } = require("../utils/auditLog");

async function listPucRecords(req, res, next) {
  try {
    const { rows } = await query(
      "SELECT * FROM puc_records WHERE vehicle_id = $1 ORDER BY expiry_date DESC",
      [req.params.vehicleId]
    );
    const records = rows.map((r) => ({
      ...r,
      status: getPucStatus(r.expiry_date),
      days_until_expiry: daysUntil(r.expiry_date),
    }));
    res.json({ puc_records: records });
  } catch (err) {
    next(err);
  }
}

/** Admin-only: issue or renew a PUC certificate for a vehicle. */
async function createPucRecord(req, res, next) {
  try {
    const { certificate_no, issue_date, expiry_date } = req.body;
    if (!certificate_no || !issue_date || !expiry_date) {
      return res.status(400).json({ error: "certificate_no, issue_date and expiry_date are required" });
    }

    const { rows } = await query(
      `INSERT INTO puc_records (vehicle_id, certificate_no, issue_date, expiry_date)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [req.params.vehicleId, certificate_no, issue_date, expiry_date]
    );

    await logAction(req.user.id, "puc_issued", "puc_record", rows[0].id, {
      vehicle_id: req.params.vehicleId,
      certificate_no,
      expiry_date,
    });

    res.status(201).json({ puc_record: { ...rows[0], status: getPucStatus(rows[0].expiry_date) } });
  } catch (err) {
    if (err.code === "23505") {
      return res.status(409).json({ error: "That certificate number is already in use" });
    }
    next(err);
  }
}

module.exports = { listPucRecords, createPucRecord };
