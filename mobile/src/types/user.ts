export type AppUserIdentity = {
  id: string;
  email: string | null;
  displayInfo: string;
};

export type UserRole = 'user' | 'admin' | 'organization';
