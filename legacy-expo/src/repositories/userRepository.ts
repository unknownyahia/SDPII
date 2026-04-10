import { doc, serverTimestamp, setDoc } from 'firebase/firestore';

import { db } from '../firebase/firebaseConfig';
import type { AppUserProfile, CreateAppUserProfileInput } from '../types/user';

const USERS_COLLECTION = 'users';

export async function createUserProfile(input: CreateAppUserProfileInput) {
  const userProfile: Omit<AppUserProfile, 'createdAt'> = {
    id: input.id,
    email: input.email,
    role: input.role,
    xp: input.xp,
  };

  await setDoc(doc(db, USERS_COLLECTION, input.id), {
    ...userProfile,
    createdAt: serverTimestamp(),
  });
}
