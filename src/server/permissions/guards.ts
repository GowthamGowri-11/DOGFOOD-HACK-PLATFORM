import { getSession } from '@/server/auth/session';
import { RoleType, UserSession } from '@/types';
import { hasPermission, Permission } from './rbac';
import { ResourceGuards } from './resource-guards';

export class AuthError extends Error {
  code: string;
  status: number;

  constructor(message: string, code = 'UNAUTHORIZED', status = 401) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

export async function requireAuth(): Promise<UserSession> {
  const session = await getSession();
  if (!session) {
    throw new AuthError('Authentication required to access this resource.', 'UNAUTHORIZED', 401);
  }

  if (session.status === 'INACTIVE') {
    throw new AuthError('Account is inactive or disabled. Access denied.', 'ACCOUNT_INACTIVE', 403);
  }

  return session;
}

export async function requireRole(allowedRoles: RoleType | RoleType[]): Promise<UserSession> {
  const session = await requireAuth();
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  if (!roles.includes(session.role)) {
    throw new AuthError(
      `Access forbidden. Required role: ${roles.join(' or ')}. Your role: ${session.role}`,
      'FORBIDDEN_ROLE',
      403
    );
  }
  return session;
}

export async function requirePermission(permission: Permission): Promise<UserSession> {
  const session = await requireAuth();
  if (!hasPermission(session.role, permission)) {
    throw new AuthError(
      `Access forbidden. Missing required permission: ${permission}`,
      'FORBIDDEN_PERMISSION',
      403
    );
  }
  return session;
}

export async function requireHackathonOrganizer(hackathonId: string): Promise<UserSession> {
  const session = await requireAuth();
  if (session.role === 'ADMIN') return session;

  if (session.role !== 'ORGANIZER') {
    throw new AuthError('Organizer role required to manage this hackathon.', 'FORBIDDEN_ROLE', 403);
  }

  const isOwner = await ResourceGuards.canOrganizerAccessHackathon(session.id, hackathonId);
  if (!isOwner) {
    throw new AuthError(
      'Access denied: You are not authorized to manage this hackathon.',
      'FORBIDDEN_HACKATHON_ACCESS',
      403
    );
  }

  return session;
}

