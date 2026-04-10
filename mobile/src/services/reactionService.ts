import {
  removeLike,
  saveLike,
  subscribeToLikeUserIds,
} from '../repositories/reactionRepository';

export class ReactionValidationError extends Error {}

type ToggleLikeInput = {
  postId: string;
  userId: string | null | undefined;
  isCurrentlyLiked: boolean;
};

export async function togglePostLike(input: ToggleLikeInput) {
  if (!input.userId) {
    throw new ReactionValidationError('You must be logged in to like posts.');
  }

  if (input.isCurrentlyLiked) {
    await removeLike(input.postId, input.userId);
    return false;
  }

  await saveLike(input.postId, input.userId);
  return true;
}

export function observeLikeUserIdsForPost(
  postId: string | null | undefined,
  onUserIds: (userIds: string[]) => void,
  onError?: (error: Error) => void
) {
  if (!postId) {
    onUserIds([]);
    return () => undefined;
  }

  return subscribeToLikeUserIds(postId, onUserIds, onError);
}
