export type PostComment = {
  id: string;
  postId: string;
  userId: string;
  authorLabel: string;
  text: string;
  createdAt?: unknown;
};

export type CreatePostCommentInput = {
  postId: string;
  userId: string;
  authorLabel: string;
  text: string;
};
