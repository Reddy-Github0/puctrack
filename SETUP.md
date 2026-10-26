# Running PUCTrack on your PC — step by step

You need three things installed first: **Node.js** (v18+), **PostgreSQL**
(v14+), and a code editor (VS Code is fine). If `node -v` and `psql --version`
both print a version in a terminal, you're set — skip to Step 1.

- Node.js: https://nodejs.org (LTS version)
- PostgreSQL: https://www.postgresql.org/download/ (on Windows the installer
  also sets up **pgAdmin**, a GUI you can use instead of the command line
  for the database steps below)

---

## Step 1 — Unzip the project

Unzip `puctrack.zip` anywhere, e.g. `Documents/puctrack`. You'll get:
```
puctrack/
  server/
  client/
  README.md
```

## Step 2 — Create the database

Open a terminal (or pgAdmin's Query Tool) and create an empty database:

```bash
psql -U postgres -c "CREATE DATABASE puctrack;"
```
It'll ask for the postgres password you set during install.

Now load the schema (tables):
```bash
cd puctrack/server
psql -U postgres -d puctrack -f db/schema.sql
```
You should see a stream of `DROP TABLE` / `CREATE TABLE` / `CREATE INDEX`
lines with no errors.

> **Updating an existing install?** `schema.sql` now includes an `audit_log`
> table. Just re-run the same command above — it drops and recreates every
> table from scratch, so your seed data will need reloading too (Step 4).

## Step 3 — Configure the backend

```bash
cd puctrack/server
cp .env.example .env
```
Open `.env` in your editor and fill in:
- `PGPASSWORD` — the postgres password you used above
- `JWT_SECRET` — any long random string (e.g. mash your keyboard)
- `EMAIL_USER` / `EMAIL_PASS` — **optional.** Leave blank and the app runs
  fine — it just logs "would have sent email" to the server console instead
  of actually emailing anyone. To send real emails, use a Gmail account with
  an **App Password** (Google Account → Security → App Passwords, needs
  2-Step Verification turned on first), and put that app password in
  `EMAIL_PASS` — not your normal Gmail password.

Leave the rest as-is unless you changed the default Postgres port/user.

## Step 4 — Install and seed the backend

```bash
npm install
npm run seed
```
`npm run seed` fills the database with a demo admin, three vehicle owners,
their vehicles, PUC records, fines, and parking slots. It prints two demo
logins when it finishes — keep those handy.

## Step 5 — Start the backend

```bash
npm run dev
```
You should see `PUCTrack API listening on http://localhost:5000`.
Leave this terminal running. Open a **second terminal** for the frontend.

## Step 6 — Install and start the frontend

```bash
cd puctrack/client
npm install
npm run dev
```
You should see Vite print `Local: http://localhost:5173/`.

## Step 7 — Open it

Go to **http://localhost:5173** in your browser.

- Log in as the seeded **admin**: `admin@puctrack.in` / `password123` — you'll
  land on the Admin dashboard (fleet table, stats, issue-fine action).
- Log in as the seeded **owner**: `mahender@example.com` / `password123` — you'll
  see their PUC card (expiring soon), fines, EcoScore, and parking.
- Or click **Create an account** to register a brand-new vehicle owner and
  add a vehicle from the dashboard.

---

## Troubleshooting

| Problem | Likely fix |
|---|---|
| Backend prints `ECONNREFUSED 127.0.0.1:5432` | PostgreSQL isn't running — start the Postgres service, or check `PGPORT`/`PGHOST` in `.env` |
| Backend prints `password authentication failed` | `PGPASSWORD` in `.env` doesn't match your Postgres password |
| Frontend loads but every request fails / CORS error | Backend isn't running, or `CLIENT_ORIGIN` in `server/.env` doesn't match `http://localhost:5173` |
| `npm run seed` fails with "relation does not exist" | Run Step 2's `schema.sql` command again — the tables don't exist yet |
| Port 5000 or 5173 already in use | Something else is using it — change `PORT` in `server/.env`, or stop the other process |

## What to demo tomorrow
1. Log in as admin → show the fleet table and issue a fine live.
2. Log in as the owner whose vehicle just got fined → show it appear, pay it,
   watch the EcoScore respond.
3. Show the PUC card for the vehicle that's expiring in 8 days (seeded on
   purpose) — that's your "automated compliance visibility" claim, live.
4. Book a parking slot as the owner, then show it flip to occupied on the
   admin's live occupancy grid.
