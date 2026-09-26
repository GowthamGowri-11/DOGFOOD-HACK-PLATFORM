import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/api/response';
import prisma from '@/lib/prisma';
import crypto from 'crypto';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const cleanCode = code.toUpperCase().trim();

    const cert = await prisma.certificate.findUnique({
      where: { verificationCode: cleanCode },
      include: {
        hackathon: {
          select: {
            id: true,
            title: true,
            slug: true,
            organizationName: true,
            eventStartTime: true,
            eventEndTime: true,
          },
        },
        user: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    });

    if (!cert) {
      return errorResponse('Certificate not found or invalid verification code', 'NOT_FOUND', 404);
    }

    // Cryptographic signature hash
    const integrityHash = crypto
      .createHash('sha256')
      .update(`${cert.id}:${cert.verificationCode}:${cert.recipientName}:${cert.issuedAt.toISOString()}`)
      .digest('hex');

    return successResponse({
      certificate: {
        id: cert.id,
        verificationCode: cert.verificationCode,
        title: cert.title,
        recipientName: cert.recipientName,
        type: cert.type,
        status: cert.status,
        awardDetail: cert.awardDetail,
        issuedAt: cert.issuedAt,
        hackathon: cert.hackathon,
        integrityHash,
        issuer: {
          name: cert.hackathon.organizationName || 'Apex Frontier Systems',
          verifiedDomain: 'apexhack.io',
        },
      },
    });
  } catch (error: any) {
    return errorResponse(error.message || 'Verification failed', 'INTERNAL_ERROR', 500);
  }
}
