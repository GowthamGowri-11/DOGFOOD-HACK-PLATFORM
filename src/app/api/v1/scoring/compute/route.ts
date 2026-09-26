import { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireRole } from '@/server/permissions/guards';
import { ScoringEngine } from '@/server/services/scoring.engine';
import { successResponse, errorResponse } from '@/lib/api/response';
import prisma from '@/lib/prisma';
import { AuditService } from '@/server/services/audit.service';

const computeScoringSchema = z.object({
  hackathonId: z.string().uuid(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await requireRole(['ORGANIZER', 'ADMIN']);
    const body = await req.json();
    const parsed = computeScoringSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse('Invalid hackathonId parameter', 'VALIDATION_ERROR', 422);
    }

    const { hackathonId } = parsed.data;

    // Fetch all submitted evaluations for projects in this hackathon
    const projects = await prisma.project.findMany({
      where: { hackathonId },
      include: {
        evaluations: {
          where: { status: 'SUBMITTED' },
        },
      },
    });

    const projectScoreSummaries = projects.map((p) => {
      const scores = p.evaluations.map((e) => e.weightedScore);
      const rawAverage = ScoringEngine.aggregateProjectScores(scores);
      return {
        projectId: p.id,
        projectTitle: p.title,
        evaluationsCount: scores.length,
        rawAverageScore: rawAverage,
      };
    });

    await AuditService.log({
      userId: session.id,
      hackathonId,
      action: 'SCORING_COMPUTE',
      entityType: 'Hackathon',
      entityId: hackathonId,
      afterState: { processedProjects: projectScoreSummaries.length },
    });

    return successResponse(
      { projectScores: projectScoreSummaries },
      'Project raw weighted scores computed successfully'
    );
  } catch (error: any) {
    const status = error.status || 500;
    const code = error.code || 'INTERNAL_ERROR';
    return errorResponse(error.message, code, status);
  }
}
