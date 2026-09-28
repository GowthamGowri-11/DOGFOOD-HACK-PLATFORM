import { NextRequest } from 'next/server';
import { requireAuth, requireRole } from '@/server/permissions/guards';
import { ResourceGuards } from '@/server/permissions/resource-guards';
import { RoundProgressionService } from '@/server/services/round-progression.service';
import { successResponse, errorResponse } from '@/lib/api/response';
import prisma from '@/lib/prisma';
import { ProgressionMode } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const hackathonId = params.id;
    const hackathon = await prisma.hackathon.findUnique({
      where: { id: hackathonId },
      include: {
        rounds: { orderBy: { roundNumber: 'asc' } },
        _count: {
          select: {
            teams: true,
          },
        },
      },
    });

    if (!hackathon) {
      return errorResponse('Hackathon not found', 'NOT_FOUND', 404);
    }

    // If rounds not yet synced in DB, check rulesAndGuidelines
    let rounds = hackathon.rounds;
    if (rounds.length === 0 && hackathon.rulesAndGuidelines) {
      try {
        const parsed = JSON.parse(hackathon.rulesAndGuidelines);
        if (Array.isArray(parsed.rounds) && parsed.rounds.length > 0) {
          rounds = await RoundProgressionService.syncRoundsFromConfig(hackathonId, parsed.rounds);
        }
      } catch {
        // ignore
      }
    }

    // Get count of teams per status
    const teamStats = await prisma.team.groupBy({
      by: ['progressionStatus'],
      where: { hackathonId },
      _count: true,
    });

    return successResponse({
      hackathonId,
      progressionMode: hackathon.progressionMode,
      currentRoundNumber: hackathon.currentRoundNumber,
      totalTeams: hackathon._count.teams,
      teamStats,
      rounds,
    });
  } catch (error: any) {
    const status = error.status || 500;
    const code = error.code || 'INTERNAL_ERROR';
    return errorResponse(error.message, code, status);
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireRole(['ADMIN', 'ORGANIZER']);
    const hackathonId = params.id;

    if (session.role === 'ORGANIZER') {
      const canAccess = await ResourceGuards.canOrganizerAccessHackathon(session.id, hackathonId);
      if (!canAccess) {
        return errorResponse('You are not authorized to configure this hackathon', 'FORBIDDEN_RESOURCE', 403);
      }
    }

    const body = await req.json();
    const { progressionMode, rounds } = body;

    const updateData: any = {};
    if (progressionMode && (progressionMode === 'SELECTION_BASED' || progressionMode === 'OVERALL_PERFORMANCE')) {
      updateData.progressionMode = progressionMode as ProgressionMode;
    }

    if (Object.keys(updateData).length > 0) {
      await prisma.hackathon.update({
        where: { id: hackathonId },
        data: updateData,
      });
    }

    let syncedRounds = [];
    if (Array.isArray(rounds)) {
      syncedRounds = await RoundProgressionService.syncRoundsFromConfig(hackathonId, rounds);
    }

    return successResponse({
      hackathonId,
      progressionMode: updateData.progressionMode || progressionMode,
      rounds: syncedRounds,
    }, 'Rounds configured successfully.');
  } catch (error: any) {
    const status = error.status || 500;
    const code = error.code || 'INTERNAL_ERROR';
    return errorResponse(error.message, code, status);
  }
}
