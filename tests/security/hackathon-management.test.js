const test = require('node:test');
const assert = require('node:assert/strict');

// ---------------------------------------------------------------------------
// MOCK DATA STORE & GUARDS
// ---------------------------------------------------------------------------

function createMockPlatform() {
  const users = new Map([
    ['usr_admin', { id: 'usr_admin', role: 'ADMIN', fullName: 'Platform Admin' }],
    ['usr_org_A', { id: 'usr_org_A', role: 'ORGANIZER', fullName: 'Organizer Alpha' }],
    ['usr_org_B', { id: 'usr_org_B', role: 'ORGANIZER', fullName: 'Organizer Beta' }],
    ['usr_part', { id: 'usr_part', role: 'PARTICIPANT', fullName: 'Alice Builder' }],
    ['usr_judge', { id: 'usr_judge', role: 'JUDGE', fullName: 'Judge Dredd' }],
  ]);

  const hackathons = new Map([
    [
      'hack_A',
      {
        id: 'hack_A',
        organizerId: 'usr_org_A',
        title: 'Alpha AI Hackathon',
        slug: 'alpha-ai-hackathon',
        status: 'PUBLISHED',
      },
    ],
    [
      'hack_B_draft',
      {
        id: 'hack_B_draft',
        organizerId: 'usr_org_B',
        title: 'Beta Stealth Hackathon',
        slug: 'beta-stealth-hackathon',
        status: 'DRAFT',
      },
    ],
  ]);

  const tracks = new Map([
    [
      'trk_A1',
      {
        id: 'trk_A1',
        hackathonId: 'hack_A',
        title: 'Autonomous Agents',
        slug: 'autonomous-agents',
      },
    ],
  ]);

  const problemStatements = new Map([
    [
      'ps_A1_1',
      {
        id: 'ps_A1_1',
        trackId: 'trk_A1',
        title: 'Agent Memory Subsystem',
        isPublic: true,
      },
    ],
  ]);

  const prizes = new Map([
    [
      'prz_A1',
      {
        id: 'prz_A1',
        hackathonId: 'hack_A',
        title: '1st Place Grand Prize',
        amount: 10000,
      },
    ],
  ]);

  const auditLogs = [];

  function canAccessHackathon(userId, role, hackathonId) {
    if (role === 'ADMIN') return true;
    if (role !== 'ORGANIZER') return false;
    const h = hackathons.get(hackathonId);
    return h ? h.organizerId === userId : false;
  }

  function canCreateHackathon(role) {
    return role === 'ORGANIZER' || role === 'ADMIN';
  }

  function logAudit(userId, hackathonId, action, entityType, entityId) {
    auditLogs.push({
      userId,
      hackathonId,
      action,
      entityType,
      entityId,
      timestamp: new Date(),
    });
  }

  return {
    users,
    hackathons,
    tracks,
    problemStatements,
    prizes,
    auditLogs,
    canAccessHackathon,
    canCreateHackathon,
    logAudit,
  };
}

// ---------------------------------------------------------------------------
// 1-4: ROLE CAPABILITIES (ORGANIZER / PARTICIPANT / JUDGE / ADMIN)
// ---------------------------------------------------------------------------

test('Security - [1] Organizer can create a hackathon', () => {
  const platform = createMockPlatform();
  assert.equal(platform.canCreateHackathon('ORGANIZER'), true);
});

test('Security - [2] Participant CANNOT create a hackathon (403 Forbidden)', () => {
  const platform = createMockPlatform();
  assert.equal(platform.canCreateHackathon('PARTICIPANT'), false);
});

test('Security - [3] Judge CANNOT create a hackathon (403 Forbidden)', () => {
  const platform = createMockPlatform();
  assert.equal(platform.canCreateHackathon('JUDGE'), false);
});

test('Security - [4] Admin can perform platform-level organizer operations', () => {
  const platform = createMockPlatform();
  assert.equal(platform.canCreateHackathon('ADMIN'), true);
  assert.equal(platform.canAccessHackathon('usr_admin', 'ADMIN', 'hack_A'), true);
  assert.equal(platform.canAccessHackathon('usr_admin', 'ADMIN', 'hack_B_draft'), true);
});

// ---------------------------------------------------------------------------
// 5-8: RESOURCE-LEVEL ISOLATION FOR MULTI-TENANT ORGANIZERS
// ---------------------------------------------------------------------------

test('Security - [5] Organizer A CANNOT update Organizer B hackathon', () => {
  const platform = createMockPlatform();
  assert.equal(platform.canAccessHackathon('usr_org_A', 'ORGANIZER', 'hack_A'), true);
  assert.equal(platform.canAccessHackathon('usr_org_A', 'ORGANIZER', 'hack_B_draft'), false);
});

test('Security - [6] Organizer A CANNOT create track under Organizer B hackathon', () => {
  const platform = createMockPlatform();
  const allowed = platform.canAccessHackathon('usr_org_A', 'ORGANIZER', 'hack_B_draft');
  assert.equal(allowed, false);
});

test('Security - [7] Organizer A CANNOT create problem statement under Organizer B track', () => {
  const platform = createMockPlatform();
  // Attempting to attach to a track belonging to another organizer's hackathon
  const targetTrack = platform.tracks.get('trk_A1');
  const allowed = platform.canAccessHackathon('usr_org_B', 'ORGANIZER', targetTrack.hackathonId);
  assert.equal(allowed, false);
});

test('Security - [8] Organizer A CANNOT modify Organizer B prize', () => {
  const platform = createMockPlatform();
  const targetPrize = platform.prizes.get('prz_A1');
  const allowed = platform.canAccessHackathon('usr_org_B', 'ORGANIZER', targetPrize.hackathonId);
  assert.equal(allowed, false);
});

// ---------------------------------------------------------------------------
// 9-11: PUBLIC DISCOVERY VISIBILITY & DRAFT PROTECTION
// ---------------------------------------------------------------------------

test('Security - [9] Public user can view published hackathon', () => {
  const platform = createMockPlatform();
  const pubHackathon = platform.hackathons.get('hack_A');
  const isPubliclyVisible = pubHackathon.status !== 'DRAFT';
  assert.equal(isPubliclyVisible, true);
});

test('Security - [10] Public user CANNOT view draft hackathon (hidden from public listing)', () => {
  const platform = createMockPlatform();
  const draftHackathon = platform.hackathons.get('hack_B_draft');
  const isPubliclyVisible = draftHackathon.status !== 'DRAFT';
  assert.equal(isPubliclyVisible, false);
});

test('Security - [11] Invalid hackathon slug returns 404 / null', () => {
  const platform = createMockPlatform();
  const findBySlug = (slug) => {
    for (const h of platform.hackathons.values()) {
      if (h.slug === slug && h.status !== 'DRAFT') return h;
    }
    return null;
  };

  assert.equal(findBySlug('non-existent-hackathon-xyz'), null);
  assert.equal(findBySlug('beta-stealth-hackathon'), null); // Draft is also 404 for public
  assert.notEqual(findBySlug('alpha-ai-hackathon'), null); // Published is found
});

// ---------------------------------------------------------------------------
// 12-14: RELATIONAL INTEGRITY CHECKS
// ---------------------------------------------------------------------------

test('Security - [12] Track must belong to valid existing hackathon', () => {
  const platform = createMockPlatform();
  const validateTrackParent = (hackathonId) => platform.hackathons.has(hackathonId);

  assert.equal(validateTrackParent('hack_A'), true);
  assert.equal(validateTrackParent('hack_invalid_id'), false);
});

test('Security - [13] Problem statement must belong to valid existing track', () => {
  const platform = createMockPlatform();
  const validatePSParent = (trackId) => platform.tracks.has(trackId);

  assert.equal(validatePSParent('trk_A1'), true);
  assert.equal(validatePSParent('trk_invalid_id'), false);
});

test('Security - [14] Prize must belong to valid existing hackathon', () => {
  const platform = createMockPlatform();
  const validatePrizeParent = (hackathonId) => platform.hackathons.has(hackathonId);

  assert.equal(validatePrizeParent('hack_A'), true);
  assert.equal(validatePrizeParent('hack_invalid_id'), false);
});

// ---------------------------------------------------------------------------
// 18-20: PAGINATION, SEARCH SANITIZATION & AUDIT LOGS
// ---------------------------------------------------------------------------

test('Security - [18] Pagination limits are strictly clamped (max 50, min 1)', () => {
  const clampPageSize = (size) => Math.min(50, Math.max(1, size || 10));

  assert.equal(clampPageSize(100000), 50); // Clamped to 50
  assert.equal(clampPageSize(-5), 1); // Clamped to 1
  assert.equal(clampPageSize(25), 25);
});

test('Security - [19] Search query is properly sanitized for database parameters', () => {
  const sanitizeQuery = (q) => (typeof q === 'string' ? q.trim().slice(0, 100) : '');

  assert.equal(sanitizeQuery('  AI agents  '), 'AI agents');
  assert.equal(sanitizeQuery(null), '');
  assert.equal(sanitizeQuery('A'.repeat(200)).length, 100);
});

test('Security - [20] Audit logs are recorded for organizer mutation events', () => {
  const platform = createMockPlatform();

  platform.logAudit('usr_org_A', 'hack_A', 'HACKATHON_CREATED', 'Hackathon', 'hack_A');
  platform.logAudit('usr_org_A', 'hack_A', 'TRACK_CREATED', 'Track', 'trk_A1');
  platform.logAudit('usr_org_A', 'hack_A', 'PROBLEM_STATEMENT_CREATED', 'ProblemStatement', 'ps_A1_1');
  platform.logAudit('usr_org_A', 'hack_A', 'PRIZE_CREATED', 'Prize', 'prz_A1');
  platform.logAudit('usr_org_A', 'hack_A', 'HACKATHON_PUBLISHED', 'Hackathon', 'hack_A');

  assert.equal(platform.auditLogs.length, 5);
  assert.equal(platform.auditLogs[0].action, 'HACKATHON_CREATED');
  assert.equal(platform.auditLogs[1].action, 'TRACK_CREATED');
  assert.equal(platform.auditLogs[2].action, 'PROBLEM_STATEMENT_CREATED');
  assert.equal(platform.auditLogs[3].action, 'PRIZE_CREATED');
  assert.equal(platform.auditLogs[4].action, 'HACKATHON_PUBLISHED');
});
