import { NextRequest } from 'next/server';
import { getCurrentUser } from '@/server/auth/session';
import { successResponse, errorResponse } from '@/lib/api/response';
import prisma from '@/lib/prisma';
import crypto from 'crypto';

export async function GET(req: NextRequest) {
  try {
    const session = await getCurrentUser();
    const { searchParams } = new URL(req.url);
    const hackathonId = searchParams.get('hackathonId') || undefined;

    // If organizer/admin with hackathonId, view all certificates in event
    if (session && (session.role === 'ORGANIZER' || session.role === 'ADMIN') && hackathonId) {
      const certificates = await prisma.certificate.findMany({
        where: { hackathonId },
        include: {
          user: { select: { id: true, fullName: true, email: true } },
          hackathon: { select: { id: true, title: true, slug: true } },
        },
        orderBy: { issuedAt: 'desc' },
      });
      return successResponse({ certificates });
    }

    // Default: participant viewing their own certificates
    const userId = session?.id || undefined;
    const certificates = await prisma.certificate.findMany({
      where: {
        ...(userId ? { userId } : {}),
        ...(hackathonId ? { hackathonId } : {}),
      },
      include: {
        hackathon: {
          select: {
            id: true,
            title: true,
            slug: true,
            organizationName: true,
            eventEndTime: true,
          },
        },
      },
      orderBy: { issuedAt: 'desc' },
    });

    return successResponse({ certificates });
  } catch (error: any) {
    return errorResponse(error.message || 'Failed to fetch certificates', 'INTERNAL_ERROR', 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session || (session.role !== 'ORGANIZER' && session.role !== 'ADMIN')) {
      return errorResponse('Only organizers can issue certificates', 'UNAUTHORIZED', 403);
    }

    const body = await req.json();
    const { hackathonId, type = 'PARTICIPANT', title } = body;

    if (!hackathonId) {
      return errorResponse('Hackathon ID is required', 'VALIDATION_ERROR', 422);
    }

    const hackathon = await prisma.hackathon.findUnique({
      where: { id: hackathonId },
      include: {
        registrations: {
          where: { status: 'APPROVED' },
          include: { user: true },
        },
      },
    });

    if (!hackathon) {
      return errorResponse('Hackathon not found', 'NOT_FOUND', 404);
    }

    const issuedCertificates = [];

    for (const reg of hackathon.registrations) {
      const randomPart = crypto.randomBytes(4).toString('hex').toUpperCase();
      const code = `APEX-${hackathon.slug.substring(0, 4).toUpperCase()}-${randomPart}`;

      let cert = await prisma.certificate.findFirst({
        where: {
          hackathonId: hackathon.id,
          userId: reg.userId,
        },
      });

      if (!cert) {
        cert = await prisma.certificate.create({
          data: {
            hackathonId: hackathon.id,
            userId: reg.userId,
            type: type as any,
            verificationCode: code,
            title: title || `Certificate of Achievement • ${hackathon.title}`,
            recipientName: reg.user.fullName,
            status: 'ISSUED',
          },
        });
      }

      issuedCertificates.push(cert);
    }

    return successResponse(
      { count: issuedCertificates.length },
      `Successfully generated ${issuedCertificates.length} digital certificates.`
    );
  } catch (error: any) {
    return errorResponse(error.message || 'Failed to issue certificates', 'INTERNAL_ERROR', 500);
  }
}
