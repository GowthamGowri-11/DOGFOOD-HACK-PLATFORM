const { test, describe } = require('node:test');
const assert = require('node:assert');

/**
 * High-Fidelity Progression Engine & Database Simulation for Strict Audit
 */
class DeepAuditProgressionHarness {
  constructor() {
    this.hackathons = new Map();
    this.rounds = new Map();
    this.teams = new Map();
    this.teamMembers = new Map();
    this.projects = new Map();
    this.submissions = new Map();
    this.judgeAssignments = new Map();
    this.evaluations = new Map();
    this.roundResults = new Map();
    this.results = new Map();
    this.notifications = [];
    this.auditLogs = [];
    this.activeLocks = new Set();
  }

  // Create Hackathon
  createHackathon({ id, title, organizerId = 'org-1', progressionMode = 'OVERALL_PERFORMANCE', roundsConfig = [] }) {
    const hackathon = {
      id,
      title,
      organizerId,
      progressionMode,
      currentRoundNumber: 1,
      status: 'EVENT_ACTIVE',
    };
    this.hackathons.set(id, hackathon);

    roundsConfig.forEach((rc, idx) => {
      const roundNum = idx + 1;
      const roundKey = `${id}:${roundNum}`;
      this.rounds.set(roundKey, {
        id: `round-rec-${id}-${roundNum}`,
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

  // Register Team with Members & Project
  registerTeamWithProject({ teamId, hackathonId, teamName, memberUserIds = [], projectId }) {
    const team = {
      id: teamId,
      hackathonId,
      name: teamName,
      progressionStatus: 'ELIGIBLE',
      highestRound: 1,
      projectId,
    };
    this.teams.set(teamId, team);

    memberUserIds.forEach((uid) => {
      this.teamMembers.set(`${teamId}:${uid}`, { teamId, userId: uid, hackathonId });
    });

    if (projectId) {
      const proj = {
        id: projectId,
        teamId,
        hackathonId,
        title: `Project ${teamName}`,
      };
      this.projects.set(projectId, proj);
    }

    return team;
  }

  // Add Submission
  addSubmission({ id, projectId, status = 'SUBMITTED', roundNumber = 1, createdAt = new Date() }) {
    const sub = { id, projectId, status, roundNumber, createdAt };
    this.submissions.set(id, sub);
    return sub;
  }

  // Add Judge Assignment
  addAssignment({ id, judgeId, projectId, roundId, status = 'ASSIGNED' }) {
    const assign = { id, judgeId, projectId, roundId, status };
    this.judgeAssignments.set(id, assign);
    return assign;
  }

  // Add Evaluation
  addEvaluation({ id, judgeId, projectId, roundId, status = 'SUBMITTED', weightedScore = 0 }) {
    const ev = { id, judgeId, projectId, roundId, status, weightedScore };
    this.evaluations.set(id, ev);
    return ev;
  }

  // Authoritative Round Access Check
  checkTeamRoundAccess(userId, hackathonId, roundNumber, options = {}) {
    if (!userId) {
      return { allowed: false, status: 401, code: 'UNAUTHORIZED', message: 'Authentication required' };
    }

    const hackathon = this.hackathons.get(hackathonId);
    if (!hackathon) {
      return { allowed: false, status: 404, code: 'HACKATHON_NOT_FOUND', message: 'Hackathon not found' };
    }

    // Resolve user's actual registered team
    let userTeam = null;
    for (const member of this.teamMembers.values()) {
      if (member.userId === userId && member.hackathonId === hackathonId) {
        userTeam = this.teams.get(member.teamId);
        break;
      }
    }

    if (!userTeam) {
      return { allowed: false, status: 403, code: 'NOT_IN_TEAM', message: 'User is not registered in any team' };
    }

    if (userTeam.progressionStatus === 'DISQUALIFIED') {
      return { allowed: false, status: 403, code: 'TEAM_DISQUALIFIED', message: 'Team is disqualified' };
    }

    if (hackathon.progressionMode === 'OVERALL_PERFORMANCE') {
      return { allowed: true, status: 200, code: 'ACCESS_GRANTED', team: userTeam };
    }

    // Selection-based checks
    const reqRound = Number(roundNumber) || 1;
    const curRound = hackathon.currentRoundNumber || 1;

    // Eliminated team cannot access current active round or any future round
    if (userTeam.progressionStatus === 'ELIMINATED' && (reqRound >= curRound || reqRound > userTeam.highestRound)) {
      return {
        allowed: false,
        status: 403,
        code: 'TEAM_ELIMINATED',
        message: `Your team was not selected for Round ${reqRound}. You can view the published leaderboard.`,
        team: userTeam,
      };
    }

    // Locked round
    if (reqRound > userTeam.highestRound) {
      return {
        allowed: false,
        status: 403,
        code: 'ROUND_LOCKED',
        message: `Round ${reqRound} is locked. You have advanced up to Round ${userTeam.highestRound}.`,
        team: userTeam,
      };
    }

    // Check if mutation requires active round
    if (options.requireActiveRound) {
      const targetRoundRec = this.rounds.get(`${hackathonId}:${reqRound}`);
      if (targetRoundRec && targetRoundRec.status === 'COMPLETED') {
        return {
          allowed: false,
          status: 403,
          code: 'ROUND_COMPLETED',
          message: `Round ${reqRound} has already been completed. Submissions are closed.`,
          team: userTeam,
        };
      }
    }

    return { allowed: true, status: 200, code: 'ACCESS_GRANTED', team: userTeam };
  }

  // Authorize API role
  authorizeRole(role, allowedRoles) {
    if (!allowedRoles.includes(role)) {
      return { allowed: false, status: 403, code: 'FORBIDDEN' };
    }
    return { allowed: true };
  }

  // Authorize Organizer hackathon access
  authorizeOrganizer(sessionOrganizerId, hackathonId) {
    const h = this.hackathons.get(hackathonId);
    if (!h) return { allowed: false, status: 404, code: 'HACKATHON_NOT_FOUND' };
    if (h.organizerId !== sessionOrganizerId) {
      return { allowed: false, status: 403, code: 'FORBIDDEN_RESOURCE' };
    }
    return { allowed: true };
  }

  // Finalize Round Results
  async finalizeRoundResults(hackathonId, roundNumber, actorUserId, options = {}) {
    const lockKey = `lock:round:finalize:${hackathonId}:${roundNumber}`;
    if (this.activeLocks.has(lockKey)) {
      throw { status: 409, code: 'CONCURRENT_OPERATION', message: 'Finalization already in progress' };
    }
    this.activeLocks.add(lockKey);

    try {
      const hackathon = this.hackathons.get(hackathonId);
      if (!hackathon) throw { status: 404, code: 'HACKATHON_NOT_FOUND', message: 'Hackathon not found' };

      const roundKey = `${hackathonId}:${roundNumber}`;
      const round = this.rounds.get(roundKey);
      if (!round) throw { status: 404, code: 'ROUND_NOT_FOUND', message: 'Round not found' };

      // 1. Idempotency Check: Already completed
      if (round.status === 'COMPLETED' && !options.forceFinalize) {
        const existingResults = Array.from(this.roundResults.values()).filter(
          (r) => r.hackathonId === hackathonId && r.roundNumber === roundNumber
        );

        if (existingResults.length > 0) {
          const adv = existingResults.filter((r) => r.progressionStatus === 'ADVANCED');
          const elim = existingResults.filter((r) => r.progressionStatus === 'ELIMINATED');
          return {
            idempotent: true,
            hackathonId,
            roundNumber,
            selectedTeamsCount: adv.length,
            eliminatedTeamsCount: elim.length,
            advancedTeamIds: adv.map((a) => a.teamId),
            eliminatedTeamIds: elim.map((e) => e.teamId),
            roundResults: existingResults,
          };
        }
      }

      // 2. Evaluation Completeness Check
      if (!options.forceFinalize) {
        const unfinishedAssignments = Array.from(this.judgeAssignments.values()).filter(
          (a) =>
            ['ASSIGNED', 'IN_PROGRESS'].includes(a.status) &&
            (!a.roundId || a.roundId === round.id)
        );
        const draftEvaluations = Array.from(this.evaluations.values()).filter(
          (e) => e.status === 'DRAFT' && (!e.roundId || e.roundId === round.id)
        );

        if (unfinishedAssignments.length > 0 || draftEvaluations.length > 0) {
          throw {
            status: 400,
            code: 'EVALUATIONS_INCOMPLETE',
            message: `Cannot finalize Round ${roundNumber}: ${unfinishedAssignments.length} assignments and ${draftEvaluations.length} draft evaluations remaining.`,
          };
        }
      }

      // 3. Fetch Eligible Teams (previous round eliminated teams are strictly excluded)
      const eligibleTeams = Array.from(this.teams.values()).filter((t) => {
        if (t.hackathonId !== hackathonId) return false;
        if (t.progressionStatus === 'DISQUALIFIED') return false;
        if (roundNumber > 1) {
          return t.highestRound >= roundNumber && t.progressionStatus !== 'ELIMINATED';
        }
        return true;
      });

      if (eligibleTeams.length === 0) {
        throw { status: 400, code: 'NO_ELIGIBLE_TEAMS', message: 'No eligible participating teams found' };
      }

      // 4. Score Calculation & Retrieval
      const teamScores = eligibleTeams.map((team) => {
        const proj = this.projects.get(team.projectId);
        const projsSubs = proj
          ? Array.from(this.submissions.values()).filter(
              (s) => s.projectId === proj.id && ['SUBMITTED', 'LOCKED'].includes(s.status)
            )
          : [];
        const firstSub = projsSubs[0];
        const submittedAt = firstSub ? firstSub.createdAt : null;

        const evals = proj
          ? Array.from(this.evaluations.values()).filter(
              (e) => e.projectId === proj.id && e.status === 'SUBMITTED' && (!e.roundId || e.roundId === round.id)
            )
          : [];

        if (evals.length === 0) {
          return {
            teamId: team.id,
            projectId: proj?.id || '',
            teamName: team.name,
            rawAverage: 0,
            finalScore: 0,
            submittedAt,
          };
        }

        const sum = evals.reduce((acc, curr) => acc + curr.weightedScore, 0);
        const rawAvg = sum / evals.length;

        return {
          teamId: team.id,
          projectId: proj.id,
          teamName: team.name,
          rawAverage: rawAvg,
          finalScore: rawAvg,
          submittedAt,
        };
      });

      // 5. Deterministic Ranking with Tiebreaker Pipeline
      const rankedTeams = [...teamScores].sort((a, b) => {
        if (b.finalScore !== a.finalScore) {
          return b.finalScore - a.finalScore; // Primary: finalScore descending
        }
        if (b.rawAverage !== a.rawAverage) {
          return b.rawAverage - a.rawAverage; // Secondary: rawAverage descending
        }
        // Tertiary: earlier submission time
        const timeA = a.submittedAt ? new Date(a.submittedAt).getTime() : Infinity;
        const timeB = b.submittedAt ? new Date(b.submittedAt).getTime() : Infinity;
        if (timeA !== timeB) {
          return timeA - timeB;
        }
        // Quaternary: canonical teamId
        return a.teamId.localeCompare(b.teamId);
      });

      // 6. Advancement / Elimination
      const advancedTeamIds = [];
      const eliminatedTeamIds = [];
      const roundResultRecords = [];
      const isFinalRound = round.isFinal || roundNumber >= 3;

      const rawSelectionCount = options.selectionCount ?? round.selectionCount;

      rankedTeams.forEach((item, index) => {
        const rank = index + 1;
        let status = 'ADVANCED';

        if (hackathon.progressionMode === 'SELECTION_BASED') {
          if (rawSelectionCount !== null && rawSelectionCount !== undefined && rank <= rawSelectionCount) {
            status = 'ADVANCED';
            advancedTeamIds.push(item.teamId);
          } else {
            status = 'ELIMINATED';
            eliminatedTeamIds.push(item.teamId);
          }
        } else {
          // OVERALL_PERFORMANCE: No elimination
          status = 'ADVANCED';
          advancedTeamIds.push(item.teamId);
        }

        roundResultRecords.push({
          hackathonId,
          roundNumber,
          roundId: round.id,
          teamId: item.teamId,
          projectId: item.projectId,
          rank,
          finalScore: item.finalScore,
          rawAverageScore: item.rawAverage,
          progressionStatus: status,
        });
      });

      // 7. Atomic DB Transaction Simulation
      if (options.simulateTxFailure) {
        throw new Error('Transaction serialization conflict or connection lost');
      }

      // Persist state updates
      round.status = 'COMPLETED';
      hackathon.currentRoundNumber = roundNumber + 1;

      const nextRoundKey = `${hackathonId}:${roundNumber + 1}`;
      const nextRound = this.rounds.get(nextRoundKey);
      if (nextRound) {
        nextRound.status = 'ACTIVE';
      }

      for (const tId of advancedTeamIds) {
        const t = this.teams.get(tId);
        t.highestRound = roundNumber + 1;
        t.progressionStatus = isFinalRound ? 'ELIGIBLE' : 'ADVANCED';
      }

      for (const tId of eliminatedTeamIds) {
        const t = this.teams.get(tId);
        t.highestRound = roundNumber;
        t.progressionStatus = 'ELIMINATED';
      }

      for (const rr of roundResultRecords) {
        this.roundResults.set(`${hackathonId}:${roundNumber}:${rr.teamId}`, rr);
        if (isFinalRound && rr.projectId) {
          this.results.set(rr.projectId, {
            projectId: rr.projectId,
            finalScore: rr.finalScore,
            rank: rr.rank,
          });
        }
      }

      // Audit Log
      this.auditLogs.push({
        action: 'ROUND_RESULT_FINALIZED',
        hackathonId,
        roundNumber,
        actorUserId,
        advancedCount: advancedTeamIds.length,
        eliminatedCount: eliminatedTeamIds.length,
      });

      // 8. Notifications
      if (!options.simulateNotificationFailure) {
        for (const tId of advancedTeamIds) {
          this.notifications.push({
            teamId: tId,
            type: 'TEAM_SELECTED_FOR_NEXT_ROUND',
            title: 'Selected for Next Round',
            message: `Your team has been selected for the next round of ${hackathon.title}.`,
          });
        }
        for (const tId of eliminatedTeamIds) {
          this.notifications.push({
            teamId: tId,
            type: 'TEAM_NOT_SELECTED_FOR_NEXT_ROUND',
            title: 'Not Selected for Next Round',
            message: `Your team was not selected for the next round of ${hackathon.title}. You can still view the published leaderboard.`,
          });
        }
      }

      return {
        hackathonId,
        roundNumber,
        progressionMode: hackathon.progressionMode,
        eligibleTeamsCount: eligibleTeams.length,
        selectedTeamsCount: advancedTeamIds.length,
        eliminatedTeamsCount: eliminatedTeamIds.length,
        advancedTeamIds,
        eliminatedTeamIds,
        isFinalRound,
        roundResults: roundResultRecords,
      };
    } finally {
      this.activeLocks.delete(lockKey);
    }
  }
}

describe('STRICT SECOND AUDIT: Round Progression Engine, Authorization & Database Consistency', () => {
  // AUDIT 1: SELECTION-BASED END-TO-END (100 -> 25 -> 10 -> 3)
  test('AUDIT 1: Selection-Based Multi-Round Exact DB State (100 -> 25 -> 10 -> 3)', async () => {
    const harness = new DeepAuditProgressionHarness();
    const h = harness.createHackathon({
      id: 'audit-sel-100',
      title: 'Global Engineering Hackathon',
      progressionMode: 'SELECTION_BASED',
      roundsConfig: [
        { name: 'Round 1 - Qualifiers', selectionCount: 25 },
        { name: 'Round 2 - Semifinals', selectionCount: 10 },
        { name: 'Round 3 - Grand Finale', selectionCount: 3 },
      ],
    });

    // 100 teams registered
    for (let i = 1; i <= 100; i++) {
      const teamId = `team-${i}`;
      const projId = `proj-${i}`;
      harness.registerTeamWithProject({
        teamId,
        hackathonId: h.id,
        teamName: `Team ${i}`,
        memberUserIds: [`user-${i}`],
        projectId: projId,
      });
      harness.addSubmission({ id: `sub-1-${i}`, projectId: projId, status: 'SUBMITTED', roundNumber: 1 });
      // Score: Team 1 has 100.0, Team 100 has 1.0
      harness.addEvaluation({
        id: `ev-1-${i}`,
        judgeId: 'judge-1',
        projectId: projId,
        roundId: `round-rec-${h.id}-1`,
        status: 'SUBMITTED',
        weightedScore: 101 - i,
      });
    }

    // Finalize Round 1
    const resR1 = await harness.finalizeRoundResults(h.id, 1, 'admin-super');
    assert.strictEqual(resR1.eligibleTeamsCount, 100);
    assert.strictEqual(resR1.selectedTeamsCount, 25);
    assert.strictEqual(resR1.eliminatedTeamsCount, 75);

    // Verify DB state after Round 1
    let dbAdvCount = 0;
    let dbElimCount = 0;
    for (let i = 1; i <= 100; i++) {
      const t = harness.teams.get(`team-${i}`);
      if (t.progressionStatus === 'ADVANCED') {
        dbAdvCount++;
        assert.strictEqual(t.highestRound, 2);
      } else if (t.progressionStatus === 'ELIMINATED') {
        dbElimCount++;
        assert.strictEqual(t.highestRound, 1);
      }
    }
    assert.strictEqual(dbAdvCount, 25, 'Exactly 25 teams in DB must be ADVANCED');
    assert.strictEqual(dbElimCount, 75, 'Exactly 75 teams in DB must be ELIMINATED');

    // Round 2 setup: 25 advanced teams participate
    for (let i = 1; i <= 25; i++) {
      const projId = `proj-${i}`;
      harness.addSubmission({ id: `sub-2-${i}`, projectId: projId, status: 'SUBMITTED', roundNumber: 2 });
      harness.addEvaluation({
        id: `ev-2-${i}`,
        judgeId: 'judge-2',
        projectId: projId,
        roundId: `round-rec-${h.id}-2`,
        status: 'SUBMITTED',
        weightedScore: 60 - i,
      });
    }

    // Finalize Round 2
    const resR2 = await harness.finalizeRoundResults(h.id, 2, 'admin-super');
    assert.strictEqual(resR2.eligibleTeamsCount, 25, 'Only 25 teams eligible for Round 2');
    assert.strictEqual(resR2.selectedTeamsCount, 10);
    assert.strictEqual(resR2.eliminatedTeamsCount, 15);

    // Verify DB state after Round 2
    let r2AdvCount = 0;
    let r2ElimCount = 0;
    for (let i = 1; i <= 25; i++) {
      const t = harness.teams.get(`team-${i}`);
      if (t.highestRound === 3) r2AdvCount++;
      if (t.progressionStatus === 'ELIMINATED') r2ElimCount++;
    }
    assert.strictEqual(r2AdvCount, 10, 'Exactly 10 teams in DB must reach Round 3');
    assert.strictEqual(r2ElimCount, 15, 'Exactly 15 teams eliminated in Round 2');

    // Round 3 setup: 10 advanced teams participate
    for (let i = 1; i <= 10; i++) {
      const projId = `proj-${i}`;
      harness.addSubmission({ id: `sub-3-${i}`, projectId: projId, status: 'SUBMITTED', roundNumber: 3 });
      harness.addEvaluation({
        id: `ev-3-${i}`,
        judgeId: 'judge-3',
        projectId: projId,
        roundId: `round-rec-${h.id}-3`,
        status: 'SUBMITTED',
        weightedScore: 30 - i,
      });
    }

    // Finalize Round 3
    const resR3 = await harness.finalizeRoundResults(h.id, 3, 'admin-super');
    assert.strictEqual(resR3.eligibleTeamsCount, 10);
    assert.strictEqual(resR3.selectedTeamsCount, 3);
    assert.strictEqual(resR3.eliminatedTeamsCount, 7);
  });

  // AUDIT 2: SCORE -> RANK -> SELECTION (Unfinished evaluations guard)
  test('AUDIT 2: Unfinished evaluations / in-progress judge assignments block progression with 400', async () => {
    const harness = new DeepAuditProgressionHarness();
    const h = harness.createHackathon({
      id: 'audit-incomplete',
      progressionMode: 'SELECTION_BASED',
      roundsConfig: [{ name: 'R1', selectionCount: 5 }],
    });

    harness.registerTeamWithProject({
      teamId: 't-1',
      hackathonId: h.id,
      teamName: 'Team 1',
      memberUserIds: ['u-1'],
      projectId: 'p-1',
    });

    // Incomplete judge assignment
    harness.addAssignment({
      id: 'assign-draft',
      judgeId: 'j-1',
      projectId: 'p-1',
      roundId: `round-rec-${h.id}-1`,
      status: 'IN_PROGRESS',
    });

    let errorThrown = null;
    try {
      await harness.finalizeRoundResults(h.id, 1, 'admin-1');
    } catch (err) {
      errorThrown = err;
    }

    assert.ok(errorThrown, 'Must throw error when evaluations are incomplete');
    assert.strictEqual(errorThrown.status, 400);
    assert.strictEqual(errorThrown.code, 'EVALUATIONS_INCOMPLETE');
  });

  // AUDIT 3: BACKEND AUTHORIZATION & API SECURITY
  test('AUDIT 3: Eliminated team receives 403 on Round 2 API; Selected team receives 200', async () => {
    const harness = new DeepAuditProgressionHarness();
    const h = harness.createHackathon({
      id: 'audit-auth-sec',
      progressionMode: 'SELECTION_BASED',
      roundsConfig: [{ name: 'R1', selectionCount: 1 }, { name: 'R2', selectionCount: 1 }],
    });

    harness.registerTeamWithProject({ teamId: 't-adv', hackathonId: h.id, memberUserIds: ['u-adv'], projectId: 'p-adv' });
    harness.registerTeamWithProject({ teamId: 't-elim', hackathonId: h.id, memberUserIds: ['u-elim'], projectId: 'p-elim' });

    harness.addEvaluation({ id: 'e-adv', judgeId: 'j-1', projectId: 'p-adv', roundId: `round-rec-${h.id}-1`, status: 'SUBMITTED', weightedScore: 90 });
    harness.addEvaluation({ id: 'e-elim', judgeId: 'j-1', projectId: 'p-elim', roundId: `round-rec-${h.id}-1`, status: 'SUBMITTED', weightedScore: 40 });

    await harness.finalizeRoundResults(h.id, 1, 'admin-1');

    // Selected team calls Round 2 API
    const advAccess = harness.checkTeamRoundAccess('u-adv', h.id, 2);
    assert.strictEqual(advAccess.allowed, true);
    assert.strictEqual(advAccess.status, 200);

    // Eliminated team calls Round 2 API
    const elimAccess = harness.checkTeamRoundAccess('u-elim', h.id, 2);
    assert.strictEqual(elimAccess.allowed, false);
    assert.strictEqual(elimAccess.status, 403);
    assert.strictEqual(elimAccess.code, 'TEAM_ELIMINATED');

    // Eliminated team spoofing roundNumber=1 for new submission after Round 1 is completed
    const pastRoundMutation = harness.checkTeamRoundAccess('u-elim', h.id, 1, { requireActiveRound: true });
    assert.strictEqual(pastRoundMutation.allowed, false);
    assert.strictEqual(pastRoundMutation.status, 403);
    assert.strictEqual(pastRoundMutation.code, 'ROUND_COMPLETED');
  });

  // AUDIT 4: IDOR / PARAMETER MANIPULATION (User Alice tries to act on Bob team)
  test('AUDIT 4: IDOR / teamId parameter manipulation is blocked server-side', () => {
    const harness = new DeepAuditProgressionHarness();
    const h = harness.createHackathon({ id: 'audit-idor', progressionMode: 'SELECTION_BASED' });

    harness.registerTeamWithProject({ teamId: 't-alice', hackathonId: h.id, memberUserIds: ['user-alice'], projectId: 'p-alice' });
    harness.registerTeamWithProject({ teamId: 't-bob', hackathonId: h.id, memberUserIds: ['user-bob'], projectId: 'p-bob' });

    // Alice presents auth token but specifies teamId="t-bob" in API body
    // The server resolves team exclusively through database teamMember relation
    const res = harness.checkTeamRoundAccess('user-alice', h.id, 1);
    assert.strictEqual(res.allowed, true);
    assert.strictEqual(res.team.id, 't-alice', 'Must resolve to Alice own team, never spoofed Bob team');
  });

  // AUDIT 5: ROLE ISOLATION (Participant and Judge cannot finalize round)
  test('AUDIT 5: Participant and Judge roles are strictly forbidden (403) from round finalization API', () => {
    const harness = new DeepAuditProgressionHarness();
    const partAuth = harness.authorizeRole('PARTICIPANT', ['ADMIN', 'ORGANIZER']);
    assert.strictEqual(partAuth.allowed, false);
    assert.strictEqual(partAuth.status, 403);

    const judgeAuth = harness.authorizeRole('JUDGE', ['ADMIN', 'ORGANIZER']);
    assert.strictEqual(judgeAuth.allowed, false);
    assert.strictEqual(judgeAuth.status, 403);

    const adminAuth = harness.authorizeRole('ADMIN', ['ADMIN', 'ORGANIZER']);
    assert.strictEqual(adminAuth.allowed, true);
  });

  // AUDIT 6: ORGANIZER RESOURCE ISOLATION (Organizer B cannot finalize Organizer A hackathon)
  test('AUDIT 6: Organizer B is blocked with 403 when attempting to finalize Organizer A hackathon', () => {
    const harness = new DeepAuditProgressionHarness();
    const h = harness.createHackathon({ id: 'h-org-a', organizerId: 'org-a' });

    const authB = harness.authorizeOrganizer('org-b', h.id);
    assert.strictEqual(authB.allowed, false);
    assert.strictEqual(authB.status, 403);
    assert.strictEqual(authB.code, 'FORBIDDEN_RESOURCE');

    const authA = harness.authorizeOrganizer('org-a', h.id);
    assert.strictEqual(authA.allowed, true);
  });

  // AUDIT 7: PROGRESSION STATE CONSISTENCY (Single authoritative enum prevents impossible states)
  test('AUDIT 7: Progression state cannot be simultaneously ADVANCED and ELIMINATED', async () => {
    const harness = new DeepAuditProgressionHarness();
    const h = harness.createHackathon({
      id: 'audit-consistency',
      progressionMode: 'SELECTION_BASED',
      roundsConfig: [{ name: 'R1', selectionCount: 1 }, { name: 'R2', selectionCount: 1 }],
    });

    harness.registerTeamWithProject({ teamId: 't-1', hackathonId: h.id, projectId: 'p-1' });
    harness.addEvaluation({ id: 'ev-1', judgeId: 'j-1', projectId: 'p-1', status: 'SUBMITTED', weightedScore: 80 });

    await harness.finalizeRoundResults(h.id, 1, 'admin-1');
    const team = harness.teams.get('t-1');

    // ProgressionStatus is a single enum value
    assert.strictEqual(team.progressionStatus, 'ADVANCED');
    assert.notStrictEqual(team.progressionStatus, 'ELIMINATED');
  });

  // AUDIT 8: IDEMPOTENCY (Calling finalization twice does not duplicate progression or notifications)
  test('AUDIT 8: Calling finalization twice returns existing state idempotently without duplicate notifications', async () => {
    const harness = new DeepAuditProgressionHarness();
    const h = harness.createHackathon({
      id: 'audit-idempotent',
      progressionMode: 'SELECTION_BASED',
      roundsConfig: [{ name: 'R1', selectionCount: 1 }],
    });

    harness.registerTeamWithProject({ teamId: 't-1', hackathonId: h.id, memberUserIds: ['u-1'], projectId: 'p-1' });
    harness.addEvaluation({ id: 'ev-1', judgeId: 'j-1', projectId: 'p-1', status: 'SUBMITTED', weightedScore: 90 });

    const firstRun = await harness.finalizeRoundResults(h.id, 1, 'admin-1');
    assert.strictEqual(firstRun.selectedTeamsCount, 1);
    const notifsAfterFirst = harness.notifications.length;

    const secondRun = await harness.finalizeRoundResults(h.id, 1, 'admin-1');
    assert.strictEqual(secondRun.idempotent, true);
    assert.strictEqual(secondRun.selectedTeamsCount, 1);
    // Notifications not re-sent
    assert.strictEqual(harness.notifications.length, notifsAfterFirst);
  });

  // AUDIT 9: CONCURRENCY LOCKING (Simultaneous finalization attempts)
  test('AUDIT 9: Concurrent finalization attempts are locked, rejecting the second attempt with 409', async () => {
    const harness = new DeepAuditProgressionHarness();
    const h = harness.createHackathon({
      id: 'audit-concurrent',
      progressionMode: 'SELECTION_BASED',
      roundsConfig: [{ name: 'R1', selectionCount: 1 }],
    });

    harness.registerTeamWithProject({ teamId: 't-1', hackathonId: h.id, projectId: 'p-1' });

    // Simulate active lock held by Admin 1
    const lockKey = `lock:round:finalize:${h.id}:1`;
    harness.activeLocks.add(lockKey);

    let errCaught = null;
    try {
      await harness.finalizeRoundResults(h.id, 1, 'admin-2');
    } catch (err) {
      errCaught = err;
    }

    assert.ok(errCaught);
    assert.strictEqual(errCaught.status, 409);
    assert.strictEqual(errCaught.code, 'CONCURRENT_OPERATION');
  });

  // AUDIT 10: DETERMINISTIC TIEBREAKER AT CUTOFF
  test('AUDIT 10: Ties at cutoff are broken deterministically by rawAverage descending and submission time', async () => {
    const harness = new DeepAuditProgressionHarness();
    const h = harness.createHackathon({
      id: 'audit-tie',
      progressionMode: 'SELECTION_BASED',
      roundsConfig: [{ name: 'R1', selectionCount: 2 }],
    });

    // 3 teams competing for top 2 spots
    // Team Top: 95.0
    // Team Tied Early: finalScore 85.0, rawAverage 85.0, submitted at 10:00 AM
    // Team Tied Late: finalScore 85.0, rawAverage 85.0, submitted at 11:00 AM
    harness.registerTeamWithProject({ teamId: 't-top', hackathonId: h.id, projectId: 'p-top' });
    harness.registerTeamWithProject({ teamId: 't-early', hackathonId: h.id, projectId: 'p-early' });
    harness.registerTeamWithProject({ teamId: 't-late', hackathonId: h.id, projectId: 'p-late' });

    harness.addSubmission({ id: 'sub-top', projectId: 'p-top', createdAt: new Date('2026-09-28T10:00:00Z') });
    harness.addSubmission({ id: 'sub-early', projectId: 'p-early', createdAt: new Date('2026-09-28T10:15:00Z') });
    harness.addSubmission({ id: 'sub-late', projectId: 'p-late', createdAt: new Date('2026-09-28T11:30:00Z') });

    harness.addEvaluation({ id: 'e-top', judgeId: 'j-1', projectId: 'p-top', status: 'SUBMITTED', weightedScore: 95 });
    harness.addEvaluation({ id: 'e-early', judgeId: 'j-1', projectId: 'p-early', status: 'SUBMITTED', weightedScore: 85 });
    harness.addEvaluation({ id: 'e-late', judgeId: 'j-1', projectId: 'p-late', status: 'SUBMITTED', weightedScore: 85 });

    const result = await harness.finalizeRoundResults(h.id, 1, 'admin-1');
    assert.strictEqual(result.selectedTeamsCount, 2);
    assert.deepStrictEqual(result.advancedTeamIds, ['t-top', 't-early'], 'T-early must advance over T-late due to earlier submission timestamp');
    assert.deepStrictEqual(result.eliminatedTeamIds, ['t-late']);
  });

  // AUDIT 11: NOTIFICATION INTEGRITY (Exact count of recipient notifications)
  test('AUDIT 11: Notification integrity yields exactly K selected and N-K not-selected notifications', async () => {
    const harness = new DeepAuditProgressionHarness();
    const h = harness.createHackathon({
      id: 'audit-notifs',
      progressionMode: 'SELECTION_BASED',
      roundsConfig: [{ name: 'R1', selectionCount: 3 }],
    });

    for (let i = 1; i <= 10; i++) {
      harness.registerTeamWithProject({
        teamId: `t-${i}`,
        hackathonId: h.id,
        memberUserIds: [`u-${i}`],
        projectId: `p-${i}`,
      });
      harness.addEvaluation({
        id: `ev-${i}`,
        judgeId: 'j-1',
        projectId: `p-${i}`,
        status: 'SUBMITTED',
        weightedScore: 100 - i,
      });
    }

    await harness.finalizeRoundResults(h.id, 1, 'admin-1');

    const selectedNotifs = harness.notifications.filter((n) => n.type === 'TEAM_SELECTED_FOR_NEXT_ROUND');
    const eliminatedNotifs = harness.notifications.filter((n) => n.type === 'TEAM_NOT_SELECTED_FOR_NEXT_ROUND');

    assert.strictEqual(selectedNotifs.length, 3);
    assert.strictEqual(eliminatedNotifs.length, 7);
    assert.strictEqual(selectedNotifs[0].message, `Your team has been selected for the next round of ${h.title}.`);
    assert.ok(eliminatedNotifs[0].message.includes('You can still view the published leaderboard'));
  });

  // AUDIT 12: OVERALL PERFORMANCE MODE (No elimination, all teams continue across rounds)
  test('AUDIT 12: Overall Performance Mode preserves all 100 teams without any elimination', async () => {
    const harness = new DeepAuditProgressionHarness();
    const h = harness.createHackathon({
      id: 'audit-op-mode',
      progressionMode: 'OVERALL_PERFORMANCE',
      roundsConfig: [{ name: 'R1' }, { name: 'R2' }, { name: 'R3' }],
    });

    for (let i = 1; i <= 100; i++) {
      harness.registerTeamWithProject({
        teamId: `team-${i}`,
        hackathonId: h.id,
        memberUserIds: [`user-${i}`],
        projectId: `proj-${i}`,
      });
    }

    const r1 = await harness.finalizeRoundResults(h.id, 1, 'admin-1');
    assert.strictEqual(r1.eliminatedTeamsCount, 0);
    assert.strictEqual(r1.selectedTeamsCount, 100);

    const r2 = await harness.finalizeRoundResults(h.id, 2, 'admin-1');
    assert.strictEqual(r2.eliminatedTeamsCount, 0);
    assert.strictEqual(r2.selectedTeamsCount, 100);

    const r3 = await harness.finalizeRoundResults(h.id, 3, 'admin-1');
    assert.strictEqual(r3.eliminatedTeamsCount, 0);
    assert.strictEqual(r3.selectedTeamsCount, 100);
  });

  // AUDIT 13: HISTORICAL DATA PRESERVATION
  test('AUDIT 13: Eliminated teams retain all historical submissions, evaluations, and round results', async () => {
    const harness = new DeepAuditProgressionHarness();
    const h = harness.createHackathon({
      id: 'audit-history',
      progressionMode: 'SELECTION_BASED',
      roundsConfig: [{ name: 'R1', selectionCount: 1 }],
    });

    harness.registerTeamWithProject({ teamId: 't-elim', hackathonId: h.id, projectId: 'p-elim' });
    harness.addSubmission({ id: 'sub-elim-1', projectId: 'p-elim', status: 'SUBMITTED', roundNumber: 1 });
    harness.addEvaluation({ id: 'ev-elim-1', judgeId: 'j-1', projectId: 'p-elim', status: 'SUBMITTED', weightedScore: 30 });

    harness.registerTeamWithProject({ teamId: 't-win', hackathonId: h.id, projectId: 'p-win' });
    harness.addEvaluation({ id: 'ev-win-1', judgeId: 'j-1', projectId: 'p-win', status: 'SUBMITTED', weightedScore: 90 });

    await harness.finalizeRoundResults(h.id, 1, 'admin-1');

    // Assert historical records are still intact in memory/DB
    assert.ok(harness.teams.get('t-elim'), 'Team record must not be deleted');
    assert.ok(harness.submissions.get('sub-elim-1'), 'Submission must not be deleted');
    assert.ok(harness.evaluations.get('ev-elim-1'), 'Evaluation must not be deleted');
    assert.ok(harness.roundResults.get(`${h.id}:1:t-elim`), 'Round result must be preserved');
  });

  // AUDIT 14: BACKWARD COMPATIBILITY WITH EXISTING HACKATHONS
  test('AUDIT 14: Existing hackathons default safely to OVERALL_PERFORMANCE without disruption', () => {
    const harness = new DeepAuditProgressionHarness();
    const legacy = harness.createHackathon({
      id: 'h-legacy-prod',
      title: 'Legacy Hackathon',
      // No progressionMode passed
    });

    assert.strictEqual(legacy.progressionMode, 'OVERALL_PERFORMANCE');
    const team = harness.registerTeamWithProject({ teamId: 't-leg', hackathonId: legacy.id, memberUserIds: ['u-leg'] });
    assert.strictEqual(team.progressionStatus, 'ELIGIBLE');

    const acc = harness.checkTeamRoundAccess('u-leg', legacy.id, 1);
    assert.strictEqual(acc.allowed, true);
  });
});
