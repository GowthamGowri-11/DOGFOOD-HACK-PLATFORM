# Phase 7 — Results Engine, Publication, Community Voting & Showcase

## Overview
Phase 7 establishes the end-to-end Results Lifecycle, Public Leaderboard, Participant Result Experience, Community Voting, and Moderated Public Project Showcase.

---

## 1. Critical Invariant: Official Score vs Community Signals
There are two independent signals in the system:

```
          OFFICIAL RESULT                          COMMUNITY SIGNAL
                 │                                        │
         Human Jury Score                               Votes
                 │                                        │
          Normalized Score                             Comments
                 │                                        │
          Organizer Result                          Community Metrics
                 │
          Official Ranking
```

> **IMPORTANT**: Community votes and comments **MUST NEVER** alter or influence official jury scores or ranking. Official standing is strictly derived from normalized human judge evaluations.

---

## 2. Result Engine & Lifecycle Pipeline

```
LOCKED SUBMISSIONS
       ↓
COMPLETED HUMAN EVALUATIONS
       ↓
SCORING & NORMALIZATION (Z-Score / Min-Max)
       ↓
RESULT GENERATION (Versioned & Draft)
       ↓
RESULT VERIFICATION (Anomalies, Completeness, Duplicate Check)
       ↓
ORGANIZER REVIEW & PUBLICATION (Irreversible / Versioned)
       ↓
PUBLIC LEADERBOARD & PARTICIPANT RESULTS
```

### Preconditions for Generation
1. Hackathon status must be eligible (`EVALUATION`, `JUDGING_COMPLETED`, or `VOTING`).
2. All projects must have locked submission snapshots.
3. Every submitted project must have at least one locked evaluation.
4. Active rubric must have valid criterion weights.

### Deterministic Tie-Breaking Mechanism
When two or more projects have identical primary final scores (e.g. normalized score):
1. **Secondary Criterion:** Compare raw average score across judges.
2. **Third Criterion:** Compare submission timestamp (earlier locked submission).
3. **Shared Rank:** If identical across all deterministic criteria, assign equal rank and sort stably by project ID.

---

## 3. Prize Tier Assignment
Prizes configured in Phase 3 are mapped deterministically to ranks:
- `Rank 1` $\rightarrow$ Prize with order/rank 1 (e.g., *1st Place / Champion*)
- `Rank 2` $\rightarrow$ Prize with order/rank 2 (e.g., *2nd Place / Runner Up*)
- `Rank 3` $\rightarrow$ Prize with order/rank 3 (e.g., *3rd Place / Bronze*)

Duplicate prize assignments for different ranks are prohibited.

---

## 4. Result Verification Engine (`ResultVerificationService`)
Before publication, organizers run verification checks:
- **Completeness:** All submitted projects evaluated and scored.
- **Data Integrity:** No `NaN`, `null`, or negative final scores.
- **Rank Integrity:** Ranks are strictly positive integers in sequential order.
- **Snapshot Immutability:** Submissions remain unchanged from judging.

---

## 5. Privacy & Publication Gates
- **Pre-Publication:** Official scores and ranks are strictly hidden from participants and the public. Accessing `/api/v1/hackathons/[id]/leaderboard` returns `403 Forbidden` (`LEADERBOARD_NOT_PUBLISHED`).
- **Post-Publication:** Ranks, team names, project titles, final normalized scores, and prize awards are visible. Private judge identities, internal judge comments, and AI Jury internal evidence remain strictly private.

---

## 6. Community Voting & Anti-Abuse
- **1-Vote-Per-User Rule:** Authenticated users can cast exactly 1 vote per project per hackathon, backed by database unique constraint `@@unique([projectId, userId])`.
- **Vote Removal:** Users can toggle or withdraw their own vote. Users cannot delete or alter another user's vote.
- **Eligibility:** Votes can only be cast on public, submitted projects in hackathons where voting is active.
- **Protection:** Protected by rate limiting, authentication guards, and CSRF protection.

---

## 7. Community Comments & Moderation
- **Comment Ownership:** Authenticated users can post comments. Authors can edit or delete their own comments.
- **XSS Sanitization:** All comment content is sanitized server-side, escaping `< > " '` into HTML entities before storage.
- **Organizer Moderation:** Organizers and platform admins can `HIDE` or `RESTORE` comments. Moderation actions are recorded in the `AuditLog`.

---

## 8. Audit Log Events
- `RESULTS_GENERATED`
- `RESULTS_VERIFIED`
- `RESULTS_PUBLISHED`
- `VOTE_CAST`
- `VOTE_REMOVED`
- `COMMENT_CREATED`
- `COMMENT_UPDATED`
- `COMMENT_DELETED`
- `COMMENT_HIDDEN`
- `COMMENT_RESTORED`
