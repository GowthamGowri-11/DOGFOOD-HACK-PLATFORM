/**
 * EWJE v2 — Append-Only Hash Chain & Verification Engine
 * Implements canonical JSON serialization and SHA-256 hash chaining.
 */

import crypto from 'crypto';
import { GENESIS_HASH_EWJE_V2 } from './ewje-config';
import { ScoreEvent, HashChainVerificationResult } from './ewje-types';

/**
 * Deterministic canonical JSON representation (sorted keys, no unnecessary whitespace)
 */
export function canonicalJson(obj: any): string {
  if (obj === null || typeof obj !== 'object') {
    return JSON.stringify(obj);
  }
  if (Array.isArray(obj)) {
    return '[' + obj.map((item) => canonicalJson(item)).join(',') + ']';
  }
  const keys = Object.keys(obj).sort();
  const pairs = keys.map((key) => {
    return `${JSON.stringify(key)}:${canonicalJson(obj[key])}`;
  });
  return '{' + pairs.join(',') + '}';
}

/**
 * Compute SHA-256 hash of a score event payload chained to previousHash
 */
export function computeEventHash(
  previousHash: string,
  payload: {
    id: string;
    eventId: string;
    judgeId: string;
    projectId: string;
    criterionId: string;
    value: number;
    previousValue?: number | null;
    reason?: string | null;
    actorId: string;
    actorRole: 'JUDGE' | 'ORGANIZER';
    createdAt: string;
  }
): string {
  const serializedPayload = canonicalJson(payload);
  const input = `${previousHash}${serializedPayload}`;
  return crypto.createHash('sha256').update(input, 'utf8').digest('hex');
}

/**
 * Verify an entire sequence of score events for an event
 */
export function verifyChain(events: ScoreEvent[]): HashChainVerificationResult {
  if (!events || events.length === 0) {
    return {
      valid: true,
      totalEvents: 0,
      headHash: GENESIS_HASH_EWJE_V2,
    };
  }

  let expectedPrevHash = GENESIS_HASH_EWJE_V2;

  for (let i = 0; i < events.length; i++) {
    const event = events[i];

    // Check previous hash pointer
    if (event.previousHash !== expectedPrevHash) {
      return {
        valid: false,
        brokenAtEventId: event.id,
        errorIndex: i,
        expectedHash: expectedPrevHash,
        actualHash: event.previousHash,
        totalEvents: events.length,
        headHash: events[events.length - 1].hash,
      };
    }

    // Recompute event hash
    const payload = {
      id: event.id,
      eventId: event.eventId,
      judgeId: event.judgeId,
      projectId: event.projectId,
      criterionId: event.criterionId,
      value: event.value,
      previousValue: event.previousValue ?? null,
      reason: event.reason ?? null,
      actorId: event.actorId,
      actorRole: event.actorRole,
      createdAt: event.createdAt,
    };

    const computed = computeEventHash(expectedPrevHash, payload);
    if (computed !== event.hash) {
      return {
        valid: false,
        brokenAtEventId: event.id,
        errorIndex: i,
        expectedHash: computed,
        actualHash: event.hash,
        totalEvents: events.length,
        headHash: events[events.length - 1].hash,
      };
    }

    expectedPrevHash = event.hash;
  }

  return {
    valid: true,
    totalEvents: events.length,
    headHash: expectedPrevHash,
  };
}
