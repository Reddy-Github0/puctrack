function wrap(title, bodyHtml) {
  return `
  <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
    <div style="background:#1F6F54; padding:20px 24px; border-radius:8px 8px 0 0;">
      <p style="color:#fff; font-size:18px; font-weight:bold; margin:0;">PUCTrack</p>
    </div>
    <div style="border:1px solid #DDE5E1; border-top:none; padding:24px; border-radius:0 0 8px 8px;">
      <h2 style="margin-top:0; color:#16231F; font-size:16px;">${title}</h2>
      ${bodyHtml}
      <p style="margin-top:24px; font-size:12px; color:#5B6B65;">
        This is an automated message from PUCTrack. Please do not reply to this email.
      </p>
    </div>
  </div>`;
}

function fineIssuedEmail({ ownerName, regNumber, reason, amount }) {
  return wrap(
    "A new fine has been issued",
    `<p style="color:#16231F;">Hi ${ownerName},</p>
     <p style="color:#16231F;">A fine has been issued against your vehicle <b>${regNumber}</b>:</p>
     <p style="background:#FAE6E4; color:#B23A2E; padding:10px 14px; border-radius:6px;">
       ${reason} — <b>₹${amount}</b>
     </p>
     <p style="color:#16231F;">Log in to PUCTrack to view details and pay.</p>`
  );
}

function pucExpiryEmail({ ownerName, regNumber, expiryDate, daysLeft }) {
  const urgency = daysLeft < 0 ? `expired ${Math.abs(daysLeft)} days ago` : `expires in ${daysLeft} days`;
  return wrap(
    "Your PUC certificate needs attention",
    `<p style="color:#16231F;">Hi ${ownerName},</p>
     <p style="color:#16231F;">Your vehicle <b>${regNumber}</b>'s PUC certificate ${urgency} (${new Date(
      expiryDate
    ).toLocaleDateString()}).</p>
     <p style="color:#16231F;">Please book a testing slot soon to stay compliant.</p>`
  );
}

module.exports = { fineIssuedEmail, pucExpiryEmail };
