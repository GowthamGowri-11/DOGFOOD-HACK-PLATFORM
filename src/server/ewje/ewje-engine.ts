/**
 * EWJE v2 — Pure Mathematical Engine
 * Evidence-Weighted Judging Engine v2
 * 
 * Invariant: Pure function with NO database, network, or unseeded randomness.
 * Model: y[j,p,c] = q[p,c] + b[j] + epsilon
 */

import {
  EwjeRubric,
  CompleteJudgeSubmission,
  EwjeConfig,
  EwjeOutput,
  ProjectQualityResult,
  JudgeOffsetResult,
  CalculationMode,
} from './ewje-types';
import { EWJE_V2_DEFAULTS, GENESIS_HASH_EWJE_V2 } from './ewje-config';
import { createHash } from 'crypto';

export interface ScoreObservation {
  judgeId: string;
  projectId: string;
  criterionId: string;
  y: number;
}

/**
 * Deterministic median calculation
 */
export function computeMedian(arr: number[]): number {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2.0;
  }
  return sorted[mid];
}

/**
 * Deterministic Median Absolute Deviation (MAD)
 */
export function computeMad(residuals: number[]): { median: number; mad: number } {
  if (residuals.length === 0) return { median: 0, mad: 0 };
  const med = computeMedian(residuals);
  const absDiffs = residuals.map((r) => Math.abs(r - med));
  const mad = computeMedian(absDiffs);
  return { median: med, mad };
}

/**
 * Deterministic JSON Canonicalizer
 */
export function canonicalJson(obj: any): string {
  if (obj === null || typeof obj !== 'object') {
    return JSON.stringify(obj);
  }
  if (Array.isArray(obj)) {
    return '[' + obj.map(canonicalJson).join(',') + ']';
  }
  const keys = Object.keys(obj).sort();
  return '{' + keys.map((k) => JSON.stringify(k) + ':' + canonicalJson(obj[k])).join(',') + '}';
}

/**
 * Pure EWJE Engine Execution
 */
export function runEwje(
  rubric: EwjeRubric,
  submissions: CompleteJudgeSubmission[],
  config: EwjeConfig = EWJE_V2_DEFAULTS,
  forcedMode?: CalculationMode
): EwjeOutput {
  // 1. Validate rubric
  if (!rubric.criteria || rubric.criteria.length === 0) {
    throw new Error('[EWJE] Rubric must contain at least one criterion.');
  }

  const rubricWeightSum = rubric.criteria.reduce((s, c) => s + c.weight, 0);
  if (Math.abs(rubricWeightSum - 1.0) > 0.001) {
    throw new Error(`[EWJE] Rubric weights must sum to 1.0 (found ${rubricWeightSum.toFixed(4)})`);
  }

  const scaleMin = rubric.criteria[0].scaleMin ?? 0;
  const scaleMax = rubric.criteria[0].scaleMax ?? 100;
  const scaleRange = Math.max(1, scaleMax - scaleMin);
  const scaleFloor = config.scaleFloorFactor * scaleRange;
  const offsetCap = config.offsetCapFactor * scaleRange;

  // 2. Extract Complete Observations & Sort for Determinism
  const requiredCriteriaIds = new Set(rubric.criteria.map((c) => c.id));
  const completeSubmissions: CompleteJudgeSubmission[] = [];
  let excludedIncompleteCount = 0;

  for (const sub of submissions) {
    const scoredIds = Object.keys(sub.scores);
    const hasAll = Array.from(requiredCriteriaIds).every((id) => scoredIds.includes(id) && typeof sub.scores[id] === 'number');
    if (hasAll) {
      completeSubmissions.push(sub);
    } else {
      excludedIncompleteCount++;
    }
  }

  // Sort submissions deterministically by project then judge
  completeSubmissions.sort((a, b) => {
    if (a.projectId !== b.projectId) return a.projectId.localeCompare(b.projectId);
    return a.judgeId.localeCompare(b.judgeId);
  });

  const observations: ScoreObservation[] = [];
  const projectSet = new Set<string>();
  const judgeSet = new Set<string>();
  const judgeSubCount = new Map<string, number>();
  const projectSubCount = new Map<string, number>();

  for (const sub of completeSubmissions) {
    projectSet.add(sub.projectId);
    judgeSet.add(sub.judgeId);
    judgeSubCount.set(sub.judgeId, (judgeSubCount.get(sub.judgeId) || 0) + 1);
    projectSubCount.set(sub.projectId, (projectSubCount.get(sub.projectId) || 0) + 1);

    for (const c of rubric.criteria) {
      observations.push({
        judgeId: sub.judgeId,
        projectId: sub.projectId,
        criterionId: c.id,
        y: sub.scores[c.id],
      });
    }
  }

  const sortedProjects = Array.from(projectSet).sort();
  const sortedJudges = Array.from(judgeSet).sort();

  // 3. Determine Calculation Mode
  let calculationMode: CalculationMode = 'ROBUST_ONLY';
  let modeReason = 'Default fallback';

  if (forcedMode) {
    calculationMode = forcedMode;
    modeReason = `Forced by caller (${forcedMode})`;
  } else {
    // Check eligibility for CALIBRATED_ROBUST:
    // Every judge must have at least minJudgeProjects complete submissions
    const allJudgesMeetMin = sortedJudges.length > 0 && sortedJudges.every((jId) => (judgeSubCount.get(jId) || 0) >= config.minJudgeProjects);
    
    // Check graph connectivity
    const isConnected = checkBipartiteConnectivity(sortedJudges, sortedProjects, completeSubmissions);

    if (allJudgesMeetMin && isConnected) {
      calculationMode = 'CALIBRATED_ROBUST';
      modeReason = `Connected judge graph with all judges >= ${config.minJudgeProjects} evaluations`;
    } else if (!allJudgesMeetMin) {
      calculationMode = 'ROBUST_ONLY';
      modeReason = `One or more judges has < ${config.minJudgeProjects} evaluations (calibration disabled)`;
    } else {
      calculationMode = 'ROBUST_ONLY';
      modeReason = 'Judge-project bipartite graph is disconnected';
    }
  }

  const calibrate = calculationMode === 'CALIBRATED_ROBUST';

  // 4. Initialization
  // Initialize q[p,c] to simple mean of observed scores for that (p,c)
  const qMap = new Map<string, number>(); // key: `${p}::${c}`
  const globalSum = observations.reduce((s, o) => s + o.y, 0);
  const globalMean = observations.length > 0 ? globalSum / observations.length : (scaleMin + scaleMax) / 2.0;

  for (const p of sortedProjects) {
    for (const c of rubric.criteria) {
      const key = `${p}::${c.id}`;
      const relevant = observations.filter((o) => o.projectId === p && o.criterionId === c.id);
      if (relevant.length > 0) {
        const mean = relevant.reduce((s, o) => s + o.y, 0) / relevant.length;
        qMap.set(key, mean);
      } else {
        qMap.set(key, globalMean);
      }
    }
  }

  // Initialize b[j] = 0
  const bMap = new Map<string, number>();
  for (const j of sortedJudges) {
    bMap.set(j, 0.0);
  }

  let finalScaleEstimate = scaleFloor;

  // 5. Fixed-Iteration IRLS Fit (Default 30 iterations)
  for (let iter = 1; iter <= config.iters; iter++) {
    // A. Compute Residuals: r = y - q[p,c] - b[j]
    const residuals: number[] = [];
    const obsResiduals: number[] = [];

    for (const obs of observations) {
      const qVal = qMap.get(`${obs.projectId}::${obs.criterionId}`) ?? globalMean;
      const bVal = bMap.get(obs.judgeId) ?? 0.0;
      const r = obs.y - qVal - bVal;
      obsResiduals.push(r);
      residuals.push(r);
    }

    // B. Robust Scale via MAD
    let delta = scaleRange;
    if (residuals.length > 0) {
      const { mad } = computeMad(residuals);
      const scale = Math.max(1.4826 * mad, scaleFloor);
      finalScaleEstimate = scale;
      delta = config.huberK * scale;
    }

    // C. Huber Weights: w = 1 if |r| <= delta else delta / |r|
    const weights: number[] = [];
    for (let i = 0; i < observations.length; i++) {
      const absR = Math.abs(obsResiduals[i]);
      if (absR <= delta) {
        weights.push(1.0);
      } else {
        weights.push(delta / Math.max(1e-8, absR));
      }
    }

    // D. Update Quality q[p,c] = sum(w * (y - b[j])) / sum(w)
    for (const p of sortedProjects) {
      for (const c of rubric.criteria) {
        let weightedNumerator = 0;
        let weightSum = 0;

        for (let i = 0; i < observations.length; i++) {
          const obs = observations[i];
          if (obs.projectId === p && obs.criterionId === c.id) {
            const w = weights[i];
            const bVal = bMap.get(obs.judgeId) ?? 0.0;
            weightedNumerator += w * (obs.y - bVal);
            weightSum += w;
          }
        }

        const key = `${p}::${c.id}`;
        if (weightSum > 0) {
          qMap.set(key, weightedNumerator / weightSum);
        }
      }
    }

    // E. Update Judge Bias b[j] (only if calibration is active)
    if (calibrate) {
      for (const j of sortedJudges) {
        let weightedNumerator = 0;
        let weightSum = 0;

        for (let i = 0; i < observations.length; i++) {
          const obs = observations[i];
          if (obs.judgeId === j) {
            const w = weights[i];
            const qVal = qMap.get(`${obs.projectId}::${obs.criterionId}`) ?? globalMean;
            weightedNumerator += w * (obs.y - qVal);
            weightSum += w;
          }
        }

        // Ridge shrinkage parameter lambda
        const updatedB = weightedNumerator / (weightSum + config.lambda);
        let clampedB = updatedB;
        if (config.offsetCapEnabled) {
          clampedB = Math.max(-offsetCap, Math.min(offsetCap, updatedB));
        }
        bMap.set(j, clampedB);
      }

      // F. Mandatory Identification / Centering Rule (Preserves q + b exactly!)
      const bVals = Array.from(bMap.values());
      const meanB = bVals.length > 0 ? bVals.reduce((a, b) => a + b, 0) / bVals.length : 0;

      for (const j of sortedJudges) {
        const curB = bMap.get(j) ?? 0.0;
        bMap.set(j, curB - meanB);
      }

      for (const p of sortedProjects) {
        for (const c of rubric.criteria) {
          const key = `${p}::${c.id}`;
          const curQ = qMap.get(key) ?? globalMean;
          qMap.set(key, curQ + meanB);
        }
      }
    }
  }

  // 6. Compute Final Scores, Plain Averages, and Diagnostics
  const projectResults: ProjectQualityResult[] = [];
  const influenceWeightsList: EwjeOutput['influenceWeights'] = [];

  // Recompute final weights on fitted model
  for (const obs of observations) {
    const qVal = qMap.get(`${obs.projectId}::${obs.criterionId}`) ?? globalMean;
    const bVal = bMap.get(obs.judgeId) ?? 0.0;
    const fitted = qVal + bVal;
    const r = obs.y - fitted;
    const absR = Math.abs(r);
    const delta = config.huberK * finalScaleEstimate;
    const w = absR <= delta ? 1.0 : delta / Math.max(1e-8, absR);

    influenceWeightsList.push({
      judgeId: obs.judgeId,
      projectId: obs.projectId,
      criterionId: obs.criterionId,
      rawScore: obs.y,
      fittedPrediction: Number(fitted.toFixed(6)),
      residual: Number(r.toFixed(6)),
      influenceWeight: Number(w.toFixed(6)),
    });
  }

  for (const p of sortedProjects) {
    const criterionQualities: Record<string, number> = {};
    let finalScoreSum = 0;
    let rawScoreTotalSum = 0;
    let rawScoreCount = 0;
    const criteriaDisagreements: string[] = [];

    for (const c of rubric.criteria) {
      const qVal = qMap.get(`${p}::${c.id}`) ?? globalMean;
      const clampedQ = Math.max(scaleMin, Math.min(scaleMax, qVal));
      criterionQualities[c.id] = Number(clampedQ.toFixed(6));
      finalScoreSum += c.weight * clampedQ;

      // Check disagreement range
      const rawScoresForCriterion = observations
        .filter((o) => o.projectId === p && o.criterionId === c.id)
        .map((o) => o.y);

      if (rawScoresForCriterion.length > 0) {
        const minRaw = Math.min(...rawScoresForCriterion);
        const maxRaw = Math.max(...rawScoresForCriterion);
        const range = maxRaw - minRaw;
        const disagreementThreshold = (config.disagreementThresholdPercent / 100.0) * scaleRange;
        if (range > disagreementThreshold) {
          criteriaDisagreements.push(c.id);
        }
      }
    }

    // Plain Average across all complete submissions for project
    const projectObs = observations.filter((o) => o.projectId === p);
    if (projectObs.length > 0) {
      rawScoreTotalSum = projectObs.reduce((s, o) => s + o.y, 0);
      rawScoreCount = projectObs.length;
    }
    const rawAverageScore = rawScoreCount > 0 ? rawScoreTotalSum / rawScoreCount : globalMean;

    const completeCount = projectSubCount.get(p) || 0;
    const lowEvidence = completeCount < 2;
    const highDisagreement = criteriaDisagreements.length > 0;

    projectResults.push({
      projectId: p,
      criterionQualities,
      finalScore: Number(finalScoreSum.toFixed(6)),
      rawAverageScore: Number(rawAverageScore.toFixed(6)),
      plainAverageScore: Number(rawAverageScore.toFixed(6)),
      rank: 1, // Computed below after sorting
      flags: {
        lowEvidence,
        highDisagreement,
        disagreedCriteria: criteriaDisagreements,
        completeSubmissionCount: completeCount,
      },
    });
  }

  // Sort projects deterministically: finalScore desc -> rawAverageScore desc -> projectId asc
  projectResults.sort((a, b) => {
    if (Math.abs(b.finalScore - a.finalScore) > 1e-6) {
      return b.finalScore - a.finalScore;
    }
    const rawA = a.rawAverageScore || 0;
    const rawB = b.rawAverageScore || 0;
    if (Math.abs(rawB - rawA) > 1e-6) {
      return rawB - rawA;
    }
    return a.projectId.localeCompare(b.projectId);
  });

  // Assign ranks
  for (let i = 0; i < projectResults.length; i++) {
    projectResults[i].rank = i + 1;
  }

  // Judge Offsets & Flags
  const judgeOffsetResults: Record<string, JudgeOffsetResult> = {};
  for (const j of sortedJudges) {
    const offset = calibrate ? (bMap.get(j) ?? 0.0) : 0.0;
    const judgeObs = observations.filter((o) => o.judgeId === j);
    const residuals = judgeObs.map((o) => {
      const qVal = qMap.get(`${o.projectId}::${o.criterionId}`) ?? globalMean;
      return o.y - qVal;
    });
    const rawMeanResidual = residuals.length > 0 ? residuals.reduce((a, b) => a + b, 0) / residuals.length : 0;

    // Check criterion pattern (residual concentrated heavily in one criterion)
    let criterionPattern = false;
    let concentratedCriterionId: string | undefined;

    if (rubric.criteria.length > 1 && judgeObs.length >= 4) {
      const criterionMeans = new Map<string, number>();
      for (const c of rubric.criteria) {
        const cObs = judgeObs.filter((o) => o.criterionId === c.id);
        if (cObs.length > 0) {
          const mean = cObs.reduce((s, o) => s + (o.y - (qMap.get(`${o.projectId}::${c.id}`) ?? globalMean)), 0) / cObs.length;
          criterionMeans.set(c.id, mean);
        }
      }

      const vals = Array.from(criterionMeans.values());
      const maxC = Math.max(...vals);
      const minC = Math.min(...vals);
      if (maxC - minC > 0.3 * scaleRange) {
        criterionPattern = true;
        criterionMeans.forEach((m, cId) => {
          if ((m === maxC || m === minC) && !concentratedCriterionId) {
            concentratedCriterionId = cId;
          }
        });
      }
    }

    judgeOffsetResults[j] = {
      judgeId: j,
      offset: Number(offset.toFixed(6)),
      completeEvaluationsCount: judgeSubCount.get(j) || 0,
      rawMeanResidual: Number(rawMeanResidual.toFixed(6)),
      flags: {
        criterionPattern,
        concentratedCriterionId,
      },
    };
  }

  // 7. Reproducibility Hashes
  const inputPayload = {
    rubric,
    submissions: completeSubmissions,
    config,
    calculationMode,
  };
  const inputDataHash = createHash('sha256').update(canonicalJson(inputPayload)).digest('hex');

  const outputPayload = {
    algorithmVersion: config.algorithmVersion,
    calculationMode,
    projects: projectResults.map((p) => ({
      projectId: p.projectId,
      finalScore: p.finalScore,
      rank: p.rank,
      criterionQualities: p.criterionQualities,
    })),
    judgeOffsets: Object.fromEntries(
      Object.entries(judgeOffsetResults).map(([k, v]) => [k, { offset: v.offset, count: v.completeEvaluationsCount }])
    ),
  };
  const outputHash = createHash('sha256').update(canonicalJson(outputPayload)).digest('hex');

  return {
    algorithmVersion: config.algorithmVersion,
    calculationMode,
    modeReason,
    config,
    projects: projectResults,
    judgeOffsets: judgeOffsetResults,
    influenceWeights: influenceWeightsList,
    summary: {
      totalProjects: sortedProjects.length,
      totalJudges: sortedJudges.length,
      totalCompleteSubmissions: completeSubmissions.length,
      excludedIncompleteCount,
      globalMeanScore: Number(globalMean.toFixed(6)),
      scaleEstimate: Number(finalScaleEstimate.toFixed(6)),
    },
    reproducibility: {
      genesisHash: GENESIS_HASH_EWJE_V2,
      publishedTimestamp: new Date().toISOString(),
      inputDataHash,
      outputHash,
    },
  };
}

export function runEwjeEngine(options: {
  rubric: EwjeRubric;
  submissions: CompleteJudgeSubmission[];
  config?: EwjeConfig;
  forcedMode?: CalculationMode;
}): EwjeOutput {
  return runEwje(
    options.rubric,
    options.submissions,
    options.config || EWJE_V2_DEFAULTS,
    options.forcedMode
  );
}

/**
 * Check connectivity of bipartite judge-project graph using BFS
 */
export function checkBipartiteConnectivity(
  judges: string[],
  projects: string[],
  submissions: CompleteJudgeSubmission[]
): boolean {
  if (judges.length === 0 || projects.length === 0) return false;

  const adj = new Map<string, Set<string>>();
  for (const j of judges) adj.set(`J:${j}`, new Set());
  for (const p of projects) adj.set(`P:${p}`, new Set());

  for (const sub of submissions) {
    const jNode = `J:${sub.judgeId}`;
    const pNode = `P:${sub.projectId}`;
    if (adj.has(jNode) && adj.has(pNode)) {
      adj.get(jNode)!.add(pNode);
      adj.get(pNode)!.add(jNode);
    }
  }

  // BFS from first judge
  const visited = new Set<string>();
  const queue = [`J:${judges[0]}`];
  visited.add(queue[0]);

  while (queue.length > 0) {
    const curr = queue.shift()!;
    const neighbors = adj.get(curr) || new Set();
    neighbors.forEach((n) => {
      if (!visited.has(n)) {
        visited.add(n);
        queue.push(n);
      }
    });
  }

  // Total nodes in graph = |judges| + |projects|
  return visited.size === judges.length + projects.length;
}
