# ATLYX Competition Arena — Official Product Demonstration Video Script

**Platform:** ATLYX Competition Arena (Ultra Pro Max Platform)  
**Target Duration:** ~6–8 Minutes  
**Audience:** Evaluation Committee, Hackathon Directors, Lead Organizers, Judges, and Competitors  
**Architecture:** Next.js App Router Modular Monolith · Neon PostgreSQL · Real-Time WebSocket Daemon · EWJE v2 Judging Engine

---

## Video Script Flow & Action Sequence

### Scene 1: Platform Introduction & Public Arena
- **Visual:** Browser opens to `http://localhost:3000/`.
- **Narration:** *"Welcome to ATLYX Competition Arena — an enterprise-grade platform built for high-stakes collegiate and global hackathons. ATLYX features complete role isolation across Platform Admins, Organizers, Participants, and Judges, powered by our deterministic Evidence-Weighted Judging Engine (EWJE v2)."*
- **Action:**
  - Scroll past the live hero section showcasing current active competitions.
  - Navigate to `/explore` and `/gallery` demonstrating public track discovery, live project showcase, and community engagement.

---

### Scene 2: Platform Administrator Workspace
- **Visual:** Navigate to `/login` and authenticate as `admin@dogfood.com` / `Admin@123456`.
- **Narration:** *"We begin in the Platform Administrator Console. Platform Administrators possess system-wide authority to provision competitions, assign lead organizers, configure global scoring defaults, and inspect cross-event audit logs."*
- **Action:**
  - View `/admin/dashboard` with real-time platform metrics (10 active hackathons, total registered squads, and judge capacity).
  - Open `/admin/hackathons/create` to show multi-round progression mode configuration (**Overall Performance** vs. **Selection-Based Cutoff Mode** with configurable round advancements).
  - Inspect `/admin/hackathons` and drill into a live event console.

---

### Scene 3: Organizer Portal & Competition Configuration
- **Visual:** Log in as `organizer@dogfood.com` / `Organizer@123456` and navigate to `/organizer/hackathons`.
- **Narration:** *"Next, we access the Organizer Workspace. Organizers manage their specifically assigned competitions with full lifecycle controls — from custom participant registration forms to submission criteria and automated judge assignments."*
- **Action:**
  - Open `/organizer/hackathons/[id]` for the active competition.
  - Navigate to `/organizer/hackathons/[id]/team-form` demonstrating the dynamic drag-and-drop squad registration builder with custom fields, validation patterns, and versioned publishing.
  - Open `/organizer/rubrics` to configure weighted evaluation criteria (e.g., Technical Complexity 30%, Innovation 25%, Execution 25%, Presentation 20%).
  - Show track-to-problem-statement mapping and submission criteria configuration.

---

### Scene 4: Participant Journey (Squad Creation & Selection)
- **Visual:** Log in as `alice@dogfood.com` / `Participant@123456` and navigate to `/participant/dashboard`.
- **Narration:** *"Now let us experience the competition from the Participant viewpoint. Participants discover open competitions, register squads, invite teammates, and select approved problem statements."*
- **Action:**
  - Navigate to `/participant/hackathons` and open the registered event.
  - Open `/participant/teams` to show squad management: 3 members within the [2–4] squad size bounds, squad readiness badge set to **READY**, and real-time invite token generation.
  - Select Track & Problem Statement (e.g., *AI-Driven Autonomous Systems*).

---

### Scene 5: Project Deliverable & Real-Time WebSocket Submission
- **Visual:** Navigate to `/participant/projects` and open the team project workspace.
- **Narration:** *"Participants prepare their project deliverables — including GitHub repository URL, live demonstration link, architecture overview, and video demo. Submissions are strictly verified for deadline compliance and cryptographically snapshotted."*
- **Action:**
  - Populate project artifacts (GitHub URL, live demo URL, technical description).
  - Click **Submit Project & Lock Snapshot**.
  - Show the project transition to **LOCKED (Snapshot Hash Generated)**.
  - Open developer console or second browser tab demonstrating real-time WebSocket emission (`PROJECT_SUBMITTED` & `SUBMISSION_DEADLINE_REACHED` broadcasting to authorized rooms).

---

### Scene 6: Judge Workspace & Criterion-Level Evaluation
- **Visual:** Log in as `judge1@dogfood.com` / `Judge@123456` and navigate to `/judge/dashboard`.
- **Narration:** *"Judges operate in a strictly isolated workspace. A judge can ONLY view projects explicitly assigned to them, with zero visibility into other judges' marks, peer identities, or preliminary leaderboards."*
- **Action:**
  - Open `/judge/assignments` displaying assigned squad deliverables.
  - Click into the assigned project evaluation view.
  - Review submitted repository artifacts and live demo links.
  - Score each rubric criterion with numeric sliders (1–10) and provide qualitative justification notes.
  - Click **Submit Official Evaluation**. The score is signed and appended to the immutable audit event log.

---

### Scene 7: EWJE v2 Judging Engine & Audit Chain Verification
- **Visual:** Return to `/organizer/results` or run the CLI verification in terminal.
- **Narration:** *"With all evaluations recorded, ATLYX executes the Evidence-Weighted Judging Engine (EWJE v2). EWJE applies Huber Iteratively Reweighted Least Squares (IRLS) for robust judge scale calibration and Ridge Regularization to eliminate systematic bias without discarding genuine qualitative disagreement."*
- **Action:**
  - Click **Compute EWJE v2 Standings** in the organizer portal.
  - Show deterministic output metrics: raw scores, judge scale offsets, Huber weights, and confidence intervals.
  - Demonstrate CLI verification:
    ```bash
    node scripts/ewje-cli.js verify-public
    node scripts/ewje-cli.js verify-chain <hackathon-id>
    ```
  - Show that the public output hash deterministically matches `24075bf3ece73e63f3d4c46618c7854ec6d451783a1cf4a85c3987d627cb3b5e`.

---

### Scene 8: Official Result Publication & Public Leaderboard
- **Visual:** Organizer clicks **Publish Official Leaderboard** and navigates to `http://localhost:3000/leaderboard`.
- **Narration:** *"Once verified, the Organizer publishes the official results. The public leaderboard instantly updates with verified rankings, track badges, category award winners, and verifiable audit hashes."*
- **Action:**
  - Show the high-fidelity `/leaderboard` page with top podium finishers, track filters, and cryptographic verification badge.
  - Click on a winner card to view project showcase, team members, and published feedback summary.
  - Demonstrate downloadable official attendance and excellence certificates.

---

### Scene 9: Summary & Architecture Highlights
- **Visual:** Show platform architecture diagram / repository overview.
- **Narration:** *"ATLYX delivers uncompromising security, mathematically sound judging reproducibility, strict role isolation, and real-time reliability. Ready for mission-critical hackathon deployments."*
