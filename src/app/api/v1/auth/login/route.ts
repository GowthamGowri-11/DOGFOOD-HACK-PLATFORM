import { NextRequest } from 'next/server';
import { z } from 'zod';
import { UserRepository } from '@/server/repositories/user.repository';
import { verifyPassword } from '@/server/auth/password';
import { setSessionCookie } from '@/server/auth/session';
import { successResponse, errorResponse } from '@/lib/api/response';
import { AuditService } from '@/server/services/audit.service';
import { RateLimiter } from '@/server/auth/rate-limiter';

const loginSchema = z.object({
  email: z.string().email('Valid email is required'),
  password: z.string().min(1, 'Password is required'),
});

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse('Invalid email or password', 'INVALID_CREDENTIALS', 401);
    }

    const normalizedEmail = parsed.data.email.trim().toLowerCase();

    // Rate limiting per IP + email
    const rateCheck = await RateLimiter.check(`login:${ip}:${normalizedEmail}`, 5, 15 * 60 * 1000);
    if (!rateCheck.allowed) {
      return errorResponse('Too many failed login attempts. Please try again in 15 minutes.', 'RATE_LIMITED', 429);
    }

    const user = await UserRepository.findByEmail(normalizedEmail);
    if (!user) {
      await AuditService.log({
        action: 'LOGIN_FAILED',
        entityType: 'User',
        entityId: normalizedEmail,
        ipAddress: ip,
      });
      return errorResponse('Invalid email or password', 'INVALID_CREDENTIALS', 401);
    }

    // Check account status
    if (!user.isActive) {
      await AuditService.log({
        userId: user.id,
        action: 'LOGIN_FAILED_INACTIVE',
        entityType: 'User',
        entityId: user.id,
        ipAddress: ip,
      });
      return errorResponse('Account is inactive or disabled. Please contact administrator.', 'ACCOUNT_INACTIVE', 403);
    }

    const isMatch = await verifyPassword(parsed.data.password, user.passwordHash);
    if (!isMatch) {
      await AuditService.log({
        userId: user.id,
        action: 'LOGIN_FAILED',
        entityType: 'User',
        entityId: user.id,
        ipAddress: ip,
      });
      return errorResponse('Invalid email or password', 'INVALID_CREDENTIALS', 401);
    }

    // Reset rate limiter upon successful login
    await RateLimiter.reset(`login:${ip}:${normalizedEmail}`);

    await setSessionCookie({
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      status: user.isActive ? 'ACTIVE' : 'INACTIVE',
      avatarUrl: user.avatarUrl,
    });

    await AuditService.log({
      userId: user.id,
      action: 'LOGIN_SUCCESS',
      entityType: 'User',
      entityId: user.id,
      ipAddress: ip,
    });

    return successResponse(
      {
        user: {
          id: user.id,
          name: user.fullName,
          email: user.email,
          role: user.role,
          status: user.isActive ? 'ACTIVE' : 'INACTIVE',
        },
      },
      'Logged in successfully'
    );
  } catch (error: any) {
    return errorResponse(error.message || 'Internal server error', 'INTERNAL_ERROR', 500);
  }
}
