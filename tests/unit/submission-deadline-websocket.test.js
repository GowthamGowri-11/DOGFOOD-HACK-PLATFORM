const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('crypto');

// ---------------------------------------------------------------------------
// CANONICAL SUBMISSION DEADLINE & REALTIME WEBSOCKET WORKFLOW SUITE
// ---------------------------------------------------------------------------

function createAuthoritativeSubmissionPlatform() {
  const users = new Map([
    ['usr_admin', { id: 'usr_admin', role: 'ADMIN', fullName: 'Platform Admin', email: 'admin@platform.com' }],
    ['usr_org_A', { id: 'usr_org_A', role: 'ORGANIZER', fullName: 'Organizer Alpha', email: 'orgA@platform.com' }],
    ['usr_org_B', { id: 'usr_org_B', role: 'ORGANIZER', fullName: 'Organizer Beta', email: 'orgB@platform.com' }],
    ['usr_alice', { id: 'usr_alice', role: 'PARTICIPANT', fullName: 'Alice', email: 'alice@platform.com' }],
    ['usr_bob', { id: 'usr_bob', role: 'PARTICIPANT', fullName: 'Bob', email: 'bob@platform.com' }],
    ['usr_charlie', { id: 'usr_charlie', role: 'PARTICIPANT', fullName: 'Charlie', email: 'charlie@platform.com' }],
    ['usr_eve', { id: 'usr_eve', role: 'PARTICIPANT', fullName: 'Eve', email: 'eve@platform.com' }],
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
        subStartTime: new Date('2026-09-28T10:00:00.000Z'),
        subEndTime: new Date('2026-09-28T18:00:00.000Z'),
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
        subStartTime: new Date('2026-09-28T12:00:00.000Z'),
        subEndTime: new Date('2026-09-28T20:00:00.000Z'),
      },
    ],
    [
      'hack_C',
      {
        id: 'hack_C',
        organizerId: 'usr_org_A',
        title: 'Gamma Hackathon',
        status: 'PUBLISHED',
        minTeamSize: 1,
        maxTeamSize: 4,
        subStartTime: new Date('2026-09-28T14:00:00.000Z'),
        subEndTime: new Date('2026-09-28T22:00:00.000Z'),
      },
    ],
  ]);

  const tracks = new Map([
    ['trk_A1', { id: 'trk_A1', hackathonId: 'hack_A', title: 'AI Track' }],
    ['trk_B1', { id: 'trk_B1', hackathonId: 'hack_B', title: 'Web3 Track' }],
  ]);

  const problemStatements = new Map([
    ['ps_A1', { id: 'ps_A1', hackathonId: 'hack_A', trackId: 'trk_A1', code: 'AI-01', title: 'LLM Agents' }],
    ['ps_B1', { id: 'ps_B1', hackathonId: 'hack_B', trackId: 'trk_B1', code: 'W3-01', title: 'Smart Contracts' }],
  ]);

  const teams = new Map([
    ['team_A1', { id: 'team_A1', hackathonId: 'hack_A', name: 'AliceTeam', leaderId: 'usr_alice' }],
    ['team_B1', { id: 'team_B1', hackathonId: 'hack_B', name: 'CharlieTeam', leaderId: 'usr_charlie' }],
  ]);

  const teamMembers = new Map([
    ['team_A1:usr_alice', { teamId: 'team_A1', userId: 'usr_alice', isLeader: true }],
    ['team_A1:usr_bob', { teamId: 'team_A1', userId: 'usr_bob', isLeader: false }],
    ['team_B1:usr_charlie', { teamId: 'team_B1', userId: 'usr_charlie', isLeader: true }],
  ]);

  const projects = new Map([
    [
      'proj_A1',
      {
        id: 'proj_A1',
        hackathonId: 'hack_A',
        teamId: 'team_A1',
        trackId: 'trk_A1',
        problemId: 'ps_A1',
        title: 'Alpha Autonomous Agent',
        description: 'Comprehensive intelligent assistant platform with stateful memory and autonomous task execution capabilities.',
        repoUrl: 'https://github.com/alice/autonomous-agent',
        demoUrl: 'https://agent-demo.atlyx.io',
        isPublished: false,
      },
    ],
    [
      'proj_B1',
      {
        id: 'proj_B1',
        hackathonId: 'hack_B',
        teamId: 'team_B1',
        trackId: 'trk_B1',
        problemId: 'ps_B1',
        title: 'Beta Decentralized Exchange',
        description: 'Next-generation decentralized exchange with zero gas limit order capabilities and automated market maker pools.',
        repoUrl: 'https://github.com/charlie/dex-platform',
        demoUrl: 'https://dex-demo.atlyx.io',
        isPublished: false,
      },
    ],
  ]);

  const submissions = new Map();
  const emittedEvents = [];
  const roomSubscriptions = new Map(); // room -> Set<userId>

  // --- Realtime Event Bus & WebSocket Subsystem ---
  function subscribeRoom(userId, room) {
    const user = users.get(userId);
    if (!user) throw new Error('AUTH_REQUIRED');

    // Room Authorization Guard
    const [prefix, id] = room.split(':');
    let authorized = false;

    if (user.role === 'ADMIN') {
      authorized = true;
    } else if (prefix === 'user' && id === userId) {
      authorized = true;
    } else if (prefix === 'hackathon') {
      // Authenticated participants, organizers, and judges can subscribe
      authorized = true;
    } else if (prefix === 'organizer') {
      // Must be the assigned organizer
      const h = hackathons.get(id);
      authorized = h && h.organizerId === userId;
    } else if (prefix === 'team') {
      authorized = teamMembers.has(`${id}:${userId}`);
    } else if (prefix === 'project') {
      const p = projects.get(id);
      authorized = p && teamMembers.has(`${p.teamId}:${userId}`);
    }

    if (!authorized) {
      throw new Error('ROOM_JOIN_DENIED: Unauthorized access to room');
    }

    if (!roomSubscriptions.has(room)) {
      roomSubscriptions.set(room, new Set());
    }
    roomSubscriptions.get(room).add(userId);
    return true;
  }

  function publishEvent(event) {
    emittedEvents.push(event);
    return event;
  }

  // --- Submission Window State Helper ---
  function getSubmissionWindowState(hackathon, serverTime = new Date()) {
    const now = new Date(serverTime).getTime();
    const opensAt = new Date(hackathon.subStartTime).getTime();
    const deadline = new Date(hackathon.subEndTime).getTime();

    if (now < opensAt) return 'UPCOMING';
    if (now >= opensAt && now < deadline) return 'SUBMISSION_OPEN';
    return 'SUBMISSION_CLOSED';
  }

  function getSubmissionStatusREST(hackathonId, serverTime = new Date()) {
    const h = hackathons.get(hackathonId);
    if (!h) throw new Error('NOT_FOUND');

    const status = getSubmissionWindowState(h, serverTime);
    const now = new Date(serverTime).getTime();
    const deadline = new Date(h.subEndTime).getTime();
    const opensAt = new Date(h.subStartTime).getTime();

    return {
      status,
      submissionOpensAt: h.subStartTime.toISOString(),
      submissionDeadline: h.subEndTime.toISOString(),
      serverTime: new Date(serverTime).toISOString(),
      timeRemainingMs: Math.max(0, deadline - now),
      timeUntilOpenMs: Math.max(0, opensAt - now),
    };
  }

  // --- Organizer/Admin Window Configuration ---
  function configureSubmissionWindow(actorId, hackathonId, { subStartTime, subEndTime }) {
    const actor = users.get(actorId);
    if (!actor) throw new Error('AUTH_REQUIRED');

    const h = hackathons.get(hackathonId);
    if (!h) throw new Error('NOT_FOUND');

    // Strict Organizer & Admin Authorization
    if (actor.role !== 'ADMIN' && h.organizerId !== actorId) {
      throw new Error('FORBIDDEN_RESOURCE: You are not authorized to configure this hackathon');
    }

    const start = new Date(subStartTime).getTime();
    const end = new Date(subEndTime).getTime();

    if (isNaN(start) || isNaN(end)) {
      throw new Error('INVALID_DATES: Dates must be valid timestamps');
    }
    if (start >= end) {
      throw new Error('INVALID_DATES: Submission deadline must be after submission opening time');
    }

    h.subStartTime = new Date(subStartTime);
    h.subEndTime = new Date(subEndTime);

    publishEvent({
      eventId: crypto.randomUUID(),
      type: 'SUBMISSION_WINDOW_UPDATED',
      hackathonId,
      timestamp: new Date().toISOString(),
      rooms: [`hackathon:${hackathonId}`, `organizer:${hackathonId}`],
      payload: {
        subStartTime: h.subStartTime.toISOString(),
        subEndTime: h.subEndTime.toISOString(),
        status: getSubmissionWindowState(h),
      },
    });

    return h;
  }

  // --- Authoritative Mutation: Submit Project ---
  function submitProject(userId, projectId, serverTime = new Date()) {
    const user = users.get(userId);
    if (!user) throw new Error('AUTH_REQUIRED');

    const project = projects.get(projectId);
    if (!project) throw new Error('NOT_FOUND');

    // 1. Team membership check
    const isMember = teamMembers.has(`${project.teamId}:${userId}`);
    if (!isMember) {
      throw new Error('FORBIDDEN: User does not belong to project team');
    }

    // 2. Authoritative Server Time & Submission Window Validation
    const hackathon = hackathons.get(project.hackathonId);
    const now = new Date(serverTime).getTime();
    const opensAt = new Date(hackathon.subStartTime).getTime();
    const deadline = new Date(hackathon.subEndTime).getTime();

    if (now < opensAt) {
      const err = new Error('SUBMISSION_NOT_OPEN: Submission has not opened yet.');
      err.code = 'SUBMISSION_NOT_OPEN';
      err.status = 422;
      throw err;
    }

    if (now >= deadline) {
      const err = new Error('SUBMISSION_DEADLINE_PASSED: The submission deadline has passed.');
      err.code = 'SUBMISSION_DEADLINE_PASSED';
      err.status = 422;
      throw err;
    }

    // 3. Prevent duplicate locks
    for (const s of submissions.values()) {
      if (s.projectId === projectId && s.status === 'LOCKED') {
        throw new Error('SUBMISSION_ALREADY_LOCKED');
      }
    }

    // 4. Artifact requirements check
    if (!project.repoUrl || !project.repoUrl.startsWith('https://github.com/')) {
      throw new Error('REQUIRED_ARTIFACT_MISSING: Valid GitHub repository URL is required.');
    }

    // 5. Create immutable submission snapshot
    const subId = `sub_${submissions.size + 1}`;
    const payloadSnapshot = {
      project: {
        id: project.id,
        title: project.title,
        description: project.description,
        repoUrl: project.repoUrl,
        demoUrl: project.demoUrl,
      },
      submittedAt: new Date(serverTime).toISOString(),
      submittedBy: userId,
      version: 1,
    };
    const contentHash = crypto.createHash('sha256').update(JSON.stringify(payloadSnapshot)).digest('hex');

    const submission = {
      id: subId,
      projectId,
      versionNumber: 1,
      status: 'LOCKED',
      payloadSnapshot,
      contentHash,
      submittedAt: new Date(serverTime),
      lockedAt: new Date(serverTime),
      createdById: userId,
    };

    submissions.set(subId, submission);
    project.isPublished = true;

    // 6. Realtime Announcement
    publishEvent({
      eventId: crypto.randomUUID(),
      type: 'SUBMISSION_LOCKED',
      hackathonId: project.hackathonId,
      projectId,
      rooms: [`hackathon:${project.hackathonId}`, `team:${project.teamId}`],
      payload: {
        submissionId: subId,
        projectId,
        contentHash,
        status: 'LOCKED',
        submittedAt: submission.submittedAt.toISOString(),
      },
    });

    return submission;
  }

  // --- Deadline Monitoring Worker ---
  const emittedDeadlines = new Set();
  const emittedOpens = new Set();

  function checkDeadlines(serverTime = new Date()) {
    const now = new Date(serverTime).getTime();
    const transitions = [];

    for (const [id, h] of hackathons.entries()) {
      const opensAt = new Date(h.subStartTime).getTime();
      const deadline = new Date(h.subEndTime).getTime();

      // Open transition
      if (now >= opensAt && now < deadline) {
        if (!emittedOpens.has(id)) {
          emittedOpens.add(id);
          const evt = publishEvent({
            eventId: crypto.randomUUID(),
            type: 'SUBMISSION_WINDOW_OPENED',
            hackathonId: id,
            timestamp: new Date(serverTime).toISOString(),
            rooms: [`hackathon:${id}`, `organizer:${id}`],
            payload: {
              status: 'SUBMISSION_OPEN',
              submissionOpensAt: h.subStartTime.toISOString(),
            },
          });
          transitions.push(evt);
        }
      }

      // Deadline reached transition
      if (now >= deadline) {
        if (!emittedDeadlines.has(id)) {
          emittedDeadlines.add(id);
          const evt = publishEvent({
            eventId: crypto.randomUUID(),
            type: 'SUBMISSION_DEADLINE_REACHED',
            hackathonId: id,
            timestamp: new Date(serverTime).toISOString(),
            rooms: [`hackathon:${id}`, `organizer:${id}`],
            payload: {
              status: 'SUBMISSION_CLOSED',
              submissionDeadline: h.subEndTime.toISOString(),
            },
          });
          transitions.push(evt);
        }
      }
    }

    return transitions;
  }

  return {
    hackathons,
    projects,
    submissions,
    emittedEvents,
    subscribeRoom,
    getSubmissionWindowState,
    getSubmissionStatusREST,
    configureSubmissionWindow,
    submitProject,
    checkDeadlines,
    clearEmitted: () => {
      emittedDeadlines.clear();
      emittedOpens.clear();
      emittedEvents.length = 0;
    },
  };
}

// ---------------------------------------------------------------------------
// TEST CASES
// ---------------------------------------------------------------------------

test('Submission Deadline & Realtime - [1] Submission before opening is strictly rejected', () => {
  const p = createAuthoritativeSubmissionPlatform();
  // Open is 10:00 AM, try at 09:59:59 AM
  const earlyTime = new Date('2026-09-28T09:59:59.000Z');

  assert.throws(
    () => p.submitProject('usr_alice', 'proj_A1', earlyTime),
    /SUBMISSION_NOT_OPEN/
  );
});

test('Submission Deadline & Realtime - [2] Submission exactly at opening is accepted', () => {
  const p = createAuthoritativeSubmissionPlatform();
  // Open is 10:00:00.000Z
  const openTime = new Date('2026-09-28T10:00:00.000Z');
  const sub = p.submitProject('usr_alice', 'proj_A1', openTime);

  assert.equal(sub.status, 'LOCKED');
  assert.equal(sub.projectId, 'proj_A1');
});

test('Submission Deadline & Realtime - [3] Submission during active window is accepted', () => {
  const p = createAuthoritativeSubmissionPlatform();
  // Mid-window: 14:30:00Z
  const midTime = new Date('2026-09-28T14:30:00.000Z');
  const sub = p.submitProject('usr_alice', 'proj_A1', midTime);

  assert.equal(sub.status, 'LOCKED');
  assert.ok(sub.contentHash.length === 64);
});

test('Submission Deadline & Realtime - [4] Submission just before deadline (17:59:59.900) is accepted', () => {
  const p = createAuthoritativeSubmissionPlatform();
  // Deadline is 18:00:00.000Z. Test 100ms prior: 17:59:59.900Z
  const justBeforeTime = new Date('2026-09-28T17:59:59.900Z');
  const sub = p.submitProject('usr_alice', 'proj_A1', justBeforeTime);

  assert.equal(sub.status, 'LOCKED');
});

test('Submission Deadline & Realtime - [5] Submission exactly at deadline (18:00:00.000) is rejected', () => {
  const p = createAuthoritativeSubmissionPlatform();
  // Deadline is 18:00:00.000Z
  const exactDeadline = new Date('2026-09-28T18:00:00.000Z');

  assert.throws(
    () => p.submitProject('usr_alice', 'proj_A1', exactDeadline),
    /SUBMISSION_DEADLINE_PASSED/
  );
});

test('Submission Deadline & Realtime - [6] Submission after deadline (18:00:01.000) is rejected', () => {
  const p = createAuthoritativeSubmissionPlatform();
  const pastDeadline = new Date('2026-09-28T18:00:01.000Z');

  assert.throws(
    () => p.submitProject('usr_alice', 'proj_A1', pastDeadline),
    /SUBMISSION_DEADLINE_PASSED/
  );
});

test('Submission Deadline & Realtime - [7] Invalid opening/deadline range (opens >= deadline) is rejected', () => {
  const p = createAuthoritativeSubmissionPlatform();

  // Opens at 18:00, Deadline at 10:00 (inverted)
  assert.throws(
    () =>
      p.configureSubmissionWindow('usr_org_A', 'hack_A', {
        subStartTime: '2026-09-28T18:00:00.000Z',
        subEndTime: '2026-09-28T10:00:00.000Z',
      }),
    /INVALID_DATES/
  );

  // Opens and deadline are identical
  assert.throws(
    () =>
      p.configureSubmissionWindow('usr_org_A', 'hack_A', {
        subStartTime: '2026-09-28T18:00:00.000Z',
        subEndTime: '2026-09-28T18:00:00.000Z',
      }),
    /INVALID_DATES/
  );
});

test('Submission Deadline & Realtime - [8] Participant unauthorized for team cannot submit', () => {
  const p = createAuthoritativeSubmissionPlatform();
  const midTime = new Date('2026-09-28T14:00:00.000Z');

  // Eve is not in AliceTeam
  assert.throws(
    () => p.submitProject('usr_eve', 'proj_A1', midTime),
    /FORBIDDEN/
  );
});

test('Submission Deadline & Realtime - [9] Assigned Organizer and Admin can configure submission window', () => {
  const p = createAuthoritativeSubmissionPlatform();

  // Assigned Organizer A configures Hackathon A
  const updatedByOrg = p.configureSubmissionWindow('usr_org_A', 'hack_A', {
    subStartTime: '2026-09-28T09:00:00.000Z',
    subEndTime: '2026-09-28T19:00:00.000Z',
  });
  assert.equal(updatedByOrg.subStartTime.toISOString(), '2026-09-28T09:00:00.000Z');

  // Platform Admin configures Hackathon A
  const updatedByAdmin = p.configureSubmissionWindow('usr_admin', 'hack_A', {
    subStartTime: '2026-09-28T08:00:00.000Z',
    subEndTime: '2026-09-28T20:00:00.000Z',
  });
  assert.equal(updatedByAdmin.subStartTime.toISOString(), '2026-09-28T08:00:00.000Z');
});

test('Submission Deadline & Realtime - [10] Cross-organizer isolation strictly prevents Organizer B modifying Organizer A hackathon', () => {
  const p = createAuthoritativeSubmissionPlatform();

  // Organizer B attempts to modify Organizer A's Hackathon
  assert.throws(
    () =>
      p.configureSubmissionWindow('usr_org_B', 'hack_A', {
        subStartTime: '2026-09-28T09:00:00.000Z',
        subEndTime: '2026-09-28T17:00:00.000Z',
      }),
    /FORBIDDEN_RESOURCE/
  );
});

test('Submission Deadline & Realtime - [11] WebSocket emits SUBMISSION_DEADLINE_REACHED at configured deadline', () => {
  const p = createAuthoritativeSubmissionPlatform();

  // Before deadline (17:59:00) -> No deadline event
  const preDeadlineTransitions = p.checkDeadlines(new Date('2026-09-28T17:59:00.000Z'));
  assert.equal(preDeadlineTransitions.some((e) => e.type === 'SUBMISSION_DEADLINE_REACHED' && e.hackathonId === 'hack_A'), false);

  // At deadline (18:00:00) -> SUBMISSION_DEADLINE_REACHED emitted
  const deadlineTransitions = p.checkDeadlines(new Date('2026-09-28T18:00:00.000Z'));
  const deadlineEvt = deadlineTransitions.find((e) => e.type === 'SUBMISSION_DEADLINE_REACHED' && e.hackathonId === 'hack_A');

  assert.ok(deadlineEvt);
  assert.equal(deadlineEvt.payload.status, 'SUBMISSION_CLOSED');
  assert.ok(deadlineEvt.rooms.includes('hackathon:hack_A'));
});

test('Submission Deadline & Realtime - [12] WebSocket room authorization prevents unauthorized participants from snooping private rooms', () => {
  const p = createAuthoritativeSubmissionPlatform();

  // Participant Alice can join public hackathon room
  assert.equal(p.subscribeRoom('usr_alice', 'hackathon:hack_A'), true);

  // Participant Alice CANNOT join Organizer private room
  assert.throws(
    () => p.subscribeRoom('usr_alice', 'organizer:hack_A'),
    /ROOM_JOIN_DENIED/
  );

  // Participant Alice CANNOT join Charlie's team room
  assert.throws(
    () => p.subscribeRoom('usr_alice', 'team:team_B1'),
    /ROOM_JOIN_DENIED/
  );
});

test('Submission Deadline & Realtime - [13] Reconnect REST synchronization returns authoritative state when WebSocket disconnected', () => {
  const p = createAuthoritativeSubmissionPlatform();

  // Check before deadline
  const beforeState = p.getSubmissionStatusREST('hack_A', new Date('2026-09-28T14:00:00.000Z'));
  assert.equal(beforeState.status, 'SUBMISSION_OPEN');
  assert.ok(beforeState.timeRemainingMs > 0);

  // Check after deadline (e.g. user reconnected after missing WS event)
  const afterState = p.getSubmissionStatusREST('hack_A', new Date('2026-09-28T18:05:00.000Z'));
  assert.equal(afterState.status, 'SUBMISSION_CLOSED');
  assert.equal(afterState.timeRemainingMs, 0);
});

test('Submission Deadline & Realtime - [14] Duplicate deadline event prevention (idempotent event emission)', () => {
  const p = createAuthoritativeSubmissionPlatform();

  // First trigger at 18:00:00
  const first = p.checkDeadlines(new Date('2026-09-28T18:00:00.000Z'));
  assert.equal(first.filter((e) => e.type === 'SUBMISSION_DEADLINE_REACHED' && e.hackathonId === 'hack_A').length, 1);

  // Next second at 18:00:01 (Should NOT re-emit deadline event)
  const second = p.checkDeadlines(new Date('2026-09-28T18:00:01.000Z'));
  assert.equal(second.filter((e) => e.type === 'SUBMISSION_DEADLINE_REACHED' && e.hackathonId === 'hack_A').length, 0);
});

test('Submission Deadline & Realtime - [15] Refresh after deadline authoritatively returns SUBMISSION_CLOSED', () => {
  const p = createAuthoritativeSubmissionPlatform();

  const status1 = p.getSubmissionWindowState(p.hackathons.get('hack_A'), new Date('2026-09-28T18:00:01.000Z'));
  assert.equal(status1, 'SUBMISSION_CLOSED');

  // Second simulated page fetch / refresh
  const status2 = p.getSubmissionWindowState(p.hackathons.get('hack_A'), new Date('2026-09-28T18:05:00.000Z'));
  assert.equal(status2, 'SUBMISSION_CLOSED');
});

test('Submission Deadline & Realtime - [16] Already submitted project retains LOCKED snapshot and closed status after deadline', () => {
  const p = createAuthoritativeSubmissionPlatform();

  // Submit legitimately at 14:00
  const sub = p.submitProject('usr_alice', 'proj_A1', new Date('2026-09-28T14:00:00.000Z'));
  assert.equal(sub.status, 'LOCKED');

  // Check state after deadline
  const statusAfter = p.getSubmissionStatusREST('hack_A', new Date('2026-09-28T19:00:00.000Z'));
  assert.equal(statusAfter.status, 'SUBMISSION_CLOSED');

  // Existing submission remains intact and immutable
  assert.equal(sub.status, 'LOCKED');
});

test('Submission Deadline & Realtime - [17] Multiple hackathons maintain independent deadlines without event cross-talk', () => {
  const p = createAuthoritativeSubmissionPlatform();
  // Hack A deadline: 18:00
  // Hack B deadline: 20:00
  // Hack C deadline: 22:00

  // At 18:30: Hack A is closed, Hack B is open, Hack C is open
  const time1830 = new Date('2026-09-28T18:30:00.000Z');
  p.checkDeadlines(time1830);

  assert.equal(p.getSubmissionWindowState(p.hackathons.get('hack_A'), time1830), 'SUBMISSION_CLOSED');
  assert.equal(p.getSubmissionWindowState(p.hackathons.get('hack_B'), time1830), 'SUBMISSION_OPEN');
  assert.equal(p.getSubmissionWindowState(p.hackathons.get('hack_C'), time1830), 'SUBMISSION_OPEN');

  // At 20:30: Hack A and B are closed, Hack C is open
  const time2030 = new Date('2026-09-28T20:30:00.000Z');
  p.checkDeadlines(time2030);

  assert.equal(p.getSubmissionWindowState(p.hackathons.get('hack_A'), time2030), 'SUBMISSION_CLOSED');
  assert.equal(p.getSubmissionWindowState(p.hackathons.get('hack_B'), time2030), 'SUBMISSION_CLOSED');
  assert.equal(p.getSubmissionWindowState(p.hackathons.get('hack_C'), time2030), 'SUBMISSION_OPEN');
});

test('Submission Deadline & Realtime - [18] Client clock manipulation CANNOT bypass backend server-time deadline check', () => {
  const p = createAuthoritativeSubmissionPlatform();

  // Client falsifies its local clock to 12:00 PM, but real server authoritative time is 18:30 PM (past deadline)
  const actualServerTime = new Date('2026-09-28T18:30:00.000Z');

  assert.throws(
    () => p.submitProject('usr_alice', 'proj_A1', actualServerTime),
    /SUBMISSION_DEADLINE_PASSED/
  );
});

test('Submission Deadline & Realtime - [19] Direct API request after deadline is strictly rejected by backend', () => {
  const p = createAuthoritativeSubmissionPlatform();
  const directApiCallTime = new Date('2026-09-28T18:00:00.050Z');

  assert.throws(
    () => p.submitProject('usr_alice', 'proj_A1', directApiCallTime),
    /SUBMISSION_DEADLINE_PASSED/
  );
});

test('Submission Deadline & Realtime - [20] Race condition around deadline: submission reaching server at 18:00:00.100 is rejected', () => {
  const p = createAuthoritativeSubmissionPlatform();

  // User clicked submit button at 17:59:59.900, but network latency causes arrival at 18:00:00.100
  const serverArrivalTimestamp = new Date('2026-09-28T18:00:00.100Z');

  assert.throws(
    () => p.submitProject('usr_alice', 'proj_A1', serverArrivalTimestamp),
    /SUBMISSION_DEADLINE_PASSED/
  );
});
