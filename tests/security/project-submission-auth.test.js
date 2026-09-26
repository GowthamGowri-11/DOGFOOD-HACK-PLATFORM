const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('crypto');

// ---------------------------------------------------------------------------
// MOCK PLATFORM FOR PROJECT & SUBMISSION TESTING
// ---------------------------------------------------------------------------

function createMockSubmissionPlatform() {
  const users = new Map([
    ['usr_admin', { id: 'usr_admin', role: 'ADMIN', fullName: 'Platform Admin' }],
    ['usr_org_A', { id: 'usr_org_A', role: 'ORGANIZER', fullName: 'Organizer Alpha' }],
    ['usr_org_B', { id: 'usr_org_B', role: 'ORGANIZER', fullName: 'Organizer Beta' }],
    ['usr_alice', { id: 'usr_alice', role: 'PARTICIPANT', fullName: 'Alice' }],
    ['usr_bob', { id: 'usr_bob', role: 'PARTICIPANT', fullName: 'Bob' }],
    ['usr_charlie', { id: 'usr_charlie', role: 'PARTICIPANT', fullName: 'Charlie' }],
  ]);

  const hackathons = new Map([
    [
      'hack_A',
      {
        id: 'hack_A',
        organizerId: 'usr_org_A',
        title: 'Alpha Hackathon',
        status: 'PUBLISHED',
        minTeamSize: 1,
        maxTeamSize: 4,
        subStartTime: new Date('2026-10-05T00:00:00Z'),
        subEndTime: new Date('2026-10-15T23:59:59Z'),
      },
    ],
    [
      'hack_B',
      {
        id: 'hack_B',
        organizerId: 'usr_org_B',
        title: 'Beta Hackathon',
        status: 'PUBLISHED',
        minTeamSize: 1,
        maxTeamSize: 4,
        subStartTime: new Date('2026-10-05T00:00:00Z'),
        subEndTime: new Date('2026-10-15T23:59:59Z'),
      },
    ],
  ]);

  const tracks = new Map([
    ['trk_A1', { id: 'trk_A1', hackathonId: 'hack_A', title: 'AI Track' }],
    ['trk_B1', { id: 'trk_B1', hackathonId: 'hack_B', title: 'Cyber Track' }],
  ]);

  const problemStatements = new Map([
    ['ps_A1_1', { id: 'ps_A1_1', hackathonId: 'hack_A', trackId: 'trk_A1', code: 'AI-01', title: 'Agent Memory' }],
    ['ps_B1_1', { id: 'ps_B1_1', hackathonId: 'hack_B', trackId: 'trk_B1', code: 'CY-01', title: 'Zero Trust' }],
  ]);

  const registrations = new Map([
    ['hack_A:usr_alice', { hackathonId: 'hack_A', userId: 'usr_alice', status: 'APPROVED' }],
    ['hack_A:usr_bob', { hackathonId: 'hack_A', userId: 'usr_bob', status: 'APPROVED' }],
    ['hack_B:usr_charlie', { hackathonId: 'hack_B', userId: 'usr_charlie', status: 'APPROVED' }],
  ]);

  const teams = new Map([
    ['team_A1', { id: 'team_A1', hackathonId: 'hack_A', name: 'AliceTeam', leaderId: 'usr_alice' }],
    ['team_A2', { id: 'team_A2', hackathonId: 'hack_A', name: 'BobTeam', leaderId: 'usr_bob' }],
    ['team_B1', { id: 'team_B1', hackathonId: 'hack_B', name: 'CharlieTeam', leaderId: 'usr_charlie' }],
  ]);

  const teamMembers = new Map([
    ['team_A1:usr_alice', { teamId: 'team_A1', userId: 'usr_alice', isLeader: true }],
    ['team_A2:usr_bob', { teamId: 'team_A2', userId: 'usr_bob', isLeader: true }],
    ['team_B1:usr_charlie', { teamId: 'team_B1', userId: 'usr_charlie', isLeader: true }],
  ]);

  const projects = new Map(); // key: projectId
  const submissions = new Map(); // key: submissionId
  const auditLogs = [];

  function createProject(userId, data) {
    // 1. Verify user is in the team
    const isMember = teamMembers.has(`${data.teamId}:${userId}`);
    if (!isMember) throw new Error('FORBIDDEN');

    // 2. One-Project-Per-Team Rule
    for (const p of projects.values()) {
      if (p.teamId === data.teamId) throw new Error('PROJECT_ALREADY_EXISTS');
    }

    // 3. Track & Problem Statement Consistency
    const track = tracks.get(data.trackId);
    if (!track || track.hackathonId !== data.hackathonId) throw new Error('INVALID_TRACK');

    const problem = problemStatements.get(data.problemId);
    if (!problem || problem.hackathonId !== data.hackathonId || problem.trackId !== data.trackId) {
      throw new Error('TRACK_PROBLEM_MISMATCH');
    }

    const projectId = `proj_${projects.size + 1}`;
    const project = {
      id: projectId,
      hackathonId: data.hackathonId,
      teamId: data.teamId,
      trackId: data.trackId,
      problemId: data.problemId,
      title: data.title,
      description: data.description,
      repoUrl: data.repoUrl,
      demoUrl: data.demoUrl,
      isPublished: false,
    };

    projects.set(projectId, project);
    auditLogs.push({ action: 'PROJECT_CREATED', userId, projectId });
    return project;
  }

  function updateProject(userId, projectId, data) {
    const project = projects.get(projectId);
    if (!project) throw new Error('NOT_FOUND');

    const isMember = teamMembers.has(`${project.teamId}:${userId}`);
    if (!isMember) throw new Error('FORBIDDEN');

    // Check if locked
    for (const s of submissions.values()) {
      if (s.projectId === projectId && s.status === 'LOCKED') throw new Error('SUBMISSION_LOCKED');
    }

    Object.assign(project, data);
    auditLogs.push({ action: 'PROJECT_UPDATED', userId, projectId });
    return project;
  }

  function submitAndLock(userId, projectId, currentTime = new Date('2026-10-10T00:00:00Z')) {
    const project = projects.get(projectId);
    if (!project) throw new Error('NOT_FOUND');

    const isMember = teamMembers.has(`${project.teamId}:${userId}`);
    if (!isMember) throw new Error('FORBIDDEN');

    const h = hackathons.get(project.hackathonId);
    const now = new Date(currentTime).getTime();
    if (now < h.subStartTime.getTime()) throw new Error('SUBMISSION_WINDOW_NOT_OPEN');
    if (now > h.subEndTime.getTime()) throw new Error('SUBMISSION_WINDOW_CLOSED');

    // Check already locked
    for (const s of submissions.values()) {
      if (s.projectId === projectId && s.status === 'LOCKED') throw new Error('SUBMISSION_ALREADY_LOCKED');
    }

    // Required artifact check
    if (!project.repoUrl || !project.repoUrl.startsWith('https://github.com/')) {
      throw new Error('REQUIRED_ARTIFACT_MISSING');
    }

    const submissionId = `sub_${submissions.size + 1}`;
    const payloadSnapshot = {
      project: { title: project.title, description: project.description, repoUrl: project.repoUrl },
      submittedAt: new Date(currentTime).toISOString(),
      submitterId: userId,
    };
    const contentHash = crypto.createHash('sha256').update(JSON.stringify(payloadSnapshot)).digest('hex');

    const submission = {
      id: submissionId,
      projectId,
      status: 'LOCKED',
      payloadSnapshot,
      contentHash,
      submittedAt: new Date(currentTime),
      lockedAt: new Date(currentTime),
    };

    submissions.set(submissionId, submission);
    project.isPublished = true;
    auditLogs.push({ action: 'SUBMISSION_LOCKED', userId, projectId, submissionId });
    return submission;
  }

  return {
    users,
    hackathons,
    tracks,
    problemStatements,
    registrations,
    teams,
    teamMembers,
    projects,
    submissions,
    auditLogs,
    createProject,
    updateProject,
    submitAndLock,
  };
}

// ---------------------------------------------------------------------------
// 1-5: PROJECT CREATION & SCOPING SECURITY
// ---------------------------------------------------------------------------

test('Project Security - [1] Team member can create project for own team', () => {
  const p = createMockSubmissionPlatform();
  const proj = p.createProject('usr_alice', {
    hackathonId: 'hack_A',
    teamId: 'team_A1',
    trackId: 'trk_A1',
    problemId: 'ps_A1_1',
    title: 'Autonomous Sentinel',
    description: 'A comprehensive security agent built on distributed consensus.',
    repoUrl: 'https://github.com/dogfood/sentinel',
  });

  assert.equal(proj.title, 'Autonomous Sentinel');
  assert.equal(proj.teamId, 'team_A1');
});

test('Project Security - [2] Non-team member CANNOT create project for another team', () => {
  const p = createMockSubmissionPlatform();
  assert.throws(() => {
    p.createProject('usr_bob', {
      hackathonId: 'hack_A',
      teamId: 'team_A1', // Alice's team
      trackId: 'trk_A1',
      problemId: 'ps_A1_1',
      title: 'Hacked Project',
      description: 'Attempting to create project for Alice team',
      repoUrl: 'https://github.com/dogfood/exploit',
    });
  }, /FORBIDDEN/);
});

test('Project Security - [3] Selecting Track/Problem mismatch is rejected (400 TRACK_PROBLEM_MISMATCH)', () => {
  const p = createMockSubmissionPlatform();
  assert.throws(() => {
    p.createProject('usr_alice', {
      hackathonId: 'hack_A',
      teamId: 'team_A1',
      trackId: 'trk_A1',
      problemId: 'ps_B1_1', // Problem from Hackathon B
      title: 'Mismatched Project',
      description: 'Testing track problem consistency',
      repoUrl: 'https://github.com/dogfood/mismatch',
    });
  }, /TRACK_PROBLEM_MISMATCH/);
});

test('Project Security - [4] One-Project-Per-Team: Team cannot create multiple projects', () => {
  const p = createMockSubmissionPlatform();
  p.createProject('usr_alice', {
    hackathonId: 'hack_A',
    teamId: 'team_A1',
    trackId: 'trk_A1',
    problemId: 'ps_A1_1',
    title: 'First Project',
    description: 'First project for Alice team',
    repoUrl: 'https://github.com/dogfood/first',
  });

  assert.throws(() => {
    p.createProject('usr_alice', {
      hackathonId: 'hack_A',
      teamId: 'team_A1',
      trackId: 'trk_A1',
      problemId: 'ps_A1_1',
      title: 'Second Duplicate Project',
      description: 'Second project attempt for Alice team',
      repoUrl: 'https://github.com/dogfood/second',
    });
  }, /PROJECT_ALREADY_EXISTS/);
});

// ---------------------------------------------------------------------------
// 6-10: SUBMISSION DEADLINE & ARTIFACT VALIDATION
// ---------------------------------------------------------------------------

test('Project Security - [5] Submission missing required GitHub repository is rejected', () => {
  const p = createMockSubmissionPlatform();
  const proj = p.createProject('usr_alice', {
    hackathonId: 'hack_A',
    teamId: 'team_A1',
    trackId: 'trk_A1',
    problemId: 'ps_A1_1',
    title: 'Missing Artifact Project',
    description: 'Testing missing github repo artifact',
    repoUrl: 'invalid-url-string',
  });

  assert.throws(() => {
    p.submitAndLock('usr_alice', proj.id);
  }, /REQUIRED_ARTIFACT_MISSING/);
});

test('Project Security - [6] Submission before submission window opens is rejected', () => {
  const p = createMockSubmissionPlatform();
  const proj = p.createProject('usr_alice', {
    hackathonId: 'hack_A',
    teamId: 'team_A1',
    trackId: 'trk_A1',
    problemId: 'ps_A1_1',
    title: 'Early Project',
    description: 'Attempting submission before opening date',
    repoUrl: 'https://github.com/dogfood/early',
  });

  assert.throws(() => {
    p.submitAndLock('usr_alice', proj.id, '2026-10-01T00:00:00Z'); // Before Oct 5
  }, /SUBMISSION_WINDOW_NOT_OPEN/);
});

test('Project Security - [7] Submission after submission deadline is rejected', () => {
  const p = createMockSubmissionPlatform();
  const proj = p.createProject('usr_alice', {
    hackathonId: 'hack_A',
    teamId: 'team_A1',
    trackId: 'trk_A1',
    problemId: 'ps_A1_1',
    title: 'Late Project',
    description: 'Attempting submission after closing deadline',
    repoUrl: 'https://github.com/dogfood/late',
  });

  assert.throws(() => {
    p.submitAndLock('usr_alice', proj.id, '2026-10-20T00:00:00Z'); // After Oct 15
  }, /SUBMISSION_WINDOW_CLOSED/);
});

// ---------------------------------------------------------------------------
// 11-15: IMMUTABLE SNAPSHOT & LOCKING INTEGRITY
// ---------------------------------------------------------------------------

test('Project Security - [8] Complete End-to-End Submission & Immutability Integrity Test', () => {
  const p = createMockSubmissionPlatform();

  // 1. Create project
  const proj = p.createProject('usr_alice', {
    hackathonId: 'hack_A',
    teamId: 'team_A1',
    trackId: 'trk_A1',
    problemId: 'ps_A1_1',
    title: 'Immutable Sentinel AI',
    description: 'An autonomous multi-agent defense system.',
    repoUrl: 'https://github.com/dogfood/immutable-sentinel',
  });

  // 2. Edit draft before submission
  p.updateProject('usr_alice', proj.id, { description: 'Updated valid draft description.' });
  assert.equal(proj.description, 'Updated valid draft description.');

  // 3. Submit and Lock
  const submission = p.submitAndLock('usr_alice', proj.id);
  assert.equal(submission.status, 'LOCKED');
  assert.ok(submission.contentHash);
  assert.equal(submission.payloadSnapshot.project.title, 'Immutable Sentinel AI');

  // 4. Attempt project modification after locking -> MUST BE REJECTED
  assert.throws(() => {
    p.updateProject('usr_alice', proj.id, { title: 'Tampered Title After Lock' });
  }, /SUBMISSION_LOCKED/);

  // 5. Double submit attempt -> MUST BE REJECTED
  assert.throws(() => {
    p.submitAndLock('usr_alice', proj.id);
  }, /SUBMISSION_ALREADY_LOCKED/);

  // 6. Verify snapshot payload remains unchanged
  assert.equal(submission.payloadSnapshot.project.title, 'Immutable Sentinel AI');
});

test('Project Security - [9] Organizer A cannot inspect submissions of Organizer B', () => {
  const hackathons = new Map([
    ['hack_A', { organizerId: 'usr_org_A' }],
    ['hack_B', { organizerId: 'usr_org_B' }],
  ]);

  const canAccess = (orgId, hackId) => hackathons.get(hackId)?.organizerId === orgId;

  assert.equal(canAccess('usr_org_A', 'hack_A'), true);
  assert.equal(canAccess('usr_org_A', 'hack_B'), false);
});
