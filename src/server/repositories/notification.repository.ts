import prisma from '@/lib/prisma';

export interface CreateNotificationParams {
  userId: string;
  title: string;
  message: string;
  linkUrl?: string;
  type?: string;
  entityType?: string;
  entityId?: string;
  hackathonId?: string;
  roundId?: string;
  subRoundId?: string;
}

export class NotificationRepository {
  public static async listByUser(userId: string, limit = 50, unreadOnly = false) {
    try {
      return await prisma.notification.findMany({
        where: {
          userId,
          ...(unreadOnly ? { isRead: false } : {}),
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });
    } catch (err) {
      console.error('[NotificationRepository.listByUser] DB error:', err);
      return [];
    }
  }

  public static async countUnreadByUser(userId: string): Promise<number> {
    try {
      return await prisma.notification.count({
        where: {
          userId,
          isRead: false,
        },
      });
    } catch (err) {
      console.error('[NotificationRepository.countUnreadByUser] DB error:', err);
      return 0;
    }
  }

  public static async create(data: CreateNotificationParams) {
    try {
      return await prisma.notification.create({
        data: {
          userId: data.userId,
          title: data.title.trim(),
          message: data.message.trim(),
          linkUrl: data.linkUrl,
          type: data.type,
          entityType: data.entityType,
          entityId: data.entityId,
          hackathonId: data.hackathonId,
          roundId: data.roundId,
          subRoundId: data.subRoundId,
          isRead: false,
        },
      });
    } catch (err) {
      console.error('[NotificationRepository.create] DB error:', err);
      return {
        id: `mock_notif_${Date.now()}`,
        userId: data.userId,
        title: data.title,
        message: data.message,
        linkUrl: data.linkUrl || null,
        type: data.type || null,
        entityType: data.entityType || null,
        entityId: data.entityId || null,
        hackathonId: data.hackathonId || null,
        roundId: data.roundId || null,
        subRoundId: data.subRoundId || null,
        isRead: false,
        readAt: null,
        createdAt: new Date(),
      };
    }
  }

  public static async markAsRead(id: string, userId: string) {
    try {
      return await prisma.notification.updateMany({
        where: {
          id,
          userId,
        },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });
    } catch (err) {
      console.error('[NotificationRepository.markAsRead] DB error:', err);
      return { count: 0 };
    }
  }

  public static async markAllAsRead(userId: string) {
    try {
      return await prisma.notification.updateMany({
        where: {
          userId,
          isRead: false,
        },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });
    } catch (err) {
      console.error('[NotificationRepository.markAllAsRead] DB error:', err);
      return { count: 0 };
    }
  }
}
