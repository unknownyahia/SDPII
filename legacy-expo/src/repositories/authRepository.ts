import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from 'firebase/auth';

import { auth } from '../firebase/firebaseConfig';

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
