import { NextRequest } from 'next/server';
import { requireRole } from '@/server/permissions/guards';
import { successResponse, errorResponse } from '@/lib/api/response';
import prisma from '@/lib/prisma';
import crypto from 'crypto';
import { AuditService } from '@/server/services/audit.service';
import { Prisma, CertificateStatus, CertificateType } from '@prisma/client';
import { revalidatePath } from 'next/cache';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    await requireRole('ADMIN');

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || undefined;
    const hackathonId = searchParams.get('hackathonId') || undefined;
    const status = (searchParams.get('status') as CertificateStatus) || undefined;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const pageSize = Math.min(50, Math.max(1, parseInt(searchParams.get('pageSize') || '10', 10)));
    const skip = (page - 1) * pageSize;

    const where: Prisma.CertificateWhereInput = {
      ...(hackathonId ? { hackathonId } : {}),
      ...(status ? { status } : {}),
      ...(search
        ? {
            OR: [
              { recipientName: { contains: search, mode: 'insensitive' } },
              { verificationCode: { contains: search, mode: 'insensitive' } },
              { title: { contains: search, mode: 'insensitive' } },
              { user: { email: { contains: search, mode: 'insensitive' } } },
              { hackathon: { title: { contains: search, mode: 'insensitive' } } },
            ],
          }
        : {}),
    };

    const [total, certificates] = await Promise.all([
      prisma.certificate.count({ where }),
      prisma.certificate.findMany({
        where,
        skip,
        take: pageSize,
        include: {
          user: { select: { id: true, fullName: true, email: true } },
          hackathon: { select: { id: true, title: true, slug: true } },
        },
        orderBy: { issuedAt: 'desc' },
      }),
    ]);

    const totalPages = Math.ceil(total / pageSize);

    return successResponse({
      certificates,
      pagination: {
        total,
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
    return errorResponse(error.message || 'Failed to list certificates', 'INTERNAL_ERROR', 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireRole('ADMIN');
    const body = await req.json();
    const { hackathonId, type = 'PARTICIPANT', title } = body;

    if (!hackathonId) {
      return errorResponse('hackathonId is required', 'VALIDATION_ERROR', 400);
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

    if (hackathon.registrations.length === 0) {
      return errorResponse('No approved registrations found to issue certificates to', 'NO_REGISTRATIONS', 400);
    }

    const issued: any[] = [];

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
            type: type as CertificateType,
            verificationCode: code,
            title: title || `Certificate of Achievement • ${hackathon.title}`,
            recipientName: reg.user.fullName,
            status: 'ISSUED',
          },
        });
      }

      issued.push(cert);
    }

    await AuditService.log({
      userId: session.id,
      hackathonId,
      action: 'CERTIFICATE_ISSUED',
      entityType: 'Certificate',
      entityId: hackathonId,
      afterState: { issuedCount: issued.length, type },
    });

    try {
      revalidatePath('/participant/certificates');
      revalidatePath('/admin/certificates');
    } catch {
      // Ignore during test/static builds
    }

    return successResponse(
      { count: issued.length },
      `Successfully generated ${issued.length} digital certificates.`
    );
  } catch (error: any) {
    if (error.status === 403 || error.code === 'FORBIDDEN_ROLE') {
      return errorResponse(error.message, 'FORBIDDEN', 403);
    }
    if (error.status === 401 || error.code === 'UNAUTHORIZED') {
      return errorResponse(error.message, 'UNAUTHORIZED', 401);
    }
    return errorResponse(error.message || 'Failed to issue certificates', 'INTERNAL_ERROR', 500);
  }
}
