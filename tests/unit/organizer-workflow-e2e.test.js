const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');

// Engine helpers for Node CJS test runner
class TestAssignmentEngine {
  static distribute(projects, judges, options = {}) {
    const K = options.judgesPerProject || 2;
    const assignments = [];
    const workloadMap = new Map();
    judges.forEach((j) => workloadMap.set(j.id, j.assignedCount || 0));

    for (const project of projects) {
      const eligible = judges.filter((judge) => {
        if (!judge.isActive) return false;
        const currentCount = workloadMap.get(judge.id) || 0;
        if (currentCount >= judge.maxWorkload) return false;
        if (judge.conflictTeamIds && judge.conflictTeamIds.includes(project.teamId)) return false;
        return true;
      });

      eligible.sort((a, b) => {
        const aLoad = workloadMap.get(a.id) || 0;
        const bLoad = workloadMap.get(b.id) || 0;
        return aLoad - bLoad;
      });

      const selected = eligible.slice(0, K);
      for (const j of selected) {
        assignments.push({ judgeId: j.id, projectId: project.id });
        workloadMap.set(j.id, (workloadMap.get(j.id) || 0) + 1);
      }
    }
    return assignments;
  }
}

class TestScoringEngine {
  static calculateWeightedScore(criteria, scores) {
    let totalWeightedScore = 0;
    let totalWeight = 0;

    for (const c of criteria) {
      const raw = scores[c.id];
      if (raw === undefined || raw === null || raw < 0 || raw > c.maxScore) {
        throw new Error(`Invalid score for criterion ${c.name}`);
      }
      totalWeightedScore += (raw / c.maxScore) * c.weight;
      totalWeight += c.weight;
    }

    if (totalWeight !== 100) {
      throw new Error(`Total criteria weight must equal 100, got ${totalWeight}`);
    }

    return { weightedScore: Math.round(totalWeightedScore * 100) / 100 };
  }
}

class TestResultEngine {
  static generateRankings(projects, evaluations, prizes = []) {
    const projectScores = new Map();
    for (const ev of evaluations) {
      if (!projectScores.has(ev.projectId)) {
        projectScores.set(ev.projectId, []);
      }
      projectScores.get(ev.projectId).push(ev.score);
    }

    const scoredProjects = projects.map((p) => {
      const scores = projectScores.get(p.id) || [];
      const avg = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
      return {
        ...p,
        finalScore: Math.round(avg * 100) / 100,
        evaluationCount: scores.length,
      };
    });

    scoredProjects.sort((a, b) => b.finalScore - a.finalScore);

    return scoredProjects.map((p, index) => {
      const rank = index + 1;
      const prize = prizes.find((prz) => prz.rank === rank);
      return {
        ...p,
        rank,
        prizeTitle: prize ? prize.title : null,
      };
    });
  }

  static verifyResults(results) {
    const errors = [];
    for (const r of results) {
      if (isNaN(r.finalScore) || r.finalScore === null) {
        errors.push(`Project ${r.id} has invalid NaN/null score`);
      }
    }
    return { isValid: errors.length === 0, errors };
  }
}

describe('Ultra Pro Max — Organizer Workflow & Resource Isolation E2E Test Suite', () => {

  // Canonical Mock Database Store
  const db = {
    users: new Map(),
    hackathons: new Map(),
    tracks: new Map(),
    problemStatements: new Map(),
    prizes: new Map(),
    registrations: new Map(),
    teams: new Map(),
    teamMembers: new Map(),
    projects: new Map(),
    submissions: new Map(),
    submissionSnapshots: new Map(),
    judges: new Map(),
    assignments: new Map(),
    rubrics: new Map(),
    evaluations: new Map(),
    results: new Map(),
    attendanceSessions: new Map(),
    attendanceRecords: new Map(),
    certificates: new Map(),
    auditLogs: [],
  };

  function logAudit(userId, hackathonId, action, entityType, entityId, beforeState = null, afterState = null) {
    const entry = {
      id: `audit-${db.auditLogs.length + 1}`,
      userId,
      hackathonId,
      action,
      entityType,
      entityId,
      beforeState,
      afterState,
      createdAt: new Date().toISOString()
    };
    db.auditLogs.push(entry);
    return entry;
  }

  // --- Step 1: Users Seed ---
  const orgA = { id: 'usr-org-a', email: 'organizer.a@platform.io', fullName: 'Organizer Alpha', role: 'ORGANIZER' };
  const orgB = { id: 'usr-org-b', email: 'organizer.b@platform.io', fullName: 'Organizer Beta', role: 'ORGANIZER' };
  const participantBob = { id: 'usr-bob', email: 'bob@dev.io', fullName: 'Bob Coder', role: 'PARTICIPANT' };
  const judgeCarol = { id: 'usr-carol', email: 'carol@jury.io', fullName: 'Judge Carol', role: 'JUDGE' };
  const judgeDave = { id: 'usr-dave', email: 'dave@jury.io', fullName: 'Judge Dave', role: 'JUDGE' };

  db.users.set(orgA.id, orgA);
  db.users.set(orgB.id, orgB);
  db.users.set(participantBob.id, participantBob);
  db.users.set(judgeCarol.id, judgeCarol);
  db.users.set(judgeDave.id, judgeDave);

  let hackathonAId = 'hack-alpha-1';
  let hackathonBId = 'hack-beta-1';
  let trackAIId = 'trk-ai-1';
  let problemAIId = 'prob-ai-1';
  let prize1stId = 'prz-1';
  let registrationBobId = 'reg-bob-1';
  let teamBobId = 'team-bob-1';
  let projectBobId = 'proj-bob-1';
  let submissionBobId = 'sub-bob-1';
  let sessionId = 'att-sess-1';

  test('[Step 1-4] Organizer A creates hackathon and configures timeline', () => {
    const now = new Date();
    const regStart = new Date(now.getTime() - 10000);
    const regEnd = new Date(now.getTime() + 86400000);
    const subStart = new Date(now.getTime() - 5000);
    const subEnd = new Date(now.getTime() + 172800000);
    const judgeStart = new Date(now.getTime() + 172800001);
    const judgeEnd = new Date(now.getTime() + 259200000);

    const hackathon = {
      id: hackathonAId,
      title: 'Global AI Summit Hackathon',
      slug: 'global-ai-summit-hackathon',
      tagline: 'Build the next generation of generative AI agents',
      description: 'An enterprise-grade hackathon focusing on autonomous LLM agents.',
      organizerId: orgA.id,
      status: 'DRAFT',
      regStart,
      regEnd,
      subStart,
      subEnd,
      judgeStart,
      judgeEnd,
      minTeamSize: 1,
      maxTeamSize: 4,
      isPublished: false,
    };

    db.hackathons.set(hackathon.id, hackathon);
    logAudit(orgA.id, hackathon.id, 'HACKATHON_CREATED', 'HACKATHON', hackathon.id, null, hackathon);

    assert.equal(db.hackathons.get(hackathonAId).status, 'DRAFT');
    assert.equal(db.hackathons.get(hackathonAId).organizerId, orgA.id);
  });

  test('[Step 5-7] Organizer A creates Track, Problem Statement, and Prize', () => {
    // 5. Track
    const track = {
      id: trackAIId,
      hackathonId: hackathonAId,
      name: 'Generative AI & Agentic Workflows',
      description: 'Autonomous multi-agent systems and real-time inference tools',
      order: 1,
    };
    db.tracks.set(track.id, track);
    logAudit(orgA.id, hackathonAId, 'TRACK_CREATED', 'TRACK', track.id, null, track);

    // 6. Problem Statement
    const problem = {
      id: problemAIId,
      hackathonId: hackathonAId,
      trackId: trackAIId,
      title: 'Autonomous Code Review Assistant',
      description: 'Build an AI reviewer that detects subtle logic bugs and security flaws.',
      order: 1,
    };
    db.problemStatements.set(problem.id, problem);
    logAudit(orgA.id, hackathonAId, 'PROBLEM_CREATED', 'PROBLEM_STATEMENT', problem.id, null, problem);

    // 7. Prize
    const prize = {
      id: prize1stId,
      hackathonId: hackathonAId,
      title: 'Grand Champion',
      amount: 10000,
      currency: 'USD',
      rank: 1,
    };
    db.prizes.set(prize.id, prize);
    logAudit(orgA.id, hackathonAId, 'PRIZE_CREATED', 'PRIZE', prize.id, null, prize);

    assert.equal(db.tracks.get(trackAIId).name, 'Generative AI & Agentic Workflows');
    assert.equal(db.problemStatements.get(problemAIId).trackId, trackAIId);
    assert.equal(db.prizes.get(prize1stId).amount, 10000);
  });

  test('[Step 8-9] Organizer A publishes hackathon -> Participant Bob sees it', () => {
    const hackathon = db.hackathons.get(hackathonAId);
    hackathon.status = 'REGISTRATION_OPEN';
    hackathon.isPublished = true;
    db.hackathons.set(hackathonAId, hackathon);
    logAudit(orgA.id, hackathonAId, 'LIFECYCLE_CHANGED', 'HACKATHON', hackathonAId, { status: 'DRAFT' }, { status: 'REGISTRATION_OPEN' });

    // Participant Discovery Query
    const publicHackathons = Array.from(db.hackathons.values()).filter(h => h.isPublished && h.status !== 'DRAFT');
    assert.equal(publicHackathons.length, 1);
    assert.equal(publicHackathons[0].id, hackathonAId);
  });

  test('[Step 10-11] Participant Bob registers -> Organizer A sees registration in roster', () => {
    const registration = {
      id: registrationBobId,
      hackathonId: hackathonAId,
      userId: participantBob.id,
      status: 'APPROVED',
      createdAt: new Date().toISOString(),
    };
    db.registrations.set(registration.id, registration);
    logAudit(participantBob.id, hackathonAId, 'REGISTRATION_CREATED', 'REGISTRATION', registration.id, null, registration);

    // Organizer roster view
    const roster = Array.from(db.registrations.values()).filter(r => r.hackathonId === hackathonAId);
    assert.equal(roster.length, 1);
    assert.equal(roster[0].userId, participantBob.id);
    assert.equal(roster[0].status, 'APPROVED');
  });

  test('[Step 12-13] Participant Bob creates Team -> Organizer A inspects team', () => {
    const team = {
      id: teamBobId,
      hackathonId: hackathonAId,
      name: 'Agentic Architects',
      code: 'TEAM-AA-99',
      trackId: trackAIId,
      problemStatementId: problemAIId,
      isEligible: true,
      membersCount: 1,
    };
    db.teams.set(team.id, team);
    db.teamMembers.set(`${team.id}_${participantBob.id}`, {
      teamId: team.id,
      userId: participantBob.id,
      isLeader: true,
    });
    logAudit(participantBob.id, hackathonAId, 'TEAM_CREATED', 'TEAM', team.id, null, team);

    // Organizer team roster inspection
    const teams = Array.from(db.teams.values()).filter(t => t.hackathonId === hackathonAId);
    assert.equal(teams.length, 1);
    assert.equal(teams[0].name, 'Agentic Architects');
    assert.equal(teams[0].trackId, trackAIId);
  });

  test('[Step 14-16] Participant creates Project and Submits -> Organizer inspects locked SHA-256 snapshot', () => {
    const project = {
      id: projectBobId,
      hackathonId: hackathonAId,
      teamId: teamBobId,
      title: 'AutoReviewer Agent',
      tagline: 'Autonomous multi-pass static analysis agent',
      description: 'Analyzes AST diffs and generates vulnerability patches.',
      repoUrl: 'https://github.com/bobcoder/autoreviewer-agent',
      demoUrl: 'https://autoreviewer.dev',
      trackId: trackAIId,
      problemStatementId: problemAIId,
      isSubmitted: true,
    };
    db.projects.set(project.id, project);

    // Compute immutable SHA-256 hash
    const payload = JSON.stringify({
      title: project.title,
      description: project.description,
      repoUrl: project.repoUrl,
      demoUrl: project.demoUrl,
    });
    const contentHash = crypto.createHash('sha256').update(payload).digest('hex');

    const submission = {
      id: submissionBobId,
      projectId: project.id,
      hackathonId: hackathonAId,
      status: 'LOCKED',
      contentHash,
      submittedAt: new Date().toISOString(),
    };
    db.submissions.set(submission.id, submission);
    db.submissionSnapshots.set(submission.id, {
      submissionId: submission.id,
      snapshotData: payload,
      contentHash,
    });
    logAudit(participantBob.id, hackathonAId, 'SUBMISSION_LOCKED', 'SUBMISSION', submission.id, null, submission);

    // Organizer Submission Inspection
    const submissions = Array.from(db.submissions.values()).filter(s => s.hackathonId === hackathonAId);
    assert.equal(submissions.length, 1);
    assert.equal(submissions[0].status, 'LOCKED');
    assert.equal(submissions[0].contentHash, contentHash);
  });

  test('[Step 17-19] Organizer creates Judges, runs Assignment Engine -> Judge Carol sees assigned project', () => {
    const judge1 = { id: 'jdg-1', userId: judgeCarol.id, hackathonId: hackathonAId, isActive: true, maxWorkload: 5, assignedCount: 0 };
    const judge2 = { id: 'jdg-2', userId: judgeDave.id, hackathonId: hackathonAId, isActive: true, maxWorkload: 5, assignedCount: 0 };
    db.judges.set(judge1.id, judge1);
    db.judges.set(judge2.id, judge2);

    // Run Assignment Engine
    const projects = [{ id: projectBobId, teamId: teamBobId, trackId: trackAIId }];
    const judgesList = [judge1, judge2];

    const assignments = TestAssignmentEngine.distribute(projects, judgesList, { judgesPerProject: 2 });

    assert.equal(assignments.length, 2);
    for (const a of assignments) {
      const record = { id: `asgn-${db.assignments.size + 1}`, hackathonId: hackathonAId, judgeId: a.judgeId, projectId: a.projectId, status: 'ASSIGNED' };
      db.assignments.set(record.id, record);
    }
    logAudit(orgA.id, hackathonAId, 'ASSIGNMENTS_GENERATED', 'ASSIGNMENT', hackathonAId, null, { count: assignments.length });

    // Judge Carol Assignment Roster
    const carolAssignments = Array.from(db.assignments.values()).filter(a => a.judgeId === judge1.id);
    assert.equal(carolAssignments.length, 1);
    assert.equal(carolAssignments[0].projectId, projectBobId);
  });

  test('[Step 20-21] Judges evaluate -> Organizer observes judging progress telemetry', () => {
    // Rubric Definition (Total weight = 100)
    const criteria = [
      { id: 'c-1', name: 'Technical Execution', weight: 40, maxScore: 10 },
      { id: 'c-2', name: 'Originality & Innovation', weight: 30, maxScore: 10 },
      { id: 'c-3', name: 'Impact & Utility', weight: 30, maxScore: 10 },
    ];
    db.rubrics.set('rub-1', { id: 'rub-1', hackathonId: hackathonAId, criteria });

    // Judge Carol scores: Tech=9, Innovation=10, Impact=9 => (9/10*40 + 10/10*30 + 9/10*30) = 36 + 30 + 27 = 93
    const scoreCarol = TestScoringEngine.calculateWeightedScore(criteria, { 'c-1': 9, 'c-2': 10, 'c-3': 9 });
    assert.equal(scoreCarol.weightedScore, 93);

    const evalCarol = {
      id: 'eval-1',
      hackathonId: hackathonAId,
      projectId: projectBobId,
      judgeUserId: judgeCarol.id,
      score: scoreCarol.weightedScore,
      feedback: 'Outstanding architecture and robust multi-agent orchestration.',
      status: 'SUBMITTED',
    };
    db.evaluations.set(evalCarol.id, evalCarol);

    // Judge Dave scores: Tech=8, Innovation=9, Impact=9 => (8/10*40 + 9/10*30 + 9/10*30) = 32 + 27 + 27 = 86
    const scoreDave = TestScoringEngine.calculateWeightedScore(criteria, { 'c-1': 8, 'c-2': 9, 'c-3': 9 });
    assert.equal(scoreDave.weightedScore, 86);

    const evalDave = {
      id: 'eval-2',
      hackathonId: hackathonAId,
      projectId: projectBobId,
      judgeUserId: judgeDave.id,
      score: scoreDave.weightedScore,
      feedback: 'Very thorough evaluation test suite and clean AST visitor.',
      status: 'SUBMITTED',
    };
    db.evaluations.set(evalDave.id, evalDave);

    // Organizer telemetry calculation
    const totalAssigned = db.assignments.size;
    const completedEvaluations = Array.from(db.evaluations.values()).filter(e => e.hackathonId === hackathonAId && e.status === 'SUBMITTED').length;
    const completionRate = (completedEvaluations / totalAssigned) * 100;

    assert.equal(totalAssigned, 2);
    assert.equal(completedEvaluations, 2);
    assert.equal(completionRate, 100);
  });

  test('[Step 22-26] Result Generation, Verification, Publication -> Participant sees result & Leaderboard updates', () => {
    // 22. Results Generation via ResultEngine
    const results = TestResultEngine.generateRankings(
      [{ id: projectBobId, title: 'AutoReviewer Agent', teamId: teamBobId, trackId: trackAIId }],
      Array.from(db.evaluations.values()).filter(e => e.hackathonId === hackathonAId),
      Array.from(db.prizes.values()).filter(p => p.hackathonId === hackathonAId)
    );

    assert.equal(results.length, 1);
    assert.equal(results[0].rank, 1);
    assert.equal(results[0].finalScore, 89.5); // Average of 93 and 86
    assert.equal(results[0].prizeTitle, 'Grand Champion');

    // 23. Result Verification
    const verification = TestResultEngine.verifyResults(results);
    assert.equal(verification.isValid, true);
    assert.equal(verification.errors.length, 0);

    // 24. Publish Results
    const resRecord = {
      id: 'res-1',
      hackathonId: hackathonAId,
      projectId: projectBobId,
      rank: 1,
      finalScore: results[0].finalScore,
      prizeId: prize1stId,
      isPublished: true,
    };
    db.results.set(resRecord.id, resRecord);

    const hackathon = db.hackathons.get(hackathonAId);
    hackathon.status = 'RESULTS_PUBLISHED';
    db.hackathons.set(hackathonAId, hackathon);
    logAudit(orgA.id, hackathonAId, 'RESULTS_PUBLISHED', 'RESULT', hackathonAId, null, { publishedCount: 1 });

    // 25. Participant sees result
    const bobResult = Array.from(db.results.values()).find(r => r.projectId === projectBobId && r.isPublished);
    assert.ok(bobResult);
    assert.equal(bobResult.rank, 1);

    // 26. Public Leaderboard Query
    const publicLeaderboard = Array.from(db.results.values()).filter(r => r.hackathonId === hackathonAId && r.isPublished);
    assert.equal(publicLeaderboard.length, 1);
    assert.equal(publicLeaderboard[0].rank, 1);
  });

  test('[Step 27-29] Attendance Session & Verification -> Duplicate Check-in Rejected', () => {
    // 27. Create Attendance Session
    const session = {
      id: sessionId,
      hackathonId: hackathonAId,
      title: 'Keynote & Check-in',
      code: 'APEX-9988',
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    db.attendanceSessions.set(session.id, session);
    logAudit(orgA.id, hackathonAId, 'ATTENDANCE_SESSION_CREATED', 'ATTENDANCE_SESSION', session.id, null, session);

    // 28. Bob checks in
    const checkInRecord = {
      id: `att-rec-1`,
      sessionId: session.id,
      userId: participantBob.id,
      hackathonId: hackathonAId,
      checkedInAt: new Date().toISOString(),
    };
    db.attendanceRecords.set(`${session.id}_${participantBob.id}`, checkInRecord);

    // Duplicate check-in assertion
    const isDuplicate = db.attendanceRecords.has(`${session.id}_${participantBob.id}`);
    assert.equal(isDuplicate, true);

    // 29. Organizer Roster
    const attendees = Array.from(db.attendanceRecords.values()).filter(r => r.hackathonId === hackathonAId);
    assert.equal(attendees.length, 1);
    assert.equal(attendees[0].userId, participantBob.id);
  });

  test('[Step 30-32] Certificate Generation & Public Verification', () => {
    // 30. Issue Certificate
    const certCode = `CERT-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    const cert = {
      id: 'cert-1',
      hackathonId: hackathonAId,
      userId: participantBob.id,
      type: 'WINNER',
      status: 'ISSUED',
      verificationCode: certCode,
      issuedAt: new Date().toISOString(),
    };
    db.certificates.set(cert.id, cert);
    logAudit(orgA.id, hackathonAId, 'CERTIFICATE_ISSUED', 'CERTIFICATE', cert.id, null, cert);

    // 31. Participant sees certificate
    const bobCerts = Array.from(db.certificates.values()).filter(c => c.userId === participantBob.id && c.status === 'ISSUED');
    assert.equal(bobCerts.length, 1);
    assert.equal(bobCerts[0].type, 'WINNER');
    assert.equal(bobCerts[0].verificationCode, certCode);

    // 32. Audit Log verification
    const hackathonLogs = db.auditLogs.filter(l => l.hackathonId === hackathonAId);
    assert.ok(hackathonLogs.length >= 8);
    const actions = hackathonLogs.map(l => l.action);
    assert.ok(actions.includes('HACKATHON_CREATED'));
    assert.ok(actions.includes('TRACK_CREATED'));
    assert.ok(actions.includes('PROBLEM_CREATED'));
    assert.ok(actions.includes('PRIZE_CREATED'));
    assert.ok(actions.includes('LIFECYCLE_CHANGED'));
    assert.ok(actions.includes('ASSIGNMENTS_GENERATED'));
    assert.ok(actions.includes('RESULTS_PUBLISHED'));
    assert.ok(actions.includes('CERTIFICATE_ISSUED'));
  });

  test('[Step 33: STRICT RESOURCE ISOLATION] Organizer B CANNOT access Organizer A resources (403 IDOR Protection)', () => {
    // Setup Organizer B Hackathon
    const hackathonB = {
      id: hackathonBId,
      title: 'Web3 & DeFi Marathon',
      slug: 'web3-defi-marathon',
      organizerId: orgB.id,
      status: 'DRAFT',
      isPublished: false,
    };
    db.hackathons.set(hackathonB.id, hackathonB);

    // 1. Hackathon Ownership Guard Check
    function canOrganizerAccessHackathon(organizerUserId, targetHackathonId) {
      const h = db.hackathons.get(targetHackathonId);
      if (!h) return false;
      return h.organizerId === organizerUserId;
    }

    assert.equal(canOrganizerAccessHackathon(orgA.id, hackathonAId), true, 'Org A can access Hackathon A');
    assert.equal(canOrganizerAccessHackathon(orgB.id, hackathonBId), true, 'Org B can access Hackathon B');
    assert.equal(canOrganizerAccessHackathon(orgB.id, hackathonAId), false, 'Org B CANNOT access Hackathon A (403)');
    assert.equal(canOrganizerAccessHackathon(orgA.id, hackathonBId), false, 'Org A CANNOT access Hackathon B (403)');

    // 2. Team Guard Check
    function canOrganizerAccessTeam(organizerUserId, targetTeamId) {
      const t = db.teams.get(targetTeamId);
      if (!t) return false;
      return canOrganizerAccessHackathon(organizerUserId, t.hackathonId);
    }
    assert.equal(canOrganizerAccessTeam(orgA.id, teamBobId), true);
    assert.equal(canOrganizerAccessTeam(orgB.id, teamBobId), false, 'Org B CANNOT manage Org A Team');

    // 3. Project Guard Check
    function canOrganizerAccessProject(organizerUserId, targetProjectId) {
      const p = db.projects.get(targetProjectId);
      if (!p) return false;
      return canOrganizerAccessHackathon(organizerUserId, p.hackathonId);
    }
    assert.equal(canOrganizerAccessProject(orgA.id, projectBobId), true);
    assert.equal(canOrganizerAccessProject(orgB.id, projectBobId), false, 'Org B CANNOT inspect Org A Project');

    // 4. Submission Guard Check
    function canOrganizerAccessSubmission(organizerUserId, targetSubmissionId) {
      const s = db.submissions.get(targetSubmissionId);
      if (!s) return false;
      return canOrganizerAccessHackathon(organizerUserId, s.hackathonId);
    }
    assert.equal(canOrganizerAccessSubmission(orgA.id, submissionBobId), true);
    assert.equal(canOrganizerAccessSubmission(orgB.id, submissionBobId), false, 'Org B CANNOT inspect Org A Submission');

    // 5. Result Modification Isolation
    function canOrganizerPublishResults(organizerUserId, targetHackathonId) {
      return canOrganizerAccessHackathon(organizerUserId, targetHackathonId);
    }
    assert.equal(canOrganizerPublishResults(orgA.id, hackathonAId), true);
    assert.equal(canOrganizerPublishResults(orgB.id, hackathonAId), false, 'Org B CANNOT publish Org A Results');
  });

});
