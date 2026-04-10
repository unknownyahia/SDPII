import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  type DocumentData,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';

import { db } from '../firebase/firebase';
import type {
  AppNotification,
  CreateAppNotificationInput,
} from '../types/notification';

const USERS_COLLECTION = 'users';
const NOTIFICATIONS_COLLECTION = 'notifications';

function mapNotificationDocument(
  docSnap: QueryDocumentSnapshot<DocumentData>
): AppNotification {
  const data = docSnap.data();

  return {
    id: docSnap.id,
    recipientUserId:
      typeof data.recipientUserId === 'string' ? data.recipientUserId : '',
    actorUserId: typeof data.actorUserId === 'string' ? data.actorUserId : '',
    actorLabel: typeof data.actorLabel === 'string' ? data.actorLabel : 'Someone',
    type:
      data.type === 'comment_on_post' || data.type === 'like_on_post'
        ? data.type
        : 'like_on_post',
    postId: typeof data.postId === 'string' ? data.postId : '',
    commentId: typeof data.commentId === 'string' ? data.commentId : null,
    message: typeof data.message === 'string' ? data.message : '',
    isRead: typeof data.isRead === 'boolean' ? data.isRead : false,
    createdAt: data.createdAt,
    readAt: data.readAt,
  };
}

export async function createNotification(input: CreateAppNotificationInput) {
  return addDoc(
    collection(db, USERS_COLLECTION, input.recipientUserId, NOTIFICATIONS_COLLECTION),
    {
      ...input,
      createdAt: serverTimestamp(),
      readAt: null,
    }
  );
}

export async function upsertLikeNotification(
  input: CreateAppNotificationInput & { id: string }
) {
  return setDoc(
    doc(
      db,
      USERS_COLLECTION,
      input.recipientUserId,
      NOTIFICATIONS_COLLECTION,
      input.id
    ),
    {
      ...input,
      createdAt: serverTimestamp(),
      readAt: null,
    }
  );
}

export async function markNotificationRead(
  userId: string,
  notificationId: string
) {
  return setDoc(
    doc(db, USERS_COLLECTION, userId, NOTIFICATIONS_COLLECTION, notificationId),
    {
      isRead: true,
      readAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export function subscribeToNotifications(
  userId: string,
  onNotifications: (notifications: AppNotification[]) => void,
  onError?: (error: Error) => void
) {
  return onSnapshot(
    query(
      collection(db, USERS_COLLECTION, userId, NOTIFICATIONS_COLLECTION),
      orderBy('createdAt', 'desc')
    ),
    (snapshot) => {
      onNotifications(snapshot.docs.map(mapNotificationDocument));
    },
    (error) => {
      if (onError) {
        onError(error);
      }
    }
  );
}
