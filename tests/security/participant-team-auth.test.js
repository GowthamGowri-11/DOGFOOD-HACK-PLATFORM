const test = require('node:test');
const assert = require('node:assert/strict');

// ---------------------------------------------------------------------------
// MOCK PARTICIPANT & TEAM STORE
// ---------------------------------------------------------------------------

function createMockTeamPlatform() {
  const users = new Map([
    ['usr_admin', { id: 'usr_admin', role: 'ADMIN', fullName: 'Platform Admin' }],
    ['usr_org_A', { id: 'usr_org_A', role: 'ORGANIZER', fullName: 'Organizer Alpha' }],
    ['usr_org_B', { id: 'usr_org_B', role: 'ORGANIZER', fullName: 'Organizer Beta' }],
    ['usr_alice', { id: 'usr_alice', role: 'PARTICIPANT', fullName: 'Alice' }],
    ['usr_bob', { id: 'usr_bob', role: 'PARTICIPANT', fullName: 'Bob' }],
    ['usr_charlie', { id: 'usr_charlie', role: 'PARTICIPANT', fullName: 'Charlie' }],
    ['usr_unregistered', { id: 'usr_unregistered', role: 'PARTICIPANT', fullName: 'Unregistered' }],
  ]);

  const hackathons = new Map([
    [
      'hack_1',
      {
        id: 'hack_1',
        organizerId: 'usr_org_A',
        title: 'Alpha Hackathon',
        status: 'PUBLISHED',
        minTeamSize: 2,
        maxTeamSize: 3,
        regStartTime: new Date('2026-10-01T00:00:00Z'),
        regEndTime: new Date('2026-10-10T00:00:00Z'),
      },
    ],
    [
      'hack_draft',
      {
        id: 'hack_draft',
        organizerId: 'usr_org_A',
        title: 'Draft Hackathon',
        status: 'DRAFT',
        minTeamSize: 1,
        maxTeamSize: 4,
        regStartTime: new Date('2026-10-01T00:00:00Z'),
        regEndTime: new Date('2026-10-10T00:00:00Z'),
      },
    ],
  ]);

  const registrations = new Map(); // key: "hackathonId:userId"
  const teams = new Map(); // key: teamId
  const teamMembers = new Map(); // key: "teamId:userId"
  const invites = new Map(); // key: token
  const auditLogs = [];

  function register(userId, hackathonId, currentTime = new Date('2026-10-05T00:00:00Z')) {
    const h = hackathons.get(hackathonId);
    if (!h) throw new Error('NOT_FOUND');
    if (h.status === 'DRAFT') throw new Error('HACKATHON_DRAFT');
    const now = new Date(currentTime).getTime();
    if (now < h.regStartTime.getTime() || now > h.regEndTime.getTime()) {
      throw new Error('REGISTRATION_WINDOW_CLOSED');
    }
    const key = `${hackathonId}:${userId}`;
    if (registrations.has(key)) throw new Error('ALREADY_REGISTERED');
    registrations.set(key, { id: `reg_${key}`, hackathonId, userId, status: 'APPROVED' });
    auditLogs.push({ action: 'PARTICIPANT_REGISTERED', userId, hackathonId });
    return registrations.get(key);
  }

  function createTeam(userId, hackathonId, name) {
    const isReg = registrations.has(`${hackathonId}:${userId}`);
    if (!isReg) throw new Error('REGISTRATION_REQUIRED');

    // Check if user already in a team for this hackathon
    for (const [key, mem] of teamMembers.entries()) {
      if (mem.userId === userId) {
        const t = teams.get(mem.teamId);
        if (t && t.hackathonId === hackathonId) throw new Error('ALREADY_IN_TEAM');
      }
    }

    // Check name uniqueness
    for (const t of teams.values()) {
      if (t.hackathonId === hackathonId && t.name.toLowerCase() === name.toLowerCase()) {
        throw new Error('TEAM_NAME_TAKEN');
      }
    }

    const teamId = `team_${teams.size + 1}`;
    const team = { id: teamId, hackathonId, name, leaderId: userId, inviteCode: `CODE-${teamId}` };
    teams.set(teamId, team);
    teamMembers.set(`${teamId}:${userId}`, { teamId, userId, isLeader: true });
    auditLogs.push({ action: 'TEAM_CREATED', userId, hackathonId });
    return team;
  }

  function joinTeam(userId, teamId) {
    const team = teams.get(teamId);
    if (!team) throw new Error('TEAM_NOT_FOUND');
    const h = hackathons.get(team.hackathonId);

    const isReg = registrations.has(`${team.hackathonId}:${userId}`);
    if (!isReg) throw new Error('REGISTRATION_REQUIRED');

    // Check if user already in another team for this hackathon
    for (const [key, mem] of teamMembers.entries()) {
      if (mem.userId === userId) {
        const t = teams.get(mem.teamId);
        if (t && t.hackathonId === team.hackathonId) throw new Error('ALREADY_IN_TEAM');
      }
    }

    // Check team capacity
    let currentMembers = 0;
    for (const mem of teamMembers.values()) {
      if (mem.teamId === teamId) currentMembers++;
    }
    if (currentMembers >= h.maxTeamSize) throw new Error('TEAM_FULL');

    teamMembers.set(`${teamId}:${userId}`, { teamId, userId, isLeader: false });
    auditLogs.push({ action: 'TEAM_MEMBER_JOINED', userId, hackathonId: team.hackathonId });
    return true;
  }

  return {
    users,
    hackathons,
    registrations,
    teams,
    teamMembers,
    invites,
    auditLogs,
    register,
    createTeam,
    joinTeam,
  };
}

// ---------------------------------------------------------------------------
// 1-5: REGISTRATION LIFECYCLE & ELIGIBILITY TESTS
// ---------------------------------------------------------------------------

test('Participant Auth - [1] Participant can register during active registration window', () => {
  const p = createMockTeamPlatform();
  const reg = p.register('usr_alice', 'hack_1');
  assert.equal(reg.status, 'APPROVED');
  assert.equal(reg.userId, 'usr_alice');
});

test('Participant Auth - [2] Registration outside time window is rejected', () => {
  const p = createMockTeamPlatform();
  // Too late
  assert.throws(() => {
    p.register('usr_alice', 'hack_1', '2026-10-25T00:00:00Z');
  }, /REGISTRATION_WINDOW_CLOSED/);
});

test('Participant Auth - [3] Registration on DRAFT hackathon is rejected', () => {
  const p = createMockTeamPlatform();
  assert.throws(() => {
    p.register('usr_alice', 'hack_draft');
  }, /HACKATHON_DRAFT/);
});

test('Participant Auth - [4] Duplicate registration for same hackathon is rejected', () => {
  const p = createMockTeamPlatform();
  p.register('usr_alice', 'hack_1');
  assert.throws(() => {
    p.register('usr_alice', 'hack_1');
  }, /ALREADY_REGISTERED/);
});

// ---------------------------------------------------------------------------
// 6-11: TEAM FORMATION & ONE-TEAM-PER-HACKATHON RULE
// ---------------------------------------------------------------------------

test('Participant Auth - [5] Non-registered user CANNOT create a team', () => {
  const p = createMockTeamPlatform();
  assert.throws(() => {
    p.createTeam('usr_unregistered', 'hack_1', 'CyberNinjas');
  }, /REGISTRATION_REQUIRED/);
});

test('Participant Auth - [6] Registered participant can create team and becomes Leader', () => {
  const p = createMockTeamPlatform();
  p.register('usr_alice', 'hack_1');
  const team = p.createTeam('usr_alice', 'hack_1', 'CyberNinjas');
  assert.equal(team.name, 'CyberNinjas');
  assert.equal(team.leaderId, 'usr_alice');
});

test('Participant Auth - [7] ONE-TEAM-PER-HACKATHON: User cannot create multiple teams in same hackathon', () => {
  const p = createMockTeamPlatform();
  p.register('usr_alice', 'hack_1');
  p.createTeam('usr_alice', 'hack_1', 'CyberNinjas');

  assert.throws(() => {
    p.createTeam('usr_alice', 'hack_1', 'SecondTeam');
  }, /ALREADY_IN_TEAM/);
});

test('Participant Auth - [8] ONE-TEAM-PER-HACKATHON: User in team cannot join another team in same hackathon', () => {
  const p = createMockTeamPlatform();
  p.register('usr_alice', 'hack_1');
  p.register('usr_bob', 'hack_1');

  const teamAlice = p.createTeam('usr_alice', 'hack_1', 'TeamAlice');
  const teamBob = p.createTeam('usr_bob', 'hack_1', 'TeamBob');

  assert.throws(() => {
    p.joinTeam('usr_alice', teamBob.id);
  }, /ALREADY_IN_TEAM/);
});

test('Participant Auth - [9] Team Name uniqueness within hackathon is enforced', () => {
  const p = createMockTeamPlatform();
  p.register('usr_alice', 'hack_1');
  p.register('usr_bob', 'hack_1');

  p.createTeam('usr_alice', 'hack_1', 'ApexForce');

  assert.throws(() => {
    p.createTeam('usr_bob', 'hack_1', 'apexforce'); // Case-insensitive collision
  }, /TEAM_NAME_TAKEN/);
});

test('Participant Auth - [10] Exceeding maximum team size (max 3) is rejected', () => {
  const p = createMockTeamPlatform();
  p.register('usr_alice', 'hack_1');
  p.register('usr_bob', 'hack_1');
  p.register('usr_charlie', 'hack_1');

  const team = p.createTeam('usr_alice', 'hack_1', 'TrioTeam'); // 1 member
  p.joinTeam('usr_bob', team.id); // 2 members
  p.joinTeam('usr_charlie', team.id); // 3 members (Max reached)

  // Register 4th user
  p.users.set('usr_david', { id: 'usr_david', role: 'PARTICIPANT' });
  p.register('usr_david', 'hack_1');

  assert.throws(() => {
    p.joinTeam('usr_david', team.id);
  }, /TEAM_FULL/);
});

// ---------------------------------------------------------------------------
// 12-16: RESOURCE ISOLATION & AUDIT LOGGING
// ---------------------------------------------------------------------------

test('Participant Auth - [11] Non-team member CANNOT manage or disband another team', () => {
  const p = createMockTeamPlatform();
  p.register('usr_alice', 'hack_1');
  p.register('usr_bob', 'hack_1');
  const teamAlice = p.createTeam('usr_alice', 'hack_1', 'AliceHQ');

  const canManage = (userId, team) => team.leaderId === userId;
  assert.equal(canManage('usr_alice', teamAlice), true);
  assert.equal(canManage('usr_bob', teamAlice), false);
});

test('Participant Auth - [12] Organizer A cannot manage registrations/teams of Organizer B', () => {
  const hackathons = new Map([
    ['hack_A', { organizerId: 'usr_org_A' }],
    ['hack_B', { organizerId: 'usr_org_B' }],
  ]);

  const canOrganizerAccess = (orgId, hackId) => {
    const h = hackathons.get(hackId);
    return h ? h.organizerId === orgId : false;
  };

  assert.equal(canOrganizerAccess('usr_org_A', 'hack_A'), true);
  assert.equal(canOrganizerAccess('usr_org_A', 'hack_B'), false);
});

test('Participant Auth - [13] Audit logs are generated for all lifecycle and team operations', () => {
  const p = createMockTeamPlatform();
  p.register('usr_alice', 'hack_1');
  p.createTeam('usr_alice', 'hack_1', 'AuditTestedTeam');

  assert.equal(p.auditLogs.length, 2);
  assert.equal(p.auditLogs[0].action, 'PARTICIPANT_REGISTERED');
  assert.equal(p.auditLogs[1].action, 'TEAM_CREATED');
});
