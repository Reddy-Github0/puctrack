const { query } = require("../config/db");
const { computeEcoScore } = require("../utils/ecoscore");

/** Computed on the fly from current PUC + fine data — nothing to keep in sync. */
async function getEcoScore(req, res, next) {
  try {
    const vehicleId = req.params.vehicleId;

    const { rows: pucRows } = await query(
      "SELECT expiry_date FROM puc_records WHERE vehicle_id = $1 ORDER BY expiry_date DESC LIMIT 1",
      [vehicleId]
    );
    const { rows: fineRows } = await query(
      `SELECT
         COUNT(*) FILTER (WHERE status = 'unpaid')::int AS unpaid_count,
         COUNT(*)::int AS total_count
       FROM fines WHERE vehicle_id = $1`,
      [vehicleId]
    );

    const result = computeEcoScore({
      pucExpiryDate: pucRows[0]?.expiry_date || null,
      unpaidFineCount: fineRows[0].unpaid_count,
      totalFineCount: fineRows[0].total_count,
    });

    res.json({ ecoscore: result });
  } catch (err) {
    next(err);
  }
}

module.exports = { getEcoScore };
