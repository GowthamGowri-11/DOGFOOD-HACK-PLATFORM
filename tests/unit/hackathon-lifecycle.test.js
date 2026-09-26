const test = require('node:test');
const assert = require('node:assert/strict');

// ---------------------------------------------------------------------------
// 1. DATE VALIDATION TESTS
// ---------------------------------------------------------------------------

function validateDates(dates) {
  const errors = [];
  const regStart = new Date(dates.regStartTime).getTime();
  const regEnd = new Date(dates.regEndTime).getTime();
  const eventStart = new Date(dates.eventStartTime).getTime();
  const eventEnd = new Date(dates.eventEndTime).getTime();
  const subStart = new Date(dates.subStartTime).getTime();
  const subEnd = new Date(dates.subEndTime).getTime();
  const judgingStart = new Date(dates.judgingStartTime).getTime();
  const judgingEnd = new Date(dates.judgingEndTime).getTime();

  if (isNaN(regStart) || isNaN(regEnd) || regStart >= regEnd) {
    errors.push('Registration start time must be strictly before registration end time.');
  }
  if (isNaN(eventStart) || isNaN(eventEnd) || eventStart >= eventEnd) {
    errors.push('Event start time must be strictly before event end time.');
  }
  if (isNaN(subStart) || isNaN(subEnd) || subStart >= subEnd) {
    errors.push('Submission start time must be strictly before submission end time.');
  }
  if (isNaN(judgingStart) || isNaN(judgingEnd) || judgingStart >= judgingEnd) {
    errors.push('Judging start time must be strictly before judging end time.');
  }
  if (!isNaN(subStart) && !isNaN(regStart) && subStart < regStart) {
    errors.push('Submission window cannot start before registration opens.');
  }
  if (!isNaN(judgingStart) && !isNaN(subStart) && judgingStart < subStart) {
    errors.push('Judging window cannot start before submissions open.');
  }
  if (!isNaN(eventEnd) && !isNaN(eventStart) && eventEnd < regStart) {
    errors.push('Event conclusion cannot occur before registration begins.');
  }

  return { isValid: errors.length === 0, errors };
}

test('Lifecycle - Valid event dates pass validation cleanly', () => {
  const validDates = {
    regStartTime: '2026-10-01T00:00:00Z',
    regEndTime: '2026-10-10T23:59:59Z',
    subStartTime: '2026-10-05T00:00:00Z',
    subEndTime: '2026-10-15T23:59:59Z',
    judgingStartTime: '2026-10-16T00:00:00Z',
    judgingEndTime: '2026-10-20T23:59:59Z',
    eventStartTime: '2026-10-01T00:00:00Z',
    eventEndTime: '2026-10-22T23:59:59Z',
  };

  const result = validateDates(validDates);
  assert.equal(result.isValid, true);
  assert.equal(result.errors.length, 0);
});

test('Lifecycle - regStart >= regEnd is rejected', () => {
  const invalid = {
    regStartTime: '2026-10-10T00:00:00Z',
    regEndTime: '2026-10-01T00:00:00Z',
    subStartTime: '2026-10-05T00:00:00Z',
    subEndTime: '2026-10-15T23:59:59Z',
    judgingStartTime: '2026-10-16T00:00:00Z',
    judgingEndTime: '2026-10-20T23:59:59Z',
    eventStartTime: '2026-10-01T00:00:00Z',
    eventEndTime: '2026-10-22T23:59:59Z',
  };

  const result = validateDates(invalid);
  assert.equal(result.isValid, false);
  assert.ok(result.errors.some((e) => e.includes('Registration start time must be strictly before')));
});

test('Lifecycle - submission window starting before registration is rejected', () => {
  const invalid = {
    regStartTime: '2026-10-05T00:00:00Z',
    regEndTime: '2026-10-10T23:59:59Z',
    subStartTime: '2026-10-01T00:00:00Z', // Before reg start
    subEndTime: '2026-10-15T23:59:59Z',
    judgingStartTime: '2026-10-16T00:00:00Z',
    judgingEndTime: '2026-10-20T23:59:59Z',
    eventStartTime: '2026-10-01T00:00:00Z',
    eventEndTime: '2026-10-22T23:59:59Z',
  };

  const result = validateDates(invalid);
  assert.equal(result.isValid, false);
  assert.ok(result.errors.some((e) => e.includes('Submission window cannot start before registration opens')));
});

test('Lifecycle - judging window starting before submission window is rejected', () => {
  const invalid = {
    regStartTime: '2026-10-01T00:00:00Z',
    regEndTime: '2026-10-10T23:59:59Z',
    subStartTime: '2026-10-10T00:00:00Z',
    subEndTime: '2026-10-15T23:59:59Z',
    judgingStartTime: '2026-10-05T00:00:00Z', // Before sub start
    judgingEndTime: '2026-10-20T23:59:59Z',
    eventStartTime: '2026-10-01T00:00:00Z',
    eventEndTime: '2026-10-22T23:59:59Z',
  };

  const result = validateDates(invalid);
  assert.equal(result.isValid, false);
  assert.ok(result.errors.some((e) => e.includes('Judging window cannot start before submissions open')));
});

// ---------------------------------------------------------------------------
// 2. STATE MACHINE LIFECYCLE TRANSITIONS
// ---------------------------------------------------------------------------

const ALLOWED_TRANSITIONS = {
  DRAFT: ['PUBLISHED'],
  PUBLISHED: ['DRAFT', 'REGISTRATION_OPEN', 'EVENT_ACTIVE'],
  REGISTRATION_OPEN: ['REGISTRATION_CLOSED', 'EVENT_ACTIVE'],
  REGISTRATION_CLOSED: ['REGISTRATION_OPEN', 'EVENT_ACTIVE', 'SUBMISSION_OPEN'],
  EVENT_ACTIVE: ['SUBMISSION_OPEN', 'SUBMISSION_CLOSED', 'JUDGING'],
  SUBMISSION_OPEN: ['SUBMISSION_CLOSED', 'JUDGING'],
  SUBMISSION_CLOSED: ['JUDGING', 'RESULTS_PENDING'],
  JUDGING: ['RESULTS_PENDING', 'RESULTS_PUBLISHED'],
  RESULTS_PENDING: ['RESULTS_PUBLISHED', 'JUDGING'],
  RESULTS_PUBLISHED: ['COMPLETED'],
  COMPLETED: [],
};

function canTransition(current, target) {
  if (current === target) return true;
  const allowed = ALLOWED_TRANSITIONS[current] || [];
  return allowed.includes(target);
}

test('State Machine - DRAFT can transition to PUBLISHED', () => {
  assert.equal(canTransition('DRAFT', 'PUBLISHED'), true);
});

test('State Machine - DRAFT cannot jump straight to RESULTS_PUBLISHED or COMPLETED', () => {
  assert.equal(canTransition('DRAFT', 'RESULTS_PUBLISHED'), false);
  assert.equal(canTransition('DRAFT', 'COMPLETED'), false);
  assert.equal(canTransition('DRAFT', 'JUDGING'), false);
});

test('State Machine - COMPLETED is a terminal state', () => {
  assert.equal(canTransition('COMPLETED', 'DRAFT'), false);
  assert.equal(canTransition('COMPLETED', 'PUBLISHED'), false);
  assert.equal(canTransition('COMPLETED', 'EVENT_ACTIVE'), false);
});

// ---------------------------------------------------------------------------
// 3. PRE-PUBLISH READINESS VALIDATION
// ---------------------------------------------------------------------------

function validateForPublishing(hackathon) {
  const missing = [];
  if (!hackathon.title || hackathon.title.trim().length < 3) {
    missing.push('Hackathon title must be at least 3 characters.');
  }
  if (!hackathon.description || hackathon.description.trim().length < 20) {
    missing.push('Hackathon description must be at least 20 characters.');
  }
  if (!hackathon.organizationName || hackathon.organizationName.trim().length < 2) {
    missing.push('Organization name is required.');
  }
  if (!hackathon.slug || hackathon.slug.trim().length < 3) {
    missing.push('Valid URL slug is required.');
  }
  if (!hackathon.tracks || hackathon.tracks.length === 0) {
    missing.push('At least one competition track is required before publishing.');
  }

  const dateCheck = validateDates(hackathon);
  if (!dateCheck.isValid) {
    missing.push(...dateCheck.errors);
  }

  return { isReady: missing.length === 0, missing };
}

test('Publish Validator - Incomplete hackathon (no tracks, short description) is rejected', () => {
  const incomplete = {
    title: 'Hi',
    description: 'Short',
    organizationName: '',
    slug: 'hi',
    tracks: [],
    regStartTime: '2026-10-01T00:00:00Z',
    regEndTime: '2026-10-10T23:59:59Z',
    subStartTime: '2026-10-05T00:00:00Z',
    subEndTime: '2026-10-15T23:59:59Z',
    judgingStartTime: '2026-10-16T00:00:00Z',
    judgingEndTime: '2026-10-20T23:59:59Z',
    eventStartTime: '2026-10-01T00:00:00Z',
    eventEndTime: '2026-10-22T23:59:59Z',
  };

  const check = validateForPublishing(incomplete);
  assert.equal(check.isReady, false);
  assert.ok(check.missing.length >= 4);
});

test('Publish Validator - Fully configured hackathon with tracks passes publishing check', () => {
  const complete = {
    title: 'Global AI Championship 2026',
    description: 'An enterprise-grade hackathon focused on autonomous LLM agent systems and scalable infrastructure.',
    organizationName: 'Global AI Foundation',
    slug: 'global-ai-championship-2026',
    tracks: [{ id: 'trk_1', title: 'Generative AI' }],
    regStartTime: '2026-10-01T00:00:00Z',
    regEndTime: '2026-10-10T23:59:59Z',
    subStartTime: '2026-10-05T00:00:00Z',
    subEndTime: '2026-10-15T23:59:59Z',
    judgingStartTime: '2026-10-16T00:00:00Z',
    judgingEndTime: '2026-10-20T23:59:59Z',
    eventStartTime: '2026-10-01T00:00:00Z',
    eventEndTime: '2026-10-22T23:59:59Z',
  };

  const check = validateForPublishing(complete);
  assert.equal(check.isReady, true);
  assert.equal(check.missing.length, 0);
});
