/**
 * EWJE v2 — Sensitivity Analysis Engine (Leave-One-Judge-Out)
 * Strictly diagnostic; does NOT modify project scores.
 */

import { runEwjeEngine } from './ewje-engine';
import {
  Rubric,
  JudgeProjectSubmission,
  EwjeConfig,
  PrizeSensitivityResult,
} from './ewje-types';

export interface RunSensitivityOptions {
  rubric: Rubric;
  submissions: JudgeProjectSubmission[];
  config: EwjeConfig;
  topPositions?: number; // default 3 (podium)
}

export function runSensitivityAnalysis(
  options: RunSensitivityOptions
): PrizeSensitivityResult[] {
  const { rubric, submissions, config, topPositions = 3 } = options;

  // Run primary calculation
  const primaryResult = runEwjeEngine({
    rubric,
    submissions,
    config,
  });

  const primaryRanking = primaryResult.projects;
  const uniqueJudges = Array.from(new Set(submissions.map((s) => s.judgeId))).sort();

  const sensitivityResults: PrizeSensitivityResult[] = [];

  for (let pos = 1; pos <= Math.min(topPositions, primaryRanking.length); pos++) {
    const originalProject = primaryRanking[pos - 1];
    let isStable = true;
    let alteredByJudgeId: string | undefined = undefined;
    let replacementProjectId: string | undefined = undefined;

    for (const judgeId of uniqueJudges) {
      // Filter out this judge's submissions
      const filteredSubmissions = submissions.filter((s) => s.judgeId !== judgeId);
      if (filteredSubmissions.length === 0) continue;

      const lojoResult = runEwjeEngine({
        rubric,
        submissions: filteredSubmissions,
        config,
      });

      const lojoRankedProject = lojoResult.projects[pos - 1];
      if (lojoRankedProject && lojoRankedProject.projectId !== originalProject.projectId) {
        isStable = false;
        alteredByJudgeId = judgeId;
        replacementProjectId = lojoRankedProject.projectId;
        break; // First finding of sensitivity for this position
      }
    }

    sensitivityResults.push({
      position: pos,
      originalProjectId: originalProject.projectId,
      status: isStable ? 'STABLE' : 'SENSITIVE',
      alteredByJudgeId,
      replacementProjectId,
    });
  }

  return sensitivityResults;
}
