const { test, describe } = require('node:test');
const assert = require('node:assert');

// In-Memory Simulated Security Domain
class MockJudgingContext {
  constructor() {
    this.users = new Map();
    this.hackathons = new Map();
    this.teams = new Map();
    this.projects = new Map();
    this.rubrics = new Map();
    this.judges = new Map();
    this.assignments = new Map();
    this.evaluations = new Map();
    this.aiRuns = new Map();
    this.auditLogs = [];
  }

  addUser(id, role, email) {
    this.users.set(id, { id, role, email });
  }

  addHackathon(id, organizerId, title) {
    this.hackathons.set(id, { id, organizerId, title, status: 'PUBLISHED' });
  }

  addTeam(id, hackathonId, name, memberIds) {
    this.teams.set(id, { id, hackathonId, name, memberIds });
  }

  addProject(id, hackathonId, teamId, title) {
    this.projects.set(id, {
      id,
      hackathonId,
      teamId,
      title,
      isLocked: true,
      snapshot: { title, repoUrl: 'https://github.com/org/repo' },
    });
  }

  addRubric(id, hackathonId, criteria) {
    this.rubrics.set(id, { id, hackathonId, version: 1, criteria });
  }

  addJudge(id, hackathonId, userId, maxWorkload = 10, conflictTeamIds = []) {
    // Auto-detect team memberships as COI
    const userTeams = [];
    this.teams.forEach((t) => {
      if (t.hackathonId === hackathonId && t.memberIds.includes(userId)) {
        userTeams.push(t.id);
      }
    });

    const mergedCOI = Array.from(new Set([...conflictTeamIds, ...userTeams]));
    this.judges.set(id, { id, hackathonId, userId, maxWorkload, conflictTeamIds: mergedCOI, isActive: true });
  }

  assignJudge(judgeId, projectId) {
    const judge = this.judges.get(judgeId);
    const project = this.projects.get(projectId);
    if (!judge || !project) throw new Error('NOT_FOUND');

    // COI Check
    if (judge.conflictTeamIds.includes(project.teamId)) {
      throw { status: 400, code: 'CONFLICT_OF_INTEREST', message: 'Judge has a conflict of interest with this team.' };
    }

    const assignmentId = `asgn_${judgeId}_${projectId}`;
    this.assignments.set(assignmentId, {
      id: assignmentId,
      judgeId,
      projectId,
      status: 'ASSIGNED',
    });
    return assignmentId;
  }

  getAssignmentForJudge(assignmentId, requestingUserId) {
    const assignment = this.assignments.get(assignmentId);
    if (!assignment) return null;

    const judge = this.judges.get(assignment.judgeId);
    // STRICT ISOLATION CHECK
    if (!judge || judge.userId !== requestingUserId) {
      throw { status: 403, code: 'FORBIDDEN_ISOLATION', message: 'Judge isolation: cannot access peer assignment' };
    }

    return assignment;
  }

  submitEvaluation(assignmentId, requestingUserId, scores, status = 'SUBMITTED') {
    const assignment = this.assignments.get(assignmentId);
    if (!assignment) {
      throw { status: 404, code: 'ASSIGNMENT_NOT_FOUND', message: 'Assignment not found' };
    }

    const judge = this.judges.get(assignment.judgeId);
    if (!judge || judge.userId !== requestingUserId) {
      throw { status: 403, code: 'FORBIDDEN_EVALUATION', message: 'Unauthorized: cannot score peer assignment' };
    }

    // Check if evaluation already locked
    const existing = this.evaluations.get(assignmentId);
    if (existing && existing.status === 'SUBMITTED') {
      throw { status: 409, code: 'EVALUATION_LOCKED', message: 'Evaluation is locked and cannot be modified.' };
    }

    let rawScoreSum = 0;
    let weightedScore = 0;
    for (const s of scores) {
      rawScoreSum += s.rawScore;
      weightedScore += (s.rawScore / s.maxScore) * s.weightPercentage;
    }

    const evaluation = {
      id: `eval_${assignmentId}`,
      assignmentId,
      judgeId: judge.id,
      projectId: assignment.projectId,
      status,
      rawScoreSum,
      weightedScore: Number(weightedScore.toFixed(2)),
      scores,
    };

    this.evaluations.set(assignmentId, evaluation);
    if (status === 'SUBMITTED') {
      assignment.status = 'COMPLETED';
    }

    this.auditLogs.push({
      action: status === 'SUBMITTED' ? 'EVALUATION_SUBMITTED' : 'EVALUATION_DRAFT',
      userId: requestingUserId,
      entityId: evaluation.id,
    });

    return evaluation;
  }

  runAIJuryIndependent(projectId, rubricId) {
    const project = this.projects.get(projectId);
    const rubric = this.rubrics.get(rubricId);
    if (!project || !rubric) throw new Error('NOT_FOUND');

    // CRITICAL: AI evaluates only locked project snapshot + rubric WITHOUT reading human scores
    const aiScores = rubric.criteria.map((c) => ({
      criterionId: c.id,
      score: c.maxScore * 0.85,
      confidence: 0.9,
    }));

    const runId = `ai_run_${projectId}`;
    const aiRun = {
      id: runId,
      projectId,
      rubricId,
      scores: aiScores,
      overallScore: 85.0,
      confidence: 0.9,
    };

    this.aiRuns.set(runId, aiRun);
    return aiRun;
  }
}

describe('Judge Isolation & Security Tests', () => {
  let ctx;

  test('Setup mock enterprise judging environment', () => {
    ctx = new MockJudgingContext();
    // Users
    ctx.addUser('user_judge_a', 'JUDGE', 'judgeA@test.com');
    ctx.addUser('user_judge_b', 'JUDGE', 'judgeB@test.com');
    ctx.addUser('user_participant', 'PARTICIPANT', 'part@test.com');
    ctx.addUser('user_organizer_a', 'ORGANIZER', 'orgA@test.com');
    ctx.addUser('user_organizer_b', 'ORGANIZER', 'orgB@test.com');

    // Hackathon & Rubric
    ctx.addHackathon('hack_1', 'user_organizer_a', 'AI Hackathon 2026');
    ctx.addRubric('rubric_1', 'hack_1', [
      { id: 'crit_1', title: 'Tech', weightPercentage: 60, maxScore: 100 },
      { id: 'crit_2', title: 'UX', weightPercentage: 40, maxScore: 100 },
    ]);

    // Teams & Projects
    ctx.addTeam('team_alpha', 'hack_1', 'Team Alpha', ['user_participant']);
    ctx.addTeam('team_judge_conflict', 'hack_1', 'Team COI', ['user_judge_a']); // Judge A is on this team!

    ctx.addProject('proj_alpha', 'hack_1', 'team_alpha', 'Alpha AI Project');
    ctx.addProject('proj_coi', 'hack_1', 'team_judge_conflict', 'COI Project');

    // Judges
    ctx.addJudge('judge_a', 'hack_1', 'user_judge_a', 5, []);
    ctx.addJudge('judge_b', 'hack_1', 'user_judge_b', 5, []);
  });

  test('[1] Conflict of Interest (COI): Judge A cannot be assigned to project from their own team', () => {
    assert.throws(
      () => {
        ctx.assignJudge('judge_a', 'proj_coi');
      },
      (err) => err.code === 'CONFLICT_OF_INTEREST',
      'Judge A must be rejected from evaluating project where they are a team member'
    );
  });

  test('[2] Judge A can evaluate non-conflicted assigned project', () => {
    const asgnId = ctx.assignJudge('judge_a', 'proj_alpha');
    assert.ok(asgnId);

    const asgn = ctx.getAssignmentForJudge(asgnId, 'user_judge_a');
    assert.strictEqual(asgn.id, asgnId);
  });

  test('[3] Judge B CANNOT access Judge A assignment (Strict Isolation Guard)', () => {
    const asgnId = `asgn_judge_a_proj_alpha`;
    assert.throws(
      () => {
        ctx.getAssignmentForJudge(asgnId, 'user_judge_b');
      },
      (err) => err.code === 'FORBIDDEN_ISOLATION' && err.status === 403,
      'Judge B must be blocked from inspecting Judge A assignment'
    );
  });

  test('[4] Judge B CANNOT submit evaluation for Judge A assignment', () => {
    const asgnId = `asgn_judge_a_proj_alpha`;
    const scorePayload = [
      { criterionId: 'crit_1', rawScore: 80, maxScore: 100, weightPercentage: 60 },
      { criterionId: 'crit_2', rawScore: 90, maxScore: 100, weightPercentage: 40 },
    ];

    assert.throws(
      () => {
        ctx.submitEvaluation(asgnId, 'user_judge_b', scorePayload, 'SUBMITTED');
      },
      (err) => err.code === 'FORBIDDEN_EVALUATION' && err.status === 403,
      'Judge B must be blocked from scoring Judge A project'
    );
  });

  test('[5] Judge A successfully submits evaluation and locks it', () => {
    const asgnId = `asgn_judge_a_proj_alpha`;
    const scorePayload = [
      { criterionId: 'crit_1', rawScore: 80, maxScore: 100, weightPercentage: 60 }, // 48
      { criterionId: 'crit_2', rawScore: 90, maxScore: 100, weightPercentage: 40 }, // 36 -> Total = 84
    ];

    const evalResult = ctx.submitEvaluation(asgnId, 'user_judge_a', scorePayload, 'SUBMITTED');
    assert.strictEqual(evalResult.status, 'SUBMITTED');
    assert.strictEqual(evalResult.weightedScore, 84);
  });

  test('[6] Double Submission / Modification of locked evaluation is rejected (Immutability)', () => {
    const asgnId = `asgn_judge_a_proj_alpha`;
    const modifiedScores = [
      { criterionId: 'crit_1', rawScore: 100, maxScore: 100, weightPercentage: 60 },
      { criterionId: 'crit_2', rawScore: 100, maxScore: 100, weightPercentage: 40 },
    ];

    assert.throws(
      () => {
        ctx.submitEvaluation(asgnId, 'user_judge_a', modifiedScores, 'SUBMITTED');
      },
      (err) => err.code === 'EVALUATION_LOCKED' && err.status === 409,
      'Locked evaluation must reject modifications'
    );
  });

  test('[7] Autonomous AI Jury independently evaluates locked submission without human score', () => {
    const aiRun = ctx.runAIJuryIndependent('proj_alpha', 'rubric_1');
    assert.strictEqual(aiRun.projectId, 'proj_alpha');
    assert.strictEqual(aiRun.scores.length, 2);
    assert.strictEqual(aiRun.overallScore, 85.0);
  });

  test('[8] Audit logs capture evaluation submission event', () => {
    const submitLog = ctx.auditLogs.find((l) => l.action === 'EVALUATION_SUBMITTED');
    assert.ok(submitLog, 'Audit log must record evaluation submission event');
    assert.strictEqual(submitLog.userId, 'user_judge_a');
  });
});
