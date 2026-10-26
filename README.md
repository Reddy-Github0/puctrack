# PUCTrack

AI-Based Vehicle Emission & Compliance System — unifies PUC certificate
tracking, fine management, parking allocation, and a rule-based EcoScore
into one platform, with role-based Admin/User dashboards and backend-enforced,
vehicle-level data isolation.

## Stack
- **Frontend:** React 18 + Vite + Tailwind CSS, React Router
- **Backend:** Node.js + Express, plain SQL via `pg`
- **Database:** PostgreSQL
- **Auth:** JWT, bcrypt-hashed passwords, role (`user` / `admin`)

## Folder structure
```
puctrack/
├── server/                  Express API
│   ├── config/db.js         PostgreSQL connection pool
│   ├── middleware/          authenticate.js, authorize.js (role + ownership)
│   ├── routes/               one file per resource
│   ├── controllers/          one file per resource
│   ├── utils/                pucStatus.js, ecoscore.js (pure business logic)
│   ├── db/schema.sql         table definitions
│   ├── db/runSeed.js         demo data loader
│   └── server.js             app entry point
└── client/                  React app
    ├── src/api/client.js     fetch wrapper (attaches JWT)
    ├── src/context/          AuthContext
    ├── src/pages/            Login, Register, UserDashboard, AdminDashboard
    └── src/components/       shared/, user/, admin/
```

See `SETUP.md` for how to run this locally, step by step.
