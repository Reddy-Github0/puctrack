const { query } = require("../config/db");
const PDFDocument = require("pdfkit");
const { sendMail } = require("../utils/mailer");
const { fineIssuedEmail } = require("../utils/emailTemplates");
const { logAction } = require("../utils/auditLog");

async function listFinesForVehicle(req, res, next) {
  try {
    const { rows } = await query(
      "SELECT * FROM fines WHERE vehicle_id = $1 ORDER BY issued_at DESC",
      [req.params.vehicleId]
    );
    res.json({ fines: rows });
  } catch (err) {
    next(err);
  }
}

/** Admin-only: issue a fine against a vehicle. */
async function createFine(req, res, next) {
  try {
    const { reason, amount } = req.body;
    if (!reason || amount === undefined) {
      return res.status(400).json({ error: "reason and amount are required" });
    }

    const { rows } = await query(
      `INSERT INTO fines (vehicle_id, reason, amount, issued_by)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [req.params.vehicleId, reason, amount, req.user.id]
    );
    const fine = rows[0];

    // Look up who to notify. This failing shouldn't fail the fine creation
    // itself, so it's a best-effort side effect, not part of the transaction.
    const { rows: ownerRows } = await query(
      `SELECT v.reg_number, u.name AS owner_name, u.email AS owner_email
       FROM vehicles v JOIN users u ON u.id = v.owner_id WHERE v.id = $1`,
      [req.params.vehicleId]
    );
    if (ownerRows[0]) {
      const o = ownerRows[0];
      sendMail({
        to: o.owner_email,
        subject: `PUCTrack: New fine issued for ${o.reg_number}`,
        html: fineIssuedEmail({ ownerName: o.owner_name, regNumber: o.reg_number, reason, amount }),
      }).catch(() => {});
    }

    await logAction(req.user.id, "fine_issued", "fine", fine.id, {
      vehicle_id: req.params.vehicleId,
      reason,
      amount,
    });

    res.status(201).json({ fine });
  } catch (err) {
    next(err);
  }
}

/**
 * Marks a fine as paid. In place of a real payment gateway this stamps a
 * mock qr_ref — the UPI/QR integration point noted as future work in
 * the project's system-requirements slide plugs in right here.
 */
async function payFine(req, res, next) {
  try {
    const { rows: fineRows } = await query("SELECT * FROM fines WHERE id = $1", [req.params.fineId]);
    const fine = fineRows[0];
    if (!fine) return res.status(404).json({ error: "Fine not found" });

    if (req.user.role !== "admin") {
      const { rows: vehicleRows } = await query("SELECT owner_id FROM vehicles WHERE id = $1", [fine.vehicle_id]);
      if (vehicleRows[0]?.owner_id !== req.user.id) {
        return res.status(403).json({ error: "This fine doesn't belong to your vehicle" });
      }
    }
    if (fine.status === "paid") {
      return res.status(409).json({ error: "This fine is already paid" });
    }

    const mockQrRef = `QR-${Date.now().toString(36).toUpperCase()}`;
    const { rows } = await query(
      `UPDATE fines SET status = 'paid', paid_at = now(), qr_ref = $2 WHERE id = $1 RETURNING *`,
      [req.params.fineId, mockQrRef]
    );

    await logAction(req.user.id, "fine_paid", "fine", fine.id, {
      vehicle_id: fine.vehicle_id,
      amount: fine.amount,
    });

    res.json({ fine: rows[0] });
  } catch (err) {
    next(err);
  }
}

/**
 * Streams a simple PDF receipt for a paid fine. Only the fine's owner
 * (or an admin) can fetch it, and only once it's actually paid.
 */
async function getReceipt(req, res, next) {
  try {
    const { rows } = await query(
      `SELECT f.*, v.reg_number, v.model, u.name AS owner_name, u.email AS owner_email
       FROM fines f
       JOIN vehicles v ON v.id = f.vehicle_id
       JOIN users u ON u.id = v.owner_id
       WHERE f.id = $1`,
      [req.params.fineId]
    );
    const fine = rows[0];
    if (!fine) return res.status(404).json({ error: "Fine not found" });

    if (req.user.role !== "admin") {
      const { rows: vRows } = await query("SELECT owner_id FROM vehicles WHERE id = $1", [fine.vehicle_id]);
      if (vRows[0]?.owner_id !== req.user.id) {
        return res.status(403).json({ error: "This receipt isn't yours" });
      }
    }
    if (fine.status !== "paid") {
      return res.status(409).json({ error: "This fine hasn't been paid yet" });
    }

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="receipt-FN-${fine.id}.pdf"`);

    const doc = new PDFDocument({ size: "A4", margin: 50 });
    doc.pipe(res);

    doc.rect(0, 0, doc.page.width, 90).fill("#1F6F54");
    doc.fillColor("#FFFFFF").fontSize(22).font("Helvetica-Bold").text("PUCTrack", 50, 32);
    doc.fontSize(11).font("Helvetica").text("Payment Receipt", 50, 60);

    doc.fillColor("#16231F").moveDown(4);
    doc.fontSize(10).fillColor("#5B6B65").text(`Receipt for fine FN-${fine.id}`, 50, 120);
    doc.fontSize(10).text(`Issued on ${new Date().toLocaleDateString()}`, { align: "right" });

    const rowsData = [
      ["Vehicle", `${fine.reg_number}${fine.model ? " — " + fine.model : ""}`],
      ["Owner", `${fine.owner_name} (${fine.owner_email})`],
      ["Reason", fine.reason],
      ["Amount paid", `Rs. ${fine.amount}`],
      ["Payment reference", fine.qr_ref || "—"],
      ["Paid on", fine.paid_at ? new Date(fine.paid_at).toLocaleString() : "—"],
      ["Issued on", new Date(fine.issued_at).toLocaleString()],
    ];

    let y = 160;
    rowsData.forEach(([label, value], i) => {
      if (i % 2 === 0) {
        doc.rect(50, y - 6, 495, 26).fill("#F3F6F5");
      }
      doc.fillColor("#5B6B65").fontSize(10).font("Helvetica").text(label, 60, y, { width: 150 });
      doc.fillColor("#16231F").fontSize(10).font("Helvetica-Bold").text(String(value), 220, y, { width: 310 });
      y += 26;
    });

    doc.moveDown(4);
    doc
      .fontSize(9)
      .fillColor("#5B6B65")
      .font("Helvetica")
      .text(
        "This is a system-generated receipt from PUCTrack — an integrated vehicle PUC, fine, and parking management platform.",
        50,
        y + 20,
        { width: 495 }
      );

    doc.end();
  } catch (err) {
    next(err);
  }
}

module.exports = { listFinesForVehicle, createFine, payFine, getReceipt };
