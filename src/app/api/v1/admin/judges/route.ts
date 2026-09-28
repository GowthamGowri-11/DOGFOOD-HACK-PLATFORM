import { NextRequest } from 'next/server';
import { requireRole } from '@/server/permissions/guards';
import { successResponse, errorResponse } from '@/lib/api/response';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { AuditService } from '@/server/services/audit.service';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    await requireRole('ADMIN');

    const { searchParams } = new URL(req.url);
    const hackathonId = searchParams.get('hackathonId') || undefined;

    // Fetch all hackathons for the dropdown selector
    const hackathons = await prisma.hackathon.findMany({
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        minTeamSize: true,
        maxTeamSize: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const isAll = hackathonId === 'all';
    const activeHackathonId = isAll
      ? 'all'
      : (hackathonId || hackathons[0]?.id || 'all');

    // Fetch judges
    const judges = await prisma.judge.findMany({
      where: {
        ...(activeHackathonId !== 'all' ? { hackathonId: activeHackathonId } : {}),
      },
      include: {
        user: {
          select: { id: true, fullName: true, email: true, avatarUrl: true },
        },
        hackathon: {
          select: { id: true, title: true, slug: true, status: true },
        },
        assignments: {
          include: {
            project: {
              select: {
                id: true,
                title: true,
                slug: true,
                repoUrl: true,
                team: {
                  select: { id: true, name: true, inviteCode: true },
                },
              },
            },
          },
          orderBy: { assignedAt: 'desc' },
        },
        evaluations: {
          select: { id: true, status: true, weightedScore: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Fetch total teams for the active hackathon
    const totalTeamsInHackathon = await prisma.team.count({
      where: activeHackathonId !== 'all' ? { hackathonId: activeHackathonId } : {},
    });

    // Count unique teams assigned to at least one judge
    const assignedProjectIds = new Set<string>();
    judges.forEach((j) => {
      j.assignments.forEach((a) => {
        if (a.projectId) assignedProjectIds.add(a.projectId);
      });
    });

    const formatted = judges.map((j) => {
      const completedCount = j.evaluations.filter((e) => e.status === 'SUBMITTED').length;
      return {
        id: j.id,
        userId: j.userId,
        fullName: j.user.fullName,
        email: j.user.email,
        hackathonId: j.hackathonId,
        hackathonTitle: j.hackathon.title,
        hackathonStatus: j.hackathon.status,
        maxWorkload: j.maxWorkload,
        isActive: j.isActive,
        expertiseTracks: j.expertiseTracks,
        assignmentsCount: j.assignments.length,
        assignedTeams: j.assignments.map((a) => ({
          assignmentId: a.id,
          projectId: a.project.id,
          projectTitle: a.project.title,
          teamId: a.project.team?.id,
          teamName: a.project.team?.name || a.project.title,
          status: a.status,
          assignedAt: a.assignedAt,
        })),
        completedEvaluationsCount: completedCount,
        pendingEvaluationsCount: Math.max(0, j.assignments.length - completedCount),
      };
    });

    const activeJudgesCount = judges.filter((j) => j.isActive).length;
    const avgTeams =
      activeJudgesCount > 0 ? Math.round(assignedProjectIds.size / activeJudgesCount) : 0;

    return successResponse({
      judges: formatted,
      hackathons,
      selectedHackathonId: activeHackathonId,
      stats: {
        totalJudges: judges.length,
        activeJudges: activeJudgesCount,
        totalTeams: totalTeamsInHackathon,
        assignedTeams: assignedProjectIds.size,
        avgTeamsPerJudge: avgTeams,
      },
    });
  } catch (error: any) {
    if (error.status === 403 || error.code === 'FORBIDDEN_ROLE') {
      return errorResponse(error.message, 'FORBIDDEN', 403);
    }
    if (error.status === 401 || error.code === 'UNAUTHORIZED') {
      return errorResponse(error.message, 'UNAUTHORIZED', 401);
    }
    return errorResponse(error.message || 'Failed to list judges', 'INTERNAL_ERROR', 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireRole('ADMIN');
    const body = await req.json();
    const { action = 'AUTO_ASSIGN', hackathonId } = body;

    if (!hackathonId || hackathonId === 'all') {
      return errorResponse('Please select a specific hackathon event', 'VALIDATION_ERROR', 400);
    }

    const hackathon = await prisma.hackathon.findUnique({
      where: { id: hackathonId },
    });

    if (!hackathon) {
      return errorResponse('Hackathon not found', 'NOT_FOUND', 404);
    }

    // =========================================================================
    // ACTION 1: ADD JUDGE
    // =========================================================================
    if (action === 'ADD_JUDGE') {
      const { fullName, email, expertiseTracks = [], maxWorkload = 25 } = body;

      if (!fullName || !email) {
        return errorResponse('Judge Full Name and Email are required', 'VALIDATION_ERROR', 400);
      }

      const cleanEmail = email.toLowerCase().trim();

      // Find or create User
      let user = await prisma.user.findFirst({
        where: { email: cleanEmail },
      });

      if (!user) {
        const defaultPasswordHash = await bcrypt.hash('Password123!', 10);
        user = await prisma.user.create({
          data: {
            fullName: fullName.trim(),
            email: cleanEmail,
            passwordHash: defaultPasswordHash,
            role: 'JUDGE',
            isActive: true,
          },
        });
      } else if (user.role !== 'JUDGE' && user.role !== 'ADMIN' && user.role !== 'ORGANIZER') {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { role: 'JUDGE' },
        });
      }

      // Check if judge record already exists for this hackathon
      const existingJudge = await prisma.judge.findUnique({
        where: {
          hackathonId_userId: {
            hackathonId,
            userId: user.id,
          },
        },
      });

      if (existingJudge) {
        const updated = await prisma.judge.update({
          where: { id: existingJudge.id },
          data: {
            isActive: true,
            maxWorkload: Number(maxWorkload) || 25,
            expertiseTracks: Array.isArray(expertiseTracks) ? expertiseTracks : [],
          },
        });
        return successResponse(updated, `Judge ${fullName} updated successfully`);
      }

      const createdJudge = await prisma.judge.create({
        data: {
          hackathonId,
          userId: user.id,
          maxWorkload: Number(maxWorkload) || 25,
          expertiseTracks: Array.isArray(expertiseTracks) ? expertiseTracks : [],
          isActive: true,
          conflictTeamIds: [],
        },
      });

      await AuditService.log({
        userId: session.id,
        hackathonId,
        action: 'JUDGE_ASSIGNED',
        entityType: 'Judge',
        entityId: createdJudge.id,
        afterState: { judgeName: fullName, email: cleanEmail },
      });

      return successResponse(createdJudge, `Judge ${fullName} added successfully to ${hackathon.title}`);
    }

    // =========================================================================
    // ACTION 2: RESET ASSIGNMENTS
    // =========================================================================
    if (action === 'RESET_ASSIGNMENTS') {
      const deleted = await prisma.judgeAssignment.deleteMany({
        where: {
          judge: { hackathonId },
        },
      });

      return successResponse(
        { deletedCount: deleted.count },
        `Successfully reset ${deleted.count} team assignments.`
      );
    }

    // =========================================================================
    // ACTION 3: AUTO-ASSIGN ENGINE (Randomized, Even Split Across Judges)
    // Example: 60 teams and 4 judges -> splits 15 random teams to each judge!
    // =========================================================================
    if (action === 'AUTO_ASSIGN') {
      // 1. Fetch all active judges in this hackathon
      const activeJudges = await prisma.judge.findMany({
        where: { hackathonId, isActive: true },
        include: { user: { select: { fullName: true } } },
      });

      if (activeJudges.length === 0) {
        return errorResponse(
          'Cannot run assignment engine: No active judges found for this hackathon. Please add judges first.',
          'NO_JUDGES_FOUND',
          400
        );
      }

      // 2. Fetch all teams in this hackathon
      const teams = await prisma.team.findMany({
        where: { hackathonId },
        include: { project: true },
      });

      if (teams.length === 0) {
        return errorResponse(
          'Cannot run assignment engine: No participating teams found in this hackathon to assign.',
          'NO_TEAMS_FOUND',
          400
        );
      }

      // 3. Ensure every team has a project record so it can be evaluated & assigned
      const projectItems: { projectId: string; teamId: string; teamName: string }[] = [];

      for (const team of teams) {
        let project = team.project;
        if (!project) {
          // Ensure default track
          let track = await prisma.track.findFirst({ where: { hackathonId } });
          if (!track) {
            track = await prisma.track.create({
              data: {
                hackathonId,
                title: 'General Innovation',
                slug: 'general-innovation',
                colorHex: '#2563EB',
              },
            });
          }

          // Ensure default problem statement
          let problem = await prisma.problemStatement.findFirst({ where: { hackathonId } });
          if (!problem) {
            problem = await prisma.problemStatement.create({
              data: {
                hackathonId,
                trackId: track.id,
                code: 'GEN-01',
                title: 'General Challenge Deliverable',
                description: 'Open engineering innovation track',
              },
            });
          }

          const projectSlug = `${team.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-project`;
          project = await prisma.project.create({
            data: {
              hackathonId,
              teamId: team.id,
              trackId: track.id,
              problemId: problem.id,
              title: `${team.name} Solution`,
              slug: projectSlug,
              tagline: `Enterprise solution built by ${team.name}`,
              description: `Project deliverable for team ${team.name}`,
              repoUrl: `https://github.com/apex-arena/${projectSlug}`,
              demoUrl: `https://${projectSlug}.apex-arena.dev`,
              techStack: ['TypeScript', 'Next.js'],
              isPublished: true,
            },
          });
        }

        projectItems.push({
          projectId: project.id,
          teamId: team.id,
          teamName: team.name,
        });
      }

      // 4. Randomly shuffle all teams using Fisher-Yates Shuffle
      const shuffledTeams = [...projectItems];
      for (let i = shuffledTeams.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledTeams[i], shuffledTeams[j]] = [shuffledTeams[j], shuffledTeams[i]];
      }

      // 5. Clear previous assignments for this hackathon
      await prisma.judgeAssignment.deleteMany({
        where: {
          judge: { hackathonId },
        },
      });

      // 6. Evenly split the shuffled teams across judges
      // e.g., 60 teams / 4 judges -> each judge gets exactly 15 teams!
      // If 8 teams / 4 judges -> each judge gets exactly 2 teams!
      const newAssignments: { judgeId: string; projectId: string }[] = [];
      const judgeTeamCountMap: Record<string, number> = {};
      activeJudges.forEach((j) => {
        judgeTeamCountMap[j.id] = 0;
      });

      shuffledTeams.forEach((item, index) => {
        const assignedJudge = activeJudges[index % activeJudges.length];
        newAssignments.push({
          judgeId: assignedJudge.id,
          projectId: item.projectId,
        });
        judgeTeamCountMap[assignedJudge.id] = (judgeTeamCountMap[assignedJudge.id] || 0) + 1;
      });

      // 7. Persist assignments in database
      const createdAssignments = await prisma.$transaction(
        newAssignments.map((a) =>
          prisma.judgeAssignment.create({
            data: {
              judgeId: a.judgeId,
              projectId: a.projectId,
              status: 'ASSIGNED',
            },
          })
        )
      );

      const teamsPerJudge = Math.round(shuffledTeams.length / activeJudges.length);

      await AuditService.log({
        userId: session.id,
        hackathonId,
        action: 'JUDGE_ASSIGNED',
        entityType: 'JudgeAssignment',
        entityId: hackathonId,
        afterState: {
          totalTeams: shuffledTeams.length,
          judgesCount: activeJudges.length,
          teamsPerJudge,
          assignmentsCount: createdAssignments.length,
        },
      });

      return successResponse(
        {
          totalTeams: shuffledTeams.length,
          judgesCount: activeJudges.length,
          teamsPerJudge,
          assignmentsCount: createdAssignments.length,
        },
        `Engine successfully distributed ${shuffledTeams.length} random teams evenly across ${activeJudges.length} judges (~${teamsPerJudge} teams each).`
      );
    }

    return errorResponse(`Unknown action: ${action}`, 'VALIDATION_ERROR', 400);
  } catch (error: any) {
    if (error.status === 403 || error.code === 'FORBIDDEN_ROLE') {
      return errorResponse(error.message, 'FORBIDDEN', 403);
    }
    if (error.status === 401 || error.code === 'UNAUTHORIZED') {
      return errorResponse(error.message, 'UNAUTHORIZED', 401);
    }
    return errorResponse(error.message || 'Failed to process judge request', 'INTERNAL_ERROR', 500);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await requireRole('ADMIN');
    const { searchParams } = new URL(req.url);
    const judgeId = searchParams.get('id');

    if (!judgeId) {
      return errorResponse('Judge ID is required', 'VALIDATION_ERROR', 400);
    }

    const judge = await prisma.judge.findUnique({
      where: { id: judgeId },
      include: { user: true, hackathon: true },
    });

    if (!judge) {
      return errorResponse('Judge record not found', 'NOT_FOUND', 404);
    }

    // Delete assignments for this judge
    await prisma.judgeAssignment.deleteMany({
      where: { judgeId },
    });

    // Delete judge
    await prisma.judge.delete({
      where: { id: judgeId },
    });

    await AuditService.log({
      userId: session.id,
      hackathonId: judge.hackathonId,
      action: 'JUDGE_ASSIGNED',
      entityType: 'Judge',
      entityId: judgeId,
      afterState: { status: 'DELETED', judgeName: judge.user.fullName },
    });

    return successResponse(
      { judgeId },
      `Judge ${judge.user.fullName} successfully removed from ${judge.hackathon.title}.`
    );
  } catch (error: any) {
    if (error.status === 403 || error.code === 'FORBIDDEN_ROLE') {
      return errorResponse(error.message, 'FORBIDDEN', 403);
    }
    return errorResponse(error.message || 'Failed to remove judge', 'INTERNAL_ERROR', 500);
  }
}
