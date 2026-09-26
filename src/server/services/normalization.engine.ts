export interface JudgeEvaluationRecord {
  judgeId: string;
  projectId: string;
  weightedScore: number;
}

export interface ProjectNormalizedScore {
  projectId: string;
  rawAverage: number;
  normalizedScore: number;
  finalScore: number;
}

export class NormalizationEngine {
  /**
   * Applies Z-score normalization per judge to calibrate strict vs lenient graders.
   */
  public static computeZScoreNormalization(
    records: JudgeEvaluationRecord[]
  ): ProjectNormalizedScore[] {
    if (records.length === 0) return [];

    // Group records by judge to compute mean and standard deviation per judge
    const judgeScores = new Map<string, number[]>();
    records.forEach((r) => {
      const list = judgeScores.get(r.judgeId) || [];
      list.push(r.weightedScore);
      judgeScores.set(r.judgeId, list);
    });

    const judgeStats = new Map<string, { mean: number; stdDev: number }>();
    let globalSum = 0;
    records.forEach((r) => (globalSum += r.weightedScore));
    const globalMean = globalSum / records.length;

    let globalVarianceSum = 0;
    records.forEach((r) => (globalVarianceSum += Math.pow(r.weightedScore - globalMean, 2)));
    const globalStdDev = Math.sqrt(globalVarianceSum / records.length) || 1.0;

    judgeScores.forEach((scores, judgeId) => {
      const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
      const variance = scores.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / scores.length;
      const stdDev = Math.sqrt(variance) || 1.0; // Avoid divide-by-zero
      judgeStats.set(judgeId, { mean, stdDev });
    });

    // Group normalized z-scores by project
    const projectZScores = new Map<string, { rawScores: number[]; zScores: number[] }>();
    records.forEach((r) => {
      const stats = judgeStats.get(r.judgeId) || { mean: globalMean, stdDev: globalStdDev };
      const zScore = (r.weightedScore - stats.mean) / stats.stdDev;

      const curr = projectZScores.get(r.projectId) || { rawScores: [], zScores: [] };
      curr.rawScores.push(r.weightedScore);
      curr.zScores.push(zScore);
      projectZScores.set(r.projectId, curr);
    });

    const results: ProjectNormalizedScore[] = [];
    projectZScores.forEach((data, projectId) => {
      const rawAvg = data.rawScores.reduce((a, b) => a + b, 0) / data.rawScores.length;
      const meanZ = data.zScores.reduce((a, b) => a + b, 0) / data.zScores.length;
      
      // Rescale back to global scale bounded in [0, 100]
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

  /**
   * Applies Min-Max scaling to map scores smoothly from 0 to 100.
   */
  public static computeMinMaxNormalization(
    records: JudgeEvaluationRecord[]
  ): ProjectNormalizedScore[] {
    if (records.length === 0) return [];

    const projectScores = new Map<string, number[]>();
    records.forEach((r) => {
      const list = projectScores.get(r.projectId) || [];
      list.push(r.weightedScore);
      projectScores.set(r.projectId, list);
    });

    const rawAverages: { projectId: string; avg: number }[] = [];
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
