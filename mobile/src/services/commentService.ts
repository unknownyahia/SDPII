import {
  createComment,
  deleteComment,
  subscribeToComments,
} from '../repositories/commentRepository';
import type { PostComment } from '../types/comment';

export class CommentValidationError extends Error {}

type AddCommentInput = {
  postId: string;
  userId: string | null | undefined;
  authorLabel: string | null | undefined;
  text: string;
};

type DeleteCommentInput = {
  postId: string;
  commentId: string;
  currentUserId: string | null | undefined;
  commentUserId: string;
};

export async function addCommentToPost(input: AddCommentInput) {
  if (!input.userId) {
    throw new CommentValidationError('You must be logged in to comment.');
  }

  const normalizedText = input.text.trim();
  if (!normalizedText) {
    throw new CommentValidationError('Comment text cannot be empty.');
  }

  const result = await createComment({
    postId: input.postId,
    userId: input.userId,
    authorLabel: input.authorLabel || 'Unknown user',
    text: normalizedText,
  });

  return result.id;
}

export async function deleteOwnComment(input: DeleteCommentInput) {
  if (!input.currentUserId) {
    throw new CommentValidationError('You must be logged in to delete comments.');
  }

  if (input.currentUserId !== input.commentUserId) {
    throw new CommentValidationError('You can only delete your own comments.');
  }

  await deleteComment(input.postId, input.commentId);
}

export function observeCommentsForPost(
  postId: string | null | undefined,
  onComments: (comments: PostComment[]) => void,
  onError?: (error: Error) => void
) {
  if (!postId) {
    onComments([]);
    return () => undefined;
  }

  return subscribeToComments(postId, onComments, onError);
}
