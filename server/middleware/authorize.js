const { query } = require("../config/db");

/** Blocks the request unless req.user.role is one of the allowed roles. */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: "You don't have permission to do that" });
    }
    next();
  };
}

/**
 * Enforces vehicle-level data isolation: admins may touch any vehicle,
 * a regular user may only touch a vehicle they own. This is the backend
 * check that actually guarantees isolation — the frontend hiding a button
 * is not enough on its own.
 *
 * Expects the route to have a :vehicleId param, or override via paramName.
 */
function requireVehicleOwnership(paramName = "vehicleId") {
  return async (req, res, next) => {
    if (req.user.role === "admin") return next();

    const vehicleId = req.params[paramName];
    try {
      const { rows } = await query("SELECT owner_id FROM vehicles WHERE id = $1", [vehicleId]);
      if (rows.length === 0) {
        return res.status(404).json({ error: "Vehicle not found" });
      }
      if (rows[0].owner_id !== req.user.id) {
        return res.status(403).json({ error: "This vehicle doesn't belong to you" });
      }
      next();
    } catch (err) {
      next(err);
    }
  };
}

module.exports = { requireRole, requireVehicleOwnership };
