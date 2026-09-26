export interface CriterionScoreInput {
  criterionId: string;
  rawScore: number;
  maxScore: number;
  weightPercentage: number;
}

export interface EvaluationScoreResult {
  rawScoreSum: number;
  weightedScore: number; // Scaled to 0 - 100
  criterionContributions?: {
    criterionId: string;
    rawScore: number;
    maxScore: number;
    weightPercentage: number;
    weightedContribution: number;
  }[];
}

export interface RubricValidationResult {
  isValid: boolean;
  totalWeight: number;
  errors: string[];
}

export class ScoringEngine {
  /**
   * Validates a set of rubric criteria for completeness and valid percentage weights (must sum to 100).
   */
  public static validateRubric(
    criteria: { title?: string; weightPercentage: number; maxScore?: number }[]
  ): RubricValidationResult {
    const errors: string[] = [];

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

    // Check sum of weights equals 100% (allowing small floating point epsilon)
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

  /**
   * Calculates raw score sum and percentage-weighted score across criteria.
   */
  public static calculateEvaluationScore(scores: CriterionScoreInput[]): EvaluationScoreResult {
    let rawScoreSum = 0;
    let weightedScore = 0;
    let totalWeight = 0;
    const contributions: {
      criterionId: string;
      rawScore: number;
      maxScore: number;
      weightPercentage: number;
      weightedContribution: number;
    }[] = [];

    for (const item of scores) {
      if (item.rawScore < 0) {
        throw new Error(`Invalid score ${item.rawScore}: scores cannot be negative.`);
      }
      if (item.maxScore > 0 && item.rawScore > item.maxScore) {
        throw new Error(
          `Invalid score ${item.rawScore}: score cannot exceed maximum allowed of ${item.maxScore}.`
        );
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

    // Normalizing against weight sum if weights do not sum up to 100 exactly
    if (totalWeight > 0 && Math.abs(totalWeight - 100) > 0.01) {
      weightedScore = (weightedScore / totalWeight) * 100;
    }

    return {
      rawScoreSum: Number(rawScoreSum.toFixed(2)),
      weightedScore: Number(weightedScore.toFixed(2)),
      criterionContributions: contributions,
    };
  }

  /**
   * Averages all judge evaluations for a given project.
   */
  public static aggregateProjectScores(evaluationScores: number[]): number {
    if (evaluationScores.length === 0) return 0;
    const sum = evaluationScores.reduce((acc, curr) => acc + curr, 0);
    return Number((sum / evaluationScores.length).toFixed(2));
  }
}

