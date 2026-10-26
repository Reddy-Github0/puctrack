-- PUCTrack database schema
-- Run with: psql -U postgres -d puctrack -f db/schema.sql

DROP TABLE IF EXISTS audit_log CASCADE;
DROP TABLE IF EXISTS ecoscore CASCADE;
DROP TABLE IF EXISTS parking_bookings CASCADE;
DROP TABLE IF EXISTS parking_slots CASCADE;
DROP TABLE IF EXISTS fines CASCADE;
DROP TABLE IF EXISTS puc_records CASCADE;
DROP TABLE IF EXISTS vehicles CASCADE;
DROP TABLE IF EXISTS users CASCADE;

CREATE TABLE users (
  id            SERIAL PRIMARY KEY,
  name          VARCHAR(120) NOT NULL,
  email         VARCHAR(160) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role          VARCHAR(10) NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE vehicles (
  id            SERIAL PRIMARY KEY,
  owner_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reg_number    VARCHAR(20) UNIQUE NOT NULL,
  vehicle_type  VARCHAR(40) NOT NULL DEFAULT 'car',
  model         VARCHAR(80),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE puc_records (
  id              SERIAL PRIMARY KEY,
  vehicle_id      INTEGER NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  certificate_no  VARCHAR(40) UNIQUE NOT NULL,
  issue_date      DATE NOT NULL,
  expiry_date     DATE NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- Status (valid / expiring / expired) is derived from expiry_date at
-- read time in utils/pucStatus.js rather than stored, so it never
-- drifts out of sync with "today".

CREATE TABLE fines (
  id          SERIAL PRIMARY KEY,
  vehicle_id  INTEGER NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  reason      VARCHAR(200) NOT NULL,
  amount      NUMERIC(10, 2) NOT NULL CHECK (amount >= 0),
  status      VARCHAR(10) NOT NULL DEFAULT 'unpaid' CHECK (status IN ('unpaid', 'paid')),
  issued_by   INTEGER REFERENCES users(id),
  issued_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  paid_at     TIMESTAMPTZ,
  qr_ref      VARCHAR(60)
);

CREATE TABLE parking_slots (
  id        SERIAL PRIMARY KEY,
  location  VARCHAR(80) NOT NULL,
  slot_no   VARCHAR(10) NOT NULL,
  status    VARCHAR(10) NOT NULL DEFAULT 'free' CHECK (status IN ('free', 'occupied')),
  UNIQUE (location, slot_no)
);

CREATE TABLE parking_bookings (
  id          SERIAL PRIMARY KEY,
  slot_id     INTEGER NOT NULL REFERENCES parking_slots(id) ON DELETE CASCADE,
  vehicle_id  INTEGER NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  start_time  TIMESTAMPTZ NOT NULL DEFAULT now(),
  end_time    TIMESTAMPTZ,
  status      VARCHAR(10) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled'))
);

CREATE TABLE ecoscore (
  id           SERIAL PRIMARY KEY,
  vehicle_id   INTEGER NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  score        INTEGER NOT NULL CHECK (score BETWEEN 0 AND 100),
  factors_json JSONB NOT NULL DEFAULT '{}',
  computed_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE audit_log (
  id          SERIAL PRIMARY KEY,
  actor_id    INTEGER REFERENCES users(id) ON DELETE SET NULL,
  action      VARCHAR(60) NOT NULL,
  target_type VARCHAR(40),
  target_id   INTEGER,
  details     JSONB NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_vehicles_owner ON vehicles(owner_id);
CREATE INDEX idx_puc_vehicle ON puc_records(vehicle_id);
CREATE INDEX idx_fines_vehicle ON fines(vehicle_id);
CREATE INDEX idx_bookings_vehicle ON parking_bookings(vehicle_id);
CREATE INDEX idx_bookings_slot ON parking_bookings(slot_id);
CREATE INDEX idx_audit_actor ON audit_log(actor_id);
CREATE INDEX idx_audit_created ON audit_log(created_at DESC);
