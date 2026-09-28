import { NotificationRepository, CreateNotificationParams } from '../repositories/notification.repository';
import { eventBus } from '../realtime/event-bus';
import { RealtimeRoomBuilder } from '../realtime/event-types';

export class NotificationService {
  /**
   * Creates an in-app notification and immediately dispatches a real-time WebSocket event
   * to the recipient's authorized private room.
   */
  public static async sendNotification(params: CreateNotificationParams) {
    const notification = await NotificationRepository.create(params);

    // Dispatch real-time event to user's private room
    await eventBus.publish({
      type: 'NOTIFICATION_CREATED',
      userId: params.userId,
      rooms: [RealtimeRoomBuilder.user(params.userId)],
      payload: {
        id: notification.id,
        title: notification.title,
        message: notification.message,
        linkUrl: notification.linkUrl,
        type: notification.type,
        entityType: notification.entityType,
        entityId: notification.entityId,
        hackathonId: notification.hackathonId,
        roundId: notification.roundId,
        subRoundId: notification.subRoundId,
        createdAt: notification.createdAt,
      },
    });

    return notification;
  }

  /**
   * Send notification to multiple users simultaneously.
   */
  public static async sendBulkNotification(userIds: string[], params: Omit<CreateNotificationParams, 'userId'>) {
    const results = [];
    for (const userId of userIds) {
      const res = await this.sendNotification({ ...params, userId });
      results.push(res);
    }
    return results;
  }

  public static async getNotifications(userId: string, limit = 50, unreadOnly = false) {
    const notifications = await NotificationRepository.listByUser(userId, limit, unreadOnly);
    const unreadCount = await NotificationRepository.countUnreadByUser(userId);
    return { notifications, unreadCount };
  }

  public static async markAsRead(id: string, userId: string) {
    return await NotificationRepository.markAsRead(id, userId);
  }

  public static async markAllAsRead(userId: string) {
    return await NotificationRepository.markAllAsRead(userId);
  }
}
