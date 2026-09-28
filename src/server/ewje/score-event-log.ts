/**
 * EWJE v2 — Append-Only Score Event Log Service
 * Enforces append-only rules, score validation, correction handling, and latest score extraction.
 */

import crypto from 'crypto';
import { GENESIS_HASH_EWJE_V2 } from './ewje-config';
import { computeEventHash, verifyChain } from './hash-chain';
import { ScoreEvent, Rubric, JudgeProjectSubmission } from './ewje-types';

export interface AppendScoreEventInput {
  eventId: string;
  judgeId: string;
  projectId: string;
  criterionId: string;
  value: number;
  reason?: string;
  actorId: string;
  actorRole: 'JUDGE' | 'ORGANIZER';
  rubric: Rubric;
  assignedJudgesForProject?: string[];
  isJudgingActive?: boolean;
}

export class ScoreEventLogError extends Error {
  constructor(message: string, public code: string = 'SCORE_EVENT_ERROR') {
    super(message);
    this.name = 'ScoreEventLogError';
  }
}

export class ScoreEventLogManager {
  private eventsByHackathon: Map<string, ScoreEvent[]> = new Map();

  /**
   * Get all score events for a hackathon/event (chronological order)
   */
  public getEvents(eventId: string): ScoreEvent[] {
    return this.eventsByHackathon.get(eventId) || [];
  }

  /**
   * Set pre-existing events (for loading from DB or tests)
   */
  public loadEvents(eventId: string, events: ScoreEvent[]): void {
    this.eventsByHackathon.set(eventId, [...events]);
  }

  /**
   * Append a new score event with strict validation and hash chaining
   */
  public appendScoreEvent(input: AppendScoreEventInput): ScoreEvent {
    // 1. Check if judging is active
    if (input.isJudgingActive === false) {
      throw new ScoreEventLogError(
        'Judging is closed for this event. Submissions are forbidden.',
        'JUDGING_CLOSED'
      );
    }

    // 2. Validate criterion existence and rubric range
    const criterion = input.rubric.criteria.find((c) => c.id === input.criterionId);
    if (!criterion) {
      throw new ScoreEventLogError(
        `Criterion '${input.criterionId}' not found in rubric version ${input.rubric.version}.`,
        'CRITERION_NOT_FOUND'
      );
    }

    if (input.value < criterion.scaleMin || input.value > criterion.scaleMax) {
      throw new ScoreEventLogError(
        `Score value ${input.value} is outside valid rubric range [${criterion.scaleMin}, ${criterion.scaleMax}].`,
        'SCORE_OUT_OF_RANGE'
      );
    }

    // 3. Validate assignment
    if (
      input.assignedJudgesForProject &&
      !input.assignedJudgesForProject.includes(input.judgeId)
    ) {
      throw new ScoreEventLogError(
        `Judge '${input.judgeId}' is not assigned to project '${input.projectId}'.`,
        'UNASSIGNED_PROJECT'
      );
    }

    const events = this.eventsByHackathon.get(input.eventId) || [];
    const previousHeadHash =
      events.length > 0 ? events[events.length - 1].hash : GENESIS_HASH_EWJE_V2;

    // Find previous score for (judge, project, criterion)
    let previousValue: number | null = null;
    for (let i = events.length - 1; i >= 0; i--) {
      const e = events[i];
      if (
        e.judgeId === input.judgeId &&
        e.projectId === input.projectId &&
        e.criterionId === input.criterionId
      ) {
        previousValue = e.value;
        break;
      }
    }

    // If this is a correction (previous value exists) and actor is ORGANIZER, reason is required
    if (previousValue !== null && input.actorRole === 'ORGANIZER' && !input.reason) {
      throw new ScoreEventLogError(
        'Organizer corrections require an explicit reason.',
        'CORRECTION_REASON_REQUIRED'
      );
    }

    const eventId = `sev_${crypto.randomUUID()}`;
    const createdAt = new Date().toISOString();

    const payload = {
      id: eventId,
      eventId: input.eventId,
      judgeId: input.judgeId,
      projectId: input.projectId,
      criterionId: input.criterionId,
      value: input.value,
      previousValue: previousValue,
      reason: input.reason || null,
      actorId: input.actorId,
      actorRole: input.actorRole,
      createdAt,
    };

    const hash = computeEventHash(previousHeadHash, payload);

    const newEvent: ScoreEvent = {
      ...payload,
      previousHash: previousHeadHash,
      hash,
    };

    events.push(newEvent);
    this.eventsByHackathon.set(input.eventId, events);

    return newEvent;
  }

  /**
   * Reconstruct latest scores in use and complete submissions for EWJE
   */
  public extractLatestSubmissions(
    eventId: string,
    rubric: Rubric
  ): {
    completeSubmissions: JudgeProjectSubmission[];
    incompleteSubmissions: { judgeId: string; projectId: string; missingCriteria: string[] }[];
  } {
    const events = this.getEvents(eventId);
    // Map of `judge::project` -> Map of `criterionId` -> value
    const latestMap = new Map<string, Map<string, number>>();

    for (const e of events) {
      const key = `${e.judgeId}::${e.projectId}`;
      if (!latestMap.has(key)) {
        latestMap.set(key, new Map());
      }
      latestMap.get(key)!.set(e.criterionId, e.value);
    }

    const completeSubmissions: JudgeProjectSubmission[] = [];
    const incompleteSubmissions: {
      judgeId: string;
      projectId: string;
      missingCriteria: string[];
    }[] = [];

    latestMap.forEach((critScores, key) => {
      const [judgeId, projectId] = key.split('::');
      const missing: string[] = [];
      const scoresRecord: Record<string, number> = {};

      for (const c of rubric.criteria) {
        if (critScores.has(c.id)) {
          scoresRecord[c.id] = critScores.get(c.id)!;
        } else {
          missing.push(c.id);
        }
      }

      if (missing.length === 0) {
        completeSubmissions.push({
          judgeId,
          projectId,
          scores: scoresRecord,
        });
      } else {
        incompleteSubmissions.push({
          judgeId,
          projectId,
          missingCriteria: missing,
        });
      }
    });

    // Deterministic sort
    completeSubmissions.sort((a, b) => {
      if (a.projectId !== b.projectId) return a.projectId.localeCompare(b.projectId);
      return a.judgeId.localeCompare(b.judgeId);
    });

    return { completeSubmissions, incompleteSubmissions };
  }

  /**
   * Verify integrity of the score events chain
   */
  public verify(eventId: string) {
    const events = this.getEvents(eventId);
    return verifyChain(events);
  }
}

export const globalScoreEventLog = new ScoreEventLogManager();
