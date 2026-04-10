import { createPost, createPosts } from '../repositories/postsRepository';
import { SAMPLE_POSTS } from '../samplePosts';
import type { CreateSpotPostInput, SpotCategory } from '../types/post';
import {
  getCurrentCoordinates,
  getLocationDisplayName,
  requestForegroundLocationPermission,
} from './locationService';

export class PostValidationError extends Error {}
export class PostLocationPermissionError extends Error {}

type PublishPostInput = {
  userId: string | null | undefined;
  text: string;
  category: SpotCategory;
};

type PublishPostResult = {
  locationName: string;
};

function normalizePostText(text: string) {
  return text.trim();
}

export async function publishCurrentLocationPost(
  input: PublishPostInput
): Promise<PublishPostResult> {
  if (!input.userId) {
    throw new PostValidationError('You must be logged in to create a post.');
  }

  const normalizedText = normalizePostText(input.text);
  if (!normalizedText) {
    throw new PostValidationError('Please enter some text for your update.');
  }

  const { status } = await requestForegroundLocationPermission();
  if (status !== 'granted') {
    throw new PostLocationPermissionError(
      'We need location permission to attach your spot to the map.'
    );
  }

  const { latitude, longitude } = await getCurrentCoordinates();
  const locationName = await getLocationDisplayName(latitude, longitude);

  const postInput: CreateSpotPostInput = {
    userId: input.userId,
    text: normalizedText,
    category: input.category,
    lat: latitude,
    lng: longitude,
    locationName: locationName || null,
  };

  await createPost(postInput);

  return {
    locationName,
  };
}

export async function seedDemoPosts() {
  await createPosts(
    SAMPLE_POSTS.map((post) => ({
      ...post,
      locationName: null,
    }))
  );
}
