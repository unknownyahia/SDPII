import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';

import { db } from '../firebase/firebase';

const USERS_COLLECTION = 'users';
const FAVORITES_COLLECTION = 'favorites';

function getFavoriteDocRef(userId: string, postId: string) {
  return doc(db, USERS_COLLECTION, userId, FAVORITES_COLLECTION, postId);
}

export async function saveFavorite(userId: string, postId: string) {
  return setDoc(getFavoriteDocRef(userId, postId), {
    userId,
    postId,
    createdAt: serverTimestamp(),
  });
}

export async function removeFavorite(userId: string, postId: string) {
  return deleteDoc(getFavoriteDocRef(userId, postId));
}

export function subscribeToFavoritePostIds(
  userId: string,
  onFavoritePostIds: (postIds: string[]) => void,
  onError?: (error: Error) => void
) {
  return onSnapshot(
    collection(db, USERS_COLLECTION, userId, FAVORITES_COLLECTION),
    (snapshot) => {
      onFavoritePostIds(snapshot.docs.map((docSnap) => docSnap.id));
    },
    (error) => {
      if (onError) {
        onError(error);
      }
    }
  );
}
