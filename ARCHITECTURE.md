# Ultra Pro Max Hackathon Platform — Architecture

## 1. System Topology

The platform is designed as a **Modular Monolith** built on **Next.js (App Router)** with **Prisma ORM** and **Neon PostgreSQL**.

```
                           NEXT.JS APP ROUTER
                                    │
           ┌────────────────────────┼────────────────────────┐
           ↓                        ↓                        ↓
      PUBLIC PLATFORM          DASHBOARDS                REST API
     (/, /hackathons,       (/participant,           (/api/v1/*)
      /explore, /projects)   /organizer,
                             /judge, /admin)
           │                        │                        │
           └────────────────────────┴────────────────────────┘
                                    │
                                    ↓
                           SERVER ACTION / ROUTE
                                    │
                                    ↓
                         DOMAIN SERVICES & ENGINES
    (Assignment, Rubric, Scoring, Normalization, Result, AI Jury, Calibration)
                                    │
                                    ↓
                               REPOSITORIES
    (User, Hackathon, Team, Project, Submission, Judge, Evaluation, Result, AI)
                                    │
                                    ↓
                                PRISMA ORM
                                    │
                                    ↓
                             NEON POSTGRESQL
```

## 2. Core Architectural Principles

1. **Strict Layer Flow:**
   - `UI Component` -> `Route Handler / Server Action` -> `Domain Service` -> `Repository` -> `Prisma` -> `Neon PostgreSQL`.
   - Never query database or Prisma directly inside UI components.
   - Keep Route Handlers thin: validate request body via Zod, enforce auth & permissions, delegate to domain services, return standardized JSON responses.

2. **Database Engine (Neon PostgreSQL):**
   - Direct connection (`DIRECT_URL`) for running schema migrations safely.
   - Pooled connection (`DATABASE_URL` with `?pgbouncer=true&sslmode=require`) for Next.js App Router and serverless workloads.

3. **Domain Engine Independence:**
   - **Assignment Engine:** Responsible for matching projects to judges based on workload, availability, track expertise, and conflict-of-interest filters.
   - **Judging Engine:** Isolated evaluation workspace where judges submit criterion-level scores and qualitative feedback.
   - **Scoring & Normalization Engine:** Transforms raw criterion scores into weighted totals and applies statistical normalization (Z-Score, Min-Max, Trimmed Mean).
   - **Result & Verification Engine:** Applies leaderboard rules, ranks projects with deterministic tiebreakers, maps prize categories, executes anomaly checks, and manages explicit publication states.
   - **Community Signal Engine:** Manages 1-vote-per-user voting and moderated comments feed, kept strictly separate from official judge evaluation scores.
   - **AI Jury Subsystem:** Autonomous evaluation engine that extracts structural repository evidence, inspects code quality, evaluates rubrics, and logs confidence metrics.
   - **AI Calibration Pipeline:** Compares AI Jury scores against historical human scores to calculate MAE, RMSE, and agreement rates, tuning prompts and bias offsets over versioned datasets.

## 3. Role Boundaries

| Role | Scope | Key Capabilities |
| :--- | :--- | :--- |
| **ADMIN** | Platform-Wide | Manage users, platform settings, audit logs, system health, calibration datasets. |
| **ORGANIZER** | Event-Scoped | Configure hackathon, tracks, problem statements, rubrics, manage registrations, assign judges, generate & publish results, moderate comments. |
| **JUDGE** | Assignment-Scoped | Access strictly assigned projects, submit criterion evaluations, record qualitative notes. |
| **PARTICIPANT** | Team/Project-Scoped | Register for event, create/join teams, choose problem statements, submit project deliverables, view personal official results. |
| **COMMUNITY** | Authenticated User | Browse public project gallery, cast 1-vote-per-project, post and manage own comments. |
| **PUBLIC** | Unauthenticated | Explore hackathons, browse published project gallery, inspect published leaderboard. |
