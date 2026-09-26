import { AIComparisonEngine, ComparisonPair } from './ai-comparison.engine';

export interface CalibrationDatasetSplit {
  trainingPairs: ComparisonPair[];
  validationPairs: ComparisonPair[];
}

export interface CalibrationPipelineResult {
  calibrationVersion: string;
  maeBefore: number;
  maeAfter: number;
  rmseBefore: number;
  rmseAfter: number;
  correlationBefore: number;
  correlationAfter: number;
  isApprovedForPromotion: boolean;
}

export class AICalibrationPipeline {
  /**
   * Partitions historical comparison dataset into 80% train and 20% validation.
   */
  public static splitDataset(pairs: ComparisonPair[], trainRatio = 0.8): CalibrationDatasetSplit {
    const shuffled = [...pairs];
    const trainSize = Math.floor(shuffled.length * trainRatio);
    return {
      trainingPairs: shuffled.slice(0, trainSize),
      validationPairs: shuffled.slice(trainSize),
    };
  }

  /**
   * Executes a controlled calibration run and validates accuracy improvement on the hold-out validation set.
   */
  public static runCalibration(
    split: CalibrationDatasetSplit,
    versionTag: string
  ): CalibrationPipelineResult {
    // 1. Compute baseline metrics on hold-out validation set
    const before = AIComparisonEngine.calculateMetrics(split.validationPairs);

    // 2. Simulate optimization of criterion weights and prompt bias offsets on training set
    // Calculate mean systematic bias on training pairs
    const trainBias =
      split.trainingPairs.length > 0
        ? split.trainingPairs.reduce((acc, p) => acc + (p.aiScore - p.humanScore), 0) /
          split.trainingPairs.length
        : 0;

    // Apply learned calibration offset to validation pairs
    const calibratedValidationPairs: ComparisonPair[] = split.validationPairs.map((p) => ({
      ...p,
      aiScore: Math.max(0, Math.min(100, p.aiScore - trainBias * 0.75)), // 75% dampening to avoid overfitting
    }));

    // 3. Compute post-calibration metrics on validation set
    const after = AIComparisonEngine.calculateMetrics(calibratedValidationPairs);

    // Model promotion rule: MAE must improve on unseen validation data
    const isApprovedForPromotion = after.mae <= before.mae;

    return {
      calibrationVersion: versionTag,
      maeBefore: before.mae,
      maeAfter: after.mae,
      rmseBefore: before.rmse,
      rmseAfter: after.rmse,
      correlationBefore: before.correlation,
      correlationAfter: after.correlation,
      isApprovedForPromotion,
    };
  }
}
