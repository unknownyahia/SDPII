export type PostReactionType = 'like';

export type PostReaction = {
  userId: string;
  postId: string;
  type: PostReactionType;
  createdAt?: unknown;
};
