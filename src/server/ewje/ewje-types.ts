/**
 * EWJE v2 — Type Definitions
 * Evidence-Weighted Judging Engine v2
 */

export type CalculationMode = 'CALIBRATED_ROBUST' | 'ROBUST_ONLY';

export interface EwjeCriterion {
  id: string;
  name: string;
  weight: number; // Sum across criteria must equal 1.0
  scaleMin: number;
  scaleMax: number;
}
export type Criterion = EwjeCriterion;

export interface EwjeRubric {
  id?: string;
  version: number | string;
  scaleMin?: number;
  scaleMax?: number;
  criteria: EwjeCriterion[];
}
export type Rubric = EwjeRubric;

export interface RawJudgeScore {
  judgeId: string;
  projectId: string;
  criterionId: string;
  value: number;
}

export interface CompleteJudgeSubmission {
  judgeId: string;
  projectId: string;
  scores: Record<string, number>; // criterionId -> raw score
}
export type JudgeProjectSubmission = CompleteJudgeSubmission;

export interface EwjeConfig {
  algorithmVersion: string;
  iters: number;
  lambda: number;
  huberK: number;
  scaleFloorFactor: number;
  offsetCapFactor: number;
  offsetCapEnabled: boolean;
  minJudgeProjects: number;
  disagreementThresholdPercent: number;
  defaultJudgesPerProject: number;
  seed?: number;
}

export interface ProjectQualityResult {
  projectId: string;
  criterionQualities?: Record<string, number>; // criterionId -> q[p,c]
  criterionScores?: Record<string, number>;
  finalScore: number;
  rawAverageScore?: number;
  plainAverageScore: number;
  rank: number;
  flags: {
    lowEvidence: boolean;
    highDisagreement: boolean;
    disagreedCriteria?: string[];
    completeSubmissionCount?: number;
  } | string[];
}

export interface JudgeOffsetResult {
  judgeId: string;
  offset: number; // b[j] centered around 0
  completeEvaluationsCount?: number;
  rawMeanResidual?: number;
  flags?: {
    criterionPattern: boolean;
    concentratedCriterionId?: string;
  };
}

export interface PrizeSensitivityResult {
  position: number;
  originalProjectId: string;
  status: 'STABLE' | 'SENSITIVE';
  alteredByJudgeId?: string;
  replacementProjectId?: string;
}

export interface EwjeOutput {
  algorithmVersion: string;
  calculationMode: CalculationMode;
  modeReason: string;
  config: EwjeConfig;
  projects: ProjectQualityResult[];
  judgeOffsets: Record<string, JudgeOffsetResult | number>;
  influenceWeights: Array<{
    judgeId: string;
    projectId: string;
    criterionId: string;
    rawScore?: number;
    fittedPrediction?: number;
    residual: number;
    weight?: number;
    influenceWeight?: number;
  }>;
  summary?: {
    totalProjects: number;
    totalJudges: number;
    totalCompleteSubmissions: number;
    excludedIncompleteCount: number;
    globalMeanScore: number;
    scaleEstimate: number;
  };
  reproducibility?: {
    genesisHash: string;
    publishedTimestamp: string;
    inputDataHash: string;
    outputHash: string;
  };
  flags?: Record<string, any>;
  sensitivity?: PrizeSensitivityResult[];
}
export type EwjeCalculationOutput = EwjeOutput;

export interface ScoreEvent {
  id: string;
  eventId: string;
  judgeId: string;
  projectId: string;
  criterionId: string;
  value: number;
  previousValue?: number | null;
  reason?: string | null;
  actorId: string;
  actorRole: 'JUDGE' | 'ORGANIZER';
  createdAt: string;
  previousHash: string;
  hash: string;
}

export interface HashChainVerificationResult {
  valid: boolean;
  brokenAtEventId?: string;
  errorIndex?: number;
  expectedHash?: string;
  actualHash?: string;
  totalEvents: number;
  headHash: string;
}

export interface AssignmentValidationCheck {
  name: string;
  threshold: number | string;
  actualValue: number | string;
  passed: boolean;
  explanation: string;
}

export interface AssignmentValidationReport {
  passed: boolean;
  checks: AssignmentValidationCheck[];
}

export interface EwjeSnapshot {
  snapshotId: string;
  eventId: string;
  assignmentVersion: number;
  rubricVersion: number | string;
  algorithmVersion: string;
  seed?: number;
  config: EwjeConfig;
  calculationMode: CalculationMode;
  modeReason: string;
  eventLogHeadHash: string;
  roundedOutput: Record<string, any>;
  outputHash: string;
  createdAt: string;
}

export interface RecomputeVerificationResult {
  passed: boolean;
  snapshotOutputHash: string;
  recomputedOutputHash: string;
  eventLogHeadHash: string;
  diff?: string;
}
