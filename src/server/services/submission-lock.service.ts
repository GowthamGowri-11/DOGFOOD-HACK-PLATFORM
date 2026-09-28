import { ProjectRepository } from '@/server/repositories/project.repository';
import { SubmissionRepository } from '@/server/repositories/submission.repository';
import { SubmissionValidator } from '@/server/services/submission-validator.service';
import { SubmissionWindowService } from '@/server/services/submission-window.service';
import { SnapshotService } from '@/server/services/snapshot.service';
import { AuditService } from '@/server/services/audit.service';
import prisma from '@/lib/prisma';
import { eventBus } from '@/server/realtime/event-bus';
import { RealtimeRoomBuilder } from '@/server/realtime/event-types';

export class SubmissionLockService {
  /**
   * Validates project submission criteria, builds the canonical snapshot, and freezes the submission.
   */
  public static async submitAndLockProject(
    projectId: string,
    userId: string,
    currentTime: Date = new Date(),
    targetRoundNumber?: number
  ) {
    const project = (await ProjectRepository.findById(projectId)) as any;
    if (!project) {
      throw { message: 'Project not found.', code: 'NOT_FOUND', status: 404 };
    }

    const isMember = project.team?.members?.some((m: any) => m.userId === userId);
    if (!isMember) {
      throw { message: 'You are not authorized to submit for this team.', code: 'FORBIDDEN', status: 403 };
    }

    // 1. Authoritative Submission Window Timing Check
    SubmissionWindowService.assertSubmissionWindowOpen(project.hackathon, currentTime);

    // 2. Round Progression Access Verification
    const activeRound = targetRoundNumber || project.hackathon?.currentRoundNumber || 1;
    const { RoundProgressionService } = await import('@/server/services/round-progression.service');
    const access = await RoundProgressionService.checkTeamRoundAccess(userId, project.hackathon.id, activeRound);
    if (!access.allowed) {
      throw {
        message: access.message,
        code: access.code,
        status: access.status,
      };
    }

    // 3. Race Condition / Double Submit Guard
    const latest = await SubmissionRepository.findLatestByProjectId(projectId);
    if (latest && latest.status === 'LOCKED') {
      throw {
        message: 'This project has already been submitted and locked.',
        code: 'SUBMISSION_ALREADY_LOCKED',
        status: 409,
      };
    }

    // 4. Authoritative Server-Side Validation Pipeline
    const validation = SubmissionValidator.validateProjectForSubmission(project, project.hackathon, currentTime);
    if (!validation.isValid) {
      throw {
        message: 'Project does not meet all required submission criteria.',
        code: 'SUBMISSION_VALIDATION_FAILED',
        status: 422,
        details: { errors: validation.errors, warnings: validation.warnings },
      };
    }

    // 5. Create Canonical Immutable Snapshot
    const versionNumber = latest ? latest.versionNumber + 1 : 1;
    const snapshotPayload = SnapshotService.createPayload(project, userId, versionNumber);
    const contentHash = SnapshotService.calculateContentHash(snapshotPayload);

    // 6. Transactional Locking
    const submission = await prisma.$transaction(async (tx) => {
      const sub = await tx.submission.create({
        data: {
          projectId: project.id,
          versionNumber,
          status: 'LOCKED',
          payloadSnapshot: snapshotPayload as any,
          submittedAt: new Date(),
          lockedAt: new Date(),
          createdById: userId,
        },
      });

      await tx.project.update({
        where: { id: project.id },
        data: { isPublished: true },
      });

      return sub;
    });

    await AuditService.log({
      userId,
      hackathonId: project.hackathon.id,
      action: 'SUBMISSION_LOCKED',
      entityType: 'Submission',
      entityId: submission.id,
      afterState: {
        submissionId: submission.id,
        version: versionNumber,
        contentHash,
        lockedAt: submission.lockedAt,
      },
    });

    await eventBus.publish({
      type: 'SUBMISSION_LOCKED',
      hackathonId: project.hackathon.id,
      teamId: project.teamId,
      projectId: project.id,
      userId,
      actorId: userId,
      rooms: [
        RealtimeRoomBuilder.hackathon(project.hackathon.id),
        RealtimeRoomBuilder.team(project.teamId),
        RealtimeRoomBuilder.project(project.id),
        RealtimeRoomBuilder.organizer(project.hackathon.id),
      ],
      payload: {
        submissionId: submission.id,
        projectId: project.id,
        teamId: project.teamId,
        versionNumber,
        status: submission.status,
        lockedAt: submission.lockedAt,
      },
    });

    return {
      submission,
      snapshot: snapshotPayload,
      contentHash,
      validation,
    };
  }
}
