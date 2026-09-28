import { ProjectRepository } from '@/server/repositories/project.repository';
import { TeamRepository } from '@/server/repositories/team.repository';
import { TrackRepository } from '@/server/repositories/track.repository';
import { ProblemStatementRepository } from '@/server/repositories/problem-statement.repository';
import { HackathonRepository } from '@/server/repositories/hackathon.repository';
import { SubmissionRepository } from '@/server/repositories/submission.repository';
import { AuditService } from '@/server/services/audit.service';
import { eventBus } from '@/server/realtime/event-bus';
import { RealtimeRoomBuilder } from '@/server/realtime/event-types';

export class ProjectService {
  /**
   * Generates a collision-resistant slug for a project within a hackathon.
   */
  public static async generateUniqueSlug(hackathonId: string, title: string): Promise<string> {
    const baseSlug = title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'project';

    let slug = baseSlug;
    let counter = 1;
    let exists = await ProjectRepository.checkSlugExists(hackathonId, slug);

    while (exists) {
      counter++;
      slug = `${baseSlug}-${counter}`;
      exists = await ProjectRepository.checkSlugExists(hackathonId, slug);
    }

    return slug;
  }

  /**
   * Creates a working project draft for a team.
   */
  public static async createProject(data: {
    hackathonId: string;
    teamId: string;
    userId: string;
    trackId: string;
    problemId: string;
    title: string;
    tagline?: string;
    description: string;
    thumbnailUrl?: string;
    repoUrl: string;
    demoUrl?: string;
    videoUrl?: string;
    documentationUrl?: string;
    techStack?: string[];
  }) {
    // 1. Verify Hackathon
    const hackathon = await HackathonRepository.findById(data.hackathonId);
    if (!hackathon) {
      throw { message: 'Hackathon not found.', code: 'NOT_FOUND', status: 404 };
    }

    // 2. Verify Team
    const team = await TeamRepository.findById(data.teamId);
    if (!team || team.hackathonId !== data.hackathonId) {
      throw { message: 'Team does not belong to this hackathon.', code: 'INVALID_TEAM', status: 400 };
    }

    const isMember = team.members.some((m) => m.userId === data.userId);
    if (!isMember) {
      throw { message: 'You must be a member of this team to create a project.', code: 'FORBIDDEN', status: 403 };
    }

    // 3. One-Project-Per-Team Rule
    const existing = await ProjectRepository.findByTeamId(data.teamId);
    if (existing) {
      throw {
        message: 'Your team has already created a project for this hackathon.',
        code: 'PROJECT_ALREADY_EXISTS',
        status: 409,
      };
    }

    // 4. Track & Problem Statement Consistency
    const track = await TrackRepository.findById(data.trackId);
    if (!track || track.hackathonId !== data.hackathonId) {
      throw { message: 'Selected track is invalid for this hackathon.', code: 'INVALID_TRACK', status: 400 };
    }

    const problem = await ProblemStatementRepository.findById(data.problemId);
    if (!problem || problem.hackathonId !== data.hackathonId || problem.trackId !== data.trackId) {
      throw {
        message: 'Selected problem statement does not belong to the selected track.',
        code: 'TRACK_PROBLEM_MISMATCH',
        status: 400,
      };
    }

    const slug = await this.generateUniqueSlug(data.hackathonId, data.title);

    const project = await ProjectRepository.create({
      hackathonId: data.hackathonId,
      teamId: data.teamId,
      trackId: data.trackId,
      problemId: data.problemId,
      title: data.title,
      slug,
      tagline: data.tagline,
      description: data.description,
      thumbnailUrl: data.thumbnailUrl,
      repoUrl: data.repoUrl,
      demoUrl: data.demoUrl,
      videoUrl: data.videoUrl,
      documentationUrl: data.documentationUrl,
      techStack: data.techStack,
    });

    await AuditService.log({
      userId: data.userId,
      hackathonId: data.hackathonId,
      action: 'PROJECT_CREATED',
      entityType: 'Project',
      entityId: project.id,
      afterState: { id: project.id, title: project.title, teamId: data.teamId },
    });

    await eventBus.publish({
      type: 'PROJECT_CREATED',
      hackathonId: data.hackathonId,
      teamId: data.teamId,
      projectId: project.id,
      userId: data.userId,
      actorId: data.userId,
      rooms: [
        RealtimeRoomBuilder.hackathon(data.hackathonId),
        RealtimeRoomBuilder.team(data.teamId),
        RealtimeRoomBuilder.project(project.id),
        RealtimeRoomBuilder.organizer(data.hackathonId),
      ],
      payload: {
        id: project.id,
        title: project.title,
        slug: project.slug,
        teamId: data.teamId,
        trackId: data.trackId,
      },
    });

    return project;
  }

  /**
   * Updates an existing draft project.
   */
  public static async updateProject(data: {
    projectId: string;
    userId: string;
    trackId?: string;
    problemId?: string;
    title?: string;
    tagline?: string;
    description?: string;
    thumbnailUrl?: string;
    repoUrl?: string;
    demoUrl?: string;
    videoUrl?: string;
    documentationUrl?: string;
    techStack?: string[];
  }) {
    const project = await ProjectRepository.findById(data.projectId);
    if (!project) {
      throw { message: 'Project not found.', code: 'NOT_FOUND', status: 404 };
    }

    const isMember = project.team.members.some((m) => m.userId === data.userId);
    if (!isMember) {
      throw { message: 'You are not authorized to edit this project.', code: 'FORBIDDEN', status: 403 };
    }

    // Locking check: If latest submission is LOCKED, project cannot be edited
    const latestSubmission = await SubmissionRepository.findLatestByProjectId(project.id);
    if (latestSubmission && latestSubmission.status === 'LOCKED') {
      throw {
        message: 'This project has been officially submitted and locked. Modifications are prohibited.',
        code: 'SUBMISSION_LOCKED',
        status: 403,
      };
    }

    // Consistency check if track or problem statement is being updated
    const targetTrackId = data.trackId || project.trackId;
    const targetProblemId = data.problemId || project.problemId;

    if (data.trackId || data.problemId) {
      const problem = await ProblemStatementRepository.findById(targetProblemId);
      if (!problem || problem.hackathonId !== project.hackathonId || problem.trackId !== targetTrackId) {
        throw {
          message: 'Selected problem statement does not belong to the selected track.',
          code: 'TRACK_PROBLEM_MISMATCH',
          status: 400,
        };
      }
    }

    const updated = await ProjectRepository.update(project.id, {
      title: data.title?.trim(),
      tagline: data.tagline?.trim(),
      description: data.description?.trim(),
      track: data.trackId ? { connect: { id: data.trackId } } : undefined,
      problemStatement: data.problemId ? { connect: { id: data.problemId } } : undefined,
      thumbnailUrl: data.thumbnailUrl,
      repoUrl: data.repoUrl?.trim(),
      demoUrl: data.demoUrl?.trim(),
      videoUrl: data.videoUrl?.trim(),
      documentationUrl: data.documentationUrl?.trim(),
      techStack: data.techStack,
    });

    await AuditService.log({
      userId: data.userId,
      hackathonId: project.hackathonId,
      action: 'PROJECT_UPDATED',
      entityType: 'Project',
      entityId: project.id,
      beforeState: { title: project.title },
      afterState: { title: updated.title },
    });

    await eventBus.publish({
      type: 'PROJECT_UPDATED',
      hackathonId: project.hackathonId,
      teamId: project.teamId,
      projectId: project.id,
      userId: data.userId,
      actorId: data.userId,
      rooms: [
        RealtimeRoomBuilder.hackathon(project.hackathonId),
        RealtimeRoomBuilder.team(project.teamId),
        RealtimeRoomBuilder.project(project.id),
        RealtimeRoomBuilder.organizer(project.hackathonId),
      ],
      payload: {
        id: updated.id,
        title: updated.title,
        slug: updated.slug,
      },
    });

    return updated;
  }
}
