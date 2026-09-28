/**
 * EWJE v2 — Simulator Scenarios Generator
 * Generates synthetic ground truth and judge submissions under various realistic conditions.
 */

// Seeded PRNG (Mulberry32)
function createPrng(seed) {
  let s = seed >>> 0;
  return function () {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Normal distribution approximation (Box-Muller)
function normalRandom(prng, mean = 0, stdDev = 1) {
  let u = 0,
    v = 0;
  while (u === 0) u = prng();
  while (v === 0) v = prng();
  const num = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  return num * stdDev + mean;
}

const DEFAULT_RUBRIC = {
  version: '1.0.0',
  scaleMin: 0,
  scaleMax: 100,
  criteria: [
    { id: 'crit_impact', name: 'Impact', weight: 0.35, scaleMin: 0, scaleMax: 100 },
    { id: 'crit_tech', name: 'Technical Execution', weight: 0.35, scaleMin: 0, scaleMax: 100 },
    { id: 'crit_ui', name: 'Design & UX', weight: 0.30, scaleMin: 0, scaleMax: 100 },
  ],
};

function generateGroundTruth(numProjects, prng) {
  const projects = [];
  for (let i = 1; i <= numProjects; i++) {
    const id = `proj_${String(i).padStart(3, '0')}`;
    const critQuality = {};
    let trueScore = 0;
    for (const c of DEFAULT_RUBRIC.criteria) {
      // Quality centered at 70, stddev 15, bounded [20, 95]
      const q = Math.max(20, Math.min(95, normalRandom(prng, 70, 14)));
      critQuality[c.id] = q;
      trueScore += q * c.weight;
    }
    projects.push({ id, critQuality, trueScore });
  }
  // Sort projects by true score to get ground truth ranking
  projects.sort((a, b) => b.trueScore - a.trueScore);
  const groundTruthRanking = projects.map((p) => p.id);
  return { projects, groundTruthRanking };
}

function generateAssignments(numJudges, numProjects, k = 3) {
  const judges = Array.from({ length: numJudges }, (_, i) => `judge_${String(i + 1).padStart(2, '0')}`);
  const assignments = [];
  const judgeLoad = {};
  judges.forEach((j) => (judgeLoad[j] = 0));

  for (let p = 1; p <= numProjects; p++) {
    const projId = `proj_${String(p).padStart(3, '0')}`;
    // Pick k judges with lowest load
    const sortedJudges = [...judges].sort((a, b) => judgeLoad[a] - judgeLoad[b]);
    const chosen = sortedJudges.slice(0, k);
    for (const j of chosen) {
      assignments.push({ judgeId: j, projectId: projId });
      judgeLoad[j]++;
    }
  }
  return { assignments, judges };
}

/**
 * 10 Required Scenarios
 */
function createScenario(name, seed, options = {}) {
  const prng = createPrng(seed);
  const numJudges = options.numJudges || 8;
  const numProjects = options.numProjects || 25;
  const k = options.k || 3;

  const { projects, groundTruthRanking } = generateGroundTruth(numProjects, prng);
  const { assignments, judges } = generateAssignments(numJudges, numProjects, k);

  const trueBiases = {};
  judges.forEach((j) => {
    trueBiases[j] = 0;
  });

  // Base setup
  const submissions = [];
  const projMap = new Map(projects.map((p) => [p.id, p]));

  switch (name) {
    case '1_balanced_assignment': {
      // Normal variation, moderate biases
      judges.forEach((j) => {
        trueBiases[j] = normalRandom(prng, 0, 5);
      });
      for (const a of assignments) {
        const p = projMap.get(a.projectId);
        const scores = {};
        for (const c of DEFAULT_RUBRIC.criteria) {
          const noise = normalRandom(prng, 0, 3);
          const raw = p.critQuality[c.id] + trueBiases[a.judgeId] + noise;
          scores[c.id] = Math.max(0, Math.min(100, raw));
        }
        submissions.push({ judgeId: a.judgeId, projectId: a.projectId, scores });
      }
      break;
    }

    case '2_disrupted_assignment': {
      // Uneven judge coverage (some projects get 2, some get 4)
      judges.forEach((j) => {
        trueBiases[j] = normalRandom(prng, 0, 6);
      });
      for (let i = 0; i < assignments.length; i++) {
        if (i % 7 === 0) continue; // drop some assignments
        const a = assignments[i];
        const p = projMap.get(a.projectId);
        const scores = {};
        for (const c of DEFAULT_RUBRIC.criteria) {
          const noise = normalRandom(prng, 0, 3);
          const raw = p.critQuality[c.id] + trueBiases[a.judgeId] + noise;
          scores[c.id] = Math.max(0, Math.min(100, raw));
        }
        submissions.push({ judgeId: a.judgeId, projectId: a.projectId, scores });
      }
      break;
    }

    case '3_judge_dropout': {
      // One judge completely drops out mid-way
      const dropoutJudge = judges[0];
      judges.forEach((j) => {
        trueBiases[j] = normalRandom(prng, 0, 4);
      });
      for (const a of assignments) {
        if (a.judgeId === dropoutJudge) continue; // dropout
        const p = projMap.get(a.projectId);
        const scores = {};
        for (const c of DEFAULT_RUBRIC.criteria) {
          const noise = normalRandom(prng, 0, 3);
          const raw = p.critQuality[c.id] + trueBiases[a.judgeId] + noise;
          scores[c.id] = Math.max(0, Math.min(100, raw));
        }
        submissions.push({ judgeId: a.judgeId, projectId: a.projectId, scores });
      }
      break;
    }

    case '4_erratic_judge': {
      // One judge has huge random variance (high noise)
      const erraticJudge = judges[0];
      judges.forEach((j) => {
        trueBiases[j] = normalRandom(prng, 0, 4);
      });
      for (const a of assignments) {
        const p = projMap.get(a.projectId);
        const scores = {};
        const isErratic = a.judgeId === erraticJudge;
        for (const c of DEFAULT_RUBRIC.criteria) {
          const noise = normalRandom(prng, 0, isErratic ? 25 : 3);
          const raw = p.critQuality[c.id] + trueBiases[a.judgeId] + noise;
          scores[c.id] = Math.max(0, Math.min(100, raw));
        }
        submissions.push({ judgeId: a.judgeId, projectId: a.projectId, scores });
      }
      break;
    }

    case '5_scale_distortion': {
      // One judge compresses scale into [60, 70], another expands [0, 100]
      for (const a of assignments) {
        const p = projMap.get(a.projectId);
        const scores = {};
        for (const c of DEFAULT_RUBRIC.criteria) {
          let raw = p.critQuality[c.id] + normalRandom(prng, 0, 3);
          if (a.judgeId === judges[0]) {
            raw = 60 + (raw - 50) * 0.2; // compressed
          } else if (a.judgeId === judges[1]) {
            raw = 50 + (raw - 50) * 1.5; // expanded
          }
          scores[c.id] = Math.max(0, Math.min(100, raw));
        }
        submissions.push({ judgeId: a.judgeId, projectId: a.projectId, scores });
      }
      break;
    }

    case '6_ceiling_effects': {
      // Many top projects clustered near 95-100 where scores clip
      for (const a of assignments) {
        const p = projMap.get(a.projectId);
        const scores = {};
        for (const c of DEFAULT_RUBRIC.criteria) {
          const raw = p.critQuality[c.id] + 15 + normalRandom(prng, 0, 3);
          scores[c.id] = Math.max(0, Math.min(100, raw)); // strong ceiling clipping
        }
        submissions.push({ judgeId: a.judgeId, projectId: a.projectId, scores });
      }
      break;
    }

    case '7_harsh_judge': {
      // One judge gives -20 across all projects
      const harshJudge = judges[0];
      trueBiases[harshJudge] = -20;
      for (const a of assignments) {
        const p = projMap.get(a.projectId);
        const scores = {};
        const bias = a.judgeId === harshJudge ? -20 : normalRandom(prng, 0, 3);
        for (const c of DEFAULT_RUBRIC.criteria) {
          const noise = normalRandom(prng, 0, 3);
          const raw = p.critQuality[c.id] + bias + noise;
          scores[c.id] = Math.max(0, Math.min(100, raw));
        }
        submissions.push({ judgeId: a.judgeId, projectId: a.projectId, scores });
      }
      break;
    }

    case '8_generous_judge': {
      // One judge gives +20 across all projects
      const genJudge = judges[0];
      trueBiases[genJudge] = 20;
      for (const a of assignments) {
        const p = projMap.get(a.projectId);
        const scores = {};
        const bias = a.judgeId === genJudge ? 20 : normalRandom(prng, 0, 3);
        for (const c of DEFAULT_RUBRIC.criteria) {
          const noise = normalRandom(prng, 0, 3);
          const raw = p.critQuality[c.id] + bias + noise;
          scores[c.id] = Math.max(0, Math.min(100, raw));
        }
        submissions.push({ judgeId: a.judgeId, projectId: a.projectId, scores });
      }
      break;
    }

    case '9_missing_scores': {
      // Some criterion scores are omitted (incomplete submissions)
      for (let i = 0; i < assignments.length; i++) {
        const a = assignments[i];
        const p = projMap.get(a.projectId);
        const scores = {};
        for (let cIdx = 0; cIdx < DEFAULT_RUBRIC.criteria.length; cIdx++) {
          const c = DEFAULT_RUBRIC.criteria[cIdx];
          if (i % 5 === 0 && cIdx === 2) {
            // Incomplete: omit design score
            continue;
          }
          const raw = p.critQuality[c.id] + normalRandom(prng, 0, 3);
          scores[c.id] = Math.max(0, Math.min(100, raw));
        }
        submissions.push({ judgeId: a.judgeId, projectId: a.projectId, scores });
      }
      break;
    }

    case '10_criterion_specific_behavior': {
      // One judge is exceptionally tough on UI/UX (-25) but normal on impact and tech
      const critJudge = judges[0];
      for (const a of assignments) {
        const p = projMap.get(a.projectId);
        const scores = {};
        for (const c of DEFAULT_RUBRIC.criteria) {
          let bias = 0;
          if (a.judgeId === critJudge && c.id === 'crit_ui') {
            bias = -25;
          }
          const raw = p.critQuality[c.id] + bias + normalRandom(prng, 0, 3);
          scores[c.id] = Math.max(0, Math.min(100, raw));
        }
        submissions.push({ judgeId: a.judgeId, projectId: a.projectId, scores });
      }
      break;
    }

    default:
      throw new Error(`Unknown scenario name: ${name}`);
  }

  // Filter out incomplete submissions according to EWJE rule (complete submissions only)
  const completeSubmissions = submissions.filter((s) => {
    return DEFAULT_RUBRIC.criteria.every((c) => s.scores[c.id] !== undefined);
  });

  return {
    name,
    seed,
    rubric: DEFAULT_RUBRIC,
    projects,
    groundTruthRanking,
    submissions: completeSubmissions,
    rawSubmissions: submissions,
    trueBiases,
  };
}

module.exports = {
  createScenario,
  DEFAULT_RUBRIC,
};
