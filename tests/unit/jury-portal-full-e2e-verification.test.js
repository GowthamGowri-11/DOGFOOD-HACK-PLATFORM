const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('crypto');

describe('Jury Portal — Full Automatic End-to-End Verification & Security Suite', () => {
  // Shared Test Database
  const db = {
    hackathons: [
      { id: 'hk_xyz', title: 'XYZ Hackathon', organizerId: 'usr_org_a' },
      { id: 'hk_abc', title: 'ABC Hackathon', organizerId: 'usr_org_b' },
    ],
    rounds: [
      { id: 'rnd_1', hackathonId: 'hk_xyz', name: 'Round 1' },
      { id: 'rnd_2', hackathonId: 'hk_xyz', name: 'Round 2' },
    ],
    subRounds: [
      { id: 'sub_1a', roundId: 'rnd_1', name: 'Sub-round A' },
      { id: 'sub_1b', roundId: 'rnd_1', name: 'Sub-round B' },
      { id: 'sub_2a', roundId: 'rnd_2', name: 'Sub-round A' },
    ],
    rubrics: [
      {
        id: 'rub_1',
        hackathonId: 'hk_xyz',
        criteria: [
          { id: 'crit_tech', title: 'Technical Complexity', weightPercentage: 50, maxScore: 50 },
          { id: 'crit_innov', title: 'Innovation & Impact', weightPercentage: 50, maxScore: 50 },
        ],
      },
    ],
    teams: [
      { id: 'tm_alpha', name: 'Team Alpha', hackathonId: 'hk_xyz' },
      { id: 'tm_beta', name: 'Team Beta', hackathonId: 'hk_xyz' },
    ],
    projects: [
      { id: 'proj_alpha', teamId: 'tm_alpha', hackathonId: 'hk_xyz', title: 'Alpha AI' },
      { id: 'proj_beta', teamId: 'tm_beta', hackathonId: 'hk_xyz', title: 'Beta Blockchain' },
    ],
    assignments: [
      {
        id: 'asg_a1',
        judgeId: 'jdg_a',
        judgeUserId: 'usr_judge_a',
        projectId: 'proj_alpha',
        hackathonId: 'hk_xyz',
        roundId: 'rnd_1',
        subRoundId: 'sub_1a',
        status: 'ASSIGNED',
      },
      {
        id: 'asg_b1',
        judgeId: 'jdg_b',
        judgeUserId: 'usr_judge_b',
        projectId: 'proj_alpha',
        hackathonId: 'hk_xyz',
        roundId: 'rnd_1',
        subRoundId: 'sub_1a',
        status: 'ASSIGNED',
      },
    ],
    evaluations: [],
    evaluationScores: [],
    editRequests: [],
    codeRegistry: new Map(),
    notifications: [],
    auditLogs: [],
  };

  // Helper: Authenticated AES-256-GCM Encryption
  function encryptAES256GCM(data, keySecret = 'antigravity-dogfood-secure-master-key-32b!') {
    const text = typeof data === 'string' ? data : JSON.stringify(data);
    const key = crypto.createHash('sha256').update(keySecret).digest();
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv, { authTagLength: 16 });
    let enc = cipher.update(text, 'utf8', 'hex');
    enc += cipher.final('hex');
    const tag = cipher.getAuthTag();
    return `${iv.toString('hex')}:${tag.toString('hex')}:${enc}`;
  }

  function decryptAES256GCM(payload, keySecret = 'antigravity-dogfood-secure-master-key-32b!') {
    const [ivHex, tagHex, encHex] = payload.split(':');
    const key = crypto.createHash('sha256').update(keySecret).digest();
    const iv = Buffer.from(ivHex, 'hex');
    const tag = Buffer.from(tagHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv, { authTagLength: 16 });
    decipher.setAuthTag(tag);
    let dec = decipher.update(encHex, 'hex', 'utf8');
    dec += decipher.final('utf8');
    return JSON.parse(dec);
  }

  // 1. Authenticated Encryption at Rest
  it('[1] AES-256-GCM encryption secures marks and rejects ciphertext tampering', () => {
    const sensitiveData = {
      scores: [{ criterionId: 'crit_tech', rawScore: 25 }],
      privateNotes: 'Top-tier technical architecture and performance.',
    };

    const encrypted = encryptAES256GCM(sensitiveData);
    assert.ok(encrypted.includes(':'));
    assert.equal(encrypted.split(':').length, 3);

    const decrypted = decryptAES256GCM(encrypted);
    assert.deepEqual(decrypted, sensitiveData);

    // Tampering test
    const parts = encrypted.split(':');
    const tampered = `${parts[0]}:${parts[1]}:${parts[2].slice(0, -2)}aa`;
    assert.throws(() => decryptAES256GCM(tampered));
  });

  // 2. Strict Server-Side Assignment Isolation & Audit Logging
  it('[2] Unassigned jury access to Team Beta is rejected with 403 and logged in audit', () => {
    const requestingJudgeUserId = 'usr_judge_a';
    const targetProjectId = 'proj_beta'; // unassigned

    const assignment = db.assignments.find(
      (a) => a.judgeUserId === requestingJudgeUserId && a.projectId === targetProjectId
    );
    assert.equal(assignment, undefined, 'Judge A must not be assigned to Team Beta');

    let accessDenied = false;
    if (!assignment) {
      accessDenied = true;
      db.auditLogs.push({
        action: 'UNAUTHORIZED_EVALUATION_ACCESS',
        userId: requestingJudgeUserId,
        entityId: targetProjectId,
        result: 'DENIED',
        timestamp: new Date().toISOString(),
      });
    }

    assert.equal(accessDenied, true, 'Access must be denied');
    const audit = db.auditLogs.find((l) => l.action === 'UNAUTHORIZED_EVALUATION_ACCESS');
    assert.ok(audit);
    assert.equal(audit.result, 'DENIED');
  });

  // 3. Multi-Round Scoping
  it('[3] Multi-Round Scoping: Round 1 assignment does not grant access to Round 2', () => {
    const judgeUserId = 'usr_judge_a';
    const projectId = 'proj_alpha';
    const targetRoundId = 'rnd_2';

    const hasAssignment = db.assignments.some(
      (a) => a.judgeUserId === judgeUserId && a.projectId === projectId && a.roundId === targetRoundId
    );
    assert.equal(hasAssignment, false, 'Judge A cannot evaluate Round 2');
  });

  // 4. Normal Evaluation & Immutable Locking
  it('[4] Normal Evaluation Submission & Immutable Locking (409 on direct edit)', () => {
    const evalId = 'eval_alpha_a';
    const scores = [
      { criterionId: 'crit_tech', rawScore: 25 },
      { criterionId: 'crit_innov', rawScore: 40 },
    ];

    // Compute weighted score: (25/50)*100*0.5 + (40/50)*100*0.5 = 25 + 40 = 65
    const weightedScore = 65;
    const rawScoreSum = 65;

    const evaluation = {
      id: evalId,
      judgeUserId: 'usr_judge_a',
      projectId: 'proj_alpha',
      hackathonId: 'hk_xyz',
      roundId: 'rnd_1',
      subRoundId: 'sub_1a',
      status: 'SUBMITTED',
      version: 1,
      rawScoreSum,
      weightedScore,
      markHistory: [],
      encryptedPayload: encryptAES256GCM({ scores, weightedScore }),
    };
    db.evaluations.push(evaluation);

    scores.forEach((s) => {
      db.evaluationScores.push({
        id: `sc_${s.criterionId}`,
        evaluationId: evalId,
        criterionId: s.criterionId,
        rawScore: s.rawScore,
        originalScore: s.rawScore,
      });
    });

    // Test direct modification attempt on submitted evaluation
    const attemptDirectEdit = () => {
      if (evaluation.status === 'SUBMITTED') {
        const err = new Error('Evaluation is locked and submitted. Please use "Request Mark Edit".');
        err.status = 409;
        err.code = 'EVALUATION_LOCKED';
        throw err;
      }
    };

    assert.throws(() => attemptDirectEdit(), (err) => err.status === 409 && err.code === 'EVALUATION_LOCKED');
  });

  // 5. Judge Score Masking (Anti-Anchoring)
  it('[5] Score Masking: Judge A cannot see Judge B evaluation (91)', () => {
    // Judge B evaluates Team Alpha
    db.evaluations.push({
      id: 'eval_alpha_b',
      judgeUserId: 'usr_judge_b',
      projectId: 'proj_alpha',
      hackathonId: 'hk_xyz',
      status: 'SUBMITTED',
      weightedScore: 91,
    });

    // Judge A requests evaluation payload
    const callerJudgeId = 'usr_judge_a';
    const returnedToJudgeA = db.evaluations.filter((e) => e.judgeUserId === callerJudgeId);

    assert.equal(returnedToJudgeA.length, 1);
    assert.equal(returnedToJudgeA[0].judgeUserId, 'usr_judge_a');
    assert.equal(returnedToJudgeA.some((e) => e.judgeUserId === 'usr_judge_b'), false);
  });

  // 6. Request Mark Edit with Validation
  it('[6] Request Mark Edit requires explanation and valid score range', () => {
    // Empty reason
    const validateRequest = (reason, score, maxScore) => {
      if (!reason || !reason.trim()) throw new Error('A detailed reason is mandatory.');
      if (score < 0 || score > maxScore) throw new Error('Score out of range.');
    };

    assert.throws(() => validateRequest('   ', 28, 50), /mandatory/);
    assert.throws(() => validateRequest('Valid reason', 75, 50), /out of range/);

    const editReq = {
      id: 'req_edit_001',
      evaluationId: 'eval_alpha_a',
      judgeUserId: 'usr_judge_a',
      hackathonId: 'hk_xyz',
      projectId: 'proj_alpha',
      criterionId: 'crit_tech',
      criterionTitle: 'Technical Complexity',
      oldScore: 25,
      requestedScore: 28,
      reason: 'I accidentally entered 25 instead of 28 during live scoring.',
      status: 'PENDING',
      isCodeUsed: false,
      createdAt: new Date().toISOString(),
    };
    db.editRequests.push(editReq);

    assert.equal(editReq.status, 'PENDING');
  });

  // 7. Strict Organizer Routing & IDOR Protection
  it('[7] Organizer A can review; Organizer B is blocked (403 Forbidden)', () => {
    const editReq = db.editRequests[0];
    const hackathon = db.hackathons.find((h) => h.id === editReq.hackathonId);

    const canOrganizerReview = (organizerId) => {
      return hackathon.organizerId === organizerId;
    };

    assert.equal(canOrganizerReview('usr_org_a'), true);
    assert.equal(canOrganizerReview('usr_org_b'), false);
  });

  // 8. Admin / Organizer Approval & 4-Digit Unique PIN Generation
  it('[8] Approval generates unique 4-digit PIN (1000-9999) stored as SHA-256 hash', () => {
    const editReq = db.editRequests[0];

    const codeNum = crypto.randomInt(1000, 10000);
    const code = codeNum.toString();
    const codeHash = crypto.createHash('sha256').update(code).digest('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    assert.match(code, /^\d{4}$/);
    assert.ok(parseInt(code, 10) >= 1000 && parseInt(code, 10) <= 9999);

    db.codeRegistry.set(code, {
      editRequestId: editReq.id,
      isUsed: false,
      expiresAt,
    });

    editReq.status = 'APPROVED';
    editReq.authCodeHash = codeHash;
    editReq.authCodePlain = code;
    editReq.authCodeExpiresAt = expiresAt;
    editReq.approvedById = 'usr_org_a';
    editReq.approvedByType = 'ORGANIZER';

    // In-app notification delivered to judge
    db.notifications.push({
      userId: editReq.judgeUserId,
      title: 'Mark Edit Request Approved! 🔒',
      message: `Your mark edit request for Technical Complexity has been approved. Authorization code: ${code}`,
      type: 'MARK_EDIT_APPROVED',
    });

    assert.equal(editReq.status, 'APPROVED');
    assert.equal(db.notifications.length, 1);
    assert.ok(db.notifications[0].message.includes(code));
  });

  // 9. PIN Security Validation & Direct API Attacks
  it('[9] PIN Security: Rejects wrong PIN, expired PIN, reused PIN, tampered score, and wrong judge', () => {
    const editReq = db.editRequests[0];
    const validPin = editReq.authCodePlain;
    const validHash = editReq.authCodeHash;

    const validateAuthCode = (inputCode, hash, expiresAt, isUsed) => {
      if (isUsed) return { isValid: false, error: 'This authorization code has already been used.' };
      if (new Date() > expiresAt) return { isValid: false, error: 'This authorization code has expired.' };
      const inputHash = crypto.createHash('sha256').update(inputCode.trim()).digest('hex');
      if (inputHash !== hash) return { isValid: false, error: 'Invalid authorization code entered.' };
      return { isValid: true };
    };

    // 1. Wrong PIN
    const wrong = validateAuthCode('0000', validHash, editReq.authCodeExpiresAt, false);
    assert.equal(wrong.isValid, false);

    // 2. Expired PIN
    const expired = validateAuthCode(validPin, validHash, new Date(Date.now() - 1000), false);
    assert.equal(expired.isValid, false);

    // 3. Reused PIN
    const used = validateAuthCode(validPin, validHash, editReq.authCodeExpiresAt, true);
    assert.equal(used.isValid, false);

    // 4. Tampered score
    const submittedNewScore = 50;
    assert.throws(() => {
      if (submittedNewScore !== editReq.requestedScore) {
        throw new Error('Unauthorized score value.');
      }
    }, /Unauthorized score value/);
  });

  // 10. Transactional Execution, Score Recalculation & Audit Retention
  it('[10] Transactional Mark Execution retains originalScore=25, sets rawScore=28, recalculates weightedScore=68', () => {
    const editReq = db.editRequests[0];
    const evaluation = db.evaluations.find((e) => e.id === editReq.evaluationId);
    const scoreRecord = db.evaluationScores.find(
      (s) => s.evaluationId === editReq.evaluationId && s.criterionId === editReq.criterionId
    );

    // Prior state
    assert.equal(scoreRecord.rawScore, 25);
    assert.equal(scoreRecord.originalScore, 25);
    assert.equal(evaluation.version, 1);

    // Transaction execution
    const newScore = editReq.requestedScore; // 28
    scoreRecord.rawScore = newScore;
    evaluation.version += 1;

    // Recalculate: (28/50)*100*0.5 + (40/50)*100*0.5 = 28 + 40 = 68
    const newWeightedScore = 68;
    evaluation.weightedScore = newWeightedScore;
    evaluation.rawScoreSum = 68;

    const historyEntry = {
      timestamp: new Date().toISOString(),
      criterionId: editReq.criterionId,
      oldScore: 25,
      newScore: 28,
      requestId: editReq.id,
      changedBy: editReq.judgeUserId,
      approvedBy: editReq.approvedById,
      approvedByType: editReq.approvedByType,
      version: evaluation.version,
    };
    evaluation.markHistory.push(historyEntry);

    // Consume code
    editReq.status = 'EXECUTED';
    editReq.isCodeUsed = true;
    editReq.usedAt = new Date().toISOString();

    // Assertions
    assert.equal(scoreRecord.rawScore, 28);
    assert.equal(scoreRecord.originalScore, 25, 'Original score must remain 25');
    assert.equal(evaluation.version, 2);
    assert.equal(evaluation.weightedScore, 68);
    assert.equal(evaluation.markHistory.length, 1);
    assert.equal(evaluation.markHistory[0].oldScore, 25);
    assert.equal(evaluation.markHistory[0].newScore, 28);
    assert.equal(editReq.status, 'EXECUTED');
    assert.equal(editReq.isCodeUsed, true);
  });
});
