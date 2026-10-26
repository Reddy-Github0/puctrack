const express = require("express");
// mergeParams lets this router read :vehicleId from the parent mount path
const router = express.Router({ mergeParams: true });

const authenticate = require("../middleware/authenticate");
const { requireRole, requireVehicleOwnership } = require("../middleware/authorize");
const { listPucRecords, createPucRecord } = require("../controllers/puc.controller");

router.use(authenticate);

router.get("/", requireVehicleOwnership(), listPucRecords);
router.post("/", requireRole("admin"), createPucRecord);

module.exports = router;
