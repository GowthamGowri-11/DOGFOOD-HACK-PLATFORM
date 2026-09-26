const { test, describe } = require('node:test');
const assert = require('node:assert');

// 1. Assignment Engine Implementation for Test Verification
class AssignmentEngine {
  static distribute(projects, judges, options = {}) {
    const K = options.judgesPerProject || 2;
    const assignments = [];
    const workloadMap = new Map();
    judges.forEach((j) => workloadMap.set(j.id, j.currentAssignmentCount || 0));

    for (const project of projects) {
      const eligible = judges.filter((judge) => {
        if (!judge.isActive) return false;
        const currentCount = workloadMap.get(judge.id) || 0;
        if (currentCount >= judge.maxWorkload) return false;
        if (judge.conflictTeamIds && judge.conflictTeamIds.includes(project.teamId)) return false;
        return true;
      });

      eligible.sort((a, b) => {
        const aTrackMatch = (a.expertiseTracks || []).includes(project.trackId) ? 1 : 0;
        const bTrackMatch = (b.expertiseTracks || []).includes(project.trackId) ? 1 : 0;

        if (options.prioritizeTrackExpertise && aTrackMatch !== bTrackMatch) {
          return bTrackMatch - aTrackMatch;
        }

        const aLoad = workloadMap.get(a.id) || 0;
        const bLoad = workloadMap.get(b.id) || 0;
        return aLoad - bLoad;
      });

      const selected = eligible.slice(0, K);
      for (const judge of selected) {
        assignments.push({
          judgeId: judge.id,
          projectId: project.id,
        });
        const prev = workloadMap.get(judge.id) || 0;
        workloadMap.set(judge.id, prev + 1);
      }
    }

    return assignments;
  }
}

// 2. Scoring Engine Implementation
class ScoringEngine {
  static validateRubric(criteria) {
    const errors = [];
    if (!criteria || criteria.length === 0) {
      errors.push('Rubric must contain at least one criterion.');
      return { isValid: false, totalWeight: 0, errors };
    }

    let totalWeight = 0;
    for (let i = 0; i < criteria.length; i++) {
      const c = criteria[i];
      const name = c.title || `Criterion #${i + 1}`;
      if (typeof c.weightPercentage !== 'number' || isNaN(c.weightPercentage)) {
        errors.push(`${name}: Weight percentage must be a valid number.`);
      } else if (c.weightPercentage <= 0) {
        errors.push(`${name}: Weight percentage must be greater than 0%.`);
      } else {
        totalWeight += c.weightPercentage;
      }

      if (c.maxScore !== undefined && (typeof c.maxScore !== 'number' || c.maxScore <= 0)) {
        errors.push(`${name}: Maximum score must be greater than 0.`);
      }
    }

    const roundedTotal = Number(totalWeight.toFixed(2));
    if (Math.abs(roundedTotal - 100) > 0.01) {
      errors.push(`Total criteria weight must equal 100%. Current sum: ${roundedTotal}%.`);
    }

    return {
      isValid: errors.length === 0,
      totalWeight: roundedTotal,
      errors,
    };
  }

  static calculateEvaluationScore(scores) {
    let rawScoreSum = 0;
    let weightedScore = 0;
    let totalWeight = 0;
    const contributions = [];

    for (const item of scores) {
      if (item.rawScore < 0) {
        throw new Error(`Invalid score ${item.rawScore}: scores cannot be negative.`);
      }
      if (item.maxScore > 0 && item.rawScore > item.maxScore) {
        throw new Error(`Invalid score ${item.rawScore}: score cannot exceed maximum allowed of ${item.maxScore}.`);
      }

      rawScoreSum += item.rawScore;
      totalWeight += item.weightPercentage;

      const normalizedCriterionScore = item.maxScore > 0 ? (item.rawScore / item.maxScore) * 100 : 0;
      const contribution = normalizedCriterionScore * (item.weightPercentage / 100);
      weightedScore += contribution;

      contributions.push({
        criterionId: item.criterionId,
        rawScore: item.rawScore,
        maxScore: item.maxScore,
        weightPercentage: item.weightPercentage,
        weightedContribution: Number(contribution.toFixed(2)),
      });
    }

    if (totalWeight > 0 && Math.abs(totalWeight - 100) > 0.01) {
      weightedScore = (weightedScore / totalWeight) * 100;
    }

    return {
      rawScoreSum: Number(rawScoreSum.toFixed(2)),
      weightedScore: Number(weightedScore.toFixed(2)),
      criterionContributions: contributions,
    };
  }

  static aggregateProjectScores(evaluationScores) {
    if (evaluationScores.length === 0) return 0;
    const sum = evaluationScores.reduce((acc, curr) => acc + curr, 0);
    return Number((sum / evaluationScores.length).toFixed(2));
  }
}

// 3. Normalization Engine Implementation
class NormalizationEngine {
  static computeZScoreNormalization(records) {
    if (records.length === 0) return [];

    const judgeScores = new Map();
    records.forEach((r) => {
      const list = judgeScores.get(r.judgeId) || [];
      list.push(r.weightedScore);
      judgeScores.set(r.judgeId, list);
    });

    const judgeStats = new Map();
    let globalSum = 0;
    records.forEach((r) => (globalSum += r.weightedScore));
    const globalMean = globalSum / records.length;

    let globalVarianceSum = 0;
    records.forEach((r) => (globalVarianceSum += Math.pow(r.weightedScore - globalMean, 2)));
    const globalStdDev = Math.sqrt(globalVarianceSum / records.length) || 1.0;

    judgeScores.forEach((scores, judgeId) => {
      const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
      const variance = scores.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / scores.length;
      const stdDev = Math.sqrt(variance) || 1.0;
      judgeStats.set(judgeId, { mean, stdDev });
    });

    const projectZScores = new Map();
    records.forEach((r) => {
      const stats = judgeStats.get(r.judgeId) || { mean: globalMean, stdDev: globalStdDev };
      const zScore = (r.weightedScore - stats.mean) / stats.stdDev;

      const curr = projectZScores.get(r.projectId) || { rawScores: [], zScores: [] };
      curr.rawScores.push(r.weightedScore);
      curr.zScores.push(zScore);
      projectZScores.set(r.projectId, curr);
    });

    const results = [];
    projectZScores.forEach((data, projectId) => {
      const rawAvg = data.rawScores.reduce((a, b) => a + b, 0) / data.rawScores.length;
      const meanZ = data.zScores.reduce((a, b) => a + b, 0) / data.zScores.length;

      const scaledNormalized = globalMean + meanZ * globalStdDev;
      const boundedScore = Math.max(0, Math.min(100, scaledNormalized));

      results.push({
        projectId,
        rawAverage: Number(rawAvg.toFixed(2)),
        normalizedScore: Number(boundedScore.toFixed(2)),
        finalScore: Number(boundedScore.toFixed(2)),
      });
    });

    return results;
  }

  static computeMinMaxNormalization(records) {
    if (records.length === 0) return [];
    const projectScores = new Map();
    records.forEach((r) => {
      const list = projectScores.get(r.projectId) || [];
      list.push(r.weightedScore);
      projectScores.set(r.projectId, list);
    });

    const rawAverages = [];
    projectScores.forEach((scores, projectId) => {
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
      rawAverages.push({ projectId, avg });
    });

    const min = Math.min(...rawAverages.map((p) => p.avg));
    const max = Math.max(...rawAverages.map((p) => p.avg));
    const range = max - min || 1;

    return rawAverages.map((p) => {
      const normalized = ((p.avg - min) / range) * 100;
      return {
        projectId: p.projectId,
        rawAverage: Number(p.avg.toFixed(2)),
        normalizedScore: Number(normalized.toFixed(2)),
        finalScore: Number(normalized.toFixed(2)),
      };
    });
  }
}

// 4. Result Engine Implementation
class ResultEngine {
  static computeRankings(projects, prizes = []) {
    const sorted = [...projects].sort((a, b) => {
      if (b.finalScore !== a.finalScore) {
        return b.finalScore - a.finalScore;
      }
      return b.rawAverage - a.rawAverage;
    });

    const prizeMap = new Map();
    prizes.forEach((p) => prizeMap.set(p.rankOrder, p.title));

    return sorted.map((p, index) => {
      const rank = index + 1;
      const awardCategory = prizeMap.get(rank);
      const isWinner = rank <= Math.max(prizes.length, 3);

      return {
        projectId: p.projectId,
        rank,
        finalScore: p.finalScore,
        rawAverageScore: p.rawAverage,
        normalizedScore: p.normalizedScore,
        awardCategory,
        isWinner,
      };
    });
  }
}

// 5. AI Comparison Engine Implementation
class AIComparisonEngine {
  static calculateMetrics(pairs) {
    if (pairs.length === 0) {
      return {
        mae: 0,
        rmse: 0,
        correlation: 1.0,
        agreementRate: 100,
        totalComparisons: 0,
      };
    }

    let absErrorSum = 0;
    let squaredErrorSum = 0;
    let agreementCount = 0;
    let sumAI = 0;
    let sumHuman = 0;

    for (const p of pairs) {
      const diff = p.aiScore - p.humanScore;
      const absError = Math.abs(diff);
      absErrorSum += absError;
      squaredErrorSum += Math.pow(diff, 2);

      sumAI += p.aiScore;
      sumHuman += p.humanScore;

      if (absError <= 10) {
        agreementCount++;
      }
    }

    const N = pairs.length;
    const mae = Number((absErrorSum / N).toFixed(2));
    const rmse = Number(Math.sqrt(squaredErrorSum / N).toFixed(2));
    const agreementRate = Number(((agreementCount / N) * 100).toFixed(1));

    const meanAI = sumAI / N;
    const meanHuman = sumHuman / N;

    let numerator = 0;
    let denomAI = 0;
    let denomHuman = 0;

    for (const p of pairs) {
      const diffAI = p.aiScore - meanAI;
      const diffHuman = p.humanScore - meanHuman;
      numerator += diffAI * diffHuman;
      denomAI += Math.pow(diffAI, 2);
      denomHuman += Math.pow(diffHuman, 2);
    }

    const denominator = Math.sqrt(denomAI * denomHuman);
    const correlation = denominator > 0 ? Number((numerator / denominator).toFixed(3)) : 1.0;

    return {
      mae,
      rmse,
      correlation,
      agreementRate,
      totalComparisons: N,
    };
  }
}

// ================================================================
// TESTS SUITE
// ================================================================

describe('Assignment Engine & COI Filtering', () => {
  const judges = [
    { id: 'j1', userId: 'u1', maxWorkload: 10, expertiseTracks: ['track-ai'], conflictTeamIds: ['team-1'], currentAssignmentCount: 0, isActive: true },
    { id: 'j2', userId: 'u2', maxWorkload: 10, expertiseTracks: ['track-web'], conflictTeamIds: [], currentAssignmentCount: 0, isActive: true },
    { id: 'j3', userId: 'u3', maxWorkload: 10, expertiseTracks: ['track-ai'], conflictTeamIds: [], currentAssignmentCount: 0, isActive: true },
    { id: 'j4_inactive', userId: 'u4', maxWorkload: 10, expertiseTracks: ['track-ai'], conflictTeamIds: [], currentAssignmentCount: 0, isActive: false },
  ];

  const projects = [
    { id: 'p1', teamId: 'team-1', trackId: 'track-ai', hackathonId: 'hack-1' },
    { id: 'p2', teamId: 'team-2', trackId: 'track-ai', hackathonId: 'hack-1' },
    { id: 'p3', teamId: 'team-3', trackId: 'track-web', hackathonId: 'hack-1' },
  ];

  test('Assignment Engine - excludes judge with COI on project team', () => {
    const assignments = AssignmentEngine.distribute([projects[0]], judges, { judgesPerProject: 2 });
    const assignedJudgeIds = assignments.map((a) => a.judgeId);
    assert.strictEqual(assignedJudgeIds.includes('j1'), false, 'Judge 1 must NOT be assigned to team-1 project due to COI');
    assert.strictEqual(assignedJudgeIds.includes('j4_inactive'), false, 'Inactive judge must NOT be assigned');
    assert.strictEqual(assignments.length, 2, 'Project should receive 2 eligible judges');
  });

  test('Assignment Engine - balances workload across multiple projects', () => {
    const assignments = AssignmentEngine.distribute(projects, judges, { judgesPerProject: 2 });
    assert.strictEqual(assignments.length, 6, 'Total 3 projects * 2 judges = 6 assignments');

    const counts = {};
    assignments.forEach((a) => {
      counts[a.judgeId] = (counts[a.judgeId] || 0) + 1;
    });

    // Verify all active judges share load without exceeding limits
    assert.strictEqual(counts['j4_inactive'], undefined);
    assert.ok(counts['j2'] >= 1 && counts['j2'] <= 3);
    assert.ok(counts['j3'] >= 1 && counts['j3'] <= 3);
  });

  test('Assignment Engine - prioritizes track expertise when configured', () => {
    const aiProject = [{ id: 'p_ai', teamId: 'team-99', trackId: 'track-ai', hackathonId: 'hack-1' }];
    const assignments = AssignmentEngine.distribute(aiProject, judges, {
      judgesPerProject: 2,
      prioritizeTrackExpertise: true,
    });
    const assignedJudges = assignments.map((a) => a.judgeId);
    // j1 and j3 have 'track-ai' expertise
    assert.ok(assignedJudges.includes('j1') && assignedJudges.includes('j3'));
  });
});

describe('Rubric Validation & Scoring Engine', () => {
  const validCriteria = [
    { title: 'Technical Execution', weightPercentage: 40, maxScore: 100 },
    { title: 'Innovation & Novelty', weightPercentage: 30, maxScore: 100 },
    { title: 'UI/UX Design', weightPercentage: 20, maxScore: 50 },
    { title: 'Impact & Feasibility', weightPercentage: 10, maxScore: 10 },
  ];

  test('Rubric Validation - accepts valid 100% total weight criteria', () => {
    const result = ScoringEngine.validateRubric(validCriteria);
    assert.strictEqual(result.isValid, true);
    assert.strictEqual(result.totalWeight, 100);
    assert.strictEqual(result.errors.length, 0);
  });

  test('Rubric Validation - rejects invalid weight sum (!= 100%)', () => {
    const invalid = [
      { title: 'A', weightPercentage: 50, maxScore: 100 },
      { title: 'B', weightPercentage: 40, maxScore: 100 },
    ];
    const result = ScoringEngine.validateRubric(invalid);
    assert.strictEqual(result.isValid, false);
    assert.strictEqual(result.totalWeight, 90);
    assert.ok(result.errors[0].includes('Total criteria weight must equal 100%'));
  });

  test('Rubric Validation - rejects negative weights or empty criteria', () => {
    const emptyResult = ScoringEngine.validateRubric([]);
    assert.strictEqual(emptyResult.isValid, false);

    const negativeWeight = [{ title: 'A', weightPercentage: -20, maxScore: 100 }];
    const negResult = ScoringEngine.validateRubric(negativeWeight);
    assert.strictEqual(negResult.isValid, false);
  });

  test('Scoring Engine - computes multi-criteria weighted score accurately', () => {
    const scores = [
      { criterionId: 'c1', rawScore: 80, maxScore: 100, weightPercentage: 40 }, // 80% * 40 = 32
      { criterionId: 'c2', rawScore: 90, maxScore: 100, weightPercentage: 30 }, // 90% * 30 = 27
      { criterionId: 'c3', rawScore: 40, maxScore: 50, weightPercentage: 20 },  // 80% * 20 = 16
      { criterionId: 'c4', rawScore: 10, maxScore: 10, weightPercentage: 10 },  // 100% * 10 = 10
    ];

    const result = ScoringEngine.calculateEvaluationScore(scores);
    assert.strictEqual(result.rawScoreSum, 220);
    assert.strictEqual(result.weightedScore, 85); // 32 + 27 + 16 + 10 = 85
    assert.strictEqual(result.criterionContributions.length, 4);
    assert.strictEqual(result.criterionContributions[0].weightedContribution, 32);
  });

  test('Scoring Engine - rejects score out of bounds (< 0 or > maxScore)', () => {
    assert.throws(() => {
      ScoringEngine.calculateEvaluationScore([
        { criterionId: 'c1', rawScore: -5, maxScore: 100, weightPercentage: 100 },
      ]);
    }, /cannot be negative/);

    assert.throws(() => {
      ScoringEngine.calculateEvaluationScore([
        { criterionId: 'c1', rawScore: 105, maxScore: 100, weightPercentage: 100 },
      ]);
    }, /cannot exceed maximum/);
  });
});

describe('Score Normalization & Result Rankings', () => {
  const evalRecords = [
    { judgeId: 'j_strict', projectId: 'p1', weightedScore: 70 },
    { judgeId: 'j_strict', projectId: 'p2', weightedScore: 80 },
    { judgeId: 'j_lenient', projectId: 'p1', weightedScore: 90 },
    { judgeId: 'j_lenient', projectId: 'p2', weightedScore: 100 },
  ];

  test('Normalization Engine - computes deterministic Z-score without NaN or Infinity', () => {
    const normalized = NormalizationEngine.computeZScoreNormalization(evalRecords);
    assert.strictEqual(normalized.length, 2);

    normalized.forEach((n) => {
      assert.ok(!isNaN(n.normalizedScore), 'Score must not be NaN');
      assert.ok(isFinite(n.normalizedScore), 'Score must be finite');
      assert.ok(n.normalizedScore >= 0 && n.normalizedScore <= 100, 'Score must be bounded in [0, 100]');
    });

    // p2 scored higher by both judges
    const p1 = normalized.find((n) => n.projectId === 'p1');
    const p2 = normalized.find((n) => n.projectId === 'p2');
    assert.ok(p2.finalScore > p1.finalScore);
  });

  test('Normalization Engine - handles zero variance / single score safely', () => {
    const singleRecords = [
      { judgeId: 'j1', projectId: 'p1', weightedScore: 85 },
      { judgeId: 'j1', projectId: 'p2', weightedScore: 85 },
    ];
    const normalized = NormalizationEngine.computeZScoreNormalization(singleRecords);
    assert.strictEqual(normalized.length, 2);
    assert.strictEqual(normalized[0].finalScore, 85);
    assert.strictEqual(normalized[1].finalScore, 85);
  });

  test('Result Engine - computes ranked leaderboard and awards prize winners', () => {
    const projects = [
      { projectId: 'p1', finalScore: 88.5, rawAverage: 88.0, normalizedScore: 88.5 },
      { projectId: 'p2', finalScore: 94.2, rawAverage: 93.5, normalizedScore: 94.2 },
      { projectId: 'p3', finalScore: 76.0, rawAverage: 75.0, normalizedScore: 76.0 },
    ];

    const prizes = [
      { title: 'Grand Champion ($10,000)', rankOrder: 1 },
      { title: 'Runner Up ($5,000)', rankOrder: 2 },
      { title: '3rd Place ($2,500)', rankOrder: 3 },
    ];

    const rankings = ResultEngine.computeRankings(projects, prizes);
    assert.strictEqual(rankings[0].projectId, 'p2');
    assert.strictEqual(rankings[0].rank, 1);
    assert.strictEqual(rankings[0].awardCategory, 'Grand Champion ($10,000)');
    assert.strictEqual(rankings[0].isWinner, true);

    assert.strictEqual(rankings[1].projectId, 'p1');
    assert.strictEqual(rankings[1].rank, 2);
    assert.strictEqual(rankings[1].awardCategory, 'Runner Up ($5,000)');

    assert.strictEqual(rankings[2].projectId, 'p3');
    assert.strictEqual(rankings[2].rank, 3);
  });
});

describe('AI Comparison Engine (MAE, RMSE, Agreement Rate)', () => {
  test('AIComparisonEngine - calculates exact statistical alignment metrics', () => {
    const pairs = [
      { criterionId: 'c1', aiScore: 85, humanScore: 80, confidence: 0.9 }, // diff = 5, sq = 25
      { criterionId: 'c2', aiScore: 90, humanScore: 92, confidence: 0.95 }, // diff = 2, sq = 4
      { criterionId: 'c3', aiScore: 70, humanScore: 75, confidence: 0.8 }, // diff = 5, sq = 25
      { criterionId: 'c4', aiScore: 60, humanScore: 85, confidence: 0.7 }, // diff = 25, sq = 625 (disagreement > 10)
    ];

    const metrics = AIComparisonEngine.calculateMetrics(pairs);

    // Expected MAE: (5 + 2 + 5 + 25) / 4 = 37 / 4 = 9.25
    assert.strictEqual(metrics.mae, 9.25);

    // Expected RMSE: sqrt((25 + 4 + 25 + 625) / 4) = sqrt(679 / 4) = sqrt(169.75) = 13.03
    assert.strictEqual(metrics.rmse, 13.03);

    // Expected Agreement Rate: 3 out of 4 <= 10 points = 75%
    assert.strictEqual(metrics.agreementRate, 75.0);
    assert.strictEqual(metrics.totalComparisons, 4);
  });

  test('AIComparisonEngine - handles empty comparison list safely', () => {
    const empty = AIComparisonEngine.calculateMetrics([]);
    assert.strictEqual(empty.totalComparisons, 0);
    assert.strictEqual(empty.mae, 0);
    assert.strictEqual(empty.rmse, 0);
    assert.strictEqual(empty.agreementRate, 100);
  });
});
