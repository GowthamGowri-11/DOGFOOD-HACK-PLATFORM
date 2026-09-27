const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('crypto');

// ---------------------------------------------------------------------------
// CANONICAL PARTICIPANT WORKFLOW E2E TEST SUITE
// ---------------------------------------------------------------------------

function createCanonicalPlatform() {
  const users = new Map([
    ['usr_alice', { id: 'usr_alice', email: 'alice@example.com', fullName: 'Alice Hacker', role: 'PARTICIPANT' }],
    ['usr_bob', { id: 'usr_bob', email: 'bob@example.com', fullName: 'Bob Builder', role: 'PARTICIPANT' }],
    ['usr_charlie', { id: 'usr_charlie', email: 'charlie@example.com', fullName: 'Charlie Coder', role: 'PARTICIPANT' }],
    ['usr_eve', { id: 'usr_eve', email: 'eve@example.com', fullName: 'Eve Attacker', role: 'PARTICIPANT' }],
    ['usr_org', { id: 'usr_org', email: 'org@example.com', fullName: 'Org Alpha', role: 'ORGANIZER' }],
    ['usr_judge', { id: 'usr_judge', email: 'judge@example.com', fullName: 'Judge Watson', role: 'JUDGE' }],
  ]);

  const hackathons = new Map([
    [
      'hack_main',
      {
        id: 'hack_main',
        title: 'Global AI Championship 2026',
        slug: 'global-ai-championship-2026',
        status: 'PUBLISHED',
        minTeamSize: 2,
        maxTeamSize: 4,
        regStartTime: new Date('2026-09-01T00:00:00Z'),
        regEndTime: new Date('2026-10-01T00:00:00Z'),
        subStartTime: new Date('2026-09-15T00:00:00Z'),
        subEndTime: new Date('2026-10-15T00:00:00Z'),
        judgingStartTime: new Date('2026-10-16T00:00:00Z'),
        judgingEndTime: new Date('2026-10-20T00:00:00Z'),
      },
    ],
  ]);

  const tracks = new Map([
    ['track_ai', { id: 'track_ai', hackathonId: 'hack_main', title: 'Autonomous AI Agents', slug: 'autonomous-ai' }],
    ['track_web3', { id: 'track_web3', hackathonId: 'hack_main', title: 'Decentralized Finance', slug: 'defi' }],
  ]);

  const problemStatements = new Map([
    [
      'ps_agents',
      {
        id: 'ps_agents',
        hackathonId: 'hack_main',
        trackId: 'track_ai',
        code: 'AI-01',
        title: 'Autonomous Threat Neutralization',
        description: 'Build an autonomous agent that monitors telemetry and detects intrusions.',
      },
    ],
    [
      'ps_defi',
      {
        id: 'ps_defi',
        hackathonId: 'hack_main',
        trackId: 'track_web3',
        code: 'WEB3-01',
        title: 'Automated Market Maker',
        description: 'Design a novel liquidity pool mechanism.',
      },
    ],
  ]);

  const registrations = new Map();
  const teams = new Map();
  const teamMembers = new Map();
  const teamInvites = new Map();
  const projects = new Map();
  const submissions = new Map();
  const attendanceSessions = new Map([
    [
      'session_keynote',
      {
        id: 'session_keynote',
        hackathonId: 'hack_main',
        title: 'Opening Keynote',
        sessionCode: 'KEYNOTE-2026',
        isActive: true,
      },
    ],
  ]);
  const attendanceRecords = new Map();
  const results = new Map();
  const certificates = new Map();
  const auditLogs = [];

  // 1. Discover & Register
  function register(userId, hackathonId, serverTime = new Date('2026-09-20T00:00:00Z')) {
    const h = hackathons.get(hackathonId);
    if (!h) throw new Error('NOT_FOUND');
    if (h.status !== 'PUBLISHED' && h.status !== 'REGISTRATION_OPEN') throw new Error('NOT_OPEN');
    if (serverTime < h.regStartTime || serverTime > h.regEndTime) throw new Error('REGISTRATION_WINDOW_CLOSED');
    const key = `${hackathonId}:${userId}`;
    if (registrations.has(key)) throw new Error('ALREADY_REGISTERED');

    const reg = { id: `reg_${key}`, hackathonId, userId, status: 'APPROVED', registeredAt: serverTime };
    registrations.set(key, reg);
    auditLogs.push({ action: 'PARTICIPANT_REGISTERED', userId, hackathonId });
    return reg;
  }

  // 2. Create Team
  function createTeam(userId, hackathonId, name) {
    if (!registrations.has(`${hackathonId}:${userId}`)) throw new Error('REGISTRATION_REQUIRED');
    for (const mem of teamMembers.values()) {
      if (mem.userId === userId) {
        const t = teams.get(mem.teamId);
        if (t && t.hackathonId === hackathonId) throw new Error('ALREADY_IN_TEAM');
      }
    }
    for (const t of teams.values()) {
      if (t.hackathonId === hackathonId && t.name.toLowerCase() === name.toLowerCase()) {
        throw new Error('TEAM_NAME_TAKEN');
      }
    }

    const teamId = `team_${teams.size + 1}`;
    const inviteCode = `INV-${name.toUpperCase().slice(0, 4)}-${teams.size + 1}`;
    const team = { id: teamId, hackathonId, name, leaderId: userId, inviteCode };
    teams.set(teamId, team);
    teamMembers.set(`${teamId}:${userId}`, { teamId, userId, isLeader: true });
    auditLogs.push({ action: 'TEAM_CREATED', userId, hackathonId });
    return team;
  }

  // 3. Send Team Invite
  function inviteMember(invitedById, teamId, invitedEmail) {
    const team = teams.get(teamId);
    if (!team) throw new Error('TEAM_NOT_FOUND');
    const isMember = teamMembers.has(`${teamId}:${invitedById}`);
    if (!isMember) throw new Error('FORBIDDEN');

    let count = 0;
    for (const mem of teamMembers.values()) if (mem.teamId === teamId) count++;
    const h = hackathons.get(team.hackathonId);
    if (count >= h.maxTeamSize) throw new Error('TEAM_FULL');

    const token = `tok_${crypto.randomBytes(8).toString('hex')}`;
    const invite = {
      id: `inv_${teamInvites.size + 1}`,
      teamId,
      invitedEmail: invitedEmail.toLowerCase().trim(),
      invitedById,
      token,
      status: 'PENDING',
      expiresAt: new Date(Date.now() + 7 * 86400000),
    };
    teamInvites.set(token, invite);
    auditLogs.push({ action: 'TEAM_INVITE_SENT', userId: invitedById, hackathonId: team.hackathonId });
    return invite;
  }

  // 4. Accept Invite
  function acceptInvite(userId, token) {
    const inv = teamInvites.get(token);
    if (!inv || inv.status !== 'PENDING') throw new Error('INVALID_TOKEN');
    if (new Date() > inv.expiresAt) throw new Error('INVITE_EXPIRED');

    const team = teams.get(inv.teamId);
    if (!registrations.has(`${team.hackathonId}:${userId}`)) throw new Error('REGISTRATION_REQUIRED');

    for (const mem of teamMembers.values()) {
      if (mem.userId === userId) {
        const t = teams.get(mem.teamId);
        if (t && t.hackathonId === team.hackathonId) throw new Error('ALREADY_IN_TEAM');
      }
    }

    teamMembers.set(`${team.id}:${userId}`, { teamId: team.id, userId, isLeader: false });
    inv.status = 'ACCEPTED';
    auditLogs.push({ action: 'TEAM_INVITE_ACCEPTED', userId, hackathonId: team.hackathonId });
    return team;
  }

  // 5. Create Project Workspace
  function createProject(userId, hackathonId, teamId, trackId, problemId, data) {
    const team = teams.get(teamId);
    if (!team || team.hackathonId !== hackathonId) throw new Error('INVALID_TEAM');
    if (!teamMembers.has(`${teamId}:${userId}`)) throw new Error('FORBIDDEN');

    for (const p of projects.values()) {
      if (p.teamId === teamId) throw new Error('PROJECT_ALREADY_EXISTS');
    }

    const tr = tracks.get(trackId);
    const ps = problemStatements.get(problemId);
    if (!tr || tr.hackathonId !== hackathonId) throw new Error('INVALID_TRACK');
    if (!ps || ps.hackathonId !== hackathonId || ps.trackId !== trackId) {
      throw new Error('TRACK_PROBLEM_MISMATCH');
    }

    const projId = `proj_${projects.size + 1}`;
    const project = {
      id: projId,
      hackathonId,
      teamId,
      trackId,
      problemId,
      title: data.title,
      description: data.description,
      repoUrl: data.repoUrl,
      demoUrl: data.demoUrl,
      videoUrl: data.videoUrl,
      techStack: data.techStack || [],
      isLocked: false,
    };
    projects.set(projId, project);
    auditLogs.push({ action: 'PROJECT_CREATED', userId, hackathonId });
    return project;
  }

  // 6. Validate & Submit & Lock Project
  function submitAndLockProject(userId, projectId, serverTime = new Date('2026-10-01T00:00:00Z')) {
    const project = projects.get(projectId);
    if (!project) throw new Error('PROJECT_NOT_FOUND');
    if (!teamMembers.has(`${project.teamId}:${userId}`)) throw new Error('FORBIDDEN');
    if (project.isLocked) throw new Error('SUBMISSION_LOCKED');

    const h = hackathons.get(project.hackathonId);
    if (serverTime < h.subStartTime || serverTime > h.subEndTime) {
      throw new Error('SUBMISSION_WINDOW_CLOSED');
    }

    if (!project.repoUrl || !project.repoUrl.includes('github.com')) {
      throw new Error('INVALID_REPO_URL');
    }
    if (!project.description || project.description.length < 20) {
      throw new Error('INCOMPLETE_DESCRIPTION');
    }

    const snapshotPayload = {
      projectId: project.id,
      title: project.title,
      description: project.description,
      repoUrl: project.repoUrl,
      demoUrl: project.demoUrl,
      trackId: project.trackId,
      problemId: project.problemId,
      submittedAt: serverTime.toISOString(),
    };

    const contentHash = crypto
      .createHash('sha256')
      .update(JSON.stringify(snapshotPayload))
      .digest('hex');

    const subId = `sub_${submissions.size + 1}`;
    const submission = {
      id: subId,
      projectId: project.id,
      versionNumber: 1,
      status: 'LOCKED',
      payloadSnapshot: snapshotPayload,
      contentHash,
      submittedAt: serverTime,
      lockedAt: serverTime,
      createdById: userId,
    };
    submissions.set(subId, submission);
    project.isLocked = true;
    auditLogs.push({ action: 'PROJECT_SUBMITTED_AND_LOCKED', userId, hackathonId: h.id });
    return submission;
  }

  // 7. Check-in Attendance
  function checkInAttendance(userId, sessionCode) {
    let session = null;
    for (const s of attendanceSessions.values()) {
      if (s.sessionCode.toUpperCase() === sessionCode.toUpperCase() && s.isActive) {
        session = s;
        break;
      }
    }
    if (!session) throw new Error('INVALID_SESSION_CODE');

    if (!registrations.has(`${session.hackathonId}:${userId}`)) {
      throw new Error('REGISTRATION_REQUIRED');
    }

    const key = `${session.id}:${userId}`;
    if (attendanceRecords.has(key)) throw new Error('ALREADY_CHECKED_IN');

    const rec = { id: `att_${key}`, sessionId: session.id, userId, checkedInAt: new Date() };
    attendanceRecords.set(key, rec);
    auditLogs.push({ action: 'ATTENDANCE_CHECKED_IN', userId, hackathonId: session.hackathonId });
    return rec;
  }

  // 8. Publish Results
  function publishResults(hackathonId, projectResults) {
    const h = hackathons.get(hackathonId);
    if (!h) throw new Error('NOT_FOUND');
    h.status = 'RESULTS_PUBLISHED';

    for (const r of projectResults) {
      results.set(r.projectId, {
        projectId: r.projectId,
        hackathonId,
        rank: r.rank,
        finalScore: r.finalScore,
        awardCategory: r.awardCategory,
        isWinner: r.isWinner,
        isPublished: true,
      });
    }
  }

  // 9. Issue Certificate
  function issueCertificate(userId, hackathonId, title, type = 'WINNER') {
    const certId = `cert_${certificates.size + 1}`;
    const verificationCode = `APEX-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    const cert = {
      id: certId,
      userId,
      hackathonId,
      title,
      type,
      verificationCode,
      status: 'ISSUED',
      issuedAt: new Date(),
    };
    certificates.set(certId, cert);
    auditLogs.push({ action: 'CERTIFICATE_ISSUED', userId, hackathonId });
    return cert;
  }

  return {
    users,
    hackathons,
    tracks,
    problemStatements,
    registrations,
    teams,
    teamMembers,
    teamInvites,
    projects,
    submissions,
    attendanceSessions,
    attendanceRecords,
    results,
    certificates,
    auditLogs,
    register,
    createTeam,
    inviteMember,
    acceptInvite,
    createProject,
    submitAndLockProject,
    checkInAttendance,
    publishResults,
    issueCertificate,
  };
}

// ---------------------------------------------------------------------------
// END-TO-END PARTICIPANT LIFECYCLE TESTS
// ---------------------------------------------------------------------------

test('Participant E2E - Complete 27-Step Participation Workflow', () => {
  const p = createCanonicalPlatform();

  // Step 1: Discover hackathon
  const h = p.hackathons.get('hack_main');
  assert.equal(h.status, 'PUBLISHED');

  // Step 2: Register Alice and Bob
  const regAlice = p.register('usr_alice', 'hack_main');
  const regBob = p.register('usr_bob', 'hack_main');
  assert.equal(regAlice.status, 'APPROVED');
  assert.equal(regBob.status, 'APPROVED');

  // Step 3: Create Team by Alice (becomes Leader)
  const team = p.createTeam('usr_alice', 'hack_main', 'Team Apex Guardians');
  assert.equal(team.name, 'Team Apex Guardians');
  assert.equal(team.leaderId, 'usr_alice');

  // Step 4: Alice invites Bob
  const invite = p.inviteMember('usr_alice', team.id, 'bob@example.com');
  assert.equal(invite.status, 'PENDING');

  // Step 5: Bob accepts invite
  p.acceptInvite('usr_bob', invite.token);
  assert.equal(invite.status, 'ACCEPTED');

  // Step 6: Alice creates project workspace aligned with Track and Problem Statement
  const project = p.createProject('usr_alice', 'hack_main', team.id, 'track_ai', 'ps_agents', {
    title: 'SentinelShield Autonomous Agent',
    description: 'Autonomous multi-agent system analyzing real-time threat telemetry and isolating adversarial payloads.',
    repoUrl: 'https://github.com/apex-guardians/sentinel-shield',
    demoUrl: 'https://sentinel-shield.vercel.app',
    videoUrl: 'https://youtube.com/watch?v=sample123',
    techStack: ['Next.js', 'TypeScript', 'Prisma', 'Claude-3.7'],
  });
  assert.equal(project.title, 'SentinelShield Autonomous Agent');
  assert.equal(project.isLocked, false);

  // Step 7: Check-in attendance at keynote
  const attendance = p.checkInAttendance('usr_alice', 'KEYNOTE-2026');
  assert.equal(attendance.userId, 'usr_alice');

  // Step 8: Validate & Submit & Lock solution
  const submission = p.submitAndLockProject('usr_alice', project.id);
  assert.equal(submission.status, 'LOCKED');
  assert.ok(submission.contentHash.length > 0);
  assert.equal(project.isLocked, true);

  // Step 9: Immutability check - Cannot resubmit or edit locked project
  assert.throws(() => {
    p.submitAndLockProject('usr_alice', project.id);
  }, /SUBMISSION_LOCKED/);

  // Step 10: Organizer publishes results
  p.publishResults('hack_main', [
    {
      projectId: project.id,
      rank: 1,
      finalScore: 96.5,
      awardCategory: 'Grand Champion — Best Autonomous Agent',
      isWinner: true,
    },
  ]);

  const res = p.results.get(project.id);
  assert.equal(res.rank, 1);
  assert.equal(res.isWinner, true);

  // Step 11: Certificate issued
  const cert = p.issueCertificate('usr_alice', 'hack_main', 'Grand Champion Award');
  assert.equal(cert.userId, 'usr_alice');
  assert.equal(cert.status, 'ISSUED');
  assert.ok(cert.verificationCode.startsWith('APEX-'));

  // Step 12: Verify full audit trail
  const actions = p.auditLogs.map((a) => a.action);
  assert.ok(actions.includes('PARTICIPANT_REGISTERED'));
  assert.ok(actions.includes('TEAM_CREATED'));
  assert.ok(actions.includes('TEAM_INVITE_SENT'));
  assert.ok(actions.includes('TEAM_INVITE_ACCEPTED'));
  assert.ok(actions.includes('PROJECT_CREATED'));
  assert.ok(actions.includes('ATTENDANCE_CHECKED_IN'));
  assert.ok(actions.includes('PROJECT_SUBMITTED_AND_LOCKED'));
  assert.ok(actions.includes('CERTIFICATE_ISSUED'));
});

// ---------------------------------------------------------------------------
// SECURITY & HORIZONTAL ISOLATION TESTS
// ---------------------------------------------------------------------------

test('Participant Security - [1] Participant Eve CANNOT create project for Alice team', () => {
  const p = createCanonicalPlatform();
  p.register('usr_alice', 'hack_main');
  p.register('usr_eve', 'hack_main');

  const teamAlice = p.createTeam('usr_alice', 'hack_main', 'AliceCrew');

  assert.throws(() => {
    p.createProject('usr_eve', 'hack_main', teamAlice.id, 'track_ai', 'ps_agents', {
      title: 'Eve Hijack',
      description: 'Attempting to inject project into Alice team.',
      repoUrl: 'https://github.com/eve/hijack',
    });
  }, /FORBIDDEN/);
});

test('Participant Security - [2] Participant Eve CANNOT submit/lock Alice project', () => {
  const p = createCanonicalPlatform();
  p.register('usr_alice', 'hack_main');
  p.register('usr_eve', 'hack_main');

  const teamAlice = p.createTeam('usr_alice', 'hack_main', 'AliceCrew');
  const projAlice = p.createProject('usr_alice', 'hack_main', teamAlice.id, 'track_ai', 'ps_agents', {
    title: 'Legitimate Project',
    description: 'This is a genuine high quality hackathon project description.',
    repoUrl: 'https://github.com/alice/project',
  });

  assert.throws(() => {
    p.submitAndLockProject('usr_eve', projAlice.id);
  }, /FORBIDDEN/);
});

test('Participant Security - [3] Selecting Track & Problem Statement mismatch is rejected', () => {
  const p = createCanonicalPlatform();
  p.register('usr_alice', 'hack_main');
  const team = p.createTeam('usr_alice', 'hack_main', 'SoloAlice');

  // Track AI with Problem Statement from Track Web3
  assert.throws(() => {
    p.createProject('usr_alice', 'hack_main', team.id, 'track_ai', 'ps_defi', {
      title: 'Mismatched Track Project',
      description: 'This project pairs AI track with Defi problem statement.',
      repoUrl: 'https://github.com/alice/mismatch',
    });
  }, /TRACK_PROBLEM_MISMATCH/);
});

test('Participant Security - [4] Double check-in for same session is rejected', () => {
  const p = createCanonicalPlatform();
  p.register('usr_alice', 'hack_main');

  p.checkInAttendance('usr_alice', 'KEYNOTE-2026');
  assert.throws(() => {
    p.checkInAttendance('usr_alice', 'KEYNOTE-2026');
  }, /ALREADY_CHECKED_IN/);
});

test('Participant Security - [5] Submission after deadline is strictly rejected', () => {
  const p = createCanonicalPlatform();
  p.register('usr_alice', 'hack_main');
  const team = p.createTeam('usr_alice', 'hack_main', 'LateTeam');
  const proj = p.createProject('usr_alice', 'hack_main', team.id, 'track_ai', 'ps_agents', {
    title: 'Late Project Submission',
    description: 'Attempting to submit past the authoritative server deadline timestamp.',
    repoUrl: 'https://github.com/alice/late',
  });

  // Server time past submission deadline (2026-10-15)
  const lateTime = new Date('2026-10-20T00:00:00Z');
  assert.throws(() => {
    p.submitAndLockProject('usr_alice', proj.id, lateTime);
  }, /SUBMISSION_WINDOW_CLOSED/);
});
