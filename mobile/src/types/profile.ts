import type { BadgeKey } from './gamification';
import type { UserRole } from './user';

export type AppLanguage = 'en' | 'ar';

export type AppProfile = {
  id: string;
  email: string | null;
  role: UserRole;
  xp: number;
  badgeKeys: BadgeKey[];
  username: string;
  bio: string;
  language: AppLanguage;
  privacyMode: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
};

export type CreateAppProfileInput = Omit<
  AppProfile,
  'createdAt' | 'updatedAt'
>;

export type UpdateAppProfileInput = Pick<
  AppProfile,
  'username' | 'bio' | 'language' | 'privacyMode'
>;
