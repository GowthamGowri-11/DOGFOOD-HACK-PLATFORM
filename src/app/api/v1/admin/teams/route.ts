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
    const statusFilter = searchParams.get('status') || 'ALL'; // ALL, REGISTERED, PENDING
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '50', 10)));
    const skip = (page - 1) * pageSize;

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

    // Calculate accurate overall stats for the selected hackathon (independent of search filter)
    const statsWhere: Prisma.TeamWhereInput = activeHackathonId !== 'all'
      ? { hackathonId: activeHackathonId }
      : {};

    const allHackathonTeams = await prisma.team.findMany({
      where: statsWhere,
      select: {
        id: true,
        hackathon: { select: { minTeamSize: true } },
        members: { select: { id: true } },
      },
    });

    const totalCount = allHackathonTeams.length;
    let registeredCount = 0;
    let pendingCount = 0;
    for (const t of allHackathonTeams) {
      const minReq = t.hackathon?.minTeamSize ?? 2;
      if (t.members.length >= minReq) {
        registeredCount++;
      } else {
        pendingCount++;
      }
    }

    const baseWhere: Prisma.TeamWhereInput = {
      ...(activeHackathonId !== 'all' ? { hackathonId: activeHackathonId } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { hackathon: { title: { contains: search, mode: 'insensitive' } } },
              { project: { title: { contains: search, mode: 'insensitive' } } },
              { members: { some: { user: { fullName: { contains: search, mode: 'insensitive' } } } } },
            ],
          }
        : {}),
    };

    // Fetch teams
    const allMatchingTeams = await prisma.team.findMany({
      where: baseWhere,
      include: {
        hackathon: {
          select: { id: true, title: true, slug: true, status: true, minTeamSize: true, maxTeamSize: true },
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
              select: { id: true, status: true, submittedAt: true, versionNumber: true },
            },
            judgeAssignments: {
              include: {
                judge: {
                  include: {
                    user: { select: { id: true, fullName: true } },
                  },
                },
              },
            },
            evaluations: {
              select: { id: true, status: true, judgeId: true },
            },
            result: {
              select: { rank: true, finalScore: true, isPublished: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Determine status (REGISTERED vs PENDING based on minTeamSize)
    const teamsWithStatus = allMatchingTeams.map((t) => {
      const minRequired = t.hackathon?.minTeamSize ?? 2;
      const isRegistered = t.members.length >= minRequired;
      return {
        ...t,
        status: (isRegistered ? 'REGISTERED' : 'PENDING') as 'REGISTERED' | 'PENDING',
      };
    });

    // Apply status filter if not ALL
    let filteredTeams = teamsWithStatus;
    if (statusFilter === 'REGISTERED') {
      filteredTeams = teamsWithStatus.filter((t) => t.status === 'REGISTERED');
    } else if (statusFilter === 'PENDING') {
      filteredTeams = teamsWithStatus.filter((t) => t.status === 'PENDING');
    }

    const paginatedTeams = filteredTeams.slice(skip, skip + pageSize);
    const totalPages = Math.ceil(filteredTeams.length / pageSize) || 1;

    return successResponse({
      teams: paginatedTeams,
      hackathons,
      selectedHackathonId: activeHackathonId,
      stats: {
        total: totalCount,
        registered: registeredCount,
        pending: pendingCount,
      },
      pagination: {
        total: filteredTeams.length,
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
    return errorResponse(error.message || 'Failed to list teams', 'INTERNAL_ERROR', 500);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await requireRole('ADMIN');

    const { searchParams } = new URL(req.url);
    let teamId = searchParams.get('id');

    if (!teamId) {
      try {
        const body = await req.json();
        teamId = body.id || body.teamId;
      } catch {
        // query param is fine
      }
    }

    if (!teamId) {
      return errorResponse('Team ID is required to disband/delete a team', 'VALIDATION_ERROR', 400);
    }

    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: { hackathon: true },
    });

    if (!team) {
      return errorResponse('Team not found', 'NOT_FOUND', 404);
    }

    await prisma.team.delete({
      where: { id: teamId },
    });

    return successResponse({ id: teamId }, 'Team disbanded successfully');
  } catch (error: any) {
    if (error.status === 403 || error.code === 'FORBIDDEN_ROLE') {
      return errorResponse(error.message, 'FORBIDDEN', 403);
    }
    return errorResponse(error.message || 'Failed to delete team', 'INTERNAL_ERROR', 500);
  }
}
