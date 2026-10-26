const EXPIRING_WINDOW_DAYS = 14;

/**
 * Derives a PUC status label from an expiry date, computed at read time
 * so it's always accurate against "today" rather than a stale stored value.
 * @param {string|Date} expiryDate
 * @returns {'valid'|'expiring'|'expired'}
 */
function getPucStatus(expiryDate) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);

  const daysLeft = Math.round((expiry - today) / (1000 * 60 * 60 * 24));

  if (daysLeft < 0) return "expired";
  if (daysLeft <= EXPIRING_WINDOW_DAYS) return "expiring";
  return "valid";
}

function daysUntil(expiryDate) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);
  return Math.round((expiry - today) / (1000 * 60 * 60 * 24));
}

module.exports = { getPucStatus, daysUntil, EXPIRING_WINDOW_DAYS };
