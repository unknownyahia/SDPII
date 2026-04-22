import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from 'firebase/auth';

import { auth } from '../firebase/firebase';

const AUTH_SESSION_TIMEOUT_MS = 5000;

export function subscribeToAuthState(
  onChange: (user: User | null) => void
) {
  return onAuthStateChanged(auth, onChange);
}

export async function registerWithEmail(email: string, password: string) {
  return createUserWithEmailAndPassword(auth, email, password);
}

export async function loginWithEmail(email: string, password: string) {
  return signInWithEmailAndPassword(auth, email, password);
}

export async function logoutCurrentUser() {
  return signOut(auth);
}

export async function waitForAuthenticatedSession(expectedUserId?: string) {
  if (typeof auth.authStateReady === 'function') {
    await auth.authStateReady();
  }

  if (expectedUserId && auth.currentUser?.uid !== expectedUserId) {
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        unsubscribe();
        reject(new Error('Timed out while preparing your account session.'));
      }, AUTH_SESSION_TIMEOUT_MS);

      const unsubscribe = onAuthStateChanged(
        auth,
        (user) => {
          if (user?.uid !== expectedUserId) {
            return;
          }

          clearTimeout(timeout);
          unsubscribe();
          resolve();
        },
        (error) => {
          clearTimeout(timeout);
          unsubscribe();
          reject(error);
        }
      );
    });
  }

  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('Account session is not ready yet.');
  }

  await currentUser.getIdToken();
  return currentUser;
}
