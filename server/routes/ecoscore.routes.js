const express = require("express");
const router = express.Router({ mergeParams: true }); // nested under /vehicles/:vehicleId/ecoscore

const authenticate = require("../middleware/authenticate");
const { requireVehicleOwnership } = require("../middleware/authorize");
const { getEcoScore } = require("../controllers/ecoscore.controller");

router.use(authenticate);
router.get("/", requireVehicleOwnership(), getEcoScore);

module.exports = router;
