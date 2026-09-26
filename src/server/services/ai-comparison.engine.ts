export interface ComparisonPair {
  criterionId: string;
  aiScore: number;
  humanScore: number;
  confidence: number;
}

export interface ComparisonMetrics {
  mae: number;
  rmse: number;
  correlation: number;
  agreementRate: number; // % within 10% tolerance
  totalComparisons: number;
}

export class AIComparisonEngine {
  /**
   * Computes per-criterion difference, absolute error, and platform-wide statistical alignment.
   */
  public static calculateMetrics(pairs: ComparisonPair[]): ComparisonMetrics {
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

      // Agreement threshold: within 10 points or 10%
      if (absError <= 10) {
        agreementCount++;
      }
    }

    const N = pairs.length;
    const mae = Number((absErrorSum / N).toFixed(2));
    const rmse = Number(Math.sqrt(squaredErrorSum / N).toFixed(2));
    const agreementRate = Number(((agreementCount / N) * 100).toFixed(1));

    // Pearson Correlation coefficient
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
