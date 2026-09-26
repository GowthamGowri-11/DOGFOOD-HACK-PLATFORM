# Security & RBAC Specifications

## 1. Authentication & Session Management
- **Password Security:** Salted and hashed using `bcryptjs` (work factor 10+).
- **Session Tokens:** Signed JWTs stored in `HttpOnly`, `SameSite=Lax`, `Secure` cookies.
- **Server Guard:** `requireAuth()`, `requireRole(role)`, `requirePermission(permission)`.

## 2. Role-Based Access Control (RBAC)

```typescript
export const ROLE_PERMISSIONS: Record<RoleType, string[]> = {
  ADMIN: [
    'platform.*',
    'hackathon.*',
    'evaluation.*',
    'ai.*',
    'audit.view',
    'users.manage'
  ],
  ORGANIZER: [
    'hackathon.manage',
    'track.manage',
    'problem.manage',
    'registration.manage',
    'team.view',
    'judge.manage',
    'assignment.manage',
    'rubric.manage',
    'scoring.compute',
    'results.publish',
    'attendance.manage',
    'certificate.issue',
    'ai.run'
  ],
  JUDGE: [
    'judge.assignment.view',
    'judge.evaluation.create',
    'judge.evaluation.update',
    'judge.evaluation.submit'
  ],
  PARTICIPANT: [
    'participant.register',
    'participant.team.manage',
    'participant.project.manage',
    'participant.submission.manage',
    'participant.vote'
  ]
};
```

## 3. Judge Isolation & Security Invariants
- Judge B cannot view Judge A's evaluations or project assignment lists under any circumstances.
- Unassigned projects return HTTP 403 Forbidden for judges.
- Submission modifications are strictly rejected once the event deadline has passed or status is `LOCKED`.
- All administrative and scoring mutations generate immutable `AuditLog` records.
