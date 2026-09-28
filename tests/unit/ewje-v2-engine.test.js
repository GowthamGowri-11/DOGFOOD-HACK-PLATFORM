const { describe, it } = require('node:test');
const assert = require('node:assert');

const {
  runPlainAverage,
  runMedian,
  runZScore,
  runRobustOnly,
  runCalibrationOnly,
  runPureEwje,
} = require('../../sim/engine');

const DEFAULT_RUBRIC = {
  version: '1.0.0',
  scaleMin: 0,
  scaleMax: 100,
  criteria: [
    { id: 'crit_impact', name: 'Impact', weight: 0.5, scaleMin: 0, scaleMax: 100 },
    { id: 'crit_tech', name: 'Tech', weight: 0.5, scaleMin: 0, scaleMax: 100 },
  ],
};

describe('EWJE v2 Engine Property Tests', () => {
  it('Property 1: Determinism — Identical input yields identical output', () => {
    const submissions = [
      { judgeId: 'J1', projectId: 'P1', scores: { crit_impact: 80, crit_tech: 85 } },
      { judgeId: 'J2', projectId: 'P1', scores: { crit_impact: 75, crit_tech: 70 } },
      { judgeId: 'J1', projectId: 'P2', scores: { crit_impact: 90, crit_tech: 92 } },
      { judgeId: 'J2', projectId: 'P2', scores: { crit_impact: 88, crit_tech: 86 } },
    ];

    const out1 = runPureEwje(DEFAULT_RUBRIC, submissions);
    const out2 = runPureEwje(DEFAULT_RUBRIC, submissions);

    assert.deepStrictEqual(out1, out2);
  });

  it('Property 2: Input Row Order Invariance — Shuffled input produces identical output', () => {
    const submissions1 = [
      { judgeId: 'J1', projectId: 'P1', scores: { crit_impact: 80, crit_tech: 85 } },
      { judgeId: 'J2', projectId: 'P1', scores: { crit_impact: 75, crit_tech: 70 } },
      { judgeId: 'J1', projectId: 'P2', scores: { crit_impact: 90, crit_tech: 92 } },
      { judgeId: 'J2', projectId: 'P2', scores: { crit_impact: 88, crit_tech: 86 } },
    ];

    const submissions2 = [
      { judgeId: 'J2', projectId: 'P2', scores: { crit_impact: 88, crit_tech: 86 } },
      { judgeId: 'J1', projectId: 'P1', scores: { crit_impact: 80, crit_tech: 85 } },
      { judgeId: 'J2', projectId: 'P1', scores: { crit_impact: 75, crit_tech: 70 } },
      { judgeId: 'J1', projectId: 'P2', scores: { crit_impact: 90, crit_tech: 92 } },
    ];

    const out1 = runPureEwje(DEFAULT_RUBRIC, submissions1);
    const out2 = runPureEwje(DEFAULT_RUBRIC, submissions2);

    assert.strictEqual(out1.projects.length, out2.projects.length);
    for (let i = 0; i < out1.projects.length; i++) {
      assert.strictEqual(out1.projects[i].projectId, out2.projects[i].projectId);
      assert.strictEqual(out1.projects[i].finalScore.toFixed(6), out2.projects[i].finalScore.toFixed(6));
    }
  });

  it('Property 3: Known Answer Robust Huber Test — Downweights outlier [90, 91, 60]', () => {
    // 3 judges evaluate project P1 on single criterion
    const singleRubric = {
      version: '1.0.0',
      scaleMin: 0,
      scaleMax: 100,
      criteria: [{ id: 'crit_main', name: 'Main', weight: 1.0, scaleMin: 0, scaleMax: 100 }],
    };

    const submissions = [
      { judgeId: 'J1', projectId: 'P1', scores: { crit_main: 90 } },
      { judgeId: 'J2', projectId: 'P1', scores: { crit_main: 91 } },
      { judgeId: 'J3', projectId: 'P1', scores: { crit_main: 60 } },
    ];

    // Plain average would be (90+91+60)/3 = 80.33
    const avgOut = runPlainAverage(singleRubric, submissions);
    assert.strictEqual(avgOut.projects[0].finalScore.toFixed(2), '80.33');

    // Robust EWJE dampens the outlier (60) influence weight so score is significantly closer to ~89-90
    const ewjeOut = runPureEwje(singleRubric, submissions, { calibrate: false, robust: true });
    assert.ok(
      ewjeOut.projects[0].finalScore > 84.0,
      `Robust EWJE expected final score > 84, got ${ewjeOut.projects[0].finalScore}`
    );
  });

  it('Property 4: Judge Removal Resilience — Engine runs smoothly when a judge drops out', () => {
    const submissions = [
      { judgeId: 'J1', projectId: 'P1', scores: { crit_impact: 80, crit_tech: 85 } },
      { judgeId: 'J2', projectId: 'P1', scores: { crit_impact: 75, crit_tech: 70 } },
      { judgeId: 'J3', projectId: 'P1', scores: { crit_impact: 85, crit_tech: 80 } },
    ];

    // Remove J3
    const remaining = submissions.filter((s) => s.judgeId !== 'J3');
    const out = runPureEwje(DEFAULT_RUBRIC, remaining);
    assert.strictEqual(out.projects.length, 1);
    assert.ok(out.projects[0].finalScore > 0);
  });
});
