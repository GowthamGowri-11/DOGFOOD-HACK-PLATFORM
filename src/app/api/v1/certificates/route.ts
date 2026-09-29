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
    const { hackathonId, type = 'PARTICIPANT', title, participants, templateConfig } = body;

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

    // ================= BRANCH A: BULK ISSUANCE FROM DATA SHEET =================
    if (participants && Array.isArray(participants) && participants.length > 0) {
      for (const p of participants) {
        const participantName = (p.participantName || p.name || 'Participant').trim();
        const teamName = (p.teamName || 'General Team').trim();
        const email = (
          p.email ||
          `${participantName.toLowerCase().replace(/[^a-z0-9]/g, '.')}@participant.dogfood.internal`
        ).trim().toLowerCase();

        // Find or create User
        let user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
          user = await prisma.user.create({
            data: {
              email,
              fullName: participantName,
              passwordHash: '$2a$10$e8wU.R5060r8oX7bV0X8n.eN6N/Z319hIeCq81t5G.r0gWn7vU57O', // standard hashed dummy password
              role: 'PARTICIPANT',
            },
          });
        }

        // Find or create Team in this hackathon
        let team = await prisma.team.findFirst({
          where: { hackathonId: hackathon.id, name: teamName },
        });

        if (!team) {
          const inviteCode = `${hackathon.slug.substring(0, 3).toUpperCase()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
          team = await prisma.team.create({
            data: {
              hackathonId: hackathon.id,
              name: teamName,
              inviteCode,
              leaderId: user.id,
            },
          });
        }

        // Ensure user is registered or team member
        const existingMember = await prisma.teamMember.findFirst({
          where: { teamId: team.id, userId: user.id },
        });
        if (!existingMember) {
          await prisma.teamMember.create({
            data: {
              teamId: team.id,
              userId: user.id,
              isLeader: p.role ? p.role.toLowerCase().includes('lead') : false,
            },
          }).catch(() => {});
        }

        // Generate unique cryptographic verification code
        const randomPart = crypto.randomBytes(4).toString('hex').toUpperCase();
        const code = `APEX-${hackathon.slug.substring(0, 4).toUpperCase()}-${randomPart}`;

        const awardDetailObj = {
          teamName,
          participantName,
          email,
          department: p.department || 'Computer Science & Engineering',
          collaborationDept: p.collaborationDept || 'AI & Data Science',
          college: p.college || 'Apex Institute of Technology',
          date: p.date || new Date().toISOString().split('T')[0],
          hackathonName: hackathon.title,
          role: p.role || 'Participant',
          templateConfig: templateConfig || null,
        };

        const cert = await prisma.certificate.create({
          data: {
            hackathonId: hackathon.id,
            userId: user.id,
            type: type as any,
            verificationCode: code,
            title: title || `Certificate of Achievement • ${hackathon.title}`,
            recipientName: participantName,
            awardDetail: JSON.stringify(awardDetailObj),
            status: 'ISSUED',
          },
          include: {
            user: { select: { id: true, fullName: true, email: true } },
            hackathon: { select: { id: true, title: true, slug: true } },
          },
        });

        issuedCertificates.push(cert);
      }

      return successResponse(
        {
          count: issuedCertificates.length,
          certificates: issuedCertificates,
        },
        `Successfully issued ${issuedCertificates.length} certificates to all participants in teams.`
      );
    }

    // ================= BRANCH B: DEFAULT REGISTRATION-BASED ISSUANCE =================
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
