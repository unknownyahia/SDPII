import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';

import { db } from '../firebase/firebase';

const POSTS_COLLECTION = 'posts';
const REACTIONS_COLLECTION = 'reactions';

function getReactionDocRef(postId: string, userId: string) {
  return doc(db, POSTS_COLLECTION, postId, REACTIONS_COLLECTION, userId);
}

export async function saveLike(postId: string, userId: string) {
  return setDoc(getReactionDocRef(postId, userId), {
    postId,
    userId,
    type: 'like',
    createdAt: serverTimestamp(),
  });
}

export async function removeLike(postId: string, userId: string) {
  return deleteDoc(getReactionDocRef(postId, userId));
}

export function subscribeToLikeUserIds(
  postId: string,
  onUserIds: (userIds: string[]) => void,
  onError?: (error: Error) => void
) {
  return onSnapshot(
    collection(db, POSTS_COLLECTION, postId, REACTIONS_COLLECTION),
    (snapshot) => {
      onUserIds(snapshot.docs.map((docSnap) => docSnap.id));
    },
    (error) => {
      if (onError) {
        onError(error);
      }
    }
  );
}
