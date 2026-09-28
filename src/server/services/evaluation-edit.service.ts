import prisma from '@/lib/prisma';
import { EvaluationEditRepository } from '../repositories/evaluation-edit.repository';
import { JudgeRepository } from '../repositories/judge.repository';
import { AuthCodeService } from '../security/auth-code.service';
import { EncryptionService } from '../security/encryption.service';
import { ScoringEngine } from './scoring.engine';
import { AuditService } from './audit.service';
import { NotificationService } from './notification.service';
import { eventBus } from '../realtime/event-bus';
import { RealtimeRoomBuilder } from '../realtime/event-types';

export class EvaluationEditService {
  /**
   * 1. Jury Requests Mark Edit for a locked/submitted evaluation.
   */
  public static async requestMarkEdit(params: {
    judgeUserId: string;
    evaluationId: string;
    criterionId: string;
    requestedScore: number;
    reason: string;
  }) {
    const { judgeUserId, evaluationId, criterionId, requestedScore, reason } = params;

    // Validate reason is mandatory and non-empty
    if (!reason || reason.trim().length === 0) {
      throw {
        status: 400,
        code: 'VALIDATION_ERROR',
        message: 'A detailed explanation/reason is mandatory when requesting a mark edit.',
      };
    }

    // Fetch evaluation and verify ownership
    const evaluation = await prisma.evaluation.findUnique({
      where: { id: evaluationId },
      include: {
        project: {
          include: {
            team: true,
            hackathon: true,
          },
        },
        scores: true,
        rubric: {
          include: {
            criteria: true,
          },
        },
      },
    });

    if (!evaluation) {
      throw { status: 404, code: 'EVALUATION_NOT_FOUND', message: 'Evaluation record not found.' };
    }

    if (evaluation.judgeUserId !== judgeUserId) {
      throw {
        status: 403,
        code: 'FORBIDDEN',
        message: 'You are not authorized to request edits for another judge’s evaluation.',
      };
    }

    if (evaluation.status !== 'SUBMITTED') {
      throw {
        status: 400,
        code: 'EVALUATION_NOT_LOCKED',
        message: 'Evaluation is still in draft state and can be updated directly without an edit request.',
      };
    }

    // Verify criterion exists in active rubric
    const criterion = evaluation.rubric.criteria.find((c) => c.id === criterionId);
    if (!criterion) {
      throw {
        status: 400,
        code: 'CRITERION_NOT_FOUND',
        message: 'The specified criterion does not exist in this evaluation rubric.',
      };
    }

    if (requestedScore < 0 || requestedScore > criterion.maxScore) {
      throw {
        status: 400,
        code: 'SCORE_OUT_OF_RANGE',
        message: `Requested score ${requestedScore} is outside allowed range (0 to ${criterion.maxScore}).`,
      };
    }

    // Prevent duplicate pending edit requests for the same evaluation & criterion
    const existingActive = await EvaluationEditRepository.findActiveByEvaluationAndCriterion(
      evaluationId,
      criterionId
    );
    if (existingActive) {
      throw {
        status: 409,
        code: 'DUPLICATE_EDIT_REQUEST',
        message: 'An active edit request is already pending or approved for this criterion.',
      };
    }

    // Get current old score
    const currentScoreRecord = evaluation.scores.find((s) => s.criterionId === criterionId);
    const oldScore = currentScoreRecord ? currentScoreRecord.rawScore : 0;

    // Create edit request
    const editRequest = await EvaluationEditRepository.createRequest({
      evaluationId,
      judgeId: evaluation.judgeId,
      judgeUserId,
      hackathonId: evaluation.project.hackathonId,
      roundId: evaluation.roundId || undefined,
      subRoundId: evaluation.subRoundId || undefined,
      teamId: evaluation.project.teamId,
      projectId: evaluation.projectId,
      criterionId,
      criterionTitle: criterion.title,
      oldScore,
      requestedScore,
      reason: reason.trim(),
    });

    // Audit log
    await AuditService.log({
      userId: judgeUserId,
      hackathonId: evaluation.project.hackathonId,
      action: 'MARK_EDIT_REQUEST_CREATED',
      entityType: 'EvaluationEditRequest',
      entityId: editRequest.id,
      afterState: {
        team: evaluation.project.team.name,
        criterion: criterion.title,
        oldScore,
        requestedScore,
        reason: reason.trim(),
        roundId: evaluation.roundId,
        subRoundId: evaluation.subRoundId,
      },
    });

    // Notify Hackathon-Specific Organizer AND Admin
    const organizerId = evaluation.project.hackathon.organizerId;

    // 1. In-app notification to the specific organizer
    await NotificationService.sendNotification({
      userId: organizerId,
      title: 'Mark Edit Request Received',
      message: `A judge requested to edit marks for Team ${evaluation.project.team.name} (${criterion.title}: ${oldScore} → ${requestedScore}).`,
      linkUrl: `/organizer/mark-edit-requests`,
      type: 'MARK_EDIT_REQUESTED',
      entityType: 'EvaluationEditRequest',
      entityId: editRequest.id,
      hackathonId: evaluation.project.hackathonId,
      roundId: evaluation.roundId || undefined,
      subRoundId: evaluation.subRoundId || undefined,
    });

    // 2. Real-time event to Organizer room and Admin room
    await eventBus.publish({
      type: 'MARK_EDIT_REQUESTED',
      hackathonId: evaluation.project.hackathonId,
      projectId: evaluation.projectId,
      teamId: evaluation.project.teamId,
      userId: judgeUserId,
      actorId: judgeUserId,
      rooms: [
        RealtimeRoomBuilder.organizer(evaluation.project.hackathonId),
        RealtimeRoomBuilder.admin(),
        RealtimeRoomBuilder.user(organizerId),
      ],
      payload: {
        requestId: editRequest.id,
        teamName: evaluation.project.team.name,
        criterionTitle: criterion.title,
        oldScore,
        requestedScore,
        reason: reason.trim(),
        status: 'PENDING',
        hackathonTitle: evaluation.project.hackathon.title,
      },
    });

    return editRequest;
  }

  /**
   * 2. Review Edit Request (Approve or Reject by Organizer OR Admin).
   */
  public static async reviewEditRequest(params: {
    reviewerUserId: string;
    reviewerRole: 'ADMIN' | 'ORGANIZER';
    requestId: string;
    action: 'APPROVE' | 'REJECT';
    rejectionReason?: string;
  }) {
    const { reviewerUserId, reviewerRole, requestId, action, rejectionReason } = params;

    const request = await EvaluationEditRepository.findById(requestId);
    if (!request) {
      throw { status: 404, code: 'REQUEST_NOT_FOUND', message: 'Evaluation edit request not found.' };
    }

    if (request.status !== 'PENDING') {
      throw {
        status: 400,
        code: 'INVALID_STATE',
        message: `This edit request is already ${request.status.toLowerCase()} and cannot be reviewed again.`,
      };
    }

    // STRICT HACKATHON-SPECIFIC ORGANIZER ROUTING GUARD
    if (reviewerRole === 'ORGANIZER') {
      if (request.hackathon.organizerId !== reviewerUserId) {
        throw {
          status: 403,
          code: 'FORBIDDEN',
          message: 'You are not authorized to review edit requests for a hackathon you do not organize.',
        };
      }
    }

    if (action === 'REJECT') {
      const reason = rejectionReason?.trim() || 'Request was declined by reviewer.';
      const updated = await EvaluationEditRepository.rejectRequest(requestId, {
        rejectedById: reviewerUserId,
        rejectedReason: reason,
      });

      // Audit log
      await AuditService.log({
        userId: reviewerUserId,
        hackathonId: request.hackathonId,
        action: 'MARK_EDIT_REJECTED',
        entityType: 'EvaluationEditRequest',
        entityId: requestId,
        afterState: {
          rejectedByRole: reviewerRole,
          rejectionReason: reason,
        },
      });

      // In-app notification to the Judge
      await NotificationService.sendNotification({
        userId: request.judgeUserId,
        title: 'Mark Edit Request Rejected',
        message: `Your edit request for ${request.criterionTitle} (Team ${request.project.team.name}) was rejected. Reason: ${reason}`,
        linkUrl: `/judge/assignments/${request.evaluation.assignmentId || request.evaluationId}`,
        type: 'MARK_EDIT_REJECTED',
        entityType: 'EvaluationEditRequest',
        entityId: requestId,
        hackathonId: request.hackathonId,
      });

      // Realtime event
      await eventBus.publish({
        type: 'MARK_EDIT_REJECTED',
        hackathonId: request.hackathonId,
        projectId: request.projectId,
        userId: request.judgeUserId,
        actorId: reviewerUserId,
        rooms: [
          RealtimeRoomBuilder.user(request.judgeUserId),
          RealtimeRoomBuilder.organizer(request.hackathonId),
          RealtimeRoomBuilder.admin(),
        ],
        payload: {
          requestId,
          status: 'REJECTED',
          rejectedReason: reason,
          reviewedByRole: reviewerRole,
        },
      });

      return updated;
    }

    // APPROVAL WORKFLOW: Generate 4-digit unique code
    const codeResult = await AuthCodeService.generateUniqueCode(requestId, 24);

    const updated = await EvaluationEditRepository.approveRequest(requestId, {
      approvedById: reviewerUserId,
      approvedByType: reviewerRole,
      authCodeHash: codeResult.codeHash,
      authCodeMasked: codeResult.maskedCode,
      authCodePlain: codeResult.code,
      authCodeExpiresAt: codeResult.expiresAt,
    });

    // Audit log (Never log raw PIN in audit)
    await AuditService.log({
      userId: reviewerUserId,
      hackathonId: request.hackathonId,
      action: 'MARK_EDIT_APPROVED',
      entityType: 'EvaluationEditRequest',
      entityId: requestId,
      afterState: {
        approvedByRole: reviewerRole,
        authCodeMasked: codeResult.maskedCode,
        expiresAt: codeResult.expiresAt,
        criterion: request.criterionTitle,
        newMark: request.requestedScore,
      },
    });

    // In-app notification to the Judge with the single-use PIN
    await NotificationService.sendNotification({
      userId: request.judgeUserId,
      title: 'Mark Edit Request Approved! 🔒',
      message: `Your mark edit request for ${request.criterionTitle} has been approved. Authorization code: ${codeResult.code}. You can now edit the mark.`,
      linkUrl: `/judge/assignments/${request.evaluation.assignmentId || request.evaluationId}`,
      type: 'MARK_EDIT_APPROVED',
      entityType: 'EvaluationEditRequest',
      entityId: requestId,
      hackathonId: request.hackathonId,
    });

    // Real-time notification to the Judge
    await eventBus.publish({
      type: 'MARK_EDIT_APPROVED',
      hackathonId: request.hackathonId,
      projectId: request.projectId,
      userId: request.judgeUserId,
      actorId: reviewerUserId,
      rooms: [
        RealtimeRoomBuilder.user(request.judgeUserId),
        RealtimeRoomBuilder.organizer(request.hackathonId),
        RealtimeRoomBuilder.admin(),
      ],
      payload: {
        requestId,
        status: 'APPROVED',
        authorizationCode: codeResult.code,
        maskedCode: codeResult.maskedCode,
        criterionId: request.criterionId,
        criterionTitle: request.criterionTitle,
        requestedScore: request.requestedScore,
        approvedByRole: reviewerRole,
        expiresAt: codeResult.expiresAt,
      },
    });

    return {
      ...updated,
      authorizationCode: codeResult.code,
    };
  }

  /**
   * 3. Execute Mark Edit with Authorization Code (Transactional & Concurrency Protected).
   */
  public static async executeMarkEdit(params: {
    judgeUserId: string;
    requestId: string;
    authorizationCode: string;
    newScore: number;
    expectedVersion?: number;
  }) {
    const { judgeUserId, requestId, authorizationCode, newScore, expectedVersion } = params;

    // Load request
    const request = await EvaluationEditRepository.findById(requestId);
    if (!request) {
      throw { status: 404, code: 'REQUEST_NOT_FOUND', message: 'Evaluation edit request not found.' };
    }

    if (request.judgeUserId !== judgeUserId) {
      throw {
        status: 403,
        code: 'FORBIDDEN',
        message: 'You cannot execute an edit request belonging to another judge.',
      };
    }

    if (request.status !== 'APPROVED') {
      throw {
        status: 400,
        code: 'REQUEST_NOT_APPROVED',
        message: `This edit request is currently in status '${request.status}' and cannot be executed.`,
      };
    }

    // Validate 4-digit Authorization Code
    const codeValidation = AuthCodeService.validateCode(
      authorizationCode,
      request.authCodeHash,
      request.authCodeExpiresAt,
      request.isCodeUsed
    );

    if (!codeValidation.isValid) {
      // Log failed authorization attempt
      await AuditService.log({
        userId: judgeUserId,
        hackathonId: request.hackathonId,
        action: 'MARK_EDIT_AUTH_FAILURE',
        entityType: 'EvaluationEditRequest',
        entityId: requestId,
        afterState: { reason: codeValidation.error },
      });

      throw {
        status: 401,
        code: 'INVALID_AUTH_CODE',
        message: codeValidation.error || 'Invalid or expired authorization code.',
      };
    }

    // STRICT SCOPE CHECK: Ensure the newScore matches the approved scope
    const criterion = request.evaluation.rubric.criteria.find((c) => c.id === request.criterionId);
    if (!criterion) {
      throw {
        status: 400,
        code: 'CRITERION_NOT_FOUND',
        message: 'The approved criterion was not found on the evaluation rubric.',
      };
    }

    if (newScore < 0 || newScore > criterion.maxScore) {
      throw {
        status: 400,
        code: 'SCORE_OUT_OF_RANGE',
        message: `Score ${newScore} is outside valid range (0 to ${criterion.maxScore}).`,
      };
    }

    if (newScore !== request.requestedScore) {
      throw {
        status: 403,
        code: 'UNAUTHORIZED_SCORE_VALUE',
        message: `Unauthorized score value ${newScore}. The authorization code was approved strictly for a score of ${request.requestedScore}.`,
      };
    }

    // CONCURRENCY & TRANSACTIONAL EXECUTION
    const result = await prisma.$transaction(async (tx) => {
      // 1. Fetch fresh evaluation with row version
      const currentEval = await tx.evaluation.findUnique({
        where: { id: request.evaluationId },
        include: { scores: true },
      });

      if (!currentEval) {
        throw new Error('EVALUATION_NOT_FOUND');
      }

      if (expectedVersion !== undefined && currentEval.version !== expectedVersion) {
        throw new Error(
          'STALE_EVALUATION_VERSION: This evaluation was updated by another authorized operation. Please refresh the evaluation state.'
        );
      }

      // 2. Prepare score calculations
      const criteriaMap = new Map(request.evaluation.rubric.criteria.map((c) => [c.id, c]));
      const updatedScoresList = currentEval.scores.map((s) => {
        const crit = criteriaMap.get(s.criterionId);
        const raw = s.criterionId === request.criterionId ? newScore : s.rawScore;
        return {
          criterionId: s.criterionId,
          rawScore: raw,
          maxScore: crit?.maxScore || 100,
          weightPercentage: crit?.weightPercentage || 0,
        };
      });

      const computed = ScoringEngine.calculateEvaluationScore(updatedScoresList);

      // 3. Update the specific EvaluationScore record
      const existingScore = currentEval.scores.find((s) => s.criterionId === request.criterionId);
      await tx.evaluationScore.update({
        where: {
          evaluationId_criterionId: {
            evaluationId: currentEval.id,
            criterionId: request.criterionId,
          },
        },
        data: {
          rawScore: newScore,
          originalScore: existingScore?.originalScore ?? request.oldScore,
        },
      });

      // 4. Update Evaluation record with immutable markHistory and version increment
      const existingHistory = (currentEval.markHistory as any[]) || [];
      const historyEntry = {
        timestamp: new Date().toISOString(),
        criterionId: request.criterionId,
        criterionTitle: request.criterionTitle,
        oldScore: request.oldScore,
        newScore,
        requestId,
        changedBy: judgeUserId,
        approvedBy: request.approvedById,
        approvedByType: request.approvedByType,
        version: currentEval.version + 1,
      };

      // Encrypt sensitive evaluation payload at rest
      const encryptedPayload = EncryptionService.encrypt({
        scores: updatedScoresList,
        weightedScore: computed.weightedScore,
        history: [...existingHistory, historyEntry],
      });

      const updatedEval = await tx.evaluation.update({
        where: { id: currentEval.id },
        data: {
          rawScoreSum: computed.rawScoreSum,
          weightedScore: computed.weightedScore,
          version: { increment: 1 },
          markHistory: [...existingHistory, historyEntry],
          encryptedPayload,
          updatedAt: new Date(),
        },
      });

      // 5. Invalidate / Consume the Authorization Code
      await tx.authorizationCodeRegistry.updateMany({
        where: { editRequestId: requestId },
        data: { isUsed: true, usedAt: new Date() },
      });

      // 6. Transition EditRequest to EXECUTED
      await tx.evaluationEditRequest.update({
        where: { id: requestId },
        data: {
          status: 'EXECUTED',
          isCodeUsed: true,
          usedAt: new Date(),
          executedAt: new Date(),
        },
      });

      // 7. Create immutable Audit Log
      await tx.auditLog.create({
        data: {
          userId: judgeUserId,
          hackathonId: request.hackathonId,
          action: 'MARK_EDIT_EXECUTED',
          entityType: 'Evaluation',
          entityId: currentEval.id,
          beforeState: {
            criterionId: request.criterionId,
            rawScore: request.oldScore,
            weightedScore: currentEval.weightedScore,
          },
          afterState: {
            criterionId: request.criterionId,
            rawScore: newScore,
            weightedScore: computed.weightedScore,
            version: updatedEval.version,
          },
        },
      });

      return { updatedEval, computed };
    });

    // Post-commit Real-time broadcast
    await eventBus.publish({
      type: 'MARK_EDIT_EXECUTED',
      hackathonId: request.hackathonId,
      projectId: request.projectId,
      teamId: request.teamId,
      userId: judgeUserId,
      actorId: judgeUserId,
      rooms: [
        RealtimeRoomBuilder.evaluation(request.evaluationId),
        RealtimeRoomBuilder.organizer(request.hackathonId),
        RealtimeRoomBuilder.judge(judgeUserId),
        RealtimeRoomBuilder.admin(),
      ],
      payload: {
        requestId,
        evaluationId: request.evaluationId,
        criterionId: request.criterionId,
        criterionTitle: request.criterionTitle,
        oldScore: request.oldScore,
        newScore,
        newWeightedScore: result.computed.weightedScore,
        status: 'EXECUTED',
      },
    });

    return {
      evaluationId: result.updatedEval.id,
      weightedScore: result.computed.weightedScore,
      version: result.updatedEval.version,
      status: 'EXECUTED',
    };
  }
}
