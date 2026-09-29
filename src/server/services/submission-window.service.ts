import { RealtimeEventBus, eventBus } from '@/server/realtime/event-bus';
import { RealtimeRoomBuilder } from '@/server/realtime/event-types';
import prisma from '@/lib/prisma';

export type SubmissionWindowState = 'UPCOMING' | 'SUBMISSION_OPEN' | 'SUBMISSION_CLOSED';

export interface SubmissionWindowInfo {
  opensAt: string;
  deadline: string;
  status: SubmissionWindowState;
  serverTime: string;
  isClosingSoon: boolean;
  timeRemainingMs: number;
  timeUntilOpenMs: number;
}

export class SubmissionWindowService {
  /**
   * Resolves the effective submission window.
   * If a hackathon has active multi-round configuration in rulesAndGuidelines / rounds,
   * the active round's startDate and submissionDeadline determine the window.
   */
  public static getEffectiveWindow(
    hackathon: {
      subStartTime?: Date | string | null;
      subEndTime?: Date | string | null;
      currentRoundNumber?: number | null;
      rulesAndGuidelines?: string | null;
    },
    currentTime: Date = new Date()
  ): {
    subStartTime: Date;
    subEndTime: Date;
    isRoundWindow: boolean;
  } {
    // 1. Check if configured with active round dates
    if (hackathon.rulesAndGuidelines) {
      try {
        const parsed =
          typeof hackathon.rulesAndGuidelines === 'string'
            ? JSON.parse(hackathon.rulesAndGuidelines)
            : hackathon.rulesAndGuidelines;

        if (Array.isArray(parsed?.rounds) && parsed.rounds.length > 0) {
          const currentRoundIdx = Math.max(0, (hackathon.currentRoundNumber || 1) - 1);
          const activeRound = parsed.rounds[currentRoundIdx] || parsed.rounds[0];

          const roundStart = activeRound.startDate ? new Date(activeRound.startDate) : null;
          const roundEnd = (activeRound.submissionDeadline || activeRound.endDate)
            ? new Date(activeRound.submissionDeadline || activeRound.endDate)
            : null;

          if (roundStart && !isNaN(roundStart.getTime()) && roundEnd && !isNaN(roundEnd.getTime())) {
            return {
              subStartTime: roundStart,
              subEndTime: roundEnd,
              isRoundWindow: true,
            };
          }
        }
      } catch {
        // Fallback
      }
    }

    // 2. Default to hackathon subStartTime / subEndTime or fallback
    const fallbackStart = hackathon.subStartTime ? new Date(hackathon.subStartTime) : new Date(0);
    const fallbackEnd = hackathon.subEndTime ? new Date(hackathon.subEndTime) : new Date(Date.now() + 86400000);

    return {
      subStartTime: isNaN(fallbackStart.getTime()) ? new Date(0) : fallbackStart,
      subEndTime: isNaN(fallbackEnd.getTime()) ? new Date(Date.now() + 86400000) : fallbackEnd,
      isRoundWindow: false,
    };
  }

  /**
   * Determine the authoritative submission window state based on server time.
   */
  public static getSubmissionWindowState(
    hackathon: {
      subStartTime?: Date | string | null;
      subEndTime?: Date | string | null;
      currentRoundNumber?: number | null;
      rulesAndGuidelines?: string | null;
    },
    currentTime: Date = new Date()
  ): SubmissionWindowState {
    const window = this.getEffectiveWindow(hackathon, currentTime);
    const now = currentTime.getTime();
    const opensAt = window.subStartTime.getTime();
    const deadline = window.subEndTime.getTime();

    if (now < opensAt) {
      return 'UPCOMING';
    }
    if (now >= opensAt && now < deadline) {
      return 'SUBMISSION_OPEN';
    }
    return 'SUBMISSION_CLOSED';
  }

  /**
   * Returns rich submission window metadata with server-authoritative time and timing deltas.
   */
  public static getSubmissionWindowDetails(
    hackathon: {
      subStartTime?: Date | string | null;
      subEndTime?: Date | string | null;
      currentRoundNumber?: number | null;
      rulesAndGuidelines?: string | null;
    },
    currentTime: Date = new Date()
  ): SubmissionWindowInfo {
    const window = this.getEffectiveWindow(hackathon, currentTime);
    const now = currentTime.getTime();
    const opensAtDate = window.subStartTime;
    const deadlineDate = window.subEndTime;
    const opensAt = opensAtDate.getTime();
    const deadline = deadlineDate.getTime();

    const status = this.getSubmissionWindowState(hackathon, currentTime);
    const timeRemainingMs = Math.max(0, deadline - now);
    const timeUntilOpenMs = Math.max(0, opensAt - now);
    const isClosingSoon = status === 'SUBMISSION_OPEN' && timeRemainingMs > 0 && timeRemainingMs <= 15 * 60 * 1000;

    return {
      opensAt: opensAtDate.toISOString(),
      deadline: deadlineDate.toISOString(),
      status,
      serverTime: currentTime.toISOString(),
      isClosingSoon,
      timeRemainingMs,
      timeUntilOpenMs,
    };
  }

  /**
   * Authoritatively validates if submission is allowed right now.
   * Throws typed domain error if outside the submission window.
   */
  public static assertSubmissionWindowOpen(
    hackathon: {
      subStartTime?: Date | string | null;
      subEndTime?: Date | string | null;
      currentRoundNumber?: number | null;
      rulesAndGuidelines?: string | null;
      title?: string;
    },
    currentTime: Date = new Date()
  ): void {
    const window = this.getEffectiveWindow(hackathon, currentTime);
    const now = currentTime.getTime();
    const opensAt = window.subStartTime.getTime();
    const deadline = window.subEndTime.getTime();

    if (now < opensAt) {
      const err = new Error('Submission has not opened yet.');
      (err as any).code = 'SUBMISSION_NOT_OPEN';
      (err as any).status = 422;
      (err as any).details = {
        opensAt: window.subStartTime.toISOString(),
        serverTime: currentTime.toISOString(),
      };
      throw err;
    }

    if (now >= deadline) {
      const err = new Error('The submission deadline has passed.');
      (err as any).code = 'SUBMISSION_DEADLINE_PASSED';
      (err as any).status = 422;
      (err as any).details = {
        deadline: window.subEndTime.toISOString(),
        serverTime: currentTime.toISOString(),
      };
      throw err;
    }
  }

  /**
   * Validates date configuration for start and end times.
   */
  public static validateWindowDates(
    subStartTime: Date | string,
    subEndTime: Date | string
  ): { isValid: boolean; error?: string } {
    const start = new Date(subStartTime).getTime();
    const end = new Date(subEndTime).getTime();

    if (isNaN(start)) {
      return { isValid: false, error: 'Invalid submission opening date/time.' };
    }
    if (isNaN(end)) {
      return { isValid: false, error: 'Invalid submission deadline date/time.' };
    }
    if (start >= end) {
      return {
        isValid: false,
        error: 'Submission deadline must be strictly after the submission opening time.',
      };
    }

    return { isValid: true };
  }

  /**
   * Broadcasts SUBMISSION_WINDOW_OPENED event to all connected clients.
   */
  public static async emitWindowOpened(hackathonId: string, subStartTime: Date | string): Promise<void> {
    const serverTime = new Date().toISOString();
    await eventBus.publish({
      type: 'SUBMISSION_WINDOW_OPENED',
      hackathonId,
      actorId: 'SYSTEM',
      rooms: [
        RealtimeRoomBuilder.hackathon(hackathonId),
        RealtimeRoomBuilder.organizer(hackathonId),
      ],
      payload: {
        hackathonId,
        subStartTime: new Date(subStartTime).toISOString(),
        serverTime,
      },
    });
  }

  /**
   * Broadcasts SUBMISSION_DEADLINE_REACHED event to all connected clients.
   */
  public static async emitDeadlineReached(hackathonId: string, subEndTime: Date | string): Promise<void> {
    const serverTime = new Date().toISOString();
    await eventBus.publish({
      type: 'SUBMISSION_DEADLINE_REACHED',
      hackathonId,
      actorId: 'SYSTEM',
      rooms: [
        RealtimeRoomBuilder.hackathon(hackathonId),
        RealtimeRoomBuilder.organizer(hackathonId),
      ],
      payload: {
        hackathonId,
        subEndTime: new Date(subEndTime).toISOString(),
        serverTime,
      },
    });
  }
}
