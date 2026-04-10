export type UserRole = 'user' | 'admin' | 'organization';

export type AppUserProfile = {
  id: string;
  email: string | null;
  role: UserRole;
  xp: number;
  createdAt?: unknown;
};

export type CreateAppUserProfileInput = Omit<AppUserProfile, 'createdAt'>;

export type AppUserIdentity = {
  id: string;
  email: string | null;
  displayInfo: string;
};
