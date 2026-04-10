import {
  markNotificationRead,
  subscribeToNotifications,
} from '../repositories/notificationRepository';
import type { AppNotification } from '../types/notification';

export class NotificationValidationError extends Error {}

export function observeNotifications(
  userId: string | null | undefined,
  onNotifications: (notifications: AppNotification[]) => void,
  onError?: (error: Error) => void
) {
  if (!userId) {
    onNotifications([]);
    return () => undefined;
  }

  return subscribeToNotifications(userId, onNotifications, onError);
}

export async function markUserNotificationRead(
  userId: string | null | undefined,
  notificationId: string
) {
  if (!userId) {
    throw new NotificationValidationError(
      'You must be logged in to update notifications.'
    );
  }

  await markNotificationRead(userId, notificationId);
}
