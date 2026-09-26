export interface AssignmentJudge {
  id: string;
  userId: string;
  maxWorkload: number;
  expertiseTracks: string[];
  conflictTeamIds: string[];
  currentAssignmentCount: number;
  isActive: boolean;
}

export interface AssignmentProject {
  id: string;
  teamId: string;
  trackId: string;
  hackathonId: string;
}

export interface AssignmentOptions {
  judgesPerProject?: number;
  prioritizeTrackExpertise?: boolean;
}

export interface AssignmentResult {
  judgeId: string;
  projectId: string;
}

export class AssignmentEngine {
  /**
   * Distributes projects to judges using a balanced greedy algorithm with constraint satisfaction.
   */
  public static distribute(
    projects: AssignmentProject[],
    judges: AssignmentJudge[],
    options: AssignmentOptions = {}
  ): AssignmentResult[] {
    const K = options.judgesPerProject || 2;
    const assignments: AssignmentResult[] = [];

    // Track active workloads locally during assignment computation
    const workloadMap = new Map<string, number>();
    judges.forEach((j) => workloadMap.set(j.id, j.currentAssignmentCount));

    for (const project of projects) {
      // Find candidate judges
      const eligible = judges.filter((judge) => {
        if (!judge.isActive) return false;
        
        const currentCount = workloadMap.get(judge.id) || 0;
        if (currentCount >= judge.maxWorkload) return false;

        // Eliminate Conflicts of Interest (COI)
        if (judge.conflictTeamIds.includes(project.teamId)) return false;

        return true;
      });

      // Sort candidate judges by track expertise match first, then by least assigned workload
      eligible.sort((a, b) => {
        const aTrackMatch = a.expertiseTracks.includes(project.trackId) ? 1 : 0;
        const bTrackMatch = b.expertiseTracks.includes(project.trackId) ? 1 : 0;

        if (options.prioritizeTrackExpertise && aTrackMatch !== bTrackMatch) {
          return bTrackMatch - aTrackMatch; // Matched track first
        }

        const aLoad = workloadMap.get(a.id) || 0;
        const bLoad = workloadMap.get(b.id) || 0;
        return aLoad - bLoad; // Least loaded first
      });

      const selected = eligible.slice(0, K);
      for (const judge of selected) {
        assignments.push({
          judgeId: judge.id,
          projectId: project.id,
        });
        const prev = workloadMap.get(judge.id) || 0;
        workloadMap.set(judge.id, prev + 1);
      }
    }

    return assignments;
  }
}
