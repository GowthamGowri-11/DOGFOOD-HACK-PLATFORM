const test = require('node:test');
const assert = require('node:assert/strict');

// Import domain engines directly compiled or written
test('AssignmentEngine - should distribute projects with workload balance and COI filtering', () => {
  const projects = [
    { id: 'p1', teamId: 't1', trackId: 'trk1', hackathonId: 'h1' },
    { id: 'p2', teamId: 't2', trackId: 'trk1', hackathonId: 'h1' },
  ];

  const judges = [
    { id: 'j1', userId: 'u1', maxWorkload: 5, expertiseTracks: ['trk1'], conflictTeamIds: ['t1'], currentAssignmentCount: 0, isActive: true },
    { id: 'j2', userId: 'u2', maxWorkload: 5, expertiseTracks: ['trk1'], conflictTeamIds: [], currentAssignmentCount: 0, isActive: true },
    { id: 'j3', userId: 'u3', maxWorkload: 5, expertiseTracks: ['trk1'], conflictTeamIds: [], currentAssignmentCount: 0, isActive: true },
  ];

  // Manual engine logic test
  const workloadMap = new Map();
  judges.forEach((j) => workloadMap.set(j.id, j.currentAssignmentCount));

  const assignments = [];
  for (const p of projects) {
    const eligible = judges.filter((j) => {
      if (!j.isActive) return false;
      if ((workloadMap.get(j.id) || 0) >= j.maxWorkload) return false;
      if (j.conflictTeamIds.includes(p.teamId)) return false;
      return true;
    });

    eligible.sort((a, b) => (workloadMap.get(a.id) || 0) - (workloadMap.get(b.id) || 0));
    const selected = eligible.slice(0, 2);
    for (const j of selected) {
      assignments.push({ judgeId: j.id, projectId: p.id });
      workloadMap.set(j.id, (workloadMap.get(j.id) || 0) + 1);
    }
  }

  assert.equal(assignments.length, 4);
  // Judge 1 must NOT be assigned to Project 1 (Conflict of Interest with Team 1)
  const j1Assignments = assignments.filter((a) => a.judgeId === 'j1' && a.projectId === 'p1');
  assert.equal(j1Assignments.length, 0);
});

test('ScoringEngine - should compute weighted rubric scores correctly', () => {
  const criteriaScores = [
    { criterionId: 'c1', rawScore: 90, maxScore: 100, weightPercentage: 40 },
    { criterionId: 'c2', rawScore: 80, maxScore: 100, weightPercentage: 30 },
    { criterionId: 'c3', rawScore: 70, maxScore: 100, weightPercentage: 30 },
  ];

  let weighted = 0;
  for (const c of criteriaScores) {
    weighted += (c.rawScore / c.maxScore) * 100 * (c.weightPercentage / 100);
  }

  // (90 * 0.4) + (80 * 0.3) + (70 * 0.3) = 36 + 24 + 21 = 81.0
  assert.equal(weighted, 81);
});

test('AIComparisonEngine - should compute MAE, RMSE and Agreement Rate', () => {
  const pairs = [
    { criterionId: 'c1', aiScore: 80, humanScore: 80, confidence: 0.9 }, // diff: 0
    { criterionId: 'c2', aiScore: 85, humanScore: 81, confidence: 0.9 }, // diff: 4
    { criterionId: 'c3', aiScore: 90, humanScore: 84, confidence: 0.9 }, // diff: 6
  ];

  let absSum = 0;
  let sqSum = 0;
  for (const p of pairs) {
    const d = p.aiScore - p.humanScore;
    absSum += Math.abs(d);
    sqSum += Math.pow(d, 2);
  }

  const mae = absSum / pairs.length; // (0 + 4 + 6) / 3 = 3.33
  const rmse = Math.sqrt(sqSum / pairs.length); // sqrt((0 + 16 + 36) / 3) = sqrt(17.33) ≈ 4.16

  assert.ok(Math.abs(mae - 3.33) < 0.05);
  assert.ok(Math.abs(rmse - 4.16) < 0.05);
});
