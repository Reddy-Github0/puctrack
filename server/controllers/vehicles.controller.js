const { query } = require("../config/db");
const { getPucStatus, daysUntil } = require("../utils/pucStatus");
const { logAction } = require("../utils/auditLog");

/** List vehicles: a user sees only their own, an admin sees everyone's. */
async function listVehicles(req, res, next) {
  try {
    const isAdmin = req.user.role === "admin";
    const sql = `
      SELECT v.id, v.reg_number, v.vehicle_type, v.model, v.owner_id,
             u.name AS owner_name,
             p.certificate_no, p.issue_date, p.expiry_date,
             COALESCE(f.unpaid_count, 0) AS unpaid_fine_count
      FROM vehicles v
      JOIN users u ON u.id = v.owner_id
      LEFT JOIN LATERAL (
        SELECT certificate_no, issue_date, expiry_date
        FROM puc_records
        WHERE vehicle_id = v.id
        ORDER BY expiry_date DESC
        LIMIT 1
      ) p ON true
      LEFT JOIN LATERAL (
        SELECT COUNT(*)::int AS unpaid_count
        FROM fines
        WHERE vehicle_id = v.id AND status = 'unpaid'
      ) f ON true
      ${isAdmin ? "" : "WHERE v.owner_id = $1"}
      ORDER BY v.id
    `;
    const { rows } = await query(sql, isAdmin ? [] : [req.user.id]);

    const vehicles = rows.map((v) => ({
      ...v,
      puc_status: v.expiry_date ? getPucStatus(v.expiry_date) : "no_record",
      days_until_expiry: v.expiry_date ? daysUntil(v.expiry_date) : null,
    }));

    res.json({ vehicles });
  } catch (err) {
    next(err);
  }
}

async function getVehicle(req, res, next) {
  try {
    const { rows } = await query(
      `SELECT v.*, u.name AS owner_name FROM vehicles v JOIN users u ON u.id = v.owner_id WHERE v.id = $1`,
      [req.params.vehicleId]
    );
    if (rows.length === 0) return res.status(404).json({ error: "Vehicle not found" });
    res.json({ vehicle: rows[0] });
  } catch (err) {
    next(err);
  }
}

/** A signed-in user registers a vehicle under their own account. */
async function createVehicle(req, res, next) {
  try {
    const { reg_number, vehicle_type, model } = req.body;
    if (!reg_number) return res.status(400).json({ error: "reg_number is required" });

    const ownerId = req.user.role === "admin" && req.body.owner_id ? req.body.owner_id : req.user.id;

    const { rows } = await query(
      `INSERT INTO vehicles (owner_id, reg_number, vehicle_type, model)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [ownerId, reg_number, vehicle_type || "car", model || null]
    );

    await logAction(
      req.user.id,
      req.user.role === "admin" ? "vehicle_registered_by_admin" : "vehicle_self_registered",
      "vehicle",
      rows[0].id,
      { reg_number, owner_id: ownerId }
    );

    res.status(201).json({ vehicle: rows[0] });
  } catch (err) {
    if (err.code === "23505") {
      return res.status(409).json({ error: "A vehicle with that registration number already exists" });
    }
    next(err);
  }
}

module.exports = { listVehicles, getVehicle, createVehicle };
