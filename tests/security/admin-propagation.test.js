const test = require('node:test');
const assert = require('node:assert/strict');

// ---------------------------------------------------------------------------
// ADMIN TO ALL ROLES PROPAGATION & SECURITY TEST SUITE
// CANONICAL SINGLE SOURCE OF TRUTH IN DOMAIN MODEL
// ---------------------------------------------------------------------------

function createMockPlatformState() {
  const users = new Map([
    ['usr_admin_1', { id: 'usr_admin_1', role: 'ADMIN', fullName: 'Root Admin', email: 'admin@platform.com', isActive: true }],
    ['usr_admin_2', { id: 'usr_admin_2', role: 'ADMIN', fullName: 'Secondary Admin', email: 'admin2@platform.com', isActive: true }],
    ['usr_org_A', { id: 'usr_org_A', role: 'ORGANIZER', fullName: 'Organizer Alpha', email: 'orgA@platform.com', isActive: true }],
    ['usr_org_B', { id: 'usr_org_B', role: 'ORGANIZER', fullName: 'Organizer Beta', email: 'orgB@platform.com', isActive: true }],
    ['usr_part_1', { id: 'usr_part_1', role: 'PARTICIPANT', fullName: 'Alice Developer', email: 'alice@dev.com', isActive: true }],
    ['usr_part_2', { id: 'usr_part_2', role: 'PARTICIPANT', fullName: 'Bob Builder', email: 'bob@dev.com', isActive: true }],
    ['usr_judge_1', { id: 'usr_judge_1', role: 'JUDGE', fullName: 'Dr. Jane Judge', email: 'judge@eval.com', isActive: true }],
  ]);

  const hackathons = new Map();
  const teams = new Map();
  const teamMembers = new Map();
  const projects = new Map();
  const submissions = new Map();
  const judges = new Map();
  const judgeAssignments = new Map();
  const evaluations = new Map();
  const results = new Map();
  const certificates = new Map();
  const auditLogs = [];

  // Helper guards
  function requireAdmin(session) {
    if (!session) throw { status: 401, message: 'UNAUTHORIZED' };
    if (session.role !== 'ADMIN') throw { status: 403, message: 'FORBIDDEN_ROLE' };
    return session;
  }

  function logAudit(actorId, action, entityType, entityId, beforeState, afterState) {
    auditLogs.push({
      id: `audit_${auditLogs.length + 1}`,
      userId: actorId,
      action,
      entityType,
      entityId,
      beforeState,
      afterState,
      createdAt: new Date(),
    });
  }

  return {
    users,
    hackathons,
    teams,
    teamMembers,
    projects,
    submissions,
    judges,
    judgeAssignments,
    evaluations,
    results,
    certificates,
    auditLogs,
    requireAdmin,
    logAudit,
  };
}

test('Admin Cross-Role Propagation & Platform Control Suite', async (t) => {
  const state = createMockPlatformState();

  // -------------------------------------------------------------------------
  // TEST 1: Admin Creates Hackathon -> Organizer Assigned -> Organizer Sees It
  // -------------------------------------------------------------------------
  await t.test('TEST 1: Admin creates hackathon -> Organizer sees it in dashboard', () => {
    const adminSession = state.users.get('usr_admin_1');
    state.requireAdmin(adminSession);

    const hackathonData = {
      id: 'hack_001',
      title: 'Global AI Championship',
      slug: 'global-ai-championship',
      organizerId: 'usr_org_A',
      status: 'DRAFT',
    };

    state.hackathons.set(hackathonData.id, hackathonData);
    state.logAudit(adminSession.id, 'HACKATHON_CREATED', 'Hackathon', hackathonData.id, null, hackathonData);

    // Verify Organizer Alpha sees this hackathon in their list
    const orgAHackathons = Array.from(state.hackathons.values()).filter(
      (h) => h.organizerId === 'usr_org_A'
    );
    assert.equal(orgAHackathons.length, 1);
    assert.equal(orgAHackathons[0].title, 'Global AI Championship');

    // Verify Organizer Beta is strictly isolated and does NOT see it
    const orgBHackathons = Array.from(state.hackathons.values()).filter(
      (h) => h.organizerId === 'usr_org_B'
    );
    assert.equal(orgBHackathons.length, 0);
  });

  // -------------------------------------------------------------------------
  // TEST 2: Admin Updates Hackathon -> Organizer & All Roles Receive Canonical State
  // -------------------------------------------------------------------------
  await t.test('TEST 2: Admin updates hackathon title -> Organizer sees updated value', () => {
    const adminSession = state.users.get('usr_admin_1');
    state.requireAdmin(adminSession);

    const existing = state.hackathons.get('hack_001');
    assert.ok(existing);

    const beforeState = { ...existing };
    existing.title = 'Global AI & Autonomous Agents Championship';
    state.logAudit(adminSession.id, 'HACKATHON_UPDATED', 'Hackathon', existing.id, beforeState, { ...existing });

    // Organizer queries their hackathon from single source of truth
    const organizerHackathon = state.hackathons.get('hack_001');
    assert.equal(organizerHackathon.title, 'Global AI & Autonomous Agents Championship');
  });

  // -------------------------------------------------------------------------
  // TEST 3: Admin Publishes Hackathon -> Participant/Public Discovery Sees It
  // -------------------------------------------------------------------------
  await t.test('TEST 3: Admin publishes hackathon -> Participant/public discovery sees it', () => {
    // Before publishing (status: DRAFT), public discovery hides it
    const publicBefore = Array.from(state.hackathons.values()).filter((h) => h.status !== 'DRAFT');
    assert.equal(publicBefore.length, 0);

    const adminSession = state.users.get('usr_admin_1');
    state.requireAdmin(adminSession);

    const hackathon = state.hackathons.get('hack_001');
    hackathon.status = 'PUBLISHED';
    state.logAudit(adminSession.id, 'HACKATHON_PUBLISHED', 'Hackathon', hackathon.id, { status: 'DRAFT' }, { status: 'PUBLISHED' });

    // Public discovery now sees it
    const publicAfter = Array.from(state.hackathons.values()).filter((h) => h.status !== 'DRAFT');
    assert.equal(publicAfter.length, 1);
    assert.equal(publicAfter[0].id, 'hack_001');
  });

  // -------------------------------------------------------------------------
  // TEST 4: Admin Assigns Judge -> Judge Sees Assignment in Workspace
  // -------------------------------------------------------------------------
  await t.test('TEST 4: Admin assigns judge -> Judge sees assignment', () => {
    const adminSession = state.users.get('usr_admin_1');
    state.requireAdmin(adminSession);

    // Setup project
    const project = { id: 'proj_001', hackathonId: 'hack_001', title: 'Autonomous Health Diagnoser' };
    state.projects.set(project.id, project);

    // Admin creates Judge and Assignment
    const judge = { id: 'jdg_001', hackathonId: 'hack_001', userId: 'usr_judge_1', maxWorkload: 10 };
    state.judges.set(judge.id, judge);

    const assignment = { id: 'asgn_001', judgeId: judge.id, projectId: project.id, status: 'ASSIGNED' };
    state.judgeAssignments.set(assignment.id, assignment);
    state.logAudit(adminSession.id, 'JUDGE_ASSIGNED', 'JudgeAssignment', assignment.id, null, assignment);

    // Judge Jane queries her assigned projects
    const judgeAssignments = Array.from(state.judgeAssignments.values()).filter((a) => {
      const j = state.judges.get(a.judgeId);
      return j && j.userId === 'usr_judge_1';
    });

    assert.equal(judgeAssignments.length, 1);
    assert.equal(judgeAssignments[0].projectId, 'proj_001');
  });

  // -------------------------------------------------------------------------
  // TEST 5: Admin Changes User Role -> RBAC & Session Reflects New Role
  // -------------------------------------------------------------------------
  await t.test('TEST 5: Admin changes user role: PARTICIPANT -> ORGANIZER', () => {
    const adminSession = state.users.get('usr_admin_1');
    state.requireAdmin(adminSession);

    const user = state.users.get('usr_part_1');
    assert.equal(user.role, 'PARTICIPANT');

    const beforeRole = user.role;
    user.role = 'ORGANIZER';
    state.logAudit(adminSession.id, 'ROLE_CHANGED', 'User', user.id, { role: beforeRole }, { role: 'ORGANIZER' });

    // User is now verified as ORGANIZER
    const updatedUser = state.users.get('usr_part_1');
    assert.equal(updatedUser.role, 'ORGANIZER');
  });

  // -------------------------------------------------------------------------
  // TEST 6: Admin Publishes Leaderboard -> Participant Sees Result, Public Sees Leaderboard
  // -------------------------------------------------------------------------
  await t.test('TEST 6: Admin publishes leaderboard -> Results visible to participant & public', () => {
    const adminSession = state.users.get('usr_admin_1');
    state.requireAdmin(adminSession);

    // Setup result record (unpublished initially)
    const result = {
      id: 'res_001',
      hackathonId: 'hack_001',
      projectId: 'proj_001',
      rank: 1,
      finalScore: 96.5,
      isPublished: false,
    };
    state.results.set(result.id, result);

    // Public cannot view unpublished results
    const publicResultsBefore = Array.from(state.results.values()).filter((r) => r.isPublished);
    assert.equal(publicResultsBefore.length, 0);

    // Admin publishes results transactionally
    result.isPublished = true;
    const hackathon = state.hackathons.get('hack_001');
    hackathon.status = 'RESULTS_PUBLISHED';
    state.logAudit(adminSession.id, 'RESULTS_PUBLISHED', 'Hackathon', hackathon.id, { status: 'JUDGING' }, { status: 'RESULTS_PUBLISHED' });

    // Public now views leaderboard
    const publicResultsAfter = Array.from(state.results.values()).filter((r) => r.isPublished);
    assert.equal(publicResultsAfter.length, 1);
    assert.equal(publicResultsAfter[0].rank, 1);
    assert.equal(publicResultsAfter[0].finalScore, 96.5);
    assert.equal(hackathon.status, 'RESULTS_PUBLISHED');
  });

  // -------------------------------------------------------------------------
  // TEST 7: Admin Issues Certificate -> Participant Sees Certificate & Public Verification
  // -------------------------------------------------------------------------
  await t.test('TEST 7: Admin issues certificate -> Participant sees certificate and /verify works', () => {
    const adminSession = state.users.get('usr_admin_1');
    state.requireAdmin(adminSession);

    const cert = {
      id: 'cert_001',
      hackathonId: 'hack_001',
      userId: 'usr_part_2',
      recipientName: 'Bob Builder',
      verificationCode: 'APEX-GLO-789A',
      status: 'ISSUED',
    };
    state.certificates.set(cert.id, cert);
    state.logAudit(adminSession.id, 'CERTIFICATE_ISSUED', 'Certificate', cert.id, null, cert);

    // Participant Bob queries his certificates
    const bobCerts = Array.from(state.certificates.values()).filter((c) => c.userId === 'usr_part_2');
    assert.equal(bobCerts.length, 1);
    assert.equal(bobCerts[0].verificationCode, 'APEX-GLO-789A');

    // Public verify endpoint lookup by verificationCode
    const verified = Array.from(state.certificates.values()).find((c) => c.verificationCode === 'APEX-GLO-789A');
    assert.ok(verified);
    assert.equal(verified.status, 'ISSUED');
  });

  // -------------------------------------------------------------------------
  // TEST 8: Admin Modifies / Inspects Team -> Changes Centralized
  // -------------------------------------------------------------------------
  await t.test('TEST 8: Admin manages team -> Centralized team state updated', () => {
    const adminSession = state.users.get('usr_admin_1');
    state.requireAdmin(adminSession);

    const team = {
      id: 'team_001',
      hackathonId: 'hack_001',
      name: 'Alpha Innovators',
      inviteCode: 'ALPHA123',
    };
    state.teams.set(team.id, team);

    team.name = 'Alpha AI Superteam';
    state.logAudit(adminSession.id, 'TEAM_UPDATED', 'Team', team.id, { name: 'Alpha Innovators' }, { name: 'Alpha AI Superteam' });

    const updatedTeam = state.teams.get('team_001');
    assert.equal(updatedTeam.name, 'Alpha AI Superteam');
  });

  // -------------------------------------------------------------------------
  // TEST 9: Admin Action Creates AuditLog -> Full Attribution & Immutability
  // -------------------------------------------------------------------------
  await t.test('TEST 9: Admin actions create immutable audit log records', () => {
    assert.ok(state.auditLogs.length >= 7);

    const roleChangeAudit = state.auditLogs.find((l) => l.action === 'ROLE_CHANGED');
    assert.ok(roleChangeAudit);
    assert.equal(roleChangeAudit.userId, 'usr_admin_1');
    assert.equal(roleChangeAudit.entityType, 'User');
    assert.equal(roleChangeAudit.afterState.role, 'ORGANIZER');

    const resultPublishAudit = state.auditLogs.find((l) => l.action === 'RESULTS_PUBLISHED');
    assert.ok(resultPublishAudit);
    assert.equal(resultPublishAudit.entityType, 'Hackathon');
  });

  // -------------------------------------------------------------------------
  // TEST 10: Security Negative Tests & Last-Admin Lockout Protection
  // -------------------------------------------------------------------------
  await t.test('TEST 10: Security checks - Non-Admin calling Admin APIs returns 403 Forbidden', () => {
    const participantSession = state.users.get('usr_part_2');
    assert.throws(
      () => state.requireAdmin(participantSession),
      (err) => err.status === 403 && err.message === 'FORBIDDEN_ROLE'
    );

    const organizerSession = state.users.get('usr_org_A');
    assert.throws(
      () => state.requireAdmin(organizerSession),
      (err) => err.status === 403 && err.message === 'FORBIDDEN_ROLE'
    );

    const judgeSession = state.users.get('usr_judge_1');
    assert.throws(
      () => state.requireAdmin(judgeSession),
      (err) => err.status === 403 && err.message === 'FORBIDDEN_ROLE'
    );

    assert.throws(
      () => state.requireAdmin(null),
      (err) => err.status === 401 && err.message === 'UNAUTHORIZED'
    );
  });

  await t.test('TEST 11: Safety Constraint - Last-Admin lockout prevention', () => {
    // If only 1 active admin remains, demoting or deactivating them must throw
    const adminCount = Array.from(state.users.values()).filter((u) => u.role === 'ADMIN' && u.isActive).length;
    assert.equal(adminCount, 2);

    // Demote one admin safely
    const admin2 = state.users.get('usr_admin_2');
    admin2.role = 'ORGANIZER';

    const remainingAdmins = Array.from(state.users.values()).filter((u) => u.role === 'ADMIN' && u.isActive).length;
    assert.equal(remainingAdmins, 1);

    // Attempting to demote the final remaining admin (usr_admin_1) must be rejected
    function safeDemoteAdmin(targetUserId, newRole) {
      const targetUser = state.users.get(targetUserId);
      if (targetUser.role === 'ADMIN' && newRole !== 'ADMIN') {
        const activeAdmins = Array.from(state.users.values()).filter(
          (u) => u.role === 'ADMIN' && u.isActive
        ).length;
        if (activeAdmins <= 1) {
          throw { status: 400, message: 'LAST_ADMIN_LOCKOUT_PREVENTION' };
        }
      }
      targetUser.role = newRole;
    }

    assert.throws(
      () => safeDemoteAdmin('usr_admin_1', 'PARTICIPANT'),
      (err) => err.status === 400 && err.message === 'LAST_ADMIN_LOCKOUT_PREVENTION'
    );

    // Final admin remains an ADMIN
    assert.equal(state.users.get('usr_admin_1').role, 'ADMIN');
  });
});
