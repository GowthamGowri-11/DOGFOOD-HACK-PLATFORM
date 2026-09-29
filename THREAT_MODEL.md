# Security Architecture & Defensive Threat Model

> **Scope:** Hackathon Voting, Submission Integrity, Evaluation Fairness, and Platform Abuse.  
> **Philosophy:** *“Name the attacks you stopped, and name the ones you did not. The honest list is worth more than the heroic one.”*

---

## Threat Matrix Summary

| Threat Vector | Severity | Mitigation Status | Primary Defensive Mechanism |
| :--- | :---: | :---: | :--- |
| **1. Sybil Attacks & Ballot Stuffing** | Critical | **STOPPED** | Quadratic Voting ($n^2$ cost), Unique DB Constraints, IP Hash Tracking |
| **2. Coordinated Vote Trading Cartels** | High | **PARTIALLY MITIGATED** | Blind Ballot Masking, Randomized Ballot Ordering |
| **3. Submission Scraping & IP Theft** | Medium | **PARTIALLY MITIGATED** | Edge Rate-Limiting, Private Pre-Deadline Payloads |
| **4. Judge Collusion & Biased Grading** | Critical | **STOPPED** | Z-Score Normalization, Double-Blind Assignment, Conflict Exclusions |
| **5. Off-Platform Judge Collusion** | High | **NOT STOPPED (Accepted Risk)** | Statistical Outlier Anomaly Flags (Post-hoc detection only) |
| **6. Deadline Gaming & Race Conditions** | High | **STOPPED** | Server UTC Clock Enforcement, Atomic Transaction Lock Snapshot |
| **7. Privilege Escalation & Impersonation** | Critical | **STOPPED** | JWT Session Guards, Role-Based Access Control (RBAC), Immutable Audit Trail |

---

## 1. Sybil Attacks & Ballot Stuffing

### What We Stopped:
1. **Multi-Vote Flooding on a Single Entry:**
   - Under standard 1-person-1-vote systems, bots create 10 fake accounts to give 10 votes.
   - **Defense:** We implemented **Quadratic Voting**. Giving $n$ votes to a project costs $n^2$ credits ($1 \to 1\text{c}, 2 \to 4\text{c}, 3 \to 9\text{c}, 4 \to 16\text{c}$). A voter with a 9-credit wallet can give at most 3 votes to their favorite project, drastically flattening the influence of bot clusters.
2. **Replay & Concurrency Attacks:**
   - Database unique composite constraint: `@@unique([projectId, userId])` and atomic wallet balance checks in Postgres prevent parallel requests from multiplying votes.
3. **Unauthenticated Public Floods:**
   - Voting requires authenticated JWT sessions or registered participant verification.

### What We Did NOT Stop (Honest Limitation):
* **Real-World Account Rings:** If an attacker coordinates 50 real individuals with genuine GitHub/Google accounts across distinct residential IP addresses to vote for one project, the platform treats them as valid distinct voters. We cannot distinguish organic popularity from genuine friend networks without invasive identity verification (e.g. government ID or biometric KYC).

---

## 2. Submission Scraping & Plagiarism

### What We Stopped:
1. **Pre-Deadline Idea Theft:**
   - Submissions in draft or under review are strictly gated by `SubmissionLockService` and only visible to the team members and assigned judges. Competitors cannot inspect rival repos or demo URLs before the submission window concludes.
2. **Automated Endpoint Harvesting:**
   - Gallery API endpoints enforce rate-limiting and serve sanitized payloads without exposing sensitive contestant PII.

### What We Did NOT Stop (Honest Limitation):
* **Public Gallery Scraping:** Once the competition concludes and the project gallery is unlocked, solutions are intentionally open and public. Anyone using a headless browser or curl can scrape project descriptions and video demos. Public open-source showcases are inherently indexable.

---

## 3. Judge Collusion & Biased Grading

### What We Stopped:
1. **Strict vs. Lenient Grader Inequity:**
   - When one judge gives an average score of 65 and another gives 90, projects assigned to the strict judge are normally doomed.
   - **Defense:** We implemented **Cross-Judge Z-Score Normalization** ($z_{jk} = \frac{x_{jk} - \mu_j}{\sigma_j}$). Scores are standardized relative to each judge's historical mean and variance, completely removing the strictness penalty.
2. **Subjective Score Manipulation:**
   - We shipped **Pairwise Mode (The Gavel Approach)** powered by the Bradley-Terry Maximum Likelihood Estimator. Judges are never asked for subjective numbers—only binary comparisons ("Is A better than B?"), which eliminates score anchoring.
3. **Direct Conflict of Interest:**
   - The assignment engine checks `conflictTeamIds` and prevents assigning a judge to evaluate their own affiliated team or mentees.

### What We Did NOT Stop (Honest Limitation):
* **Covert Off-Platform Agreement:** If two judges secretly agree via private Signal messages to down-vote a specific project while grading others normally, and their scores fall within acceptable standard deviations, algorithm cannot detect their subjective intent. We can only flag statistical anomalies post-hoc.

---

## 4. Deadline Gaming & Clock Tampering

### What We Stopped:
1. **Client-Side Clock Manipulation:**
   - The platform completely ignores client timestamps. All deadlines are evaluated using the database server's atomic UTC clock (`new Date()`).
2. **Post-Deadline Edits:**
   - When the deadline strikes or the participant clicks "Finalize Submission", the submission status changes to `LOCKED` with an immutable payload snapshot in PostgreSQL. Further mutations return `403 SUBMISSION_LOCKED`.
3. **Race Condition Edits:**
   - Lock states and updates run in serializable PostgreSQL transactions with version incrementing.

### What We Did NOT Stop (Honest Limitation):
* **Sub-Second Network Latency Failures:** If a participant clicks "Submit" at 11:59:59.800 PM and their mobile network latency takes 300ms, the request arrives at 12:00:00.100 AM and is rejected. Organizers can manually grant single-team grace periods via the Evaluation Edit Request system.

---

## 5. Auditability Without Database Access

Every security-relevant action (`QUESTION_VOTE_CAST`, `VOTE_CAST`, `SUBMISSION_LOCKED`, `EVALUATION_SUBMITTED`, `WEBHOOK_CREATED`) generates an immutable record in `AuditLog` storing:
* `actorId` and `userEmail`
* `ipAddress` and `userAgent`
* `beforeState` and `afterState` JSON snapshots
* High-precision UTC timestamp

Organizers inspect these logs directly in the browser via `/organizer/audit` without requiring `psql` or database access.
