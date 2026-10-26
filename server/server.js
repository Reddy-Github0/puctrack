require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const cron = require("node-cron");

const authRoutes = require("./routes/auth.routes");
const vehicleRoutes = require("./routes/vehicles.routes");
const pucRoutes = require("./routes/puc.routes");
const finesRoutes = require("./routes/fines.routes");
const finePaymentRoutes = require("./routes/finePayment.routes");
const parkingRoutes = require("./routes/parking.routes");
const ecoscoreRoutes = require("./routes/ecoscore.routes");
const adminRoutes = require("./routes/admin.routes");
const { sendExpiryReminders } = require("./utils/notifications");

const app = express();

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(cors({ origin: process.env.CLIENT_ORIGIN || "http://localhost:5173" }));
app.use(express.json());
app.use(morgan("dev"));

// Security hardening: a tight limiter on auth endpoints (brute-force / credential
// stuffing protection) and a looser general limiter on the rest of the API.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many attempts from this IP. Please try again in a few minutes." },
});
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests. Please slow down." },
});

app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);
app.use("/api", apiLimiter);

app.get("/api/health", (req, res) => res.json({ status: "ok" }));

app.use("/api/auth", authRoutes);
app.use("/api/vehicles", vehicleRoutes);
// Nested resources: /api/vehicles/:vehicleId/puc, /fines, /ecoscore
app.use("/api/vehicles/:vehicleId/puc", pucRoutes);
app.use("/api/vehicles/:vehicleId/fines", finesRoutes);
app.use("/api/vehicles/:vehicleId/ecoscore", ecoscoreRoutes);
app.use("/api/fines", finePaymentRoutes);
app.use("/api/parking", parkingRoutes);
app.use("/api/admin", adminRoutes);

app.use((req, res) => res.status(404).json({ error: "Not found" }));

// Centralized error handler — every controller calls next(err) on failure
// instead of formatting its own 500 response.
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || "Something went wrong" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`PUCTrack API listening on http://localhost:${PORT}`));

// Daily sweep at 8:00 AM server time — emails owners of any vehicle whose
// PUC is expiring within the window or already expired. The admin dashboard
// also exposes a manual "send reminders now" button that runs this same
// logic on demand (see admin.controller.js -> triggerExpiryReminders).
cron.schedule("0 8 * * *", () => {
  console.log("[cron] Running daily PUC expiry reminder sweep…");
  sendExpiryReminders()
    .then((r) => console.log(`[cron] Expiry reminders: checked ${r.checked}, sent ${r.sent}, failed ${r.failed}`))
    .catch((err) => console.error("[cron] Expiry reminder sweep failed:", err));
});
