import {
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  type DocumentData,
  type DocumentSnapshot,
} from 'firebase/firestore';

import { db } from '../firebase/firebase';
import type {
  AppProfile,
  AppLanguage,
  CreateAppProfileInput,
  UpdateAppProfileInput,
} from '../types/profile';
import type { BadgeKey } from '../types/gamification';
import type { UserRole } from '../types/user';

const USERS_COLLECTION = 'users';
const SUPPORTED_LANGUAGES: AppLanguage[] = ['en', 'ar'];
const SUPPORTED_ROLES: UserRole[] = ['user', 'admin', 'organization'];
const SUPPORTED_BADGES: BadgeKey[] = [
  'first_post',
  'first_comment',
  'first_like_received',
];

function isSupportedRole(value: unknown): value is UserRole {
  return typeof value === 'string' && SUPPORTED_ROLES.includes(value as UserRole);
}

function isSupportedLanguage(value: unknown): value is AppLanguage {
  return (
    typeof value === 'string' && SUPPORTED_LANGUAGES.includes(value as AppLanguage)
  );
}

function buildDefaultUsername(email: string | null, fallbackId: string) {
  if (email) {
    return email.split('@')[0] || fallbackId;
  }

  return fallbackId;
}

function mapBadgeKeys(value: unknown): BadgeKey[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(
    (item): item is BadgeKey =>
      typeof item === 'string' && SUPPORTED_BADGES.includes(item as BadgeKey)
  );
}

function mapProfileDocument(
  snapshot: DocumentSnapshot<DocumentData>,
  fallback: { id: string; email: string | null }
): AppProfile {
  const data = snapshot.data() || {};

  return {
    id: fallback.id,
    email: typeof data.email === 'string' || data.email === null ? data.email : fallback.email,
    role: isSupportedRole(data.role) ? data.role : 'user',
    xp: typeof data.xp === 'number' ? data.xp : 0,
    badgeKeys: mapBadgeKeys(data.badgeKeys),
    username:
      typeof data.username === 'string' && data.username.trim()
        ? data.username
        : buildDefaultUsername(fallback.email, fallback.id),
    bio: typeof data.bio === 'string' ? data.bio : '',
    language: isSupportedLanguage(data.language) ? data.language : 'en',
    privacyMode: typeof data.privacyMode === 'boolean' ? data.privacyMode : false,
    emailNotifications:
      typeof data.emailNotifications === 'boolean' ? data.emailNotifications : true,
    marketingEmails:
      typeof data.marketingEmails === 'boolean' ? data.marketingEmails : false,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}

export async function createProfile(input: CreateAppProfileInput) {
  await setDoc(doc(db, USERS_COLLECTION, input.id), {
    ...input,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function getProfileById(userId: string, email: string | null) {
  const snapshot = await getDoc(doc(db, USERS_COLLECTION, userId));
  return mapProfileDocument(snapshot, { id: userId, email });
}

export async function profileExistsById(userId: string) {
  const snapshot = await getDoc(doc(db, USERS_COLLECTION, userId));
  return snapshot.exists();
}

export function subscribeToProfileById(
  userId: string,
  email: string | null,
  onProfile: (profile: AppProfile) => void,
  onError?: (error: Error) => void
) {
  return onSnapshot(
    doc(db, USERS_COLLECTION, userId),
    (snapshot) => {
      onProfile(mapProfileDocument(snapshot, { id: userId, email }));
    },
    (error) => {
      if (onError) {
        onError(error);
      }
    }
  );
}

export async function updateProfileById(
  userId: string,
  input: UpdateAppProfileInput
) {
  await setDoc(
    doc(db, USERS_COLLECTION, userId),
    {
      ...input,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export async function updateProfileRoleById(
  userId: string,
  role: UserRole
) {
  await setDoc(
    doc(db, USERS_COLLECTION, userId),
    {
      role,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}
