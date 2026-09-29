# ATLYX — Competition Arena Platform

An enterprise-grade hackathon management, competition, judging, and evaluation platform built on a clean **Modular Monolith** architecture with **Next.js (App Router)** and **Prisma ORM**.

---

## 🏛️ Architecture Overview

- **Frontend & UI:** Next.js (App Router, Server Components, Route Handlers, React 18, Tailwind CSS)
- **Backend & REST APIs:** Next.js Route Handlers (`/api/v1/...`) with centralized RBAC guards and validation
- **Realtime Gateway:** Standalone WebSocket server for live leaderboard sync and deadline countdowns
- **Database:** Local Database support (PostgreSQL and MongoDB services with persistent Docker volumes)
- **ORM:** Prisma ORM with automated schema push and type-safe clients

---

## 🐳 Docker Compose & Local Setup

### 1. Prerequisites
- **Docker & Docker Compose** (for containerized deployment)
- **Node.js 18+** & **npm** (for local development)

### 2. Environment Setup
Copy the example environment configuration into `.env`:
```bash
cp .env.example .env
```
Ensure your `.env` contains:
```env
# Local Database Connection
DATABASE_URL="postgresql://postgres:postgrespassword@localhost:5433/dogfood?schema=public"
DIRECT_URL="postgresql://postgres:postgrespassword@localhost:5433/dogfood?schema=public"

# MongoDB URI (For Docker Compose or Local MongoDB service)
MONGODB_URI="mongodb://localhost:27017/dogfood"

# Authentication Secrets
JWT_SECRET="dev-jwt-secret-key-at-least-32-characters-long-12345"
SESSION_EXPIRY="7d"

# App URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NODE_ENV="development"
```

---

### 3. Running with Docker Compose

#### Start the Full Stack (Build & Up)
```bash
docker compose up --build
```
Or start in the background (detached):
```bash
docker compose up -d
```

#### Application Services & URLs
- **Web Application (Frontend):** [http://localhost:3000](http://localhost:3000)
- **REST APIs (Backend):** [http://localhost:3000/api/v1](http://localhost:3000/api/v1)
- **Local PostgreSQL:** `localhost:5432` (`postgres:postgrespassword`, DB: `dogfood`)
- **Local MongoDB:** `localhost:27017` (`mongodb://mongo:27017/dogfood`)

#### View Container Logs
```bash
# View logs from all services in real-time
docker compose logs -f

# View logs from the app service only
docker compose logs -f app
```

#### Stop the Application (Preserving Data)
```bash
docker compose down
```
> [!NOTE]
> Running `docker compose down` safely stops and removes containers while preserving all database records inside the named Docker volumes (`postgres_data` and `mongo_data`).

#### Completely Remove Local Database Data (Clean Slate)
> [!WARNING]
> The following command permanently wipes all database volumes and data.
```bash
docker compose down -v
```

---

### 4. Fixture Data & Seeding

The application imports from the official fixture source of truth:
`fixtures copy.json` (or fallback `fixtures.json`).

#### Automatic Seeding
When running via `docker compose up`, the container entrypoint detects if the database is uninitialized and automatically runs the idempotent import. If data already exists, destructive reseeding is skipped.

#### Manual Reset & Re-Import Command
To reset the hackathon records and re-import from `fixtures copy.json` at any time:

**Inside Docker:**
```bash
docker compose exec app npm run db:reset
```

**Running Locally:**
```bash
npm run db:reset
# or
node scripts/seed.js
```

---

### 5. Running Without Docker (Native Local Mode)

If Docker is unavailable on your system, the application includes a built-in embedded local database daemon:

```bash
# 1. Start local database daemon (port 5433)
npm run db:start

# 2. Push schema and seed fixture data
npx prisma db push
npm run db:seed

# 3. Start Next.js development server
npm run dev

# 4. Stop local database daemon when finished
npm run db:stop
```

---

### 6. Validation & Verification

Verify your local database contains all imported fixture entities:
```bash
node -e "const { PrismaClient } = require('@prisma/client'); const p = new PrismaClient(); Promise.all([p.hackathon.count(), p.track.count(), p.judge.count(), p.team.count(), p.project.count(), p.evaluation.count(), p.user.count()]).then(([h, t, j, tm, pr, ev, u]) => console.log(JSON.stringify({ hackathons: h, tracks: t, judges: j, teams: tm, projects: pr, evaluations: ev, users: u })));"
```
**Expected Count Summary:**
```json
{
  "hackathons": 1,
  "tracks": 8,
  "judges": 30,
  "teams": 41,
  "projects": 41,
  "evaluations": 126,
  "users": 123
}
```

#### Default Credentials:
- **Platform Administrator:** `admin@hackathon.dev` / `Password123!`
- **Event Lead (Organizer):** `organizer@hackathon.dev` / `Password123!`
- **Participant:** `alice.hacker@hackathon.dev` / `Password123!`
- **Judge:** `tomas.varga@example.org` / `Password123!`

---

## 📂 Documentation

- [Architecture & Flow Specification](file:///docs/ARCHITECTURE.md)
- [Data Model & Prisma Schema](file:///docs/DATA-MODEL.md)
- [Judging & Scoring Engine](file:///docs/JUDGING.md)
- [Security & RBAC Controls](file:///docs/SECURITY.md)
