# ATLYX — Hackathon Submission Deadline + Real-Time WebSocket Workflow
## Architecture, Implementation & Verification Comprehensive Report

---

### Executive Summary

The ATLYX Hackathon Management Platform has been enhanced with an authoritative, server-driven **Submission Deadline and Real-Time WebSocket Notification Architecture**. The platform enforces strict deadline adherence using authoritative server-side time checks, transactional snapshot locking, real-time WebSocket state distribution, automatic REST reconnection synchronization, and client clock drift protection.

---

## 1. System Architecture & Component Responsibilities

```
+-------------------------------------------------------------------------+
|                          ADMIN / ORGANIZER                              |
|   - Configures: submissionOpensAt & submissionDeadline                  |
+------------------------------------+------------------------------------+
                                     |  REST (POST / PATCH /api/v1/hackathons/[id])
                                     v
+-------------------------------------------------------------------------+
|                  BACKEND & DATABASE (SOURCE OF TRUTH)                   |
|   - PostgreSQL (Prisma): UTC subStartTime, subEndTime                   |
|   - SubmissionWindowService: getSubmissionWindowState, assertWindowOpen |
|   - DeadlineSchedulerService: Idempotent event monitor (5s interval)    |
|   - SubmissionLockService: Transactional submission snapshot & lock    |
+-------------------+--------------------------------+--------------------+
                    |                                |
                    | Event Bus                      | REST Authoritative Sync
                    v                                v
+------------------------------------+  +---------------------------------+
|       REALTIME EVENT BUS           |  |       REST CLIENT API           |
|  - RealtimeEventBus (Central)      |  |  - GET /submission-status       |
|  - ApexWebSocketServer (ws:3001)   |  |  - POST /projects/[id]/submit   |
|  - Room: hackathon:{id}            |  |  - Return UTC Server Time       |
+-------------------+----------------+  +----------------+----------------+
                    |                                    |
                    | SUBMISSION_DEADLINE_REACHED        | Synchronize State
                    v                                    v
+-------------------------------------------------------------------------+
|                           PARTICIPANT UI                                |
|   - ParticipantHackathonCard (My Hackathons)                            |
|   - SubmissionCountdown (Server-Offset Drift Protection)                |
|   - Real-time Transition: "Submission Open" -> "Submission Closed"      |
|   - Submit Button Disabled instantly without browser refresh            |
+-------------------------------------------------------------------------+
```

### Separation of Concerns:
- **Backend / Database (`PostgreSQL / Prisma`)**: **Absolute Source of Truth**. Enforces `serverTime >= opensAt && serverTime < deadline` for every submission mutation. Client time is never trusted.
- **REST APIs (`/api/v1/...`)**: **Authoritative Operations & State Reconciliation**. CRUD mutations, snapshot generation, and authoritative state fetching on initial load and reconnects.
- **WebSocket Subsystem (`ApexWebSocketServer / RealtimeEventBus`)**: **Real-Time Acceleration & State Transitions**. Emits discrete lifecycle events (`SUBMISSION_WINDOW_OPENED`, `SUBMISSION_DEADLINE_REACHED`, `SUBMISSION_WINDOW_UPDATED`) to authorized rooms (`hackathon:{id}`, `organizer:{id}`) without countdown spamming.
- **Frontend (`SubmissionCountdown / React`)**: **Presentation & Visual Countdown**. Visual countdown calculated from `(deadline - (localTime + serverOffset))`. Automatically transitions local display when reaching zero and verifies with REST.

---

## 2. State Machine & Lifecycle Transitions

| Operational State | Time Condition (Server Authoritative) | Participant UI Label | Submit Action Button | Backend API Response |
|---|---|---|---|---|
| **`UPCOMING`** | `serverTime < subStartTime` | `⏳ Submission Not Open` | **Disabled** (`Submission Not Open`) | Rejected with `422 SUBMISSION_NOT_OPEN` |
| **`SUBMISSION_OPEN`** | `serverTime >= subStartTime && serverTime < subEndTime` | `🟢 Submission Open` | **Enabled** (`Submit & Lock Project`) | Accepted (Transaction + Snapshot created) |
| **`SUBMISSION_CLOSING_SOON`** *(UI Only)* | `subEndTime - serverTime <= 15m` | `⚠️ Submission Closing Soon` | **Enabled** (`Submit & Lock Project`) | Accepted |
| **`SUBMISSION_CLOSED`** | `serverTime >= subEndTime` | `🔒 Submission Closed` | **Disabled** (`Submission Closed`) | Rejected with `422 SUBMISSION_DEADLINE_PASSED` |
| **`LOCKED`** | Submitted & locked snapshot exists | `🔒 Official Submission Locked` | **Disabled** (`Locked for Evaluation`) | Rejected with `409 SUBMISSION_ALREADY_LOCKED` |

---

## 3. Implementation Details

### 3.1 Database & Schema
- **Model**: `Hackathon` in `prisma/schema.prisma`
- **Fields**:
  - `subStartTime` (`DateTime` UTC) — Authoritative window opening timestamp.
  - `subEndTime` (`DateTime` UTC) — Authoritative deadline cutoff timestamp.
- **Validation**: Schema and application layer enforce `subStartTime < subEndTime`.

### 3.2 Services Added & Enhanced
1. **`SubmissionWindowService`** (`src/server/services/submission-window.service.ts`):
   - `getSubmissionWindowState(hackathon, serverTime)`: Determines authoritative state (`UPCOMING`, `SUBMISSION_OPEN`, `SUBMISSION_CLOSED`).
   - `getSubmissionWindowDetails(hackathon, serverTime)`: Returns window metadata, timing deltas, and `isClosingSoon`.
   - `assertSubmissionWindowOpen(hackathon, serverTime)`: Throws typed error (`SUBMISSION_NOT_OPEN` or `SUBMISSION_DEADLINE_PASSED`) if outside window.
   - `validateWindowDates(subStartTime, subEndTime)`: Validates range ordering.
   - `emitDeadlineReached(hackathonId, deadline)` & `emitWindowOpened(hackathonId, opensAt)`: Dispatches typed realtime events.

2. **`DeadlineSchedulerService`** (`src/server/services/deadline-scheduler.service.ts`):
   - Periodic deadline evaluator running on a 5-second interval.
   - **Idempotency Guard**: Tracks `emittedOpens` and `emittedDeadlines` sets to prevent duplicate event storms.
   - Invalidates cached hackathons on deadline update.

3. **`SubmissionLockService`** (`src/server/services/submission-lock.service.ts`):
   - Integrated `SubmissionWindowService.assertSubmissionWindowOpen(project.hackathon, currentTime)`.
   - Server-time evaluation executed immediately inside transaction pipeline before snapshot generation.

4. **`SubmissionValidator`** (`src/server/services/submission-validator.service.ts`):
   - Strictly enforces `currentTime < subStartTime` -> `SUBMISSION_NOT_OPEN` and `currentTime >= subEndTime` -> `SUBMISSION_DEADLINE_PASSED`.

### 3.3 REST API Endpoints
1. **`GET /api/v1/hackathons/[id]/submission-status`**:
   - Returns authoritative status, timestamps, and serverTime for client sync.
2. **`GET /api/v1/hackathons/[id]`**:
   - Includes full `submissionWindow` details object.
3. **`PATCH /api/v1/hackathons/[id]`**:
   - Enforces RBAC & Organizer isolation (`canOrganizerAccessHackathon`).
   - Validates `subStartTime < subEndTime`.
   - Records `SUBMISSION_WINDOW_UPDATED` in `AuditLog`.
   - Emits `SUBMISSION_WINDOW_UPDATED` event and invalidates scheduler cache.
4. **`POST /api/v1/projects/[id]/submit`**:
   - Enforces participant authentication, team membership, and submission window authorization.

### 3.4 Real-Time WebSocket Infrastructure
- **Event Types**:
  - `SUBMISSION_WINDOW_OPENED`
  - `SUBMISSION_DEADLINE_REACHED`
  - `SUBMISSION_WINDOW_UPDATED`
  - `SUBMISSION_LOCKED`
- **Room Structure**: `hackathon:{hackathonId}`, `organizer:{hackathonId}`, `team:{teamId}`.
- **Room Authorization**: Resource guards strictly isolate private rooms; public rooms accessible to authenticated event participants.

### 3.5 Frontend Reactive Components
1. **`SubmissionCountdown`** (`src/components/realtime/SubmissionCountdown.tsx`):
   - Client clock drift compensation (`serverOffset = serverTime - Date.now()`).
   - Subscribes to `hackathon:{id}` on mount.
   - Listens for `SUBMISSION_DEADLINE_REACHED` and updates state without page refresh.
   - Listens for `SUBMISSION_WINDOW_OPENED` and updates state without page refresh.
   - Registers `onReconnect` hook to re-query REST `/submission-status`.
2. **`ParticipantHackathonCard`** (`src/components/realtime/ParticipantHackathonCard.tsx`):
   - Dynamic real-time competition card on participant "My Hackathons" page.
3. **Organizer & Admin Configuration UI**:
   - `src/app/organizer/hackathons/[id]/page.tsx` & `src/app/admin/hackathons/[id]/page.tsx`:
   - Interactive date+time pickers for **Submission Opens** and **Submission Deadline**.
   - Immediate range validation and success notification.

---

## 4. Test Verification & Security Results

### 4.1 Test Suite Run (`npm test`)
```
✔ Submission Deadline & Realtime - [1] Submission before opening is strictly rejected
✔ Submission Deadline & Realtime - [2] Submission exactly at opening is accepted
✔ Submission Deadline & Realtime - [3] Submission during active window is accepted
✔ Submission Deadline & Realtime - [4] Submission just before deadline (17:59:59.900) is accepted
✔ Submission Deadline & Realtime - [5] Submission exactly at deadline (18:00:00.000) is rejected
✔ Submission Deadline & Realtime - [6] Submission after deadline (18:00:01.000) is rejected
✔ Submission Deadline & Realtime - [7] Invalid opening/deadline range (opens >= deadline) is rejected
✔ Submission Deadline & Realtime - [8] Participant unauthorized for team cannot submit
✔ Submission Deadline & Realtime - [9] Assigned Organizer and Admin can configure submission window
✔ Submission Deadline & Realtime - [10] Cross-organizer isolation strictly prevents Organizer B modifying Organizer A hackathon
✔ Submission Deadline & Realtime - [11] WebSocket emits SUBMISSION_DEADLINE_REACHED at configured deadline
✔ Submission Deadline & Realtime - [12] WebSocket room authorization prevents unauthorized participants from snooping private rooms
✔ Submission Deadline & Realtime - [13] Reconnect REST synchronization returns authoritative state when WebSocket disconnected
✔ Submission Deadline & Realtime - [14] Duplicate deadline event prevention (idempotent event emission)
✔ Submission Deadline & Realtime - [15] Refresh after deadline authoritatively returns SUBMISSION_CLOSED
✔ Submission Deadline & Realtime - [16] Already submitted project retains LOCKED snapshot and closed status after deadline
✔ Submission Deadline & Realtime - [17] Multiple hackathons maintain independent deadlines without event cross-talk
✔ Submission Deadline & Realtime - [18] Client clock manipulation CANNOT bypass backend server-time deadline check
✔ Submission Deadline & Realtime - [19] Direct API request after deadline is strictly rejected by backend
✔ Submission Deadline & Realtime - [20] Race condition around deadline: submission reaching server at 18:00:00.100 is rejected

Total Tests: 201 | Passed: 201 | Failed: 0 | Duration: ~1005ms
TypeScript Compilation (tsc --noEmit): 0 errors
```

---

## 5. Security & Edge Case Scenarios Verified

1. **Client Clock Tampering**:
   - Even if a participant artificially sets their browser clock back by 6 hours, the backend checks `new Date()` upon receiving the request and returns `422 SUBMISSION_DEADLINE_PASSED`.
2. **Direct API Bypass**:
   - Sending `POST /api/v1/projects/:id/submit` directly via curl or Postman after the deadline fails with status `422` and code `SUBMISSION_DEADLINE_PASSED`.
3. **Cross-Organizer Tampering (IDOR Protection)**:
   - Organizer B attempting to alter Organizer A's hackathon deadline is rejected with `403 FORBIDDEN_RESOURCE`.
4. **WebSocket Disconnection Resilience**:
   - If the WebSocket drops and the deadline passes while offline, re-establishing connection triggers automatic REST sync, updating the UI to `Submission Closed`.
5. **Multi-Hackathon Isolation**:
   - Hackathon A closing at 18:00 does not emit events to or affect Hackathon B (deadline 20:00) or Hackathon C (deadline 22:00).

---

## 6. Final Acceptance Checklist

- [x] Admin can configure submission opening and deadline.
- [x] Assigned Organizer can configure submission opening and deadline.
- [x] `subStartTime` and `subEndTime` stored as UTC DateTime in PostgreSQL.
- [x] Invalid time range (`subStartTime >= subEndTime`) is rejected.
- [x] Participant sees "Submission Not Open" before opening.
- [x] Participant sees "Submission Open" during window.
- [x] Participant can submit during the window.
- [x] Participant sees real-time countdown with server drift correction.
- [x] At deadline, WebSocket sends `SUBMISSION_DEADLINE_REACHED`.
- [x] Participant UI updates to "Submission Closed" without browser refresh.
- [x] Submit button becomes disabled immediately.
- [x] Backend authoritatively rejects submissions at/after deadline.
- [x] Browser clock manipulation cannot bypass deadline.
- [x] Direct API call cannot bypass deadline.
- [x] Page refresh after deadline retains "Submission Closed".
- [x] WebSocket disconnect/reconnect synchronizes authoritative REST state.
- [x] Multiple hackathons maintain independent deadlines.
- [x] Unauthorized users cannot configure deadlines (RBAC enforced).
- [x] WebSocket rooms are authorized and isolated.
- [x] Existing submission locking, SHA-256 snapshotting, and judging remain intact.
- [x] All 201 test suites pass with 0 errors.
- [x] TypeScript type checking (`tsc --noEmit`) passes with 0 errors.
