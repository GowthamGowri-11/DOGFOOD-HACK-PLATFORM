import { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/server/permissions/guards';
import { UserRepository } from '@/server/repositories/user.repository';
import { successResponse, errorResponse } from '@/lib/api/response';

const updateProfileSchema = z.object({
  fullName: z.string().min(2).optional(),
  bio: z.string().max(500).optional(),
  avatarUrl: z.string().url().or(z.string().length(0)).optional(),
  githubUrl: z.string().url().or(z.string().length(0)).optional(),
  linkedinUrl: z.string().url().or(z.string().length(0)).optional(),
});

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth();
    const user = await UserRepository.findById(session.id);
    if (!user) {
      return errorResponse('User not found', 'NOT_FOUND', 404);
    }

    return successResponse({
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        bio: user.bio,
        avatarUrl: user.avatarUrl,
        githubUrl: user.githubUrl,
        linkedinUrl: user.linkedinUrl,
        role: user.role,
        createdAt: user.createdAt,
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

    const updated = await UserRepository.updateProfile(session.id, parsed.data);

    return successResponse(
      {
        user: {
          id: updated.id,
          email: updated.email,
          fullName: updated.fullName,
          bio: updated.bio,
          avatarUrl: updated.avatarUrl,
          githubUrl: updated.githubUrl,
          linkedinUrl: updated.linkedinUrl,
          role: updated.role,
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
