import { NextRequest } from 'next/server';
import { getCurrentUser } from '@/server/auth/session';
import { successResponse, errorResponse } from '@/lib/api/response';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { eventBus } from '@/server/realtime/event-bus';
import { RealtimeRoomBuilder } from '@/server/realtime/event-types';

const checkInSchema = z.object({
  sessionCode: z.string().min(4).max(12),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return errorResponse('You must be signed in to check into an attendance session', 'UNAUTHORIZED', 401);
    }

    const body = await req.json();
    const parsed = checkInSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse('Valid session code is required', 'VALIDATION_ERROR', 422);
    }

    const code = parsed.data.sessionCode.toUpperCase().trim();

    // Find attendance session
    const attendanceSession = await prisma.attendanceSession.findUnique({
      where: { sessionCode: code },
      include: {
        hackathon: { select: { id: true, title: true } },
      },
    });

    if (!attendanceSession) {
      return errorResponse('Invalid attendance check-in code', 'INVALID_SESSION_CODE', 404);
    }

    if (!attendanceSession.isActive) {
      return errorResponse('This attendance session is no longer active', 'SESSION_INACTIVE', 400);
    }

    // Record check-in (upsert to be idempotent)
    const record = await prisma.attendanceRecord.upsert({
      where: {
        sessionId_userId: {
          sessionId: attendanceSession.id,
          userId: session.id,
        },
      },
      update: {},
      create: {
        sessionId: attendanceSession.id,
        userId: session.id,
        method: 'QR_CODE',
      },
    });

    const totalAttendees = await prisma.attendanceRecord.count({
      where: { sessionId: attendanceSession.id },
    });

    await eventBus.publish({
      type: 'ATTENDANCE_UPDATED',
      hackathonId: attendanceSession.hackathon.id,
      userId: session.id,
      actorId: session.id,
      rooms: [
        RealtimeRoomBuilder.hackathon(attendanceSession.hackathon.id),
        RealtimeRoomBuilder.organizer(attendanceSession.hackathon.id),
      ],
      payload: {
        sessionId: attendanceSession.id,
        sessionTitle: attendanceSession.title,
        userId: session.id,
        totalAttendees,
      },
    });

    return successResponse(
      {
        sessionTitle: attendanceSession.title,
        hackathonTitle: attendanceSession.hackathon.title,
        checkedInAt: record.checkedInAt,
        totalAttendees,
      },
      'Check-in confirmed successfully!'
    );
  } catch (error: any) {
    return errorResponse(error.message || 'Check-in failed', 'INTERNAL_ERROR', 500);
  }
}
