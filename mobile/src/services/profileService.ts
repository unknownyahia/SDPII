import {
  createProfile,
  getProfileById,
  profileExistsById,
  subscribeToProfileById,
  updateProfileById,
} from '../repositories/profileRepository';
import type {
  AppLanguage,
  AppProfile,
  CreateAppProfileInput,
  UpdateAppProfileInput,
} from '../types/profile';
import type { AppUserIdentity, UserRole } from '../types/user';

export class ProfileValidationError extends Error {}

type CreateDefaultProfileInput = {
  id: string;
  email: string | null;
  role?: UserRole;
};

type LoadProfileInput = {
  user: AppUserIdentity | null;
};

type SaveProfileInput = {
  userId: string | null | undefined;
  username: string;
  bio: string;
  language: AppLanguage;
  privacyMode: boolean;
};

function buildDefaultUsername(email: string | null, userId: string) {
  if (email) {
    return email.split('@')[0] || userId;
  }

  return userId;
}

export async function createDefaultProfile(input: CreateDefaultProfileInput) {
  const profile: CreateAppProfileInput = {
    id: input.id,
    email: input.email,
    role: input.role ?? 'user',
    xp: 0,
    badgeKeys: [],
    username: buildDefaultUsername(input.email, input.id),
    bio: '',
    language: 'en',
    privacyMode: false,
  };

  await createProfile(profile);
}

export async function ensureDefaultProfile(input: CreateDefaultProfileInput) {
  if (await profileExistsById(input.id)) {
    return;
  }

  await createDefaultProfile(input);
}

export async function loadCurrentUserProfile(
  input: LoadProfileInput
): Promise<AppProfile> {
  if (!input.user) {
    throw new ProfileValidationError('You must be logged in to view your profile.');
  }

  return getProfileById(input.user.id, input.user.email);
}

export function observeCurrentUserProfile(
  input: LoadProfileInput,
  onProfile: (profile: AppProfile) => void,
  onError?: (error: Error) => void
) {
  if (!input.user) {
    throw new ProfileValidationError('You must be logged in to view your profile.');
  }

  return subscribeToProfileById(input.user.id, input.user.email, onProfile, onError);
}

export async function saveCurrentUserProfile(input: SaveProfileInput) {
  if (!input.userId) {
    throw new ProfileValidationError('You must be logged in to update your profile.');
  }

  const username = input.username.trim();
  const bio = input.bio.trim();

  if (!username) {
    throw new ProfileValidationError('Username cannot be empty.');
  }

  const update: UpdateAppProfileInput = {
    username,
    bio,
    language: input.language,
    privacyMode: input.privacyMode,
  };

  await updateProfileById(input.userId, update);
}
