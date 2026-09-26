export interface ProjectScoreRankInput {
  projectId: string;
  finalScore: number;
  rawAverage: number;
  normalizedScore: number;
  trackId?: string;
}

export interface PrizeCategoryConfig {
  title: string;
  rankOrder: number;
}

export interface RankedProjectResult {
  projectId: string;
  rank: number;
  finalScore: number;
  rawAverageScore: number;
  normalizedScore: number;
  awardCategory?: string;
  isWinner: boolean;
}

export class ResultEngine {
  /**
   * Ranks projects by final score descending and assigns awards based on prizes.
   */
  public static computeRankings(
    projects: ProjectScoreRankInput[],
    prizes: PrizeCategoryConfig[] = []
  ): RankedProjectResult[] {
    // Sort descending by final score, tiebreak with raw average
    const sorted = [...projects].sort((a, b) => {
      if (b.finalScore !== a.finalScore) {
        return b.finalScore - a.finalScore;
      }
      return b.rawAverage - a.rawAverage;
    });

    const prizeMap = new Map<number, string>();
    prizes.forEach((p) => prizeMap.set(p.rankOrder, p.title));

    return sorted.map((p, index) => {
      const rank = index + 1;
      const awardCategory = prizeMap.get(rank);
      const isWinner = rank <= Math.max(prizes.length, 3);

      return {
        projectId: p.projectId,
        rank,
        finalScore: p.finalScore,
        rawAverageScore: p.rawAverage,
        normalizedScore: p.normalizedScore,
        awardCategory,
        isWinner,
      };
    });
  }
}
