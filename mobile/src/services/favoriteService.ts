import {
  removeFavorite,
  saveFavorite,
  subscribeToFavoritePostIds,
} from '../repositories/favoriteRepository';

export class FavoriteValidationError extends Error {}

type ToggleFavoriteInput = {
  userId: string | null | undefined;
  postId: string;
  isCurrentlyFavorite: boolean;
};

export async function toggleFavoritePost(input: ToggleFavoriteInput) {
  if (!input.userId) {
    throw new FavoriteValidationError('You must be logged in to manage favorites.');
  }

  if (!input.postId) {
    throw new FavoriteValidationError('A valid post is required.');
  }

  if (input.isCurrentlyFavorite) {
    await removeFavorite(input.userId, input.postId);
    return false;
  }

  await saveFavorite(input.userId, input.postId);
  return true;
}

export function observeFavoritePostIds(
  userId: string | null | undefined,
  onFavoritePostIds: (postIds: string[]) => void,
  onError?: (error: Error) => void
) {
  if (!userId) {
    onFavoritePostIds([]);
    return () => undefined;
  }

  return subscribeToFavoritePostIds(userId, onFavoritePostIds, onError);
}
