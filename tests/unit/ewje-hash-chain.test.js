const { describe, it } = require('node:test');
const assert = require('node:assert');
const crypto = require('crypto');

const GENESIS_HASH =
  '0000000000000000000000000000000000000000000000000000000000000000_GENESIS_EWJE_V2';

function canonicalJson(obj) {
  if (obj === null || typeof obj !== 'object') {
    return JSON.stringify(obj);
  }
  if (Array.isArray(obj)) {
    return '[' + obj.map((item) => canonicalJson(item)).join(',') + ']';
  }
  const keys = Object.keys(obj).sort();
  const pairs = keys.map((key) => `${JSON.stringify(key)}:${canonicalJson(obj[key])}`);
  return '{' + pairs.join(',') + '}';
}

function computeEventHash(previousHash, payload) {
  const serialized = canonicalJson(payload);
  return crypto.createHash('sha256').update(`${previousHash}${serialized}`, 'utf8').digest('hex');
}

function verifyChain(events) {
  if (!events || events.length === 0) {
    return { valid: true, totalEvents: 0, headHash: GENESIS_HASH };
  }
  let expectedPrevHash = GENESIS_HASH;
  for (let i = 0; i < events.length; i++) {
    const e = events[i];
    if (e.previousHash !== expectedPrevHash) {
      return {
        valid: false,
        brokenAtEventId: e.id,
        errorIndex: i,
        expectedHash: expectedPrevHash,
        actualHash: e.previousHash,
      };
    }
    const payload = {
      id: e.id,
      eventId: e.eventId,
      judgeId: e.judgeId,
      projectId: e.projectId,
      criterionId: e.criterionId,
      value: e.value,
      previousValue: e.previousValue ?? null,
      reason: e.reason ?? null,
      actorId: e.actorId,
      actorRole: e.actorRole,
      createdAt: e.createdAt,
    };
    const computed = computeEventHash(expectedPrevHash, payload);
    if (computed !== e.hash) {
      return {
        valid: false,
        brokenAtEventId: e.id,
        errorIndex: i,
        expectedHash: computed,
        actualHash: e.hash,
      };
    }
    expectedPrevHash = e.hash;
  }
  return { valid: true, totalEvents: events.length, headHash: expectedPrevHash };
}

describe('EWJE v2 Hash Chain & Tamper Detection Tests', () => {
  it('Verifies valid append-only hash chain', () => {
    const events = [];
    let prevHash = GENESIS_HASH;

    for (let i = 1; i <= 5; i++) {
      const payload = {
        id: `event_${i}`,
        eventId: 'hack_001',
        judgeId: `judge_${i}`,
        projectId: 'proj_001',
        criterionId: 'crit_impact',
        value: 80 + i,
        previousValue: null,
        reason: null,
        actorId: `user_${i}`,
        actorRole: 'JUDGE',
        createdAt: '2026-09-28T12:00:00.000Z',
      };
      const hash = computeEventHash(prevHash, payload);
      events.push({ ...payload, previousHash: prevHash, hash });
      prevHash = hash;
    }

    const verification = verifyChain(events);
    assert.strictEqual(verification.valid, true);
    assert.strictEqual(verification.totalEvents, 5);
    assert.strictEqual(verification.headHash, events[4].hash);
  });

  it('Detects payload modification (tampering) and pinpoints broken record', () => {
    const events = [];
    let prevHash = GENESIS_HASH;

    for (let i = 1; i <= 5; i++) {
      const payload = {
        id: `event_${i}`,
        eventId: 'hack_001',
        judgeId: `judge_${i}`,
        projectId: 'proj_001',
        criterionId: 'crit_impact',
        value: 80 + i,
        previousValue: null,
        reason: null,
        actorId: `user_${i}`,
        actorRole: 'JUDGE',
        createdAt: '2026-09-28T12:00:00.000Z',
      };
      const hash = computeEventHash(prevHash, payload);
      events.push({ ...payload, previousHash: prevHash, hash });
      prevHash = hash;
    }

    // Tamper with event 3 value (e.g. modify score from 83 to 99)
    events[2].value = 99;

    const verification = verifyChain(events);
    assert.strictEqual(verification.valid, false);
    assert.strictEqual(verification.brokenAtEventId, 'event_3');
    assert.strictEqual(verification.errorIndex, 2);
  });
});
