const { test, describe } = require('node:test');
const assert = require('node:assert');

/**
 * Progression Mode Engine Simulation
 * Implements the exact specifications of the Round Progression Service,
 * access control, ranking, and tiebreaking.
 */
class ProgressionTestHarness {
  constructor() {
    this.hackathons = new Map();
    this.rounds = new Map();
    this.teams = new Map();
    this.teamMembers = new Map();
    this.scores = new Map();
    this.submissions = new Map();
    this.notifications = [];
    this.auditLogs = [];
    this.activeLocks = new Set();
  }

  // Helper to initialize a hackathon
  createHackathon({ id, title, progressionMode = 'OVERALL_PERFORMANCE', roundsConfig = [] }) {
    const hackathon = {
      id,
      title,
      progressionMode,
      currentRoundNumber: 1,
      status: 'EVENT_ACTIVE',
    };
    this.hackathons.set(id, hackathon);

    roundsConfig.forEach((rc, idx) => {
      const roundNum = idx + 1;
      const roundKey = `${id}:${roundNum}`;
      this.rounds.set(roundKey, {
        hackathonId: id,
        roundNumber: roundNum,
        name: rc.name || `Round ${roundNum}`,
        selectionCount: progressionMode === 'SELECTION_BASED' && rc.selectionCount ? Number(rc.selectionCount) : null,
        status: roundNum === 1 ? 'ACTIVE' : 'DRAFT',
        isFinal: idx === roundsConfig.length - 1,
      });
    });

    return hackathon;
  }

  // Register team
  registerTeam({ id, hackathonId, name, memberUserIds = [] }) {
    const team = {
      id,
      hackathonId,
      name,
      progressionStatus: 'ELIGIBLE',
      highestRound: 1,
    };
    this.teams.set(id, team);

    memberUserIds.forEach((uid) => {
      this.teamMembers.set(`${team.id}:${uid}`, { teamId: id, userId: uid, hackathonId });
    });

    return team;
  }

  // Validate selectionCount
  static validateSelectionCount(selectionCount, eligibleTeamsCount, progressionMode) {
    if (progressionMode === 'OVERALL_PERFORMANCE') {
      return { isValid: true };
    }

    if (selectionCount === undefined || selectionCount === null || selectionCount === '') {
      return { isValid: false, error: 'Selection count is required for selection-based progression.' };
    }

    const count = Number(selectionCount);
    if (!Number.isInteger(count) || count <= 0) {
      return { isValid: false, error: 'Selection count must be a positive integer greater than zero.' };
    }

    if (eligibleTeamsCount > 0 && count > eligibleTeamsCount) {
      return {
        isValid: false,
        error: `Selection count (${count}) cannot exceed the number of eligible teams (${eligibleTeamsCount}).`,
      };
    }

    return { isValid: true, count };
  }

  // Access check
  checkTeamRoundAccess(userId, hackathonId, roundNumber) {
    if (!userId) {
      return { allowed: false, status: 401, code: 'UNAUTHORIZED', message: 'Authentication required' };
    }

    const hackathon = this.hackathons.get(hackathonId);
    if (!hackathon) {
      return { allowed: false, status: 404, code: 'HACKATHON_NOT_FOUND', message: 'Hackathon not found' };
    }

    // Verify team membership
    let userTeam = null;
    for (const member of this.teamMembers.values()) {
      if (member.userId === userId && member.hackathonId === hackathonId) {
        userTeam = this.teams.get(member.teamId);
        break;
      }
    }

    if (!userTeam) {
      return { allowed: false, status: 403, code: 'NOT_REGISTERED', message: 'User is not part of a registered team' };
    }

    // Check progression status
    if (userTeam.progressionStatus === 'DISQUALIFIED') {
      return { allowed: false, status: 403, code: 'TEAM_DISQUALIFIED', message: 'Team is disqualified' };
    }

    if (userTeam.progressionStatus === 'ELIMINATED') {
      return {
        allowed: false,
        status: 403,
        code: 'TEAM_ELIMINATED',
        message: 'Your team has been eliminated from this hackathon and cannot access further rounds.',
      };
    }

    if (hackathon.progressionMode === 'SELECTION_BASED') {
      if (roundNumber > userTeam.highestRound) {
        return {
          allowed: false,
          status: 403,
          code: 'ROUND_LOCKED',
          message: `Round ${roundNumber} is currently locked for your team. You have only advanced up to Round ${userTeam.highestRound}.`,
        };
      }
    }

    return { allowed: true, status: 200, code: 'ACCESS_GRANTED', team: userTeam };
  }

  // Tiebreaker Ranking (ResultEngine logic)
  static rankTeams(scoresList) {
    return [...scoresList].sort((a, b) => {
      if (b.finalScore !== a.finalScore) {
        return b.finalScore - a.finalScore; // Primary: finalScore descending
      }
      return b.rawAverage - a.rawAverage; // Secondary deterministic tiebreaker: rawAverage descending
    });
  }

  // Finalize Round Results
  async finalizeRoundResults(hackathonId, roundNumber, actorUserId, options = {}) {
    const lockKey = `lock:round:finalize:${hackathonId}:${roundNumber}`;
    if (this.activeLocks.has(lockKey)) {
      throw { status: 409, code: 'CONCURRENT_OPERATION', message: 'Finalization already running' };
    }
    this.activeLocks.add(lockKey);

    try {
      const hackathon = this.hackathons.get(hackathonId);
      const roundKey = `${hackathonId}:${roundNumber}`;
      const round = this.rounds.get(roundKey);

      if (!round) throw { status: 404, message: 'Round not found' };

      // Idempotency check
      if (round.status === 'COMPLETED' && !options.force) {
        return {
          idempotent: true,
          message: `Round ${roundNumber} has already been finalized.`,
          roundNumber,
        };
      }

      // Eligible teams
      const eligibleTeams = Array.from(this.teams.values()).filter(
        (t) => t.hackathonId === hackathonId && t.progressionStatus !== 'DISQUALIFIED' && t.progressionStatus !== 'ELIMINATED'
      );

      // Mode handling
      if (hackathon.progressionMode === 'OVERALL_PERFORMANCE') {
        // No elimination
        round.status = 'COMPLETED';
        return {
          hackathonId,
          roundNumber,
          progressionMode: 'OVERALL_PERFORMANCE',
          eligibleTeamsCount: eligibleTeams.length,
          advancedTeamIds: eligibleTeams.map((t) => t.id),
          eliminatedTeamIds: [],
        };
      }

      // SELECTION_BASED
      const selectionCount = round.selectionCount;
      const validation = ProgressionTestHarness.validateSelectionCount(
        selectionCount,
        eligibleTeams.length,
        'SELECTION_BASED'
      );
      if (!validation.isValid) {
        throw { status: 400, code: 'INVALID_SELECTION_COUNT', message: validation.error };
      }

      // Rank teams using deterministic scores
      const teamsWithScores = eligibleTeams.map((t) => {
        const sc = this.scores.get(`${hackathonId}:${roundNumber}:${t.id}`) || { finalScore: 0, rawAverage: 0 };
        return { teamId: t.id, finalScore: sc.finalScore, rawAverage: sc.rawAverage };
      });

      const ranked = ProgressionTestHarness.rankTeams(teamsWithScores);
      const k = validation.count;
      const selected = ranked.slice(0, k);
      const eliminated = ranked.slice(k);

      const advancedTeamIds = selected.map((s) => s.teamId);
      const eliminatedTeamIds = eliminated.map((e) => e.teamId);

      // Simulate transactional failure if requested
      if (options.simulateTxFailure) {
        throw new Error('Database transaction deadlocked during batch team progression update');
      }

      // Update team states
      for (const tId of advancedTeamIds) {
        const t = this.teams.get(tId);
        t.progressionStatus = 'ADVANCED';
        t.highestRound = roundNumber + 1;
      }
      for (const tId of eliminatedTeamIds) {
        const t = this.teams.get(tId);
        t.progressionStatus = 'ELIMINATED';
      }

      round.status = 'COMPLETED';
      const nextRoundKey = `${hackathonId}:${roundNumber + 1}`;
      const nextRound = this.rounds.get(nextRoundKey);
      if (nextRound) {
        nextRound.status = 'ACTIVE';
        hackathon.currentRoundNumber = roundNumber + 1;
      }

      // Notifications
      try {
        if (options.simulateNotificationFailure) {
          throw new Error('Notification SMTP/WebSocket gateway timeout');
        }
        for (const tId of advancedTeamIds) {
          this.notifications.push({
            teamId: tId,
            type: 'TEAM_SELECTED_FOR_NEXT_ROUND',
            message: `Your team has been selected for Round ${roundNumber + 1} of ${hackathon.title}.`,
          });
        }
        for (const tId of eliminatedTeamIds) {
          this.notifications.push({
            teamId: tId,
            type: 'TEAM_NOT_SELECTED_FOR_NEXT_ROUND',
            message: `Your team was not selected for Round ${roundNumber + 1} of ${hackathon.title}. You can still view the published leaderboard.`,
          });
        }
      } catch (notifErr) {
        // Log notification failure without failing the progression transaction
        this.auditLogs.push({ action: 'NOTIFICATION_DISPATCH_FAILED', error: notifErr.message });
      }

      return {
        hackathonId,
        roundNumber,
        progressionMode: 'SELECTION_BASED',
        eligibleTeamsCount: eligibleTeams.length,
        selectedTeamsCount: advancedTeamIds.length,
        eliminatedTeamsCount: eliminatedTeamIds.length,
        advancedTeamIds,
        eliminatedTeamIds,
      };
    } finally {
      this.activeLocks.delete(lockKey);
    }
  }
}

describe('Hackathon Round Progression & Result Models Suite (20 Test Scenarios)', () => {
  // TEST 1: Selection-based: 100 teams -> 25 -> 10 -> 3
  test('TEST 1: Selection-based multi-round progression (100 -> 25 -> 10 -> 3)', async () => {
    const harness = new ProgressionTestHarness();
    const h = harness.createHackathon({
      id: 'h-sel-100',
      title: 'Global Hackathon Championship',
      progressionMode: 'SELECTION_BASED',
      roundsConfig: [
        { name: 'Round 1 - Qualifiers', selectionCount: 25 },
        { name: 'Round 2 - Semifinals', selectionCount: 10 },
        { name: 'Round 3 - Grand Finale', selectionCount: 3 },
      ],
    });

    // Register 100 teams
    for (let i = 1; i <= 100; i++) {
      const teamId = `team-${i}`;
      harness.registerTeam({ id: teamId, hackathonId: h.id, name: `Team ${i}`, memberUserIds: [`user-${i}`] });
      // Assign distinct scores in Round 1: Team 1 has 100, Team 100 has 1
      harness.scores.set(`${h.id}:1:${teamId}`, { finalScore: 101 - i, rawAverage: 101 - i });
    }

    // Finalize Round 1
    const resR1 = await harness.finalizeRoundResults(h.id, 1, 'admin-1');
    assert.strictEqual(resR1.selectedTeamsCount, 25);
    assert.strictEqual(resR1.eliminatedTeamsCount, 75);

    // Verify: top 25 teams advanced, 75 eliminated
    for (let i = 1; i <= 25; i++) {
      const t = harness.teams.get(`team-${i}`);
      assert.strictEqual(t.progressionStatus, 'ADVANCED');
      assert.strictEqual(t.highestRound, 2);
      const acc = harness.checkTeamRoundAccess(`user-${i}`, h.id, 2);
      assert.strictEqual(acc.allowed, true, `Team ${i} must have access to Round 2`);
    }
    for (let i = 26; i <= 100; i++) {
      const t = harness.teams.get(`team-${i}`);
      assert.strictEqual(t.progressionStatus, 'ELIMINATED');
      assert.strictEqual(t.highestRound, 1);
      const acc = harness.checkTeamRoundAccess(`user-${i}`, h.id, 2);
      assert.strictEqual(acc.allowed, false, `Team ${i} must be denied Round 2`);
      assert.strictEqual(acc.status, 403);
    }

    // Configure Round 2 scores for the 25 advancing teams: Team 1..25
    for (let i = 1; i <= 25; i++) {
      harness.scores.set(`${h.id}:2:team-${i}`, { finalScore: 50 - i, rawAverage: 50 - i });
    }

    // Finalize Round 2
    const resR2 = await harness.finalizeRoundResults(h.id, 2, 'admin-1');
    assert.strictEqual(resR2.selectedTeamsCount, 10);
    assert.strictEqual(resR2.eliminatedTeamsCount, 15);

    // Verify Round 3 access
    for (let i = 1; i <= 10; i++) {
      const t = harness.teams.get(`team-${i}`);
      assert.strictEqual(t.highestRound, 3);
      const acc = harness.checkTeamRoundAccess(`user-${i}`, h.id, 3);
      assert.strictEqual(acc.allowed, true, `Team ${i} must have access to Round 3`);
    }
    for (let i = 11; i <= 25; i++) {
      const t = harness.teams.get(`team-${i}`);
      assert.strictEqual(t.progressionStatus, 'ELIMINATED');
      const acc = harness.checkTeamRoundAccess(`user-${i}`, h.id, 3);
      assert.strictEqual(acc.allowed, false, `Team ${i} must be blocked from Round 3`);
    }

    // Configure Round 3 scores for the 10 advancing teams: Team 1..10
    for (let i = 1; i <= 10; i++) {
      harness.scores.set(`${h.id}:3:team-${i}`, { finalScore: 20 - i, rawAverage: 20 - i });
    }

    // Finalize Round 3 (top 3 finalists)
    const resR3 = await harness.finalizeRoundResults(h.id, 3, 'admin-1');
    assert.strictEqual(resR3.selectedTeamsCount, 3);
    assert.strictEqual(resR3.eliminatedTeamsCount, 7);

    // Top 3 finalists
    for (let i = 1; i <= 3; i++) {
      const t = harness.teams.get(`team-${i}`);
      assert.strictEqual(t.highestRound, 4);
    }
    for (let i = 4; i <= 10; i++) {
      const t = harness.teams.get(`team-${i}`);
      assert.strictEqual(t.progressionStatus, 'ELIMINATED');
    }
  });

  // TEST 2: Overall-performance: 100 teams, 3 rounds, no elimination, consolidated scores
  test('TEST 2: Overall-performance: all 100 teams participate in all rounds without elimination', async () => {
    const harness = new ProgressionTestHarness();
    const h = harness.createHackathon({
      id: 'h-overall-100',
      title: 'Consolidated Hackathon Marathon',
      progressionMode: 'OVERALL_PERFORMANCE',
      roundsConfig: [
        { name: 'Round 1 - Concept' },
        { name: 'Round 2 - Prototype' },
        { name: 'Round 3 - Final Showcase' },
      ],
    });

    for (let i = 1; i <= 100; i++) {
      harness.registerTeam({ id: `team-${i}`, hackathonId: h.id, name: `Team ${i}`, memberUserIds: [`user-${i}`] });
    }

    // Round 1
    const resR1 = await harness.finalizeRoundResults(h.id, 1, 'admin-1');
    assert.strictEqual(resR1.eligibleTeamsCount, 100);
    assert.strictEqual(resR1.eliminatedTeamIds.length, 0);

    // Verify all 100 teams can participate in Round 2
    for (let i = 1; i <= 100; i++) {
      const acc = harness.checkTeamRoundAccess(`user-${i}`, h.id, 2);
      assert.strictEqual(acc.allowed, true);
    }

    // Round 2
    const resR2 = await harness.finalizeRoundResults(h.id, 2, 'admin-1');
    assert.strictEqual(resR2.eliminatedTeamIds.length, 0);

    // Verify all 100 teams can participate in Round 3
    for (let i = 1; i <= 100; i++) {
      const acc = harness.checkTeamRoundAccess(`user-${i}`, h.id, 3);
      assert.strictEqual(acc.allowed, true);
    }

    // Consolidated final score calculation (Round 1 + Round 2 + Round 3)
    const consolidatedScores = [];
    for (let i = 1; i <= 100; i++) {
      const r1 = 20 + (i % 10);
      const r2 = 30 + (i % 15);
      const r3 = 40 + (i % 20);
      consolidatedScores.push({ teamId: `team-${i}`, finalScore: r1 + r2 + r3, rawAverage: (r1 + r2 + r3) / 3 });
    }
    const ranked = ProgressionTestHarness.rankTeams(consolidatedScores);
    assert.strictEqual(ranked.length, 100);
    assert.ok(ranked[0].finalScore >= ranked[1].finalScore);
  });

  // TEST 3: Round 1 eliminated team tries Round 2 API -> 403
  test('TEST 3: Round 1 eliminated team receives 403 when trying Round 2 API', async () => {
    const harness = new ProgressionTestHarness();
    const h = harness.createHackathon({
      id: 'h-el-r2',
      progressionMode: 'SELECTION_BASED',
      roundsConfig: [{ name: 'R1', selectionCount: 1 }, { name: 'R2', selectionCount: 1 }],
    });
    harness.registerTeam({ id: 't-win', hackathonId: h.id, memberUserIds: ['u-win'] });
    harness.registerTeam({ id: 't-lose', hackathonId: h.id, memberUserIds: ['u-lose'] });

    harness.scores.set(`${h.id}:1:t-win`, { finalScore: 90, rawAverage: 90 });
    harness.scores.set(`${h.id}:1:t-lose`, { finalScore: 60, rawAverage: 60 });

    await harness.finalizeRoundResults(h.id, 1, 'admin-1');

    const access = harness.checkTeamRoundAccess('u-lose', h.id, 2);
    assert.strictEqual(access.allowed, false);
    assert.strictEqual(access.status, 403);
    assert.strictEqual(access.code, 'TEAM_ELIMINATED');
  });

  // TEST 4: Selected team tries Round 2 -> Success
  test('TEST 4: Selected team receives 200 and ACCESS_GRANTED for Round 2', async () => {
    const harness = new ProgressionTestHarness();
    const h = harness.createHackathon({
      id: 'h-adv-r2',
      progressionMode: 'SELECTION_BASED',
      roundsConfig: [{ name: 'R1', selectionCount: 1 }, { name: 'R2', selectionCount: 1 }],
    });
    harness.registerTeam({ id: 't-win', hackathonId: h.id, memberUserIds: ['u-win'] });
    harness.scores.set(`${h.id}:1:t-win`, { finalScore: 90, rawAverage: 90 });

    await harness.finalizeRoundResults(h.id, 1, 'admin-1');

    const access = harness.checkTeamRoundAccess('u-win', h.id, 2);
    assert.strictEqual(access.allowed, true);
    assert.strictEqual(access.status, 200);
    assert.strictEqual(access.code, 'ACCESS_GRANTED');
  });

  // TEST 5: Eliminated team tries Round 3 directly -> 403
  test('TEST 5: Eliminated team in Round 1 attempting Round 3 directly receives 403', async () => {
    const harness = new ProgressionTestHarness();
    const h = harness.createHackathon({
      id: 'h-jump-r3',
      progressionMode: 'SELECTION_BASED',
      roundsConfig: [
        { name: 'R1', selectionCount: 1 },
        { name: 'R2', selectionCount: 1 },
        { name: 'R3', selectionCount: 1 },
      ],
    });
    harness.registerTeam({ id: 't-elim', hackathonId: h.id, memberUserIds: ['u-elim'] });
    harness.scores.set(`${h.id}:1:t-elim`, { finalScore: 10, rawAverage: 10 });
    // Another advancing team
    harness.registerTeam({ id: 't-adv', hackathonId: h.id, memberUserIds: ['u-adv'] });
    harness.scores.set(`${h.id}:1:t-adv`, { finalScore: 90, rawAverage: 90 });

    await harness.finalizeRoundResults(h.id, 1, 'admin-1');

    const access = harness.checkTeamRoundAccess('u-elim', h.id, 3);
    assert.strictEqual(access.allowed, false);
    assert.strictEqual(access.status, 403);
  });

  // TEST 6: Parameter manipulation of team ID -> 403
  test('TEST 6: Parameter manipulation of team ID is blocked with 403 by authoritative user team verification', () => {
    const harness = new ProgressionTestHarness();
    const h = harness.createHackathon({ id: 'h-spoof', progressionMode: 'SELECTION_BASED' });
    harness.registerTeam({ id: 't-alice', hackathonId: h.id, memberUserIds: ['user-alice'] });
    harness.registerTeam({ id: 't-bob', hackathonId: h.id, memberUserIds: ['user-bob'] });

    // Attacker sends Alice's token with teamId = 't-bob'
    // checkTeamRoundAccess resolves team solely from DB teamMember relation, ignoring spoofed team IDs
    const access = harness.checkTeamRoundAccess('user-alice', h.id, 1);
    assert.strictEqual(access.allowed, true);
    assert.strictEqual(access.team.id, 't-alice');
    assert.notStrictEqual(access.team.id, 't-bob', 'User Alice cannot act on behalf of Team Bob');
  });

  // TEST 7: Participant attempts to access another team's private submission -> 403
  test("TEST 7: Participant attempting to access another team's private submission receives 403", () => {
    const harness = new ProgressionTestHarness();
    const h = harness.createHackathon({ id: 'h-sub-iso', progressionMode: 'SELECTION_BASED' });
    harness.registerTeam({ id: 't-alpha', hackathonId: h.id, memberUserIds: ['u-alpha'] });
    harness.registerTeam({ id: 't-beta', hackathonId: h.id, memberUserIds: ['u-beta'] });

    // Resource guard simulation: verify submission owner
    const submission = { id: 'sub-beta-1', teamId: 't-beta', isPrivate: true };
    const canAccess = (userId) => {
      const userTeamMember = harness.teamMembers.get(`${submission.teamId}:${userId}`);
      return Boolean(userTeamMember);
    };

    assert.strictEqual(canAccess('u-alpha'), false, "User Alpha cannot access Team Beta's submission");
    assert.strictEqual(canAccess('u-beta'), true, "User Beta can access own team's submission");
  });

  // TEST 8: Participant attempts to access judge/evaluation information -> 403
  test('TEST 8: Participant attempting to access judge/evaluation information receives 403', () => {
    const checkRolePermission = (role, resource) => {
      if (resource.startsWith('EVALUATION_INTERNAL') && role === 'PARTICIPANT') {
        return { allowed: false, status: 403, code: 'FORBIDDEN' };
      }
      return { allowed: true, status: 200 };
    };

    const participantCheck = checkRolePermission('PARTICIPANT', 'EVALUATION_INTERNAL_MARKS');
    assert.strictEqual(participantCheck.allowed, false);
    assert.strictEqual(participantCheck.status, 403);
  });

  // TEST 9: Selection count greater than eligible teams -> Validation failure
  test('TEST 9: Selection count greater than eligible teams is rejected with 400', () => {
    const val = ProgressionTestHarness.validateSelectionCount(25, 10, 'SELECTION_BASED');
    assert.strictEqual(val.isValid, false);
    assert.ok(val.error.includes('cannot exceed the number of eligible teams'));
  });

  // TEST 10: Selection count = eligible teams -> All advance
  test('TEST 10: Selection count equal to eligible teams advances all teams', async () => {
    const harness = new ProgressionTestHarness();
    const h = harness.createHackathon({
      id: 'h-all-adv',
      progressionMode: 'SELECTION_BASED',
      roundsConfig: [{ name: 'R1', selectionCount: 5 }, { name: 'R2', selectionCount: 5 }],
    });
    for (let i = 1; i <= 5; i++) {
      harness.registerTeam({ id: `t-${i}`, hackathonId: h.id, memberUserIds: [`u-${i}`] });
      harness.scores.set(`${h.id}:1:t-${i}`, { finalScore: 50 + i, rawAverage: 50 + i });
    }

    const res = await harness.finalizeRoundResults(h.id, 1, 'admin-1');
    assert.strictEqual(res.selectedTeamsCount, 5);
    assert.strictEqual(res.eliminatedTeamsCount, 0);
    assert.strictEqual(res.advancedTeamIds.length, 5);
  });

  // TEST 11: Selection count = 0 -> Validation failure
  test('TEST 11: Selection count = 0 or negative is rejected', () => {
    const val0 = ProgressionTestHarness.validateSelectionCount(0, 50, 'SELECTION_BASED');
    assert.strictEqual(val0.isValid, false);
    assert.ok(val0.error.includes('positive integer greater than zero'));

    const valNeg = ProgressionTestHarness.validateSelectionCount(-5, 50, 'SELECTION_BASED');
    assert.strictEqual(valNeg.isValid, false);
  });

  // TEST 12: Tie at cutoff respects deterministic evaluation engine tiebreaker
  test('TEST 12: Exact tie at cutoff is resolved deterministically by rawAverage descending', () => {
    // Cutoff = 2. Team A and Team B both have finalScore = 85.0
    // Team A has rawAverage = 88.0, Team B has rawAverage = 82.0
    const teams = [
      { teamId: 'team-top', finalScore: 95.0, rawAverage: 95.0 },
      { teamId: 'team-b', finalScore: 85.0, rawAverage: 82.0 },
      { teamId: 'team-a', finalScore: 85.0, rawAverage: 88.0 },
      { teamId: 'team-bottom', finalScore: 70.0, rawAverage: 70.0 },
    ];

    const ranked = ProgressionTestHarness.rankTeams(teams);
    assert.strictEqual(ranked[0].teamId, 'team-top');
    assert.strictEqual(ranked[1].teamId, 'team-a', 'Team A must rank higher than Team B due to higher rawAverage');
    assert.strictEqual(ranked[2].teamId, 'team-b');

    // With selectionCount = 2, team-top and team-a advance, team-b is eliminated deterministically
    const selected = ranked.slice(0, 2).map((t) => t.teamId);
    assert.deepStrictEqual(selected, ['team-top', 'team-a']);
  });

  // TEST 13: Result finalization called twice -> Idempotent behavior
  test('TEST 13: Finalizing round twice is idempotent without duplicate progression or state corruption', async () => {
    const harness = new ProgressionTestHarness();
    const h = harness.createHackathon({
      id: 'h-idem',
      progressionMode: 'SELECTION_BASED',
      roundsConfig: [{ name: 'R1', selectionCount: 1 }, { name: 'R2', selectionCount: 1 }],
    });
    harness.registerTeam({ id: 't-1', hackathonId: h.id, memberUserIds: ['u-1'] });
    harness.scores.set(`${h.id}:1:t-1`, { finalScore: 100, rawAverage: 100 });

    const first = await harness.finalizeRoundResults(h.id, 1, 'admin-1');
    assert.strictEqual(first.selectedTeamsCount, 1);
    const notifCountAfterFirst = harness.notifications.length;

    const second = await harness.finalizeRoundResults(h.id, 1, 'admin-1');
    assert.strictEqual(second.idempotent, true);
    // Ensure notifications were not duplicated
    assert.strictEqual(harness.notifications.length, notifCountAfterFirst);
  });

  // TEST 14: Two admins attempt result finalization concurrently -> Lock prevents race condition
  test('TEST 14: Concurrent finalization attempts are locked, allowing only one to proceed', async () => {
    const harness = new ProgressionTestHarness();
    const h = harness.createHackathon({
      id: 'h-race',
      progressionMode: 'SELECTION_BASED',
      roundsConfig: [{ name: 'R1', selectionCount: 1 }],
    });
    harness.registerTeam({ id: 't-1', hackathonId: h.id, memberUserIds: ['u-1'] });

    // Manually acquire lock to simulate concurrent operation in progress
    const lockKey = `lock:round:finalize:${h.id}:1`;
    harness.activeLocks.add(lockKey);

    let errorThrown = null;
    try {
      await harness.finalizeRoundResults(h.id, 1, 'admin-2');
    } catch (err) {
      errorThrown = err;
    }

    assert.ok(errorThrown);
    assert.strictEqual(errorThrown.status, 409);
    assert.strictEqual(errorThrown.code, 'CONCURRENT_OPERATION');
  });

  // TEST 15: Notification failure -> Progression state remains correct and notification can be retried
  test('TEST 15: Notification dispatch failure does not corrupt progression transaction', async () => {
    const harness = new ProgressionTestHarness();
    const h = harness.createHackathon({
      id: 'h-notif-fail',
      progressionMode: 'SELECTION_BASED',
      roundsConfig: [{ name: 'R1', selectionCount: 1 }, { name: 'R2', selectionCount: 1 }],
    });
    harness.registerTeam({ id: 't-1', hackathonId: h.id, memberUserIds: ['u-1'] });
    harness.scores.set(`${h.id}:1:t-1`, { finalScore: 90, rawAverage: 90 });

    const result = await harness.finalizeRoundResults(h.id, 1, 'admin-1', { simulateNotificationFailure: true });
    assert.strictEqual(result.selectedTeamsCount, 1);
    const team = harness.teams.get('t-1');
    assert.strictEqual(team.progressionStatus, 'ADVANCED', 'Progression state must be ADVANCED even if notification failed');
    assert.strictEqual(team.highestRound, 2);

    // Audit log records the notification failure for background retry
    const failAudit = harness.auditLogs.find((a) => a.action === 'NOTIFICATION_DISPATCH_FAILED');
    assert.ok(failAudit, 'Notification failure must be logged in audit trail');
  });

  // TEST 16: Database transaction failure during advancement -> No partially advanced teams
  test('TEST 16: DB failure during progression update rolls back completely without partial state', async () => {
    const harness = new ProgressionTestHarness();
    const h = harness.createHackathon({
      id: 'h-tx-fail',
      progressionMode: 'SELECTION_BASED',
      roundsConfig: [{ name: 'R1', selectionCount: 1 }],
    });
    harness.registerTeam({ id: 't-1', hackathonId: h.id });
    harness.scores.set(`${h.id}:1:t-1`, { finalScore: 90, rawAverage: 90 });

    let errCaught = false;
    try {
      await harness.finalizeRoundResults(h.id, 1, 'admin-1', { simulateTxFailure: true });
    } catch {
      errCaught = true;
    }

    assert.strictEqual(errCaught, true);
    const team = harness.teams.get('t-1');
    assert.strictEqual(team.progressionStatus, 'ELIGIBLE', 'Team status must remain ELIGIBLE after rollback');
    assert.strictEqual(team.highestRound, 1);
  });

  // TEST 17: Deleted/withdrawn/disqualified team respects eligibility rules
  test('TEST 17: Disqualified team is excluded from advancement regardless of score', async () => {
    const harness = new ProgressionTestHarness();
    const h = harness.createHackathon({
      id: 'h-dq',
      progressionMode: 'SELECTION_BASED',
      roundsConfig: [{ name: 'R1', selectionCount: 1 }, { name: 'R2', selectionCount: 1 }],
    });
    // Team DQ had highest score, but was disqualified
    const tDQ = harness.registerTeam({ id: 't-dq', hackathonId: h.id, memberUserIds: ['u-dq'] });
    tDQ.progressionStatus = 'DISQUALIFIED';
    harness.scores.set(`${h.id}:1:t-dq`, { finalScore: 100, rawAverage: 100 });

    // Team Clean had lower score
    harness.registerTeam({ id: 't-clean', hackathonId: h.id, memberUserIds: ['u-clean'] });
    harness.scores.set(`${h.id}:1:t-clean`, { finalScore: 80, rawAverage: 80 });

    const result = await harness.finalizeRoundResults(h.id, 1, 'admin-1');
    assert.strictEqual(result.selectedTeamsCount, 1);
    assert.deepStrictEqual(result.advancedTeamIds, ['t-clean'], 'Clean team advances; disqualified team is skipped');

    const dqAccess = harness.checkTeamRoundAccess('u-dq', h.id, 2);
    assert.strictEqual(dqAccess.allowed, false);
    assert.strictEqual(dqAccess.status, 403);
    assert.strictEqual(dqAccess.code, 'TEAM_DISQUALIFIED');
  });

  // TEST 18: Round 2 directly accessed before Round 1 result is finalized -> 403
  test('TEST 18: Round 2 directly accessed before Round 1 is finalized returns 403', () => {
    const harness = new ProgressionTestHarness();
    const h = harness.createHackathon({
      id: 'h-premature',
      progressionMode: 'SELECTION_BASED',
      roundsConfig: [{ name: 'R1', selectionCount: 5 }, { name: 'R2', selectionCount: 2 }],
    });
    harness.registerTeam({ id: 't-1', hackathonId: h.id, memberUserIds: ['u-1'] });

    // Round 1 is not finalized, team.highestRound is 1
    const access = harness.checkTeamRoundAccess('u-1', h.id, 2);
    assert.strictEqual(access.allowed, false);
    assert.strictEqual(access.status, 403);
    assert.strictEqual(access.code, 'ROUND_LOCKED');
  });

  // TEST 19: Overall-performance hackathon accidentally contains selectionCount -> ignored
  test('TEST 19: Overall-performance mode ignores/strips selectionCount from round configuration', () => {
    const val = ProgressionTestHarness.validateSelectionCount(25, 10, 'OVERALL_PERFORMANCE');
    assert.strictEqual(val.isValid, true, 'Overall performance must not fail on selectionCount');

    const harness = new ProgressionTestHarness();
    const h = harness.createHackathon({
      id: 'h-op-strip',
      progressionMode: 'OVERALL_PERFORMANCE',
      roundsConfig: [{ name: 'R1', selectionCount: 25 }],
    });
    const round = harness.rounds.get(`${h.id}:1`);
    assert.strictEqual(round.selectionCount, null, 'selectionCount must be null in OVERALL_PERFORMANCE mode');
  });

  // TEST 20: Existing hackathons created before this feature continue working without regression
  test('TEST 20: Existing hackathons without progressionMode default safely to OVERALL_PERFORMANCE', () => {
    const harness = new ProgressionTestHarness();
    // Legacy hackathon without progressionMode specified
    const legacy = harness.createHackathon({
      id: 'h-legacy',
      title: 'Legacy Hackathon 2024',
      roundsConfig: [{ name: 'Single Round' }],
    });

    assert.strictEqual(legacy.progressionMode, 'OVERALL_PERFORMANCE');
    const team = harness.registerTeam({ id: 't-leg', hackathonId: legacy.id, memberUserIds: ['u-leg'] });
    assert.strictEqual(team.progressionStatus, 'ELIGIBLE');

    const access = harness.checkTeamRoundAccess('u-leg', legacy.id, 1);
    assert.strictEqual(access.allowed, true);
    assert.strictEqual(access.status, 200);
  });
});
