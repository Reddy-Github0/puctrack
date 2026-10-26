const express = require("express");
const router = express.Router({ mergeParams: true }); // nested under /vehicles/:vehicleId/fines

const authenticate = require("../middleware/authenticate");
const { requireRole, requireVehicleOwnership } = require("../middleware/authorize");
const { listFinesForVehicle, createFine } = require("../controllers/fines.controller");

router.use(authenticate);

router.get("/", requireVehicleOwnership(), listFinesForVehicle);
router.post("/", requireRole("admin"), createFine);

module.exports = router;
