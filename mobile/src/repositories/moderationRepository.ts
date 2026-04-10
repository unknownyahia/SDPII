import { doc, setDoc } from 'firebase/firestore';

import { db } from '../firebase/firebase';

const POSTS_COLLECTION = 'posts';
const COMMENTS_COLLECTION = 'comments';

export async function hidePostById(postId: string) {
  return setDoc(
    doc(db, POSTS_COLLECTION, postId),
    {
      isHidden: true,
      moderationStatus: 'hidden',
    },
    { merge: true }
  );
}

export async function hideCommentById(postId: string, commentId: string) {
  return setDoc(
    doc(db, POSTS_COLLECTION, postId, COMMENTS_COLLECTION, commentId),
    {
      isHidden: true,
      moderationStatus: 'hidden',
    },
    { merge: true }
  );
}
