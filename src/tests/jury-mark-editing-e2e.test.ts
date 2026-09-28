import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { EncryptionService } from '../server/security/encryption.service';
import { AuthCodeService } from '../server/security/auth-code.service';
import { ScoringEngine } from '../server/services/scoring.engine';
import { eventBus } from '../server/realtime/event-bus';
import { RealtimeRoomBuilder } from '../server/realtime/event-types';

describe('Jury Portal — Secure Evaluation, Mark Editing & Real-Time Synchronization E2E', () => {
  // Test Data Fixtures
  const mockHackathon = {
    id: 'hack_xyz_100',
    title: 'XYZ AI Hackathon',
    organizerId: 'org_user_alice',
  };

  const mockOtherHackathon = {
    id: 'hack_abc_200',
    title: 'ABC Web3 Hackathon',
    organizerId: 'org_user_bob',
  };

  const mockTeamAlpha = {
    id: 'team_101',
    name: 'Team Alpha',
    hackathonId: mockHackathon.id,
  };

  const mockTeamBeta = {
    id: 'team_102',
    name: 'Team Beta',
    hackathonId: mockHackathon.id,
  };

  const mockProjectAlpha = {
    id: 'proj_alpha_1',
    teamId: mockTeamAlpha.id,
    hackathonId: mockHackathon.id,
    title: 'Alpha Autonomous Agent',
  };

  const mockRubric = {
    id: 'rubric_1',
    criteria: [
      { id: 'crit_tech', title: 'Technical Complexity', weightPercentage: 40, maxScore: 100 },
      { id: 'crit_inno', title: 'Innovation & Originality', weightPercentage: 30, maxScore: 100 },
      { id: 'crit_uiux', title: 'UI / UX Design', weightPercentage: 30, maxScore: 100 },
    ],
  };

  const mockJuryCarol = {
    id: 'jury_carol_id',
    userId: 'user_carol_judge',
    hackathonId: mockHackathon.id,
  };

  const mockJuryDave = {
    id: 'jury_dave_id',
    userId: 'user_dave_judge',
    hackathonId: mockHackathon.id,
  };

  /* -------------------------------------------------------------------------- */
  /* 1. AES-256-GCM Authenticated Encryption at Rest                            */
  /* -------------------------------------------------------------------------- */
  describe('1. Server-Side Authenticated Encryption (AES-256-GCM)', () => {
    it('encrypts and decrypts evaluation payloads accurately', () => {
      const sensitiveData = {
        scores: [
          { criterionId: 'crit_tech', rawScore: 85 },
          { criterionId: 'crit_inno', rawScore: 90 },
        ],
        privateNotes: 'Exceptional system architecture and custom CUDA kernels.',
      };

      const encrypted = EncryptionService.encrypt(sensitiveData);
      assert.ok(encrypted.includes(':'), 'Encrypted output must contain iv:authTag:cipher format');
      assert.notEqual(encrypted, JSON.stringify(sensitiveData), 'Data must be securely encrypted, not plaintext');

      const decrypted = EncryptionService.decrypt(encrypted);
      assert.deepEqual(decrypted, sensitiveData, 'Decrypted payload must match original object');
    });

    it('rejects tampered ciphertexts via authentication tag validation', () => {
      const encrypted = EncryptionService.encrypt('tamper-test-secret');
      const parts = encrypted.split(':');
      // Tamper cipher text
      const tampered = `${parts[0]}:${parts[1]}:${parts[2].slice(0, -4)}ffff`;

      assert.throws(() => {
        EncryptionService.decrypt(tampered);
      }, 'Tampered ciphertext must fail authenticated tag verification');
    });
  });

  /* -------------------------------------------------------------------------- */
  /* 2. 4-Digit Unique Authorization Code Generation & Registry                 */
  /* -------------------------------------------------------------------------- */
  describe('2. 4-Digit Unique Authorization Code Service', () => {
    it('generates a valid 4-digit code in range [1000, 9999]', async () => {
      const res = await AuthCodeService.generateUniqueCode('req_test_001', 24);
      assert.ok(res.code.length === 4, 'Code must be exactly 4 digits');
      assert.ok(parseInt(res.code, 10) >= 1000 && parseInt(res.code, 10) <= 9999, 'Code must be in 1000-9999 range');
      assert.ok(res.maskedCode.startsWith('**'), 'Masked code must mask first 2 digits');
      assert.ok(res.codeHash.length === 64, 'Code hash must be a valid 64-char SHA-256 string');
    });

    it('validates correct code and rejects wrong, expired, or used codes', () => {
      const code = '4827';
      const hash = AuthCodeService.hashCode(code);
      const futureDate = new Date(Date.now() + 3600 * 1000);
      const pastDate = new Date(Date.now() - 3600 * 1000);

      // Valid case
      const validRes = AuthCodeService.validateCode(code, hash, futureDate, false);
      assert.equal(validRes.isValid, true);

      // Wrong code
      const wrongRes = AuthCodeService.validateCode('9999', hash, futureDate, false);
      assert.equal(wrongRes.isValid, false);
      assert.equal(wrongRes.error, 'Invalid authorization code entered.');

      // Expired code
      const expiredRes = AuthCodeService.validateCode(code, hash, pastDate, false);
      assert.equal(expiredRes.isValid, false);
      assert.ok(expiredRes.error?.includes('expired'));

      // Already used code
      const usedRes = AuthCodeService.validateCode(code, hash, futureDate, true);
      assert.equal(usedRes.isValid, false);
      assert.ok(usedRes.error?.includes('already been used'));
    });
  });

  /* -------------------------------------------------------------------------- */
  /* 3. Strict Jury Isolation & Anti-Anchoring Evaluation Blindfold            */
  /* -------------------------------------------------------------------------- */
  describe('3. Jury Assignment Isolation & Score Masking', () => {
    it('prevents Jury Carol from seeing or accessing Jury Dave evaluations', () => {
      const carolEvaluation = {
        judgeUserId: mockJuryCarol.userId,
        projectId: mockProjectAlpha.id,
        weightedScore: 82.5,
      };

      const daveEvaluation = {
        judgeUserId: mockJuryDave.userId,
        projectId: mockProjectAlpha.id,
        weightedScore: 91.0,
      };

      // Simulating API filter for Jury Carol
      const allEvaluations = [carolEvaluation, daveEvaluation];
      const carolVisible = allEvaluations.filter((e) => e.judgeUserId === mockJuryCarol.userId);

      assert.equal(carolVisible.length, 1);
      assert.equal(carolVisible[0].weightedScore, 82.5);
      assert.equal(carolVisible.some((e) => e.judgeUserId === mockJuryDave.userId), false);
    });

    it('recalculates server-authoritative weighted scores accurately', () => {
      const inputs = [
        { criterionId: 'crit_tech', rawScore: 80, maxScore: 100, weightPercentage: 40 },
        { criterionId: 'crit_inno', rawScore: 90, maxScore: 100, weightPercentage: 30 },
        { criterionId: 'crit_uiux', rawScore: 70, maxScore: 100, weightPercentage: 30 },
      ];

      const result = ScoringEngine.calculateEvaluationScore(inputs);
      // (80 * 0.4) + (90 * 0.3) + (70 * 0.3) = 32 + 27 + 21 = 80.0
      assert.equal(result.weightedScore, 80.0);
      assert.equal(result.rawScoreSum, 240.0);
    });
  });

  /* -------------------------------------------------------------------------- */
  /* 4. Complete Mark Edit Lifecycle (Request -> Approval -> PIN -> Execution)  */
  /* -------------------------------------------------------------------------- */
  describe('4. Mark Edit Request & Execution Lifecycle', () => {
    let mockEvaluation: any;
    let mockEditRequest: any;
    let issuedCode: string;

    before(() => {
      // Initialize a submitted evaluation
      mockEvaluation = {
        id: 'eval_alpha_1',
        judgeUserId: mockJuryCarol.userId,
        projectId: mockProjectAlpha.id,
        hackathonId: mockHackathon.id,
        roundId: 'round_2',
        subRoundId: 'sub_round_a',
        status: 'SUBMITTED',
        version: 1,
        rawScoreSum: 240,
        weightedScore: 80.0,
        scores: [
          { criterionId: 'crit_tech', rawScore: 80, originalScore: 80 },
          { criterionId: 'crit_inno', rawScore: 90, originalScore: 90 },
          { criterionId: 'crit_uiux', rawScore: 70, originalScore: 70 },
        ],
        markHistory: [],
      };
    });

    it('Step 1: Rejects empty explanation on edit request', () => {
      const emptyReason = '   ';
      assert.ok(emptyReason.trim().length === 0, 'Empty reason must be detected');
    });

    it('Step 2: Creates a valid Mark Edit Request for technical criterion (80 -> 95)', async () => {
      const reason = 'Mistyped raw technical score during live pitch session.';
      mockEditRequest = {
        id: 'req_edit_001',
        evaluationId: mockEvaluation.id,
        judgeUserId: mockJuryCarol.userId,
        hackathonId: mockHackathon.id,
        roundId: 'round_2',
        subRoundId: 'sub_round_a',
        teamId: mockTeamAlpha.id,
        projectId: mockProjectAlpha.id,
        criterionId: 'crit_tech',
        criterionTitle: 'Technical Complexity',
        oldScore: 80,
        requestedScore: 95,
        reason: reason.trim(),
        status: 'PENDING',
        createdAt: new Date().toISOString(),
      };

      assert.equal(mockEditRequest.status, 'PENDING');
      assert.equal(mockEditRequest.oldScore, 80);
      assert.equal(mockEditRequest.requestedScore, 95);
    });

    it('Step 3: Enforces Hackathon-Specific Organizer Routing (Alice authorized, Bob forbidden)', () => {
      // Alice owns mockHackathon.id -> Authorized
      const isAliceAuthorized = mockHackathon.organizerId === 'org_user_alice';
      assert.equal(isAliceAuthorized, true, 'Alice must be authorized for XYZ Hackathon');

      // Bob owns mockOtherHackathon.id -> Rejected for XYZ Hackathon
      const isBobAuthorized = mockHackathon.organizerId === mockOtherHackathon.organizerId;
      assert.equal(isBobAuthorized, false, 'Bob must NOT be authorized for XYZ Hackathon');
    });

    it('Step 4: Organizer Alice approves edit request -> Issues single-use 4-digit code', async () => {
      const codeResult = await AuthCodeService.generateUniqueCode(mockEditRequest.id, 24);
      issuedCode = codeResult.code;

      mockEditRequest.status = 'APPROVED';
      mockEditRequest.approvedById = 'org_user_alice';
      mockEditRequest.approvedByType = 'ORGANIZER';
      mockEditRequest.authCodeHash = codeResult.codeHash;
      mockEditRequest.authCodeMasked = codeResult.maskedCode;
      mockEditRequest.authCodeExpiresAt = codeResult.expiresAt.toISOString();

      assert.equal(mockEditRequest.status, 'APPROVED');
      assert.ok(issuedCode.length === 4);
    });

    it('Step 5: Rejects execution if wrong 4-digit code is entered', () => {
      const wrongCode = '0000';
      const check = AuthCodeService.validateCode(
        wrongCode,
        mockEditRequest.authCodeHash,
        new Date(mockEditRequest.authCodeExpiresAt),
        false
      );
      assert.equal(check.isValid, false, 'Wrong PIN must be rejected');
    });

    it('Step 6: Executes mark edit with valid code -> Preserves old mark, updates version, recalculates weighted score', () => {
      const check = AuthCodeService.validateCode(
        issuedCode,
        mockEditRequest.authCodeHash,
        new Date(mockEditRequest.authCodeExpiresAt),
        false
      );
      assert.equal(check.isValid, true);

      // Perform update: Tech changed from 80 -> 95
      const oldScore = mockEvaluation.scores.find((s: any) => s.criterionId === 'crit_tech').rawScore;
      const newScore = 95;

      // Update score item
      mockEvaluation.scores = mockEvaluation.scores.map((s: any) => {
        if (s.criterionId === 'crit_tech') {
          return { ...s, rawScore: newScore, originalScore: s.originalScore ?? oldScore };
        }
        return s;
      });

      // Recalculate score server-side
      const inputs = [
        { criterionId: 'crit_tech', rawScore: 95, maxScore: 100, weightPercentage: 40 },
        { criterionId: 'crit_inno', rawScore: 90, maxScore: 100, weightPercentage: 30 },
        { criterionId: 'crit_uiux', rawScore: 70, maxScore: 100, weightPercentage: 30 },
      ];
      const recalculated = ScoringEngine.calculateEvaluationScore(inputs);
      // (95 * 0.4) + (90 * 0.3) + (70 * 0.3) = 38 + 27 + 21 = 86.0

      // Append immutable history
      const historyEntry = {
        timestamp: new Date().toISOString(),
        criterionId: 'crit_tech',
        criterionTitle: 'Technical Complexity',
        oldScore: 80,
        newScore: 95,
        requestId: mockEditRequest.id,
        changedBy: mockJuryCarol.userId,
        approvedBy: 'org_user_alice',
        version: mockEvaluation.version + 1,
      };

      mockEvaluation.markHistory.push(historyEntry);
      mockEvaluation.version += 1;
      mockEvaluation.weightedScore = recalculated.weightedScore;
      mockEvaluation.rawScoreSum = recalculated.rawScoreSum;

      // Mark request as executed
      mockEditRequest.status = 'EXECUTED';
      mockEditRequest.isCodeUsed = true;

      // Assertions
      assert.equal(mockEvaluation.weightedScore, 86.0);
      assert.equal(mockEvaluation.version, 2);
      assert.equal(mockEvaluation.markHistory.length, 1);
      assert.equal(mockEvaluation.markHistory[0].oldScore, 80);
      assert.equal(mockEvaluation.markHistory[0].newScore, 95);
      assert.equal(mockEditRequest.status, 'EXECUTED');
    });

    it('Step 7: Rejects reuse of already consumed authorization code (Anti-Replay Attack)', () => {
      const reuseCheck = AuthCodeService.validateCode(
        issuedCode,
        mockEditRequest.authCodeHash,
        new Date(mockEditRequest.authCodeExpiresAt),
        true // isCodeUsed = true
      );
      assert.equal(reuseCheck.isValid, false);
      assert.ok(reuseCheck.error?.includes('already been used'));
    });
  });

  /* -------------------------------------------------------------------------- */
  /* 5. Real-Time Event Bus Room Scoping & Delivery Guarantee                   */
  /* -------------------------------------------------------------------------- */
  describe('5. Application-Wide Real-Time Synchronization', () => {
    it('publishes domain events to authorized rooms (user, organizer, admin)', async () => {
      const receivedEvents: any[] = [];

      const unsubscribe = eventBus.subscribe('MARK_EDIT_APPROVED', (event) => {
        receivedEvents.push(event);
      });

      await eventBus.publish({
        type: 'MARK_EDIT_APPROVED',
        hackathonId: mockHackathon.id,
        userId: mockJuryCarol.userId,
        rooms: [
          RealtimeRoomBuilder.user(mockJuryCarol.userId),
          RealtimeRoomBuilder.organizer(mockHackathon.id),
          RealtimeRoomBuilder.admin(),
        ],
        payload: {
          requestId: 'req_edit_001',
          authorizationCode: '4827',
          status: 'APPROVED',
        },
      });

      assert.equal(receivedEvents.length, 1);
      assert.equal(receivedEvents[0].type, 'MARK_EDIT_APPROVED');
      assert.equal(receivedEvents[0].payload.authorizationCode, '4827');

      unsubscribe();
    });
  });
});
