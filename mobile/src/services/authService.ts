import type { User } from 'firebase/auth';

import {
  loginWithEmail,
  logoutCurrentUser,
  registerWithEmail,
  subscribeToAuthState,
  waitForAuthenticatedSession,
} from '../repositories/authRepository';
import {
  createDefaultProfile,
  loadCurrentUserProfile,
} from './profileService';
import { ensureDefaultSubscription } from './subscriptionService';
import type { AppUserIdentity } from '../types/user';

export class AuthValidationError extends Error {}

const BOOTSTRAP_RETRY_DELAYS_MS = [250, 500, 1000];

type AuthAction = 'login' | 'register';

type AuthErrorFeedback = {
  title: string;
  message: string;
};

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

export function getAuthErrorFeedback(
  error: unknown,
  action: AuthAction
): AuthErrorFeedback {
  const code =
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof (error as { code?: unknown }).code === 'string'
      ? (error as { code: string }).code
      : '';
  const message =
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as { message?: unknown }).message === 'string'
      ? (error as { message: string }).message
      : 'Something went wrong.';

  if (code.includes('invalid-credential')) {
    return {
      title: 'Incorrect email or password',
      message: 'Check your credentials and try again.',
    };
  }

  if (code.includes('email-already-in-use')) {
    return {
      title: 'Email already in use',
      message: 'Sign in instead, or use a different email address.',
    };
  }

  if (code.includes('weak-password')) {
    return {
      title: 'Password is too weak',
      message: 'Use a longer password with a mix of letters, numbers, and symbols.',
    };
  }

  if (code.includes('invalid-email')) {
    return {
      title: 'Invalid email address',
      message: 'Enter a valid email address and try again.',
    };
  }

  if (code.includes('too-many-requests')) {
    return {
      title: 'Too many attempts',
      message: 'Wait a moment before trying again.',
    };
  }

  if (code.includes('network-request-failed')) {
    return {
      title: 'Network error',
      message: 'Check your connection and try again.',
    };
  }

  if (isRetryableBootstrapError(error)) {
    return {
      title: action === 'register' ? 'Account created, but setup is blocked' : 'Signed in, but account data is blocked',
      message:
        'Authentication succeeded, but the active Firestore project denied account data access. Check the current Firestore rules or project configuration.',
    };
  }

  return {
    title: action === 'register' ? 'Register error' : 'Login error',
    message,
  };
}

function isRetryableBootstrapError(error: unknown) {
  const code =
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof (error as { code?: unknown }).code === 'string'
      ? (error as { code: string }).code
      : '';
  const message =
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as { message?: unknown }).message === 'string'
      ? (error as { message: string }).message.toLowerCase()
      : '';

  return (
    code.includes('permission-denied') ||
    code.includes('unauthenticated') ||
    message.includes('missing or insufficient permissions') ||
    message.includes('permission denied') ||
    message.includes('unauthenticated')
  );
}

function waitForDelay(delayMs: number) {
  return new Promise(resolve => {
    setTimeout(resolve, delayMs);
  });
}

async function withBootstrapRetry(task: () => Promise<void>) {
  let lastError: unknown;

  for (let attempt = 0; attempt <= BOOTSTRAP_RETRY_DELAYS_MS.length; attempt += 1) {
    try {
      await task();
      return;
    } catch (error) {
      lastError = error;

      if (
        attempt === BOOTSTRAP_RETRY_DELAYS_MS.length ||
        !isRetryableBootstrapError(error)
      ) {
        break;
      }

      await waitForDelay(BOOTSTRAP_RETRY_DELAYS_MS[attempt]);
    }
  }

  throw lastError;
}

async function ensureProfileForReturningUser(user: User) {
  const appUser = mapFirebaseUser(user);
  if (!appUser) {
    throw new Error('Account session is not ready yet.');
  }

  try {
    await withBootstrapRetry(async () => {
      await loadCurrentUserProfile({ user: appUser });
    });
    return;
  } catch (error) {
    if (!isRetryableBootstrapError(error)) {
      throw error;
    }
  }

  await withBootstrapRetry(async () => {
    await createDefaultProfile({
      id: user.uid,
      email: user.email,
      role: 'user',
    });
  });
}

async function bootstrapNewUserAccount(user: User) {
  const readyUser = await waitForAuthenticatedSession(user.uid);

  await withBootstrapRetry(async () => {
    await createDefaultProfile({
      id: readyUser.uid,
      email: readyUser.email,
      role: 'user',
    });
  });
  await withBootstrapRetry(async () => {
    await ensureDefaultSubscription(readyUser.uid);
  });
}

async function bootstrapReturningUserAccount(user: User) {
  const readyUser = await waitForAuthenticatedSession(user.uid);

  await ensureProfileForReturningUser(readyUser);
  await withBootstrapRetry(async () => {
    await ensureDefaultSubscription(readyUser.uid);
  });
}

export async function registerUser(input: EmailPasswordInput) {
  validateCredentials(input);

  const normalized = normalizeCredentials(input);
  const credential = await registerWithEmail(
    normalized.email,
    normalized.password
  );

  await bootstrapNewUserAccount(credential.user);

  return mapFirebaseUser(credential.user);
}

export async function loginUser(input: EmailPasswordInput) {
  validateCredentials(input);

  const normalized = normalizeCredentials(input);
  const credential = await loginWithEmail(
    normalized.email,
    normalized.password
  );

  await bootstrapReturningUserAccount(credential.user);

  return mapFirebaseUser(credential.user);
}

export async function logoutUser() {
  return logoutCurrentUser();
}
