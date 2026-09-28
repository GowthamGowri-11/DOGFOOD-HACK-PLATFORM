/**
 * EWJE v2 — Standalone Simulator Engine & Baselines
 */

const crypto = require('crypto');

function computeMedian(arr) {
  if (!arr || arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2.0;
  }
  return sorted[mid];
}

function computeMad(residuals) {
  if (!residuals || residuals.length === 0) return { median: 0, mad: 0 };
  const med = computeMedian(residuals);
  const absDiffs = residuals.map((r) => Math.abs(r - med));
  const mad = computeMedian(absDiffs);
  return { median: med, mad };
}

// 1. Plain Average
function runPlainAverage(rubric, submissions) {
  const projectScores = new Map();
  for (const sub of submissions) {
    let subWeighted = 0;
    for (const c of rubric.criteria) {
      subWeighted += (sub.scores[c.id] || 0) * c.weight;
    }
    const list = projectScores.get(sub.projectId) || [];
    list.push(subWeighted);
    projectScores.set(sub.projectId, list);
  }

  const results = [];
  projectScores.forEach((scores, projectId) => {
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    results.push({ projectId, finalScore: avg });
  });

  results.sort((a, b) => b.finalScore - a.finalScore);
  results.forEach((p, idx) => (p.rank = idx + 1));
  return { projects: results };
}

// 2. Median
function runMedian(rubric, submissions) {
  const projectScores = new Map();
  for (const sub of submissions) {
    let subWeighted = 0;
    for (const c of rubric.criteria) {
      subWeighted += (sub.scores[c.id] || 0) * c.weight;
    }
    const list = projectScores.get(sub.projectId) || [];
    list.push(subWeighted);
    projectScores.set(sub.projectId, list);
  }

  const results = [];
  projectScores.forEach((scores, projectId) => {
    const med = computeMedian(scores);
    results.push({ projectId, finalScore: med });
  });

  results.sort((a, b) => b.finalScore - a.finalScore);
  results.forEach((p, idx) => (p.rank = idx + 1));
  return { projects: results };
}

// 3. Per-Judge Z-Score Normalization
function runZScore(rubric, submissions) {
  const judgeScores = new Map();
  for (const sub of submissions) {
    let subWeighted = 0;
    for (const c of rubric.criteria) {
      subWeighted += (sub.scores[c.id] || 0) * c.weight;
    }
    const list = judgeScores.get(sub.judgeId) || [];
    list.push(subWeighted);
    judgeScores.set(sub.judgeId, list);
  }

  const judgeStats = new Map();
  let globalSum = 0;
  let globalCount = 0;

  judgeScores.forEach((scores, judgeId) => {
    const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
    const variance = scores.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / scores.length;
    const stdDev = Math.sqrt(variance) || 1.0;
    judgeStats.set(judgeId, { mean, stdDev });
    globalSum += scores.reduce((a, b) => a + b, 0);
    globalCount += scores.length;
  });

  const globalMean = globalCount > 0 ? globalSum / globalCount : 50;

  const projectZList = new Map();
  for (const sub of submissions) {
    let subWeighted = 0;
    for (const c of rubric.criteria) {
      subWeighted += (sub.scores[c.id] || 0) * c.weight;
    }
    const stats = judgeStats.get(sub.judgeId) || { mean: globalMean, stdDev: 1.0 };
    const z = (subWeighted - stats.mean) / stats.stdDev;
    const list = projectZList.get(sub.projectId) || [];
    list.push(globalMean + z * 10.0);
    projectZList.set(sub.projectId, list);
  }

  const results = [];
  projectZList.forEach((scores, projectId) => {
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    results.push({ projectId, finalScore: avg });
  });

  results.sort((a, b) => b.finalScore - a.finalScore);
  results.forEach((p, idx) => (p.rank = idx + 1));
  return { projects: results };
}

// 4. Robust-Only (Huber IRLS with b=0)
function runRobustOnly(rubric, submissions, config = {}) {
  return runPureEwje(rubric, submissions, { ...config, calibrate: false, robust: true });
}

// 5. Calibration-Only (Ridge shrinkage with w=1)
function runCalibrationOnly(rubric, submissions, config = {}) {
  return runPureEwje(rubric, submissions, { ...config, calibrate: true, robust: false });
}

// 6. Full EWJE Engine
function runPureEwje(rubric, submissions, options = {}) {
  const iters = options.iters || 30;
  const lambda = options.lambda !== undefined ? options.lambda : 1.0;
  const huberK = options.huberK || 1.345;
  const calibrate = options.calibrate !== undefined ? options.calibrate : true;
  const robust = options.robust !== undefined ? options.robust : true;

  const scaleMin = rubric.criteria[0].scaleMin || 0;
  const scaleMax = rubric.criteria[0].scaleMax || 100;
  const scaleRange = scaleMax - scaleMin || 100;
  const scaleFloor = 0.01 * scaleRange;

  const projectSet = new Set();
  const judgeSet = new Set();
  const observations = [];

  for (const sub of submissions) {
    projectSet.add(sub.projectId);
    judgeSet.add(sub.judgeId);
    for (const c of rubric.criteria) {
      if (sub.scores[c.id] !== undefined) {
        observations.push({
          judgeId: sub.judgeId,
          projectId: sub.projectId,
          criterionId: c.id,
          y: sub.scores[c.id],
        });
      }
    }
  }

  const sortedProjects = Array.from(projectSet).sort();
  const sortedJudges = Array.from(judgeSet).sort();

  const qMap = new Map();
  const globalSum = observations.reduce((s, o) => s + o.y, 0);
  const globalMean = observations.length > 0 ? globalSum / observations.length : (scaleMin + scaleMax) / 2.0;

  for (const p of sortedProjects) {
    for (const c of rubric.criteria) {
      const key = `${p}::${c.id}`;
      const relevant = observations.filter((o) => o.projectId === p && o.criterionId === c.id);
      if (relevant.length > 0) {
        qMap.set(key, relevant.reduce((s, o) => s + o.y, 0) / relevant.length);
      } else {
        qMap.set(key, globalMean);
      }
    }
  }

  const bMap = new Map();
  for (const j of sortedJudges) {
    bMap.set(j, 0.0);
  }

  for (let iter = 1; iter <= iters; iter++) {
    const residuals = [];
    for (const obs of observations) {
      const q = qMap.get(`${obs.projectId}::${obs.criterionId}`) ?? globalMean;
      const b = bMap.get(obs.judgeId) ?? 0.0;
      residuals.push(obs.y - q - b);
    }

    let delta = scaleRange;
    if (robust && residuals.length > 0) {
      const { mad } = computeMad(residuals);
      const scale = Math.max(1.4826 * mad, scaleFloor);
      delta = huberK * scale;
    }

    const weights = [];
    for (let i = 0; i < observations.length; i++) {
      if (!robust) {
        weights.push(1.0);
      } else {
        const absR = Math.abs(residuals[i]);
        weights.push(absR <= delta ? 1.0 : delta / Math.max(1e-8, absR));
      }
    }

    // Update q[p,c]
    for (const p of sortedProjects) {
      for (const c of rubric.criteria) {
        let weightedNum = 0;
        let wSum = 0;
        for (let i = 0; i < observations.length; i++) {
          const obs = observations[i];
          if (obs.projectId === p && obs.criterionId === c.id) {
            const w = weights[i];
            const b = bMap.get(obs.judgeId) ?? 0.0;
            weightedNum += w * (obs.y - b);
            wSum += w;
          }
        }
        if (wSum > 0) {
          qMap.set(`${p}::${c.id}`, weightedNum / wSum);
        }
      }
    }

    // Update b[j] if calibrate
    if (calibrate) {
      for (const j of sortedJudges) {
        let weightedNum = 0;
        let wSum = 0;
        for (let i = 0; i < observations.length; i++) {
          const obs = observations[i];
          if (obs.judgeId === j) {
            const w = weights[i];
            const q = qMap.get(`${obs.projectId}::${obs.criterionId}`) ?? globalMean;
            weightedNum += w * (obs.y - q);
            wSum += w;
          }
        }
        bMap.set(j, weightedNum / (wSum + lambda));
      }

      // Center b and shift q
      const bVals = Array.from(bMap.values());
      const meanB = bVals.length > 0 ? bVals.reduce((a, b) => a + b, 0) / bVals.length : 0;
      for (const j of sortedJudges) {
        bMap.set(j, (bMap.get(j) || 0) - meanB);
      }
      for (const p of sortedProjects) {
        for (const c of rubric.criteria) {
          const k = `${p}::${c.id}`;
          qMap.set(k, (qMap.get(k) || globalMean) + meanB);
        }
      }
    }
  }

  const projects = [];
  for (const p of sortedProjects) {
    let finalScore = 0;
    for (const c of rubric.criteria) {
      const q = qMap.get(`${p}::${c.id}`) ?? globalMean;
      finalScore += c.weight * Math.max(scaleMin, Math.min(scaleMax, q));
    }
    projects.push({ projectId: p, finalScore });
  }

  projects.sort((a, b) => b.finalScore - a.finalScore);
  projects.forEach((p, idx) => (p.rank = idx + 1));

  const judgeOffsets = {};
  for (const j of sortedJudges) {
    judgeOffsets[j] = bMap.get(j) || 0;
  }

  return { projects, judgeOffsets };
}

module.exports = {
  runPlainAverage,
  runMedian,
  runZScore,
  runRobustOnly,
  runCalibrationOnly,
  runPureEwje,
};
