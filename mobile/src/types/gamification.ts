export type XpEventType =
  | 'post_created'
  | 'comment_created'
  | 'post_liked_received';

export type UserXpEvent = {
  id: string;
  type: XpEventType;
  points: number;
  createdAt?: unknown;
};

export type BadgeKey = 'first_post' | 'first_comment' | 'first_like_received';
