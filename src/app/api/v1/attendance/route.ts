import { NextRequest } from 'next/server';
import { getCurrentUser } from '@/server/auth/session';
import { successResponse, errorResponse } from '@/lib/api/response';
import prisma from '@/lib/prisma';
import { z } from 'zod';

const createSessionSchema = z.object({
  hackathonId: z.string(),
  title: z.string().min(3),
  sessionCode: z.string().min(4).max(12),
  startsAt: z.string().datetime().optional(),
  endsAt: z.string().datetime().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const session = await getCurrentUser();
    const { searchParams } = new URL(req.url);
    const hackathonId = searchParams.get('hackathonId') || undefined;

    const sessions = await prisma.attendanceSession.findMany({
      where: hackathonId ? { hackathonId } : {},
      include: {
        hackathon: { select: { id: true, title: true, slug: true } },
        _count: { select: { records: true } },
        records: session?.id
          ? {
              where: { userId: session.id },
              select: { id: true, checkedInAt: true, method: true },
            }
          : false,
      },
      orderBy: { startsAt: 'asc' },
    });

    const formatted = sessions.map((s) => ({
      id: s.id,
      hackathonId: s.hackathonId,
      hackathonTitle: s.hackathon.title,
      title: s.title,
      sessionCode: s.sessionCode,
      startsAt: s.startsAt,
      endsAt: s.endsAt,
      isActive: s.isActive,
      totalAttendees: s._count.records,
      hasCheckedIn: s.records && s.records.length > 0,
      checkedInAt: s.records && s.records[0] ? s.records[0].checkedInAt : null,
    }));

    return successResponse({ sessions: formatted });
  } catch (error: any) {
    return errorResponse(error.message || 'Failed to fetch attendance sessions', 'INTERNAL_ERROR', 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session || (session.role !== 'ORGANIZER' && session.role !== 'ADMIN')) {
      return errorResponse('Only organizers can create attendance sessions', 'UNAUTHORIZED', 403);
    }

    const body = await req.json();
    const parsed = createSessionSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse('Invalid session parameters', 'VALIDATION_ERROR', 422, parsed.error.format());
    }

    const { hackathonId, title, sessionCode, startsAt, endsAt } = parsed.data;

    const newSession = await prisma.attendanceSession.create({
      data: {
        hackathonId,
        title,
        sessionCode: sessionCode.toUpperCase().trim(),
        startsAt: startsAt ? new Date(startsAt) : new Date(),
        endsAt: endsAt ? new Date(endsAt) : new Date(Date.now() + 1000 * 60 * 60 * 4), // 4 hours
        isActive: true,
      },
    });

    return successResponse({ session: newSession }, 'Attendance session created successfully', 201);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return errorResponse('Session code must be unique', 'DUPLICATE_CODE', 400);
    }
    return errorResponse(error.message || 'Failed to create attendance session', 'INTERNAL_ERROR', 500);
  }
}
