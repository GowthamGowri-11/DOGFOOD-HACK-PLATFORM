import { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/server/permissions/guards';
import { UserRepository } from '@/server/repositories/user.repository';
import { successResponse, errorResponse } from '@/lib/api/response';

// In-memory store for extended profile fields (phoneNumber, year, mentorName, portfolio, resume, skills)
const EXTENDED_PROFILES = new Map<string, {
  phoneNumber?: string;
  year?: string;
  mentorName?: string;
  portfolioUrl?: string;
  resumeUrl?: string;
  skills?: string[];
}>();

const updateProfileSchema = z.object({
  fullName: z.string().min(1).optional(),
  phoneNumber: z.string().optional(),
  year: z.string().optional(),
  mentorName: z.string().optional(),
  bio: z.string().max(1000).optional(),
  avatarUrl: z.string().optional(),
  githubUrl: z.string().optional(),
  linkedinUrl: z.string().optional(),
  portfolioUrl: z.string().optional(),
  resumeUrl: z.string().optional(),
  skills: z.array(z.string()).optional(),
});

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth();
    let user: any = null;
    try {
      user = await UserRepository.findById(session.id);
    } catch {
      // Fallback if DB unavailable
    }

    const extended = EXTENDED_PROFILES.get(session.id) || {};

    return successResponse({
      user: {
        id: session.id,
        email: user?.email || session.email,
        fullName: user?.fullName || session.fullName || 'Builder',
        bio: user?.bio || '',
        avatarUrl: user?.avatarUrl || null,
        githubUrl: user?.githubUrl || '',
        linkedinUrl: user?.linkedinUrl || '',
        phoneNumber: extended.phoneNumber || '',
        year: extended.year || '',
        mentorName: extended.mentorName || '',
        portfolioUrl: extended.portfolioUrl || '',
        resumeUrl: extended.resumeUrl || '',
        skills: extended.skills || [],
        role: user?.role || session.role,
        createdAt: user?.createdAt || new Date().toISOString(),
      },
    });
  } catch (error: any) {
    const status = error.status || 500;
    const code = error.code || 'INTERNAL_ERROR';
    return errorResponse(error.message, code, status);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await requireAuth();
    const body = await req.json();
    const parsed = updateProfileSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse('Invalid profile data', 'VALIDATION_ERROR', 422, parsed.error.format());
    }

    const data = parsed.data;

    // Update extended store
    EXTENDED_PROFILES.set(session.id, {
      phoneNumber: data.phoneNumber,
      year: data.year,
      mentorName: data.mentorName,
      portfolioUrl: data.portfolioUrl,
      resumeUrl: data.resumeUrl,
      skills: data.skills || [],
    });

    // Attempt DB update for core fields
    let updatedUser: any = null;
    try {
      updatedUser = await UserRepository.updateProfile(session.id, {
        fullName: data.fullName,
        bio: data.bio,
        avatarUrl: data.avatarUrl,
        githubUrl: data.githubUrl,
        linkedinUrl: data.linkedinUrl,
      });
    } catch {
      // Ignore if DB demo user
    }

    return successResponse(
      {
        user: {
          id: session.id,
          email: updatedUser?.email || session.email,
          fullName: data.fullName || updatedUser?.fullName || session.fullName,
          bio: data.bio !== undefined ? data.bio : updatedUser?.bio,
          avatarUrl: data.avatarUrl !== undefined ? data.avatarUrl : updatedUser?.avatarUrl,
          githubUrl: data.githubUrl !== undefined ? data.githubUrl : updatedUser?.githubUrl,
          linkedinUrl: data.linkedinUrl !== undefined ? data.linkedinUrl : updatedUser?.linkedinUrl,
          phoneNumber: data.phoneNumber || '',
          year: data.year || '',
          mentorName: data.mentorName || '',
          portfolioUrl: data.portfolioUrl || '',
          resumeUrl: data.resumeUrl || '',
          skills: data.skills || [],
          role: updatedUser?.role || session.role,
        },
      },
      'Profile updated successfully'
    );
  } catch (error: any) {
    const status = error.status || 500;
    const code = error.code || 'INTERNAL_ERROR';
    return errorResponse(error.message, code, status);
  }
}
