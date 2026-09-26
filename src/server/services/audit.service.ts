import prisma from '@/lib/prisma';

export interface CreateAuditLogParams {
  userId?: string | null;
  hackathonId?: string | null;
  action: string;
  entityType: string;
  entityId: string;
  beforeState?: any;
  afterState?: any;
  ipAddress?: string;
  userAgent?: string;
}

export class AuditService {
  /**
   * Records an immutable audit log entry.
   */
  public static async log(params: CreateAuditLogParams) {
    try {
      return await prisma.auditLog.create({
        data: {
          userId: params.userId || null,
          hackathonId: params.hackathonId || null,
          action: params.action,
          entityType: params.entityType,
          entityId: params.entityId,
          beforeState: params.beforeState ? JSON.parse(JSON.stringify(params.beforeState)) : undefined,
          afterState: params.afterState ? JSON.parse(JSON.stringify(params.afterState)) : undefined,
          ipAddress: params.ipAddress,
          userAgent: params.userAgent,
        },
      });
    } catch (error) {
      console.error('[AuditService.log] Failed to write audit record:', error);
      return null;
    }
  }
}
