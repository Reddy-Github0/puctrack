const nodemailer = require("nodemailer");

let transporter = null;
let attempted = false;

/**
 * Lazily builds the SMTP transporter. Returns null (rather than throwing)
 * if EMAIL_USER/EMAIL_PASS aren't set, so the app runs fine without email
 * configured — sendMail() just logs to the console instead.
 */
function getTransporter() {
  if (attempted) return transporter;
  attempted = true;

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log("[mailer] EMAIL_USER/EMAIL_PASS not set — emails will be logged, not sent.");
    return null;
  }

  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || "smtp.gmail.com",
    port: Number(process.env.EMAIL_PORT) || 587,
    secure: false,
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
  });
  return transporter;
}

/**
 * Sends an email, or logs what would have been sent if SMTP isn't configured.
 * Never throws — callers can fire-and-forget without wrapping in try/catch,
 * so a broken mail server never breaks the request that triggered the email.
 */
async function sendMail({ to, subject, html }) {
  const t = getTransporter();
  if (!t) {
    console.log(`[mailer] (not configured) would send "${subject}" to ${to}`);
    return { sent: false, reason: "not_configured" };
  }
  try {
    await t.sendMail({ from: process.env.EMAIL_FROM || process.env.EMAIL_USER, to, subject, html });
    return { sent: true };
  } catch (err) {
    console.error("[mailer] send failed:", err.message);
    return { sent: false, reason: err.message };
  }
}

module.exports = { sendMail };
