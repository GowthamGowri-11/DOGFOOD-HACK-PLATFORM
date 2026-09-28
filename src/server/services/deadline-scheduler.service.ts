import prisma from '@/lib/prisma';
import { SubmissionWindowService } from './submission-window.service';

export class DeadlineSchedulerService {
  private static instance: DeadlineSchedulerService | null = null;
  private intervalId: NodeJS.Timeout | null = null;
  private emittedOpens: Set<string> = new Set();
  private emittedDeadlines: Set<string> = new Set();
  private isChecking: boolean = false;

  private constructor() {}

  public static getInstance(): DeadlineSchedulerService {
    if (!DeadlineSchedulerService.instance) {
      DeadlineSchedulerService.instance = new DeadlineSchedulerService();
    }
    return DeadlineSchedulerService.instance;
  }

  /**
   * Start the scheduler interval if not already running.
   */
  public start(intervalMs: number = 5000): void {
    if (this.intervalId) return;

    // Run an immediate check on startup
    this.checkDeadlines().catch((err) => {
      console.error('[DeadlineScheduler] Initial check error:', err);
    });

    this.intervalId = setInterval(() => {
      this.checkDeadlines().catch((err) => {
        console.error('[DeadlineScheduler] Periodic check error:', err);
      });
    }, intervalMs);

    if (this.intervalId.unref) {
      this.intervalId.unref();
    }

    console.log(`[DeadlineScheduler] Started deadline monitoring scheduler (interval ${intervalMs}ms)`);
  }

  /**
   * Stop the scheduler interval.
   */
  public stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('[DeadlineScheduler] Stopped deadline monitoring scheduler');
    }
  }

  /**
   * Invalidate cached emitted events for a hackathon (e.g. when organizer modifies deadline).
   */
  public invalidateHackathon(hackathonId: string): void {
    this.emittedOpens.delete(hackathonId);
    this.emittedDeadlines.delete(hackathonId);
  }

  /**
   * Clear all tracked event records (useful in tests).
   */
  public clear(): void {
    this.emittedOpens.clear();
    this.emittedDeadlines.clear();
  }

  /**
   * Check all active hackathons against currentTime and emit state transitions idempotently.
   */
  public async checkDeadlines(currentTime: Date = new Date()): Promise<{
    opened: string[];
    closed: string[];
  }> {
    if (this.isChecking) return { opened: [], closed: [] };
    this.isChecking = true;

    const opened: string[] = [];
    const closed: string[] = [];

    try {
      const now = currentTime.getTime();

      // Query hackathons that are not in DRAFT or COMPLETED state
      const hackathons = await prisma.hackathon.findMany({
        where: {
          status: {
            notIn: ['DRAFT', 'COMPLETED'],
          },
        },
        select: {
          id: true,
          status: true,
          subStartTime: true,
          subEndTime: true,
        },
      });

      for (const h of hackathons) {
        const opensAt = new Date(h.subStartTime).getTime();
        const deadline = new Date(h.subEndTime).getTime();

        // 1. Check window open transition (now >= opensAt and now < deadline)
        if (now >= opensAt && now < deadline) {
          if (!this.emittedOpens.has(h.id)) {
            this.emittedOpens.add(h.id);
            opened.push(h.id);
            await SubmissionWindowService.emitWindowOpened(h.id, h.subStartTime);
          }
        }

        // 2. Check deadline reached transition (now >= deadline)
        if (now >= deadline) {
          if (!this.emittedDeadlines.has(h.id)) {
            this.emittedDeadlines.add(h.id);
            closed.push(h.id);
            await SubmissionWindowService.emitDeadlineReached(h.id, h.subEndTime);
          }
        }
      }
    } catch (err) {
      console.error('[DeadlineScheduler] Error evaluating deadlines:', err);
    } finally {
      this.isChecking = false;
    }

    return { opened, closed };
  }
}

export const deadlineScheduler = DeadlineSchedulerService.getInstance();
