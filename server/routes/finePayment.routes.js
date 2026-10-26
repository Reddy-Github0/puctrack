const express = require("express");
const router = express.Router();

const authenticate = require("../middleware/authenticate");
const { payFine, getReceipt } = require("../controllers/fines.controller");

router.use(authenticate);

// PATCH /api/fines/:fineId/pay
router.patch("/:fineId/pay", payFine);
// GET /api/fines/:fineId/receipt
router.get("/:fineId/receipt", getReceipt);

module.exports = router;
