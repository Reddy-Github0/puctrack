/**
 * Populates demo data: one admin, three vehicle owners, their vehicles,
 * PUC records (one valid, one expiring soon, one expired), a couple of
 * fines, and a handful of parking slots. Safe to re-run — it clears the
 * tables it touches first.
 *
 * Usage: npm run seed   (after `psql ... -f db/schema.sql` has been run once)
 */
require("dotenv").config();
const bcrypt = require("bcryptjs");
const { pool } = require("../config/db");

async function seed() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    await client.query(
      "TRUNCATE ecoscore, parking_bookings, parking_slots, fines, puc_records, vehicles, users RESTART IDENTITY CASCADE"
    );

    const passwordHash = await bcrypt.hash("password123", 10);

    const { rows: users } = await client.query(
      `INSERT INTO users (name, email, password_hash, role) VALUES
        ('Admin User', 'admin@puctrack.in', $1, 'admin'),
        ('K. Mahender Reddy', 'mahender@example.com', $1, 'user'),
        ('S. Rithvik Reddy', 'rithvik@example.com', $1, 'user'),
        ('K. Raghuveera Reddy', 'raghuveera@example.com', $1, 'user')
       RETURNING id, email`,
      [passwordHash]
    );
    const byEmail = Object.fromEntries(users.map((u) => [u.email, u.id]));

    const { rows: vehicles } = await client.query(
      `INSERT INTO vehicles (owner_id, reg_number, vehicle_type, model) VALUES
        ($1, 'TS 09 EQ 4471', 'car', 'Honda City ZX - 2021'),
        ($2, 'TS 07 FA 8821', 'car', 'Hyundai Creta - 2022'),
        ($3, 'AP 28 BT 1190', 'bike', 'TVS Apache RTR - 2020')
       RETURNING id, reg_number`,
      [byEmail["mahender@example.com"], byEmail["rithvik@example.com"], byEmail["raghuveera@example.com"]]
    );
    const byReg = Object.fromEntries(vehicles.map((v) => [v.reg_number, v.id]));

    await client.query(
      `INSERT INTO puc_records (vehicle_id, certificate_no, issue_date, expiry_date) VALUES
        ($1, 'PUCC-2026-0417732', CURRENT_DATE - INTERVAL '172 days', CURRENT_DATE + INTERVAL '8 days'),
        ($2, 'PUCC-2027-0091284', CURRENT_DATE - INTERVAL '30 days',  CURRENT_DATE + INTERVAL '150 days'),
        ($3, 'PUCC-2026-0335510', CURRENT_DATE - INTERVAL '210 days', CURRENT_DATE - INTERVAL '45 days')`,
      [byReg["TS 09 EQ 4471"], byReg["TS 07 FA 8821"], byReg["AP 28 BT 1190"]]
    );

    await client.query(
      `INSERT INTO fines (vehicle_id, reason, amount, status, issued_by, issued_at) VALUES
        ($1, 'Emission re-test overdue', 500, 'unpaid', $2, now() - INTERVAL '14 days'),
        ($1, 'PUC not displayed', 300, 'paid', $2, now() - INTERVAL '135 days'),
        ($3, 'Emission re-test overdue', 500, 'unpaid', $2, now() - INTERVAL '10 days'),
        ($3, 'Parking overstay - Lot B4', 150, 'unpaid', $2, now() - INTERVAL '5 days')`,
      [byReg["TS 09 EQ 4471"], byEmail["admin@puctrack.in"], byReg["AP 28 BT 1190"]]
    );

    const { rows: slots } = await client.query(
      `INSERT INTO parking_slots (location, slot_no, status) VALUES
        ('Lot A - Kompally Gate', 'A-12', 'free'),
        ('Lot B - Main Block', 'B-04', 'occupied'),
        ('Lot B - Main Block', 'B-07', 'free'),
        ('Lot C - AIML Block', 'C-19', 'free')
       RETURNING id, slot_no`
    );
    const bySlot = Object.fromEntries(slots.map((s) => [s.slot_no, s.id]));

    await client.query(
      `INSERT INTO parking_bookings (slot_id, vehicle_id, start_time, status) VALUES
        ($1, $2, now() - INTERVAL '2 hours', 'active')`,
      [bySlot["B-04"], byReg["TS 07 FA 8821"]]
    );

    await client.query("COMMIT");
    console.log("Seed complete. Demo login: admin@puctrack.in / password123 (admin)");
    console.log("                          mahender@example.com / password123 (user)");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Seed failed:", err);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
