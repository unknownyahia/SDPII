import {
  addDoc,
  collection,
  collectionGroup,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  type DocumentData,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';

import { db } from '../firebase/firebase';
import type { CreatePostCommentInput, PostComment } from '../types/comment';

const POSTS_COLLECTION = 'posts';
const COMMENTS_COLLECTION = 'comments';

function mapCommentDocument(
  postId: string,
  docSnap: QueryDocumentSnapshot<DocumentData>
): PostComment | null {
  const data = docSnap.data();

  if (data.isHidden === true) {
    return null;
  }

  return {
    id: docSnap.id,
    postId,
    userId: typeof data.userId === 'string' ? data.userId : '',
    authorLabel:
      typeof data.authorLabel === 'string' ? data.authorLabel : 'Unknown user',
    text: typeof data.text === 'string' ? data.text : '',
    createdAt: data.createdAt,
  };
}

export async function createComment(input: CreatePostCommentInput) {
  return addDoc(collection(db, POSTS_COLLECTION, input.postId, COMMENTS_COLLECTION), {
    userId: input.userId,
    authorLabel: input.authorLabel,
    text: input.text,
    createdAt: serverTimestamp(),
  });
}

export async function deleteComment(postId: string, commentId: string) {
  return deleteDoc(doc(db, POSTS_COLLECTION, postId, COMMENTS_COLLECTION, commentId));
}

export function subscribeToComments(
  postId: string,
  onComments: (comments: PostComment[]) => void,
  onError?: (error: Error) => void
) {
  return onSnapshot(
    query(
      collection(db, POSTS_COLLECTION, postId, COMMENTS_COLLECTION),
      orderBy('createdAt', 'asc')
    ),
    (snapshot) => {
      onComments(
        snapshot.docs
          .map((docSnap) => mapCommentDocument(postId, docSnap))
          .filter((comment): comment is PostComment => comment !== null)
      );
    },
    (error) => {
      if (onError) {
        onError(error);
      }
    }
  );
}

export function subscribeToCommentCountsByPost(
  onCounts: (counts: Record<string, number>) => void,
  onError?: (error: Error) => void
) {
  return onSnapshot(
    collectionGroup(db, COMMENTS_COLLECTION),
    (snapshot) => {
      const counts: Record<string, number> = {};

      snapshot.docs.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.isHidden === true) {
          return;
        }

        const postId = docSnap.ref.parent.parent?.id;
        if (!postId) {
          return;
        }

        counts[postId] = (counts[postId] ?? 0) + 1;
      });

      onCounts(counts);
    },
    (error) => {
      if (onError) {
        onError(error);
      }
    }
  );
}
