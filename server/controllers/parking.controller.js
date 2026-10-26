const { query } = require("../config/db");
const { logAction } = require("../utils/auditLog");

async function listSlots(req, res, next) {
  try {
    const { rows } = await query("SELECT * FROM parking_slots ORDER BY location, slot_no");
    res.json({ slots: rows });
  } catch (err) {
    next(err);
  }
}

/** Books a free slot for a vehicle the caller owns (or any vehicle, if admin). */
async function createBooking(req, res, next) {
  const client = await require("../config/db").pool.connect();
  try {
    const { slot_id, vehicle_id } = req.body;
    if (!slot_id || !vehicle_id) {
      return res.status(400).json({ error: "slot_id and vehicle_id are required" });
    }

    if (req.user.role !== "admin") {
      const { rows } = await query("SELECT owner_id FROM vehicles WHERE id = $1", [vehicle_id]);
      if (rows[0]?.owner_id !== req.user.id) {
        return res.status(403).json({ error: "You can only book parking for your own vehicle" });
      }
    }

    await client.query("BEGIN");
    const { rows: slotRows } = await client.query(
      "SELECT * FROM parking_slots WHERE id = $1 FOR UPDATE",
      [slot_id]
    );
    const slot = slotRows[0];
    if (!slot) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Slot not found" });
    }
    if (slot.status !== "free") {
      await client.query("ROLLBACK");
      return res.status(409).json({ error: "That slot is already occupied" });
    }

    await client.query("UPDATE parking_slots SET status = 'occupied' WHERE id = $1", [slot_id]);
    const { rows: bookingRows } = await client.query(
      `INSERT INTO parking_bookings (slot_id, vehicle_id) VALUES ($1, $2) RETURNING *`,
      [slot_id, vehicle_id]
    );
    await client.query("COMMIT");

    await logAction(req.user.id, "parking_booked", "parking_booking", bookingRows[0].id, {
      slot_id,
      vehicle_id,
    });

    res.status(201).json({ booking: bookingRows[0] });
  } catch (err) {
    await client.query("ROLLBACK");
    next(err);
  } finally {
    client.release();
  }
}

/** Ends a booking and frees the slot back up. */
async function endBooking(req, res, next) {
  const client = await require("../config/db").pool.connect();
  try {
    await client.query("BEGIN");
    const { rows } = await client.query(
      "SELECT * FROM parking_bookings WHERE id = $1 FOR UPDATE",
      [req.params.bookingId]
    );
    const booking = rows[0];
    if (!booking) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Booking not found" });
    }

    if (req.user.role !== "admin") {
      const { rows: vRows } = await client.query("SELECT owner_id FROM vehicles WHERE id = $1", [booking.vehicle_id]);
      if (vRows[0]?.owner_id !== req.user.id) {
        await client.query("ROLLBACK");
        return res.status(403).json({ error: "This booking isn't yours" });
      }
    }

    await client.query(
      "UPDATE parking_bookings SET status = 'completed', end_time = now() WHERE id = $1",
      [req.params.bookingId]
    );
    await client.query("UPDATE parking_slots SET status = 'free' WHERE id = $1", [booking.slot_id]);
    await client.query("COMMIT");

    res.json({ message: "Booking ended, slot freed" });
  } catch (err) {
    await client.query("ROLLBACK");
    next(err);
  } finally {
    client.release();
  }
}

module.exports = { listSlots, createBooking, endBooking };
