import prisma from '@/lib/prisma';

export class NotificationRepository {
  public static async listByUser(userId: string, limit = 50) {
    return prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  public static async countUnreadByUser(userId: string): Promise<number> {
    return prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });
  }

  public static async create(data: {
    userId: string;
    title: string;
    message: string;
    linkUrl?: string;
  }) {
    return prisma.notification.create({
      data: {
        userId: data.userId,
        title: data.title.trim(),
        message: data.message.trim(),
        linkUrl: data.linkUrl,
        isRead: false,
      },
    });
  }

  public static async markAsRead(id: string, userId: string) {
    return prisma.notification.updateMany({
      where: {
        id,
        userId,
      },
      data: {
        isRead: true,
      },
    });
  }

  public static async markAllAsRead(userId: string) {
    return prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });
  }
}
