const test = require('node:test');
const assert = require('node:assert/strict');

// ---------------------------------------------------------------------------
// 1. TEAM SIZE & READINESS CALCULATION
// ---------------------------------------------------------------------------

function calculateReadiness(memberCount, minTeamSize, maxTeamSize) {
  const isReady = memberCount >= minTeamSize && memberCount <= maxTeamSize;
  const missingMembers = Math.max(0, minTeamSize - memberCount);
  const canAcceptMore = memberCount < maxTeamSize;

  let statusLabel = 'READY';
  if (memberCount < minTeamSize) {
    statusLabel = `INCOMPLETE (Needs ${missingMembers} more)`;
  } else if (memberCount > maxTeamSize) {
    statusLabel = 'OVERSIZED';
  }

  return {
    isReady,
    memberCount,
    minTeamSize,
    maxTeamSize,
    missingMembers,
    canAcceptMore,
    statusLabel,
  };
}

test('Team Rules - [1] Team within bounds (2-4 members with 3 members) is marked READY', () => {
  const result = calculateReadiness(3, 2, 4);
  assert.equal(result.isReady, true);
  assert.equal(result.missingMembers, 0);
  assert.equal(result.canAcceptMore, true);
  assert.equal(result.statusLabel, 'READY');
});

test('Team Rules - [2] Team below minimum (min 3, count 1) is marked INCOMPLETE', () => {
  const result = calculateReadiness(1, 3, 5);
  assert.equal(result.isReady, false);
  assert.equal(result.missingMembers, 2);
  assert.equal(result.canAcceptMore, true);
  assert.ok(result.statusLabel.includes('INCOMPLETE (Needs 2 more)'));
});

test('Team Rules - [3] Team at exact maximum capacity cannot accept more members', () => {
  const result = calculateReadiness(4, 2, 4);
  assert.equal(result.isReady, true);
  assert.equal(result.canAcceptMore, false);
});

test('Team Rules - [4] Solo hackathon (min 1, max 1) with 1 member is READY and full', () => {
  const result = calculateReadiness(1, 1, 1);
  assert.equal(result.isReady, true);
  assert.equal(result.canAcceptMore, false);
});

// ---------------------------------------------------------------------------
// 2. INVITE TOKEN EXPIRATION
// ---------------------------------------------------------------------------

function isInviteValid(invite, currentTime) {
  if (invite.status !== 'PENDING') return false;
  return new Date(currentTime) <= new Date(invite.expiresAt);
}

test('Team Rules - [5] Active invite token before expiry is valid', () => {
  const invite = {
    status: 'PENDING',
    expiresAt: '2026-10-15T00:00:00Z',
  };
  const now = '2026-10-10T00:00:00Z';
  assert.equal(isInviteValid(invite, now), true);
});

test('Team Rules - [6] Expired invite token is invalid', () => {
  const invite = {
    status: 'PENDING',
    expiresAt: '2026-10-01T00:00:00Z',
  };
  const now = '2026-10-10T00:00:00Z';
  assert.equal(isInviteValid(invite, now), false);
});

test('Team Rules - [7] Already accepted invite token is invalid', () => {
  const invite = {
    status: 'ACCEPTED',
    expiresAt: '2026-10-20T00:00:00Z',
  };
  const now = '2026-10-10T00:00:00Z';
  assert.equal(isInviteValid(invite, now), false);
});
