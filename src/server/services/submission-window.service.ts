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
   * Determine the authoritative submission window state based on server time.
   */
  public static getSubmissionWindowState(
    hackathon: { subStartTime: Date | string; subEndTime: Date | string },
    currentTime: Date = new Date()
  ): SubmissionWindowState {
    const now = currentTime.getTime();
    const opensAt = new Date(hackathon.subStartTime).getTime();
    const deadline = new Date(hackathon.subEndTime).getTime();

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
    hackathon: { subStartTime: Date | string; subEndTime: Date | string },
    currentTime: Date = new Date()
  ): SubmissionWindowInfo {
    const now = currentTime.getTime();
    const opensAtDate = new Date(hackathon.subStartTime);
    const deadlineDate = new Date(hackathon.subEndTime);
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
    hackathon: { subStartTime: Date | string; subEndTime: Date | string; title?: string },
    currentTime: Date = new Date()
  ): void {
    const now = currentTime.getTime();
    const opensAt = new Date(hackathon.subStartTime).getTime();
    const deadline = new Date(hackathon.subEndTime).getTime();

    if (now < opensAt) {
      const err = new Error('Submission has not opened yet.');
      (err as any).code = 'SUBMISSION_NOT_OPEN';
      (err as any).status = 422;
      (err as any).details = {
        opensAt: new Date(hackathon.subStartTime).toISOString(),
        serverTime: currentTime.toISOString(),
      };
      throw err;
    }

    if (now >= deadline) {
      const err = new Error('The submission deadline has passed.');
      (err as any).code = 'SUBMISSION_DEADLINE_PASSED';
      (err as any).status = 422;
      (err as any).details = {
        deadline: new Date(hackathon.subEndTime).toISOString(),
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
        error: 'Submission deadline must be strictly after submission opening time.',
      };
    }

    return { isValid: true };
  }

  /**
   * Emits the SUBMISSION_DEADLINE_REACHED realtime event to authorized rooms.
   */
  public static async emitDeadlineReached(hackathonId: string, deadline: Date | string): Promise<void> {
    const deadlineIso = new Date(deadline).toISOString();
    console.log(`[event] SUBMISSION_DEADLINE_REACHED hackathonId=${hackathonId} timestamp=${new Date().toISOString()}`);

    await eventBus.publish({
      type: 'SUBMISSION_DEADLINE_REACHED',
      hackathonId,
      rooms: [
        RealtimeRoomBuilder.hackathon(hackathonId),
        RealtimeRoomBuilder.organizer(hackathonId),
      ],
      payload: {
        status: 'SUBMISSION_CLOSED',
        submissionDeadline: deadlineIso,
        serverTime: new Date().toISOString(),
      },
    });
  }

  /**
   * Emits the SUBMISSION_WINDOW_OPENED realtime event to authorized rooms.
   */
  public static async emitWindowOpened(hackathonId: string, opensAt: Date | string): Promise<void> {
    const opensAtIso = new Date(opensAt).toISOString();
    console.log(`[event] SUBMISSION_WINDOW_OPENED hackathonId=${hackathonId} timestamp=${new Date().toISOString()}`);

    await eventBus.publish({
      type: 'SUBMISSION_WINDOW_OPENED',
      hackathonId,
      rooms: [
        RealtimeRoomBuilder.hackathon(hackathonId),
        RealtimeRoomBuilder.organizer(hackathonId),
      ],
      payload: {
        status: 'SUBMISSION_OPEN',
        submissionOpensAt: opensAtIso,
        serverTime: new Date().toISOString(),
      },
    });
  }
}
