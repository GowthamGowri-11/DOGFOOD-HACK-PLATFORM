const test = require('node:test');
const assert = require('node:assert/strict');

// ---------------------------------------------------------------------------
// 1. TEAM MEMBER FORM BUILDER MODEL & VALIDATION
// ---------------------------------------------------------------------------

function validateFormField(field) {
  if (!field.label || typeof field.label !== 'string' || field.label.trim() === '') {
    return { isValid: false, error: 'Field label is required' };
  }
  const validTypes = ['TEXT', 'EMAIL', 'PHONE', 'NUMBER', 'TEXTAREA', 'SELECT', 'MULTI_SELECT', 'RADIO', 'CHECKBOX', 'DATE', 'URL'];
  if (!validTypes.includes(field.type)) {
    return { isValid: false, error: `Invalid field type: ${field.type}` };
  }
  if (['SELECT', 'MULTI_SELECT', 'RADIO', 'CHECKBOX'].includes(field.type)) {
    if (!field.options || !Array.isArray(field.options) || field.options.length === 0) {
      return { isValid: false, error: 'Choice field must contain at least one option' };
    }
  }
  return { isValid: true };
}

function validateFormSubmission(fields, responseValues) {
  for (const field of fields) {
    if (field.required) {
      const val = responseValues[field.id] || responseValues[field.label];
      if (val === undefined || val === null || String(val).trim() === '') {
        return { isValid: false, error: `Required field "${field.label}" is missing or empty` };
      }
    }
  }

  // Validate email field format
  const emailVal = responseValues['field_email'] || responseValues['email'] || responseValues['Email'];
  if (emailVal && (!String(emailVal).includes('@') || !String(emailVal).includes('.'))) {
    return { isValid: false, error: 'Invalid email address format' };
  }

  return { isValid: true };
}

// ---------------------------------------------------------------------------
// 2. FORM LIFECYCLE & VERSIONING
// ---------------------------------------------------------------------------

function publishForm(currentForm) {
  return {
    ...currentForm,
    status: 'PUBLISHED',
    version: (currentForm.version || 1) + 1,
    publishedAt: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// 3. TEAM CAPACITY & MEMBERSHIP ENFORCEMENT
// ---------------------------------------------------------------------------

function canAddMemberToTeam(team, newMemberEmail, maxTeamSize, existingMembersInHackathon) {
  // Check 1: Capacity
  if (team.members.length >= maxTeamSize) {
    return { allowed: false, error: `Team is full. Max capacity is ${maxTeamSize}.` };
  }

  // Check 2: Already in this team
  const normalizedEmail = newMemberEmail.toLowerCase().trim();
  if (team.members.some((m) => m.email.toLowerCase() === normalizedEmail)) {
    return { allowed: false, error: 'User is already a member of this team.' };
  }

  // Check 3: One-team-per-hackathon rule
  if (existingMembersInHackathon.includes(normalizedEmail)) {
    return { allowed: false, error: 'User is already part of another team in this hackathon.' };
  }

  return { allowed: true };
}

// ---------------------------------------------------------------------------
// TEST CASES
// ---------------------------------------------------------------------------

test('Form Builder - [1] Validates canonical text and choice fields correctly', () => {
  const textField = { id: 'f1', type: 'TEXT', label: 'Full Name', required: true };
  assert.equal(validateFormField(textField).isValid, true);

  const selectField = { id: 'f2', type: 'SELECT', label: 'Department', required: true, options: ['AI&DS', 'CSE'] };
  assert.equal(validateFormField(selectField).isValid, true);

  const invalidSelect = { id: 'f3', type: 'SELECT', label: 'Department', required: true, options: [] };
  assert.equal(validateFormField(invalidSelect).isValid, false);
});

test('Form Builder - [2] Form publishing increments version and sets status to PUBLISHED', () => {
  const draftForm = {
    hackathonId: 'hack-1',
    title: 'Team Member Form',
    status: 'DRAFT',
    version: 1,
    fields: [{ id: 'field_fullname', type: 'TEXT', label: 'Full Name', required: true }],
  };

  const published = publishForm(draftForm);
  assert.equal(published.status, 'PUBLISHED');
  assert.equal(published.version, 2);
  assert.ok(published.publishedAt);
});

test('Form Submission - [3] Rejects submission when required fields are missing', () => {
  const fields = [
    { id: 'field_fullname', label: 'Full Name', required: true },
    { id: 'field_email', label: 'Email', required: true },
    { id: 'field_github', label: 'GitHub URL', required: false },
  ];

  const incompleteResponse = {
    field_fullname: 'Rahul Kumar',
    // field_email missing
  };

  const result = validateFormSubmission(fields, incompleteResponse);
  assert.equal(result.isValid, false);
  assert.ok(result.error.includes('Email'));
});

test('Form Submission - [4] Rejects malformed email values', () => {
  const fields = [
    { id: 'field_fullname', label: 'Full Name', required: true },
    { id: 'field_email', label: 'Email', required: true },
  ];

  const badEmailResponse = {
    field_fullname: 'Rahul Kumar',
    field_email: 'not-an-email',
  };

  const result = validateFormSubmission(fields, badEmailResponse);
  assert.equal(result.isValid, false);
  assert.ok(result.error.includes('Invalid email'));
});

test('Form Submission - [5] Accepts complete, valid response', () => {
  const fields = [
    { id: 'field_fullname', label: 'Full Name', required: true },
    { id: 'field_email', label: 'Email', required: true },
    { id: 'field_dept', label: 'Department', required: true },
  ];

  const validResponse = {
    field_fullname: 'Priya Sharma',
    field_email: 'priya@apex.edu',
    field_dept: 'AI&DS',
  };

  const result = validateFormSubmission(fields, validResponse);
  assert.equal(result.isValid, true);
});

test('Team Membership - [6] Prevents adding member when team is at maximum capacity', () => {
  const team = {
    id: 'team-1',
    members: [{ email: 'alice@test.com' }, { email: 'bob@test.com' }, { email: 'charlie@test.com' }, { email: 'dave@test.com' }],
  };

  const check = canAddMemberToTeam(team, 'eve@test.com', 4, []);
  assert.equal(check.allowed, false);
  assert.ok(check.error.includes('full'));
});

test('Team Membership - [7] Prevents duplicate addition in the same team', () => {
  const team = {
    id: 'team-1',
    members: [{ email: 'alice@test.com' }, { email: 'bob@test.com' }],
  };

  const check = canAddMemberToTeam(team, 'alice@test.com', 4, []);
  assert.equal(check.allowed, false);
  assert.ok(check.error.includes('already a member'));
});

test('Team Membership - [8] Enforces ONE-TEAM-PER-HACKATHON rule across squads', () => {
  const team = {
    id: 'team-1',
    members: [{ email: 'alice@test.com' }],
  };

  const allHackathonMembers = ['alice@test.com', 'bob@test.com', 'charlie@test.com'];

  const check = canAddMemberToTeam(team, 'bob@test.com', 4, allHackathonMembers);
  assert.equal(check.allowed, false);
  assert.ok(check.error.includes('another team'));
});

test('Team Membership - [9] Immediate membership creation without approval queue (NON-APPROVAL WORKFLOW)', () => {
  const team = {
    id: 'team-1',
    members: [{ email: 'leader@test.com' }],
  };

  const check = canAddMemberToTeam(team, 'newmember@test.com', 4, ['leader@test.com']);
  assert.equal(check.allowed, true);

  // In the immediate workflow, adding immediately pushes member to active roster
  team.members.push({ email: 'newmember@test.com', isLeader: false, status: 'ACTIVE' });
  assert.equal(team.members.length, 2);
  assert.equal(team.members[1].status, 'ACTIVE'); // No PENDING state
});
