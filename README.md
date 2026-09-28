# ATLYX — Competition Arena (Ultra Pro Max Platform)

An enterprise-grade hackathon management, competition, judging, and AI-assisted evaluation platform designed with a clean **Modular Monolith** architecture on **Next.js (App Router)**, **Prisma ORM**, and **Neon PostgreSQL**.

---

## 🏛️ Architecture Overview

- **Framework:** Next.js (App Router, Server Components, Route Handlers, Server Actions)
- **Language & Types:** TypeScript with strict type checking
- **Styling:** Tailwind CSS with modern enterprise design system
- **Database:** Neon Serverless PostgreSQL with connection pooling
- **Cache & Session Store:** High-Performance In-Memory Store (Fast caching, active session store, sliding-window rate limiting, and mutex locks)
- **ORM:** Prisma ORM with automated migrations
- **Security:** Argon2id/Bcrypt password hashing, signed JWT sessions with revocation tracking, centralized RBAC
- **AI Subsystem:** Independent AI Jury with structural evidence extraction, AI-Human comparison engine, and versioned calibration pipeline

---

## 🚀 Quick Start

### 1. Prerequisites
- Node.js 18+ (tested on Node 20+)
- Neon PostgreSQL connection string

### 2. Environment Setup
```bash
cp .env.example .env
# Fill in your DATABASE_URL and DIRECT_URL
```

### 3. Install & Initialize
```bash
npm install
npx prisma generate
```

### 4. Run Development Server
```bash
npm run dev
# Open http://localhost:3000
```

---

## 📂 Documentation

- [Architecture & Flow Specification](file:///docs/ARCHITECTURE.md)
- [Data Model & Prisma Schema](file:///docs/DATA-MODEL.md)
- [REST API Specifications](file:///docs/API.md)
- [Judging & Scoring Engine](file:///docs/JUDGING.md)
- [AI Jury & Calibration Subsystem](file:///docs/AI-JURY.md)
- [Results Engine & Community Showcase](file:///docs/RESULTS.md)
- [Security & RBAC Controls](file:///docs/SECURITY.md)
- [Acceptance Verification Suite](file:///acceptance-report.txt)
