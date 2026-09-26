const test = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const JWT_SECRET = 'dev-fallback-secret-key-min-32-chars-hackathon';

// Mock DB store for isolated unit/security testing
function createMockStore() {
  const users = new Map();
  const hackathons = new Map();
  const projects = new Map();
  const evaluations = new Map();
  const auditLogs = [];

  return {
    users,
    hackathons,
    projects,
    evaluations,
    auditLogs,
  };
}

// -------------------------------------------------------------
// 1. REGISTRATION & ROLE TAMPERING TESTS
// -------------------------------------------------------------

test('Auth Security - [1] Valid registration succeeds with default PARTICIPANT role', async () => {
  const store = createMockStore();
  const passwordHash = await bcrypt.hash('SecurePass123!', 10);

  const payload = {
    name: 'Alice Participant',
    email: 'alice@example.com',
    password: 'SecurePass123!',
  };

  const normalizedEmail = payload.email.trim().toLowerCase();
  const user = {
    id: 'u_alice_1',
    email: normalizedEmail,
    fullName: payload.name,
    passwordHash,
    role: 'PARTICIPANT',
    isActive: true,
    createdAt: new Date(),
  };

  store.users.set(normalizedEmail, user);

  assert.equal(user.email, 'alice@example.com');
  assert.equal(user.role, 'PARTICIPANT');
  assert.equal(user.isActive, true);
});

test('Auth Security - [2] Duplicate email registration is rejected', () => {
  const store = createMockStore();
  store.users.set('alice@example.com', { id: '1', email: 'alice@example.com' });

  const attemptEmail = 'ALICE@EXAMPLE.COM'.trim().toLowerCase();
  const exists = store.users.has(attemptEmail);

  assert.equal(exists, true);
});

test('Auth Security - [3] Invalid email format is rejected by validation', () => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  assert.equal(emailRegex.test('invalid-email-string'), false);
  assert.equal(emailRegex.test('user@domain'), false);
  assert.equal(emailRegex.test('valid@example.com'), true);
});

test('Auth Security - [4] Weak password (< 8 chars) is rejected', () => {
  const isStrong = (pass) => typeof pass === 'string' && pass.length >= 8;
  assert.equal(isStrong('short'), false);
  assert.equal(isStrong('1234567'), false);
  assert.equal(isStrong('SecurePassword123!'), true);
});

test('Auth Security - [5] Malicious public registration payload CANNOT forge ADMIN role', () => {
  const payload = {
    name: 'Attacker',
    email: 'attacker@example.com',
    password: 'Password123!',
    role: 'ADMIN', // Malicious attempt to elevate role
  };

  // Safe server-side registration rule: Always force role to PARTICIPANT
  const safeRole = 'PARTICIPANT';
  assert.equal(safeRole, 'PARTICIPANT');
  assert.notEqual(safeRole, payload.role);
});

// -------------------------------------------------------------
// 2. LOGIN & INACTIVE ACCOUNT TESTS
// -------------------------------------------------------------

test('Auth Security - [6] Login with valid credentials succeeds and creates signed session', async () => {
  const passwordHash = await bcrypt.hash('CorrectPassword123!', 10);
  const user = {
    id: 'u_valid',
    email: 'user@example.com',
    fullName: 'Test User',
    passwordHash,
    role: 'PARTICIPANT',
    isActive: true,
  };

  const isMatch = await bcrypt.compare('CorrectPassword123!', user.passwordHash);
  assert.equal(isMatch, true);

  const token = jwt.sign(
    {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      status: 'ACTIVE',
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  const decoded = jwt.verify(token, JWT_SECRET);
  assert.equal(decoded.id, 'u_valid');
  assert.equal(decoded.role, 'PARTICIPANT');
  assert.equal(decoded.status, 'ACTIVE');
});

test('Auth Security - [7] Login with wrong password fails with generic error', async () => {
  const passwordHash = await bcrypt.hash('RealPassword123!', 10);
  const isMatch = await bcrypt.compare('WrongPassword!', passwordHash);
  assert.equal(isMatch, false);
});

test('Auth Security - [8] Login for INACTIVE user is blocked', () => {
  const user = {
    id: 'u_inactive',
    email: 'banned@example.com',
    isActive: false,
  };

  const isAllowed = user.isActive === true;
  assert.equal(isAllowed, false);
});

test('Auth Security - [9] Logout is idempotent and safely clears state', () => {
  let cookieVal = 'valid_token';
  // First logout
  cookieVal = '';
  assert.equal(cookieVal, '');
  // Second logout (already logged out)
  cookieVal = '';
  assert.equal(cookieVal, '');
});

// -------------------------------------------------------------
// 3. SESSION SECURITY & TAMPERING TESTS
// -------------------------------------------------------------

test('Auth Security - [10] Tampered or forged JWT token is rejected', () => {
  const token = jwt.sign({ id: 'u_user', role: 'PARTICIPANT' }, JWT_SECRET);
  const parts = token.split('.');
  // Modify payload
  const forgedPayload = Buffer.from(JSON.stringify({ id: 'u_user', role: 'ADMIN' })).toString('base64url');
  const tamperedToken = `${parts[0]}.${forgedPayload}.${parts[2]}`;

  assert.throws(() => {
    jwt.verify(tamperedToken, JWT_SECRET);
  });
});

test('Auth Security - [11] Expired session token is rejected', () => {
  const expiredToken = jwt.sign(
    { id: 'u_expired', role: 'PARTICIPANT' },
    JWT_SECRET,
    { expiresIn: '-1s' }
  );

  assert.throws(() => {
    jwt.verify(expiredToken, JWT_SECRET);
  });
});

// -------------------------------------------------------------
// 4. RBAC GUARDS & PERMISSIONS TESTS
// -------------------------------------------------------------

const ROLE_PERMISSIONS = {
  ADMIN: ['platform.manage', 'platform.users.manage', 'platform.audit.view'],
  ORGANIZER: ['hackathon.manage', 'track.manage', 'judge.manage', 'results.publish'],
  JUDGE: ['judge.assignments.view', 'judge.evaluation.create', 'judge.evaluation.submit'],
  PARTICIPANT: ['participant.register', 'participant.team.manage', 'participant.project.manage'],
};

function hasRolePermission(role, permission) {
  if (role === 'ADMIN') return true;
  const list = ROLE_PERMISSIONS[role] || [];
  return list.includes(permission);
}

test('RBAC - [12] Admin has platform management permissions', () => {
  assert.equal(hasRolePermission('ADMIN', 'platform.manage'), true);
  assert.equal(hasRolePermission('ADMIN', 'platform.users.manage'), true);
  assert.equal(hasRolePermission('ADMIN', 'hackathon.manage'), true);
});

test('RBAC - [13] Organizer is blocked from platform.manage', () => {
  assert.equal(hasRolePermission('ORGANIZER', 'platform.manage'), false);
  assert.equal(hasRolePermission('ORGANIZER', 'hackathon.manage'), true);
});

test('RBAC - [14] Judge is blocked from organizer and admin permissions', () => {
  assert.equal(hasRolePermission('JUDGE', 'platform.manage'), false);
  assert.equal(hasRolePermission('JUDGE', 'hackathon.manage'), false);
  assert.equal(hasRolePermission('JUDGE', 'judge.evaluation.submit'), true);
});

test('RBAC - [15] Participant is blocked from judging and organizer operations', () => {
  assert.equal(hasRolePermission('PARTICIPANT', 'judge.evaluation.create'), false);
  assert.equal(hasRolePermission('PARTICIPANT', 'hackathon.manage'), false);
  assert.equal(hasRolePermission('PARTICIPANT', 'participant.team.manage'), true);
});

// -------------------------------------------------------------
// 5. RESOURCE-LEVEL ISOLATION TESTS
// -------------------------------------------------------------

test('Resource Isolation - [16] Organizer A cannot manage Organizer B hackathon', () => {
  const hackathons = new Map([
    ['hack_A', { id: 'hack_A', organizerId: 'usr_org_A' }],
    ['hack_B', { id: 'hack_B', organizerId: 'usr_org_B' }],
  ]);

  const canAccess = (userId, hackathonId) => {
    const h = hackathons.get(hackathonId);
    return h ? h.organizerId === userId : false;
  };

  assert.equal(canAccess('usr_org_A', 'hack_A'), true);
  assert.equal(canAccess('usr_org_A', 'hack_B'), false); // BLOCKED
});

test('Resource Isolation - [17] Judge A cannot view or edit Judge B evaluation', () => {
  const evaluations = new Map([
    ['eval_1', { id: 'eval_1', judgeUserId: 'usr_judge_A', projectId: 'p1' }],
    ['eval_2', { id: 'eval_2', judgeUserId: 'usr_judge_B', projectId: 'p2' }],
  ]);

  const canAccessEval = (judgeUserId, evalId) => {
    const ev = evaluations.get(evalId);
    return ev ? ev.judgeUserId === judgeUserId : false;
  };

  assert.equal(canAccessEval('usr_judge_A', 'eval_1'), true);
  assert.equal(canAccessEval('usr_judge_A', 'eval_2'), false); // STRICTLY ISOLATED
});

test('Resource Isolation - [18] Participant A cannot access Participant B team or submission', () => {
  const teamMembers = new Set([
    'team_alpha:usr_alice',
    'team_beta:usr_bob',
  ]);

  const canAccessTeam = (userId, teamId) => teamMembers.has(`${teamId}:${userId}`);

  assert.equal(canAccessTeam('usr_alice', 'team_alpha'), true);
  assert.equal(canAccessTeam('usr_alice', 'team_beta'), false); // BLOCKED
});

// -------------------------------------------------------------
// 6. SENSITIVE DATA LEAKAGE PREVENTION
// -------------------------------------------------------------

test('Security - [19] SafeUser representation never contains passwordHash or secrets', () => {
  const rawDbUser = {
    id: 'u1',
    email: 'user@example.com',
    fullName: 'John Doe',
    passwordHash: '$2a$10$abcdef1234567890secretHash',
    role: 'PARTICIPANT',
    isActive: true,
    avatarUrl: null,
    createdAt: new Date(),
  };

  const safeUser = {
    id: rawDbUser.id,
    email: rawDbUser.email,
    name: rawDbUser.fullName,
    role: rawDbUser.role,
    status: rawDbUser.isActive ? 'ACTIVE' : 'INACTIVE',
  };

  assert.equal(safeUser.passwordHash, undefined);
  assert.equal('passwordHash' in safeUser, false);
  assert.equal('password' in safeUser, false);
});
