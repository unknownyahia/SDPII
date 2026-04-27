import { createPost } from '../repositories/postsRepository';
import type { DisplayCategoryId } from '../constants/categories';
import type { CreateSpotPostInput, SpotCategory } from '../types/post';
import {
  getCurrentCoordinates,
  getLocationDisplayName,
  requestForegroundLocationPermission,
} from './locationService';
import type { LocationOverride } from './locationPresets';

export class PostValidationError extends Error {}
export class PostLocationPermissionError extends Error {}

const MAX_POST_TEXT_LENGTH = 280;

type PublishPostInput = {
  userId: string | null | undefined;
  text: string;
  category: SpotCategory;
  displayCategory?: DisplayCategoryId | null;
  locationOverride?: LocationOverride | null;
  heroImageUrl?: string | null;
};

type PublishPostResult = {
  locationName: string;
};

function normalizePostText(text: string) {
  return text.trim();
}

function isFiniteCoordinate(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function normalizeHeroImageUrl(value: string | null | undefined) {
  const trimmed = value?.trim() ?? '';
  if (!trimmed) {
    return null;
  }

  if (!/^https?:\/\//i.test(trimmed)) {
    throw new PostValidationError('Media must use a valid http or https URL.');
  }

  return trimmed;
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

  if (normalizedText.length > MAX_POST_TEXT_LENGTH) {
    throw new PostValidationError(
      `Post text must be ${MAX_POST_TEXT_LENGTH} characters or fewer.`
    );
  }

  let latitude = input.locationOverride?.latitude;
  let longitude = input.locationOverride?.longitude;
  let locationName = input.locationOverride?.locationName ?? '';

  if (!isFiniteCoordinate(latitude) || !isFiniteCoordinate(longitude)) {
    const { status } = await requestForegroundLocationPermission();
    if (status !== 'granted') {
      throw new PostLocationPermissionError(
        'We need location permission to attach your spot to the map.'
      );
    }

    const coordinates = await getCurrentCoordinates();
    latitude = coordinates.latitude;
    longitude = coordinates.longitude;
    locationName = await getLocationDisplayName(latitude, longitude);
  }

  const postInput: CreateSpotPostInput = {
    userId: input.userId,
    text: normalizedText,
    category: input.category,
    displayCategory: input.displayCategory ?? null,
    lat: latitude,
    lng: longitude,
    locationName: locationName || null,
    heroImageUrl: normalizeHeroImageUrl(input.heroImageUrl),
  };

  await createPost(postInput);

  return {
    locationName,
  };
}
