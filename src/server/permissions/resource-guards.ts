import prisma from '@/lib/prisma';

export class ResourceGuards {
  /**
   * Checks if an organizer owns or is authorized to manage a specific hackathon.
   */
  public static async canOrganizerAccessHackathon(
    organizerUserId: string,
    hackathonId: string
  ): Promise<boolean> {
    const hackathon = await prisma.hackathon.findUnique({
      where: { id: hackathonId },
      select: { organizerId: true },
    });

    if (!hackathon) return false;
    return hackathon.organizerId === organizerUserId;
  }

  /**
   * Checks if a judge is actively assigned to evaluate a specific project.
   */
  public static async canJudgeAccessProject(
    judgeUserId: string,
    projectId: string
  ): Promise<boolean> {
    const assignment = await prisma.judgeAssignment.findFirst({
      where: {
        projectId,
        judge: {
          userId: judgeUserId,
          isActive: true,
        },
      },
    });

    return !!assignment;
  }

  /**
   * Checks if a judge owns a specific evaluation.
   */
  public static async canJudgeAccessEvaluation(
    judgeUserId: string,
    evaluationId: string
  ): Promise<boolean> {
    const evaluation = await prisma.evaluation.findUnique({
      where: { id: evaluationId },
      select: { judgeUserId: true },
    });

    if (!evaluation) return false;
    return evaluation.judgeUserId === judgeUserId;
  }

  /**
   * Checks if a participant owns a specific registration.
   */
  public static async canParticipantAccessRegistration(
    userId: string,
    registrationId: string
  ): Promise<boolean> {
    const registration = await prisma.registration.findUnique({
      where: { id: registrationId },
      select: { userId: true },
    });

    if (!registration) return false;
    return registration.userId === userId;
  }

  /**
   * Checks if a participant is a member or leader of a specific team.
   */
  public static async canParticipantAccessTeam(
    userId: string,
    teamId: string
  ): Promise<boolean> {
    const member = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId,
          userId,
        },
      },
    });

    return !!member;
  }

  /**
   * Checks if a participant belongs to the team that created a specific project.
   */
  public static async canParticipantAccessProject(
    userId: string,
    projectId: string
  ): Promise<boolean> {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { teamId: true },
    });

    if (!project) return false;
    return this.canParticipantAccessTeam(userId, project.teamId);
  }

  /**
   * Checks if a participant belongs to the team that submitted a specific submission snapshot.
   */
  public static async canParticipantAccessSubmission(
    userId: string,
    submissionId: string
  ): Promise<boolean> {
    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        project: {
          select: { teamId: true },
        },
      },
    });

    if (!submission) return false;
    return this.canParticipantAccessTeam(userId, submission.project.teamId);
  }

  /**
   * Checks if a participant is the leader of a specific team.
   */
  public static async canParticipantManageTeam(
    userId: string,
    teamId: string
  ): Promise<boolean> {
    const member = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId,
          userId,
        },
      },
      select: { isLeader: true },
    });

    return !!member && member.isLeader;
  }

  /**
   * Checks if an organizer owns the hackathon that a team belongs to.
   */
  public static async canOrganizerAccessTeam(
    organizerUserId: string,
    teamId: string
  ): Promise<boolean> {
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        hackathon: {
          select: { organizerId: true },
        },
      },
    });

    if (!team) return false;
    return team.hackathon.organizerId === organizerUserId;
  }

  /**
   * Checks if an organizer owns the hackathon that a registration belongs to.
   */
  public static async canOrganizerAccessRegistration(
    organizerUserId: string,
    registrationId: string
  ): Promise<boolean> {
    const reg = await prisma.registration.findUnique({
      where: { id: registrationId },
      include: {
        hackathon: {
          select: { organizerId: true },
        },
      },
    });

    if (!reg) return false;
    return reg.hackathon.organizerId === organizerUserId;
  }

  /**
   * Checks if an organizer owns the hackathon that a project belongs to.
   */
  public static async canOrganizerAccessProject(
    organizerUserId: string,
    projectId: string
  ): Promise<boolean> {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        hackathon: {
          select: { organizerId: true },
        },
      },
    });

    if (!project) return false;
    return project.hackathon.organizerId === organizerUserId;
  }

  /**
   * Checks if an organizer owns the hackathon that a submission belongs to.
   */
  public static async canOrganizerAccessSubmission(
    organizerUserId: string,
    submissionId: string
  ): Promise<boolean> {
    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        project: {
          include: {
            hackathon: {
              select: { organizerId: true },
            },
          },
        },
      },
    });

    if (!submission) return false;
    return submission.project.hackathon.organizerId === organizerUserId;
  }

  /**
   * Checks if a user is the author of a specific comment.
   */
  public static async canUserManageComment(
    userId: string,
    commentId: string
  ): Promise<boolean> {
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      select: { userId: true },
    });

    if (!comment) return false;
    return comment.userId === userId;
  }

  /**
   * Checks if an organizer owns the hackathon that a comment belongs to (for moderation).
   */
  public static async canOrganizerModerateComment(
    organizerUserId: string,
    commentId: string
  ): Promise<boolean> {
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: {
        project: {
          include: {
            hackathon: {
              select: { organizerId: true },
            },
          },
        },
      },
    });

    if (!comment) return false;
    return comment.project.hackathon.organizerId === organizerUserId;
  }

  /**
   * Checks if a participant is authorized to participate in a specific round of a hackathon.
   */
  public static async canParticipantAccessRound(
    userId: string,
    hackathonId: string,
    roundNumber: number
  ): Promise<boolean> {
    const { RoundProgressionService } = await import('@/server/services/round-progression.service');
    const result = await RoundProgressionService.checkTeamRoundAccess(userId, hackathonId, roundNumber);
    return result.allowed;
  }
}

