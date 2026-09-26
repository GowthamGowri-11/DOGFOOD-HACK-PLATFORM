# API Specification (`/api/v1/*`)

All endpoints adhere to standardized JSON envelopes.

### Standard Responses

**Success Envelope (HTTP 200/201):**
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation executed successfully"
}
```

**Error Envelope (HTTP 400/401/403/404/409/422/500):**
```json
{
  "success": false,
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "The requested resource was not found.",
    "details": {}
  }
}
```

---

## Endpoint Catalog

### 1. Authentication (`/api/v1/auth/*`)
- `POST /api/v1/auth/register` - Create user account
- `POST /api/v1/auth/login` - Authenticate and set session cookie
- `POST /api/v1/auth/logout` - Invalidate session
- `GET /api/v1/auth/me` - Retrieve authenticated user profile

### 2. Hackathons (`/api/v1/hackathons/*`)
- `GET /api/v1/hackathons` - Browse/search public hackathons
- `POST /api/v1/hackathons` - Create hackathon (ORGANIZER/ADMIN)
- `GET /api/v1/hackathons/[id]` - Get hackathon details
- `PATCH /api/v1/hackathons/[id]` - Update event configuration

### 3. Tracks & Problem Statements
- `GET /api/v1/tracks?hackathonId=:id` - List tracks
- `POST /api/v1/tracks` - Add track
- `GET /api/v1/problem-statements?hackathonId=:id` - List problem statements
- `POST /api/v1/problem-statements` - Add problem statement

### 4. Teams, Projects & Submissions
- `POST /api/v1/registrations` - Register user for hackathon
- `POST /api/v1/teams` - Create team
- `POST /api/v1/teams/[id]/invites` - Send invite
- `POST /api/v1/projects` - Create project
- `POST /api/v1/projects/[id]/submit` - Submit deliverables & create immutable snapshot
- `GET /api/v1/submissions/[id]/snapshot` - Retrieve immutable snapshot and SHA-256 content hash

### 5. Judge Management (`/api/v1/hackathons/[id]/judges/*`)
- `GET /api/v1/hackathons/[id]/judges` - List judges for hackathon (Organizer/Admin)
- `POST /api/v1/hackathons/[id]/judges` - Add judge with expertiseTracks, maxWorkload, COI configuration
- `GET /api/v1/hackathons/[id]/judges/[judgeId]` - Get judge details
- `PATCH /api/v1/hackathons/[id]/judges/[judgeId]` - Update judge workload or status
- `DELETE /api/v1/hackathons/[id]/judges/[judgeId]` - Deactivate judge

### 6. Rubrics & Criteria Engine (`/api/v1/hackathons/[id]/rubrics/*`)
- `GET /api/v1/hackathons/[id]/rubrics` - List rubrics and active version
- `POST /api/v1/hackathons/[id]/rubrics` - Create rubric with validated 100% total weight criteria
- `GET /api/v1/rubrics/[id]` - Get rubric details and criteria
- `PATCH /api/v1/rubrics/[id]` - Update rubric (rejected if active evaluations locked)

### 7. Judge Assignments & Evaluation Workspace
- `POST /api/v1/hackathons/[id]/assignments/generate` - Run balanced AssignmentEngine with COI exclusion
- `GET /api/v1/hackathons/[id]/assignments` - Organizer assignment monitoring
- `GET /api/v1/judge/assignments` - Judge assigned project queue (Strict Isolation Guard)
- `GET /api/v1/judge/assignments/[id]` - Judge project workspace (Locked Snapshot + Rubric)
- `POST /api/v1/judge/assignments/[id]` - Save draft or submit & lock evaluation

### 8. Scoring, Normalization & Results
- `GET /api/v1/hackathons/[id]/judging` - Organizer judging overview & workload table
- `POST /api/v1/scoring/compute` - Calculate raw weighted scores
- `POST /api/v1/normalization/compute` - Execute Z-Score or Min-Max normalization & compute ranks
- `POST /api/v1/hackathons/[id]/results/generate` - Generate versioned official results & prize matching
- `POST /api/v1/hackathons/[id]/results/verify` - Run verification checks on generated results
- `POST /api/v1/hackathons/[id]/results/publish` - Publish official results publicly (irreversible without new version)
- `GET /api/v1/hackathons/[id]/results` - Fetch internal (organizer/admin) or published results
- `GET /api/v1/hackathons/[id]/leaderboard` - Public leaderboard (403 if unpublished)
- `GET /api/v1/participants/me/hackathons/[id]/result` - Participant own result view

### 9. Community Voting, Comments & Gallery (Phase 7)
- `GET /api/v1/gallery` - Public project showcase with track filter, search, and sorting (newest/votes/rank)
- `POST /api/v1/projects/[id]/vote` - Cast community vote (1-vote-per-user)
- `DELETE /api/v1/projects/[id]/vote` - Remove own community vote
- `GET /api/v1/projects/[id]/votes` - Get project vote count & user vote status
- `GET /api/v1/projects/[id]/comments` - List visible community comments (paginated)
- `POST /api/v1/projects/[id]/comments` - Create comment (with server-side XSS sanitization)
- `PATCH /api/v1/comments/[id]` - Author edit comment
- `DELETE /api/v1/comments/[id]` - Author or moderator delete comment
- `POST /api/v1/comments/[id]/moderate` - Organizer/Admin hide or restore comment

### 10. AI Jury & Calibration Subsystem
- `POST /api/v1/hackathons/[id]/ai-jury/run` - Execute autonomous AI Jury batch evaluation
- `GET /api/v1/ai-jury/runs/[id]` - Get AI run details, extracted evidence, confidence
- `GET /api/v1/ai-jury/runs/[id]/comparison` - AI vs Human comparison for specific run
- `GET /api/v1/ai-comparison?hackathonId=:id` - Hackathon-wide AI vs Human consensus metrics (MAE, RMSE, Agreement Rate)
