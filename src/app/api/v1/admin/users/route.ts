import { NextRequest } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { requireRole } from '@/server/permissions/guards';
import { UserRepository } from '@/server/repositories/user.repository';
import { successResponse, errorResponse } from '@/lib/api/response';
import { AuditService } from '@/server/services/audit.service';
import { RoleType } from '@/types';

const createUserSchema = z.object({
  email: z.string().email(),
  fullName: z.string().min(2),
  password: z.string().min(8),
  role: z
    .enum(['ADMIN', 'ORGANIZER', 'JUDGE', 'PARTICIPANT', 'Student'])
    .default('PARTICIPANT')
    .transform((r) => (r === 'Student' ? 'PARTICIPANT' : r)),
  phone: z.string().optional(),
  bio: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    await requireRole('ADMIN');
    const { searchParams } = new URL(req.url);

    const page = Number(searchParams.get('page')) || 1;
    const pageSize = Number(searchParams.get('pageSize')) || 20;
    const search = searchParams.get('search') || undefined;
    const role = (searchParams.get('role') as RoleType) || undefined;
    const status = (searchParams.get('status') as 'ACTIVE' | 'INACTIVE') || undefined;
    const sortBy = (searchParams.get('sortBy') as 'createdAt' | 'fullName') || 'createdAt';
    const sortOrder = (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc';

    const result = await UserRepository.findPaginated({
      page,
      pageSize,
      search,
      role,
      status,
      sortBy,
      sortOrder,
    });

    return successResponse(result);
  } catch (error: any) {
    const status = error.status || 500;
    const code = error.code || 'INTERNAL_ERROR';
    return errorResponse(error.message, code, status);
  }
}

export async function POST(req: NextRequest) {
  try {
    const adminSession = await requireRole('ADMIN');
    const body = await req.json();

    const parsed = createUserSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse('Invalid user payload', 'VALIDATION_ERROR', 422, parsed.error.format());
    }

    const { email, fullName, password, role, phone, bio } = parsed.data;
    const userBio = phone?.trim() ? `Phone: ${phone.trim()}` : bio;

    const existing = await UserRepository.findByEmail(email);
    if (existing) {
      return errorResponse('User with this email already exists', 'EMAIL_ALREADY_EXISTS', 409);
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await UserRepository.create({
      email,
      fullName,
      passwordHash,
      role: role as RoleType,
      bio: userBio,
    });

    await AuditService.log({
      userId: adminSession.id,
      action: 'USER_CREATED',
      entityType: 'User',
      entityId: user.id,
      afterState: { email: user.email, role: user.role, fullName: user.fullName },
    });

    return successResponse(
      { user: UserRepository.toSafeUser(user) },
      'User created successfully by Administrator',
      201
    );
  } catch (error: any) {
    const status = error.status || 500;
    const code = error.code || 'INTERNAL_ERROR';
    return errorResponse(error.message, code, status);
  }
}
