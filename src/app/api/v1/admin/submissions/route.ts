import { NextRequest } from 'next/server';
import { requireRole } from '@/server/permissions/guards';
import { successResponse, errorResponse } from '@/lib/api/response';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    await requireRole('ADMIN');

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || undefined;
    const hackathonId = searchParams.get('hackathonId') || undefined;
    const status = searchParams.get('status') || 'ALL'; // ALL, SUBMITTED, NOT_SUBMITTED, DRAFT
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '20', 10)));
    const skip = (page - 1) * pageSize;

    // Fetch all hackathons for the dropdown selector
    const hackathons = await prisma.hackathon.findMany({
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        subEndTime: true,
        minTeamSize: true,
        maxTeamSize: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const isAll = hackathonId === 'all';
    const activeHackathonId = isAll
      ? 'all'
      : (hackathonId || hackathons[0]?.id || 'all');

    // Fetch all teams for the active hackathon or all hackathons
    const teamWhere: Prisma.TeamWhereInput =
      activeHackathonId !== 'all' ? { hackathonId: activeHackathonId } : {};

    const teams = await prisma.team.findMany({
      where: teamWhere,
      include: {
        hackathon: {
          select: {
            id: true,
            title: true,
            slug: true,
            status: true,
            subEndTime: true,
            minTeamSize: true,
            maxTeamSize: true,
          },
        },
        members: {
          include: {
            user: { select: { id: true, fullName: true, email: true, avatarUrl: true } },
          },
          orderBy: { isLeader: 'desc' },
        },
        project: {
          include: {
            track: { select: { id: true, title: true } },
            problemStatement: { select: { id: true, title: true } },
            submissions: {
              orderBy: { versionNumber: 'desc' },
              take: 1,
              select: {
                id: true,
                versionNumber: true,
                status: true,
                submittedAt: true,
                lockedAt: true,
                payloadSnapshot: true,
                createdById: true,
              },
            },
            evaluations: { select: { id: true, status: true } },
            aiJuryRuns: {
              take: 1,
              orderBy: { createdAt: 'desc' },
              select: { id: true, overallScore: true, confidenceScore: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Map each team to its submission status
    const mappedItems = teams.map((team) => {
      const leader = team.members.find((m) => m.isLeader)?.user || team.members[0]?.user;
      const latestSub = team.project?.submissions?.[0];
      const isSubmitted = latestSub?.status === 'SUBMITTED';
      const submissionStatus: 'SUBMITTED' | 'NOT_SUBMITTED' | 'DRAFT' = isSubmitted
        ? 'SUBMITTED'
        : latestSub?.status === 'DRAFT'
        ? 'DRAFT'
        : 'NOT_SUBMITTED';

      return {
        id: team.id,
        team: {
          id: team.id,
          name: team.name,
          inviteCode: team.inviteCode,
          leader: leader ? { id: leader.id, fullName: leader.fullName, email: leader.email } : null,
          membersCount: team.members.length,
          members: team.members.map((m) => ({
            id: m.id,
            fullName: m.user.fullName,
            email: m.user.email,
            isLeader: m.isLeader,
          })),
        },
        hackathon: team.hackathon,
        submissionStatus,
        project: team.project
          ? {
              id: team.project.id,
              title: team.project.title,
              slug: team.project.slug,
              repoUrl: team.project.repoUrl,
              demoUrl: team.project.demoUrl,
              techStack: team.project.techStack,
              track: team.project.track,
              problemStatement: team.project.problemStatement,
              evaluationsCount:
                team.project.evaluations?.filter((e) => e.status === 'SUBMITTED').length || 0,
              aiJuryScore: team.project.aiJuryRuns?.[0]?.overallScore ?? null,
            }
          : null,
        submission: latestSub || null,
        createdAt: team.createdAt,
      };
    });

    // Compute accurate stats for the active hackathon
    const totalTeams = mappedItems.length;
    const submittedCount = mappedItems.filter((i) => i.submissionStatus === 'SUBMITTED').length;
    const notSubmittedCount = mappedItems.filter((i) => i.submissionStatus !== 'SUBMITTED').length;
    const submissionRate = totalTeams > 0 ? Math.round((submittedCount / totalTeams) * 100) : 0;

    // Apply status filter
    let filtered = mappedItems;
    if (status && status !== 'ALL') {
      if (status === 'SUBMITTED') {
        filtered = filtered.filter((i) => i.submissionStatus === 'SUBMITTED');
      } else if (status === 'NOT_SUBMITTED') {
        filtered = filtered.filter((i) => i.submissionStatus !== 'SUBMITTED');
      } else if (status === 'DRAFT') {
        filtered = filtered.filter((i) => i.submissionStatus === 'DRAFT');
      }
    }

    // Apply search filter
    if (search && search.trim()) {
      const q = search.toLowerCase().trim();
      filtered = filtered.filter((i) => {
        const matchTeam = i.team.name.toLowerCase().includes(q);
        const matchLeader =
          i.team.leader?.fullName?.toLowerCase().includes(q) ||
          i.team.leader?.email?.toLowerCase().includes(q);
        const matchProj = i.project?.title?.toLowerCase().includes(q);
        const matchCode = i.team.inviteCode?.toLowerCase().includes(q);
        const matchHack = i.hackathon?.title?.toLowerCase().includes(q);
        return matchTeam || matchLeader || matchProj || matchCode || matchHack;
      });
    }

    const paginated = filtered.slice(skip, skip + pageSize);
    const totalPages = Math.ceil(filtered.length / pageSize) || 1;

    return successResponse({
      items: paginated,
      hackathons,
      selectedHackathonId: activeHackathonId,
      stats: {
        total: totalTeams,
        submitted: submittedCount,
        notSubmitted: notSubmittedCount,
        submissionRate,
      },
      pagination: {
        total: filtered.length,
        page,
        pageSize,
        totalPages,
        hasMore: page < totalPages,
      },
    });
  } catch (error: any) {
    if (error.status === 403 || error.code === 'FORBIDDEN_ROLE') {
      return errorResponse(error.message, 'FORBIDDEN', 403);
    }
    if (error.status === 401 || error.code === 'UNAUTHORIZED') {
      return errorResponse(error.message, 'UNAUTHORIZED', 401);
    }
    return errorResponse(error.message || 'Failed to list submissions', 'INTERNAL_ERROR', 500);
  }
}
