import { NextRequest } from 'next/server';
import { z } from 'zod';
import { UserRepository } from '@/server/repositories/user.repository';
import { hashPassword } from '@/server/auth/password';
import { setSessionCookie } from '@/server/auth/session';
import { successResponse, errorResponse } from '@/lib/api/response';
import { AuditService } from '@/server/services/audit.service';
import { RateLimiter } from '@/server/auth/rate-limiter';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  fullName: z.string().min(2, 'Full name must be at least 2 characters').optional(),
  email: z.string().email('Valid email is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['PARTICIPANT', 'ORGANIZER', 'JUDGE']).optional().default('PARTICIPANT'),
}).refine((data) => data.name || data.fullName, {
  message: 'Name is required',
  path: ['fullName'],
});

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const rateCheck = RateLimiter.check(`register:${ip}`, 10, 15 * 60 * 1000);
    if (!rateCheck.allowed) {
      return errorResponse('Too many registration attempts. Please try again later.', 'RATE_LIMITED', 429);
    }

    const body = await req.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse('Invalid registration data', 'VALIDATION_ERROR', 422, parsed.error.format());
    }

    const normalizedEmail = parsed.data.email.trim().toLowerCase();
    const resolvedName = (parsed.data.fullName || parsed.data.name)!.trim();

    // Check duplicate email
    const existing = await UserRepository.findByEmail(normalizedEmail);
    if (existing) {
      return errorResponse('An account with this email already exists', 'EMAIL_IN_USE', 409);
    }

    const passwordHash = await hashPassword(parsed.data.password);

    // SECURITY: Public registration allows PARTICIPANT, ORGANIZER, JUDGE. ADMIN is strictly forbidden.
    const assignedRole = parsed.data.role && ['PARTICIPANT', 'ORGANIZER', 'JUDGE'].includes(parsed.data.role)
      ? parsed.data.role
      : 'PARTICIPANT';

    const user = await UserRepository.create({
      email: normalizedEmail,
      passwordHash,
      fullName: resolvedName,
      role: assignedRole,
    });

    await setSessionCookie({
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: assignedRole,
      status: 'ACTIVE',
      avatarUrl: user.avatarUrl,
    });

    await AuditService.log({
      userId: user.id,
      action: 'USER_REGISTERED',
      entityType: 'User',
      entityId: user.id,
      afterState: { email: user.email, role: user.role },
      ipAddress: ip,
    });

    return successResponse(
      {
        user: {
          id: user.id,
          name: user.fullName,
          email: user.email,
          role: user.role,
          status: 'ACTIVE',
        },
      },
      'Account created successfully',
      201
    );
  } catch (error: any) {
    return errorResponse(error.message || 'Internal server error', 'INTERNAL_ERROR', 500);
  }
}
