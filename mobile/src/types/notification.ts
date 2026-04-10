export type AppNotificationType = 'comment_on_post' | 'like_on_post';

export type AppNotification = {
  id: string;
  recipientUserId: string;
  actorUserId: string;
  actorLabel: string;
  type: AppNotificationType;
  postId: string;
  commentId?: string | null;
  message: string;
  isRead: boolean;
  createdAt?: unknown;
  readAt?: unknown;
};

export type CreateAppNotificationInput = Omit<
  AppNotification,
  'id' | 'createdAt' | 'readAt'
>;
