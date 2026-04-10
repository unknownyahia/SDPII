import type { User } from 'firebase/auth';

import {
  loginWithEmail,
  logoutCurrentUser,
  registerWithEmail,
  subscribeToAuthState,
} from '../repositories/authRepository';
import { createUserProfile } from '../repositories/userRepository';
import type { AppUserIdentity, CreateAppUserProfileInput } from '../types/user';

export class AuthValidationError extends Error {}

type EmailPasswordInput = {
  email: string;
  password: string;
};

function normalizeCredentials(input: EmailPasswordInput) {
  return {
    email: input.email.trim(),
    password: input.password,
  };
}

function validateCredentials(input: EmailPasswordInput) {
  if (!input.email || !input.password) {
    throw new AuthValidationError('Please enter email and password.');
  }
}

function mapFirebaseUser(user: User | null): AppUserIdentity | null {
  if (!user) {
    return null;
  }

  return {
    id: user.uid,
    email: user.email,
    displayInfo: user.email || user.uid,
  };
}

export function observeAuthState(
  onChange: (user: AppUserIdentity | null) => void
) {
  return subscribeToAuthState((user) => {
    onChange(mapFirebaseUser(user));
  });
}

export async function registerUser(input: EmailPasswordInput) {
  validateCredentials(input);

  const normalized = normalizeCredentials(input);
  const credential = await registerWithEmail(
    normalized.email,
    normalized.password
  );

  const userProfile: CreateAppUserProfileInput = {
    id: credential.user.uid,
    email: credential.user.email,
    role: 'user',
    xp: 0,
  };

  await createUserProfile(userProfile);

  return mapFirebaseUser(credential.user);
}

export async function loginUser(input: EmailPasswordInput) {
  validateCredentials(input);

  const normalized = normalizeCredentials(input);
  const credential = await loginWithEmail(
    normalized.email,
    normalized.password
  );

  return mapFirebaseUser(credential.user);
}

export async function logoutUser() {
  return logoutCurrentUser();
}
