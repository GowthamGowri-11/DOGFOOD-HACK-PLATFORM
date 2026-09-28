/**
 * EWJE v2 — Snapshot & Deterministic Recomputation Engine
 * Generates immutable final calculation records with SHA-256 output hashes and provides
 * independent recomputation verification from append-only score event logs.
 */

import crypto from 'crypto';
import { canonicalJson } from './hash-chain';
import { runEwjeEngine } from './ewje-engine';
import { runSensitivityAnalysis } from './sensitivity-engine';
import { ScoreEventLogManager } from './score-event-log';
import {
  Rubric,
  EwjeConfig,
  EwjeCalculationOutput,
  EwjeSnapshot,
  RecomputeVerificationResult,
  ProjectQualityResult,
} from './ewje-types';

/**
 * Format numeric values to fixed 6 decimal places for canonical JSON serialization
 */
export function formatTo6Decimals(val: number): number {
  return Number(val.toFixed(6));
}

/**
 * Build canonical rounded output structure for hashing
 */
export function buildCanonicalRoundedOutput(
  engineOutput: EwjeCalculationOutput
): Record<string, any> {
  const roundedProjects = engineOutput.projects.map((p: ProjectQualityResult) => {
    const roundedCriteria: Record<string, number> = {};
    const critObj = p.criterionScores || p.criterionQualities || {};
    for (const cId in critObj) {
      roundedCriteria[cId] = formatTo6Decimals(critObj[cId]);
    }
    return {
      projectId: p.projectId,
      rank: p.rank,
      finalScore: formatTo6Decimals(p.finalScore),
      plainAverageScore: formatTo6Decimals(p.plainAverageScore || 0),
      criterionScores: roundedCriteria,
      flags: Array.isArray(p.flags) ? [...p.flags].sort() : p.flags,
    };
  });

  const roundedJudgeOffsets: Record<string, number> = {};
  const sortedJudgeKeys = Object.keys(engineOutput.judgeOffsets || {}).sort();
  for (const j of sortedJudgeKeys) {
    const rawVal = engineOutput.judgeOffsets[j];
    const offsetNum = typeof rawVal === 'number' ? rawVal : (rawVal as any)?.offset || 0;
    roundedJudgeOffsets[j] = formatTo6Decimals(offsetNum);
  }

  const roundedInfluenceWeights = (engineOutput.influenceWeights || []).map((iw) => ({
    judgeId: iw.judgeId,
    projectId: iw.projectId,
    criterionId: iw.criterionId,
    weight: formatTo6Decimals(iw.weight || iw.influenceWeight || 1.0),
    residual: formatTo6Decimals(iw.residual),
  }));

  return {
    algorithmVersion: engineOutput.algorithmVersion,
    calculationMode: engineOutput.calculationMode,
    modeReason: engineOutput.modeReason,
    projects: roundedProjects,
    judgeOffsets: roundedJudgeOffsets,
    influenceWeights: roundedInfluenceWeights,
    flags: engineOutput.flags,
    sensitivity: engineOutput.sensitivity,
  };
}

/**
 * Compute SHA-256 hash of canonical rounded output
 */
export function computeOutputHash(canonicalRoundedOutput: Record<string, any>): string {
  const jsonStr = canonicalJson(canonicalRoundedOutput);
  return crypto.createHash('sha256').update(jsonStr, 'utf8').digest('hex');
}

/**
 * Create an immutable snapshot for an event
 */
export function createSnapshot(params: {
  eventId: string;
  assignmentVersion: number;
  rubric: Rubric;
  config: EwjeConfig;
  engineOutput: EwjeCalculationOutput;
  eventLogHeadHash: string;
}): EwjeSnapshot {
  const canonicalRounded = buildCanonicalRoundedOutput(params.engineOutput);
  const outputHash = computeOutputHash(canonicalRounded);

  const snapshot: EwjeSnapshot = {
    snapshotId: `snp_${crypto.randomUUID()}`,
    eventId: params.eventId,
    assignmentVersion: params.assignmentVersion,
    rubricVersion: params.rubric.version,
    algorithmVersion: params.engineOutput.algorithmVersion,
    seed: params.config.seed || 42,
    config: { ...params.config },
    calculationMode: params.engineOutput.calculationMode,
    modeReason: params.engineOutput.modeReason,
    eventLogHeadHash: params.eventLogHeadHash,
    roundedOutput: canonicalRounded,
    outputHash,
    createdAt: new Date().toISOString(),
  };

  return snapshot;
}

/**
 * Deterministically recompute output from score event log and verify against snapshot
 */
export function recomputeAndVerify(params: {
  snapshot: EwjeSnapshot;
  rubric: Rubric;
  logManager: ScoreEventLogManager;
}): RecomputeVerificationResult {
  const { snapshot, rubric, logManager } = params;

  // 1. Verify append-only chain integrity
  const chainCheck = logManager.verify(snapshot.eventId);
  if (!chainCheck.valid) {
    return {
      passed: false,
      snapshotOutputHash: snapshot.outputHash,
      recomputedOutputHash: '',
      eventLogHeadHash: chainCheck.headHash,
      diff: `Hash chain verification failed at event ${chainCheck.brokenAtEventId}: expected ${chainCheck.expectedHash}, found ${chainCheck.actualHash}.`,
    };
  }

  // 2. Re-extract complete submissions
  const { completeSubmissions } = logManager.extractLatestSubmissions(
    snapshot.eventId,
    rubric
  );

  // 3. Re-run EWJE pure engine
  const recomputedOutput = runEwjeEngine({
    rubric,
    submissions: completeSubmissions,
    config: snapshot.config,
  });

  // 4. Re-run sensitivity analysis
  const sensitivity = runSensitivityAnalysis({
    rubric,
    submissions: completeSubmissions,
    config: snapshot.config,
  });
  recomputedOutput.sensitivity = sensitivity;

  // 5. Build canonical rounded output & hash
  const canonicalRounded = buildCanonicalRoundedOutput(recomputedOutput);
  const recomputedHash = computeOutputHash(canonicalRounded);

  const passed = recomputedHash === snapshot.outputHash;

  let diff: string | undefined = undefined;
  if (!passed) {
    diff = `Output hash mismatch:\nExpected Snapshot: ${snapshot.outputHash}\nRecomputed Hash:   ${recomputedHash}`;
  }

  return {
    passed,
    snapshotOutputHash: snapshot.outputHash,
    recomputedOutputHash: recomputedHash,
    eventLogHeadHash: chainCheck.headHash,
    diff,
  };
}
