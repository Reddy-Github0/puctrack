const express = require("express");
const router = express.Router();
const authenticate = require("../middleware/authenticate");
const { requireVehicleOwnership } = require("../middleware/authorize");
const { listVehicles, getVehicle, createVehicle } = require("../controllers/vehicles.controller");

router.use(authenticate);

router.get("/", listVehicles);
router.post("/", createVehicle);
router.get("/:vehicleId", requireVehicleOwnership(), getVehicle);

module.exports = router;
