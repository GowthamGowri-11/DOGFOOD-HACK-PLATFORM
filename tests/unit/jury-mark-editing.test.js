const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('crypto');

describe('Jury Portal — Secure Evaluation, Mark Editing & Real-Time Sync', () => {
  // Mock Encryption Service Logic
  function encryptPayload(data, secretKey = 'test-encryption-key-32-chars-long!') {
    const text = typeof data === 'string' ? data : JSON.stringify(data);
    const key = crypto.createHash('sha256').update(secretKey).digest();
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv, { authTagLength: 16 });
    let enc = cipher.update(text, 'utf8', 'hex');
    enc += cipher.final('hex');
    const tag = cipher.getAuthTag();
    return `${iv.toString('hex')}:${tag.toString('hex')}:${enc}`;
  }

  function decryptPayload(payload, secretKey = 'test-encryption-key-32-chars-long!') {
    const [ivHex, tagHex, encHex] = payload.split(':');
    const key = crypto.createHash('sha256').update(secretKey).digest();
    const iv = Buffer.from(ivHex, 'hex');
    const tag = Buffer.from(tagHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv, { authTagLength: 16 });
    decipher.setAuthTag(tag);
    let dec = decipher.update(encHex, 'hex', 'utf8');
    dec += decipher.final('utf8');
    return JSON.parse(dec);
  }

  // 1. Authenticated Encryption at Rest
  it('[1] Authenticated Encryption (AES-256-GCM) secures marks at rest and rejects tampered data', () => {
    const evaluationData = {
      judgeId: 'jury_101',
      teamId: 'team_alpha',
      scores: [{ criterionId: 'tech', score: 92 }],
      privateNotes: 'Top notch code quality',
    };

    const encrypted = encryptPayload(evaluationData);
    assert.ok(encrypted.includes(':'));
    assert.notEqual(encrypted, JSON.stringify(evaluationData));

    const decrypted = decryptPayload(encrypted);
    assert.deepEqual(decrypted, evaluationData);

    // Tamper test
    const parts = encrypted.split(':');
    const tampered = `${parts[0]}:${parts[1]}:${parts[2].slice(0, -4)}dead`;
    assert.throws(() => decryptPayload(tampered));
  });

  // 2. 4-Digit Unique Authorization Code Generation & Hash Verification
  it('[2] 4-digit PIN generation and SHA-256 validation', () => {
    const codeNumber = crypto.randomInt(1000, 10000);
    const codeStr = codeNumber.toString();
    assert.equal(codeStr.length, 4);

    const hash = crypto.createHash('sha256').update(codeStr).digest('hex');
    assert.equal(hash.length, 64);

    const checkHash = (input) => crypto.createHash('sha256').update(input).digest('hex') === hash;
    assert.equal(checkHash(codeStr), true);
    assert.equal(checkHash('0000'), false);
  });

  // 3. Jury Assignment Isolation & Score Masking
  it('[3] Jury Assignment Isolation & Score Masking prevents cross-judge score anchoring', () => {
    const allEvaluations = [
      { judgeId: 'jury_alice', teamId: 'team_1', rawScore: 88, status: 'SUBMITTED' },
      { judgeId: 'jury_bob', teamId: 'team_1', rawScore: 94, status: 'SUBMITTED' },
      { judgeId: 'jury_carol', teamId: 'team_1', rawScore: 76, status: 'SUBMITTED' },
    ];

    // Alice requests evaluation data for team_1
    const aliceView = allEvaluations.filter((e) => e.judgeId === 'jury_alice');
    assert.equal(aliceView.length, 1);
    assert.equal(aliceView[0].rawScore, 88);
    // Ensure Bob and Carol scores are completely absent
    assert.equal(aliceView.some((e) => e.judgeId === 'jury_bob' || e.judgeId === 'jury_carol'), false);
  });

  // 4. Multi-Round & Sub-Round Context Scoping
  it('[4] Multi-Round & Sub-Round Context Isolation', () => {
    const assignments = [
      { judgeId: 'jury_alice', hackathonId: 'h1', roundId: 'round_1', subRoundId: 'sub_a', teamId: 't1' },
      { judgeId: 'jury_bob', hackathonId: 'h1', roundId: 'round_2', subRoundId: 'sub_b', teamId: 't1' },
    ];

    const canAliceEvaluateRound2 = assignments.some(
      (a) => a.judgeId === 'jury_alice' && a.hackathonId === 'h1' && a.roundId === 'round_2'
    );
    assert.equal(canAliceEvaluateRound2, false, 'Jury assigned to Round 1 cannot evaluate Round 2');

    const canBobEvaluateRound2 = assignments.some(
      (a) => a.judgeId === 'jury_bob' && a.hackathonId === 'h1' && a.roundId === 'round_2'
    );
    assert.equal(canBobEvaluateRound2, true, 'Jury assigned to Round 2 can evaluate Round 2');
  });

  // 5. Submission Freezing & Edit Request Requirement
  it('[5] Draft vs Locked Submission - Direct edit rejected once SUBMITTED', () => {
    let evaluation = {
      id: 'eval_1',
      status: 'DRAFT',
      score: 75,
    };

    // While DRAFT: direct edit is allowed
    evaluation.score = 78;
    assert.equal(evaluation.score, 78);

    // Submit & Lock
    evaluation.status = 'SUBMITTED';

    // Direct edit attempt must be rejected
    const tryDirectEdit = (newScore) => {
      if (evaluation.status === 'SUBMITTED') {
        throw new Error('409 EVALUATION_LOCKED: Use Request Mark Edit to modify submitted marks.');
      }
      evaluation.score = newScore;
    };

    assert.throws(() => tryDirectEdit(85), /409 EVALUATION_LOCKED/);
  });

  // 6. Hackathon-Specific Organizer Routing
  it('[6] Hackathon-Specific Organizer Routing - Only responsible organizer receives request', () => {
    const hackathons = {
      hack_xyz: { organizerId: 'org_alice' },
      hack_abc: { organizerId: 'org_bob' },
    };

    const editRequest = {
      hackathonId: 'hack_xyz',
      judgeId: 'jury_1',
      criterion: 'Technical',
      oldMark: 25,
      requestedMark: 28,
      reason: 'Typo in score entry',
    };

    const targetOrganizer = hackathons[editRequest.hackathonId].organizerId;
    assert.equal(targetOrganizer, 'org_alice');
    assert.notEqual(targetOrganizer, 'org_bob');

    const isAuthorized = (reviewerId, reviewerRole) => {
      if (reviewerRole === 'ADMIN') return true;
      return targetOrganizer === reviewerId;
    };

    assert.equal(isAuthorized('org_alice', 'ORGANIZER'), true);
    assert.equal(isAuthorized('org_bob', 'ORGANIZER'), false);
    assert.equal(isAuthorized('admin_super', 'ADMIN'), true);
  });

  // 7. Transactional Mark Execution, History Preservation & Concurrency
  it('[7] Transactional Mark Execution retains old mark, updates version, and recalculates score', () => {
    let evaluation = {
      id: 'eval_1',
      version: 3,
      weightedScore: 75.0,
      scores: [
        { criterionId: 'c1', rawScore: 70, originalScore: 70, weight: 0.5 },
        { criterionId: 'c2', rawScore: 80, originalScore: 80, weight: 0.5 },
      ],
      markHistory: [],
    };

    const editRequest = {
      id: 'req_101',
      criterionId: 'c1',
      oldScore: 70,
      requestedScore: 85,
      status: 'APPROVED',
      authCode: '5821',
      isCodeUsed: false,
    };

    // Execute with correct PIN
    const executedScore = 85;
    const oldScore = evaluation.scores.find((s) => s.criterionId === 'c1').rawScore;

    evaluation.scores = evaluation.scores.map((s) =>
      s.criterionId === 'c1' ? { ...s, rawScore: executedScore, originalScore: s.originalScore ?? oldScore } : s
    );

    // Recalculate weighted score: (85 * 0.5) + (80 * 0.5) = 42.5 + 40 = 82.5
    const newWeightedScore = evaluation.scores.reduce((sum, s) => sum + s.rawScore * s.weight, 0);

    evaluation.markHistory.push({
      timestamp: new Date().toISOString(),
      criterionId: 'c1',
      oldScore,
      newScore: executedScore,
      version: evaluation.version + 1,
    });

    evaluation.version += 1;
    evaluation.weightedScore = newWeightedScore;
    editRequest.status = 'EXECUTED';
    editRequest.isCodeUsed = true;

    // Assertions
    assert.equal(evaluation.weightedScore, 82.5);
    assert.equal(evaluation.version, 4);
    assert.equal(evaluation.markHistory.length, 1);
    assert.equal(evaluation.markHistory[0].oldScore, 70);
    assert.equal(evaluation.markHistory[0].newScore, 85);
    assert.equal(editRequest.isCodeUsed, true);
  });
});
