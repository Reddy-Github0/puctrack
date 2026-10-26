const express = require("express");
const router = express.Router();

const authenticate = require("../middleware/authenticate");
const { listSlots, createBooking, endBooking } = require("../controllers/parking.controller");

router.use(authenticate);

router.get("/slots", listSlots);
router.post("/bookings", createBooking);
router.patch("/bookings/:bookingId/end", endBooking);

module.exports = router;
