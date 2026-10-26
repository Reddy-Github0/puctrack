const { getPucStatus } = require("./pucStatus");

/**
 * Rule-based EcoScore (0-100), computed from data already in the system.
 * Kept deliberately simple and explainable for Review 1 — the factors_json
 * breakdown is what a future ML model would eventually replace/augment.
 */
function computeEcoScore({ pucExpiryDate, unpaidFineCount, totalFineCount }) {
  let score = 100;
  const factors = {};

  if (pucExpiryDate) {
    const status = getPucStatus(pucExpiryDate);
    const penalty = { valid: 0, expiring: 5, expired: 25 }[status];
    score -= penalty;
    factors.puc_status = { status, penalty };
  }

  const finePenalty = Math.min(unpaidFineCount * 10, 30);
  score -= finePenalty;
  factors.unpaid_fines = { count: unpaidFineCount, penalty: finePenalty };

  if (totalFineCount === 0) {
    score += 5;
    factors.clean_record_bonus = 5;
  }

  score = Math.max(0, Math.min(100, Math.round(score)));
  return { score, factors };
}

module.exports = { computeEcoScore };
