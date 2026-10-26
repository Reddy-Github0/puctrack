const express = require("express");
const router = express.Router();

const authenticate = require("../middleware/authenticate");
const { requireRole } = require("../middleware/authorize");
const {
  getStats,
  listUsers,
  createUser,
  getFinesTimeline,
  listAuditLog,
  triggerExpiryReminders,
} = require("../controllers/admin.controller");

router.use(authenticate, requireRole("admin"));
router.get("/stats", getStats);
router.get("/users", listUsers);
router.post("/users", createUser);
router.get("/analytics/fines-timeline", getFinesTimeline);
router.get("/audit-log", listAuditLog);
router.post("/notifications/send-expiry-reminders", triggerExpiryReminders);

module.exports = router;
