import {
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  type DocumentData,
  type DocumentSnapshot,
} from 'firebase/firestore';

import { db } from '../firebase/firebase';
import type {
  CreateUserSubscriptionInput,
  PlanLevel,
  PlanStatus,
  UserSubscription,
} from '../types/subscription';

const USERS_COLLECTION = 'users';
const SUBSCRIPTIONS_COLLECTION = 'subscriptions';
const CURRENT_SUBSCRIPTION_ID = 'current';
const SUPPORTED_PLAN_LEVELS: PlanLevel[] = [
  'free',
  'organization_basic',
  'organization_premium',
];
const SUPPORTED_PLAN_STATUSES: PlanStatus[] = ['active', 'inactive', 'trial'];

function isPlanLevel(value: unknown): value is PlanLevel {
  return (
    typeof value === 'string' &&
    SUPPORTED_PLAN_LEVELS.includes(value as PlanLevel)
  );
}

function isPlanStatus(value: unknown): value is PlanStatus {
  return (
    typeof value === 'string' &&
    SUPPORTED_PLAN_STATUSES.includes(value as PlanStatus)
  );
}

function getSubscriptionDocRef(userId: string) {
  return doc(
    db,
    USERS_COLLECTION,
    userId,
    SUBSCRIPTIONS_COLLECTION,
    CURRENT_SUBSCRIPTION_ID
  );
}

function mapSubscriptionDocument(
  snapshot: DocumentSnapshot<DocumentData>,
  fallbackUserId: string
): UserSubscription {
  const data = snapshot.data() || {};

  return {
    userId: fallbackUserId,
    planLevel: isPlanLevel(data.planLevel) ? data.planLevel : 'free',
    status: isPlanStatus(data.status) ? data.status : 'active',
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}

export async function createSubscription(input: CreateUserSubscriptionInput) {
  await setDoc(getSubscriptionDocRef(input.userId), {
    ...input,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function getSubscriptionByUserId(userId: string) {
  const snapshot = await getDoc(getSubscriptionDocRef(userId));
  return mapSubscriptionDocument(snapshot, userId);
}

export async function subscriptionExistsByUserId(userId: string) {
  const snapshot = await getDoc(getSubscriptionDocRef(userId));
  return snapshot.exists();
}

export function subscribeToSubscriptionByUserId(
  userId: string,
  onSubscription: (subscription: UserSubscription) => void,
  onError?: (error: Error) => void
) {
  return onSnapshot(
    getSubscriptionDocRef(userId),
    (snapshot) => {
      onSubscription(mapSubscriptionDocument(snapshot, userId));
    },
    (error) => {
      if (onError) {
        onError(error);
      }
    }
  );
}

export async function updateSubscriptionByUserId(
  userId: string,
  update: Pick<UserSubscription, 'planLevel' | 'status'>
) {
  await setDoc(
    getSubscriptionDocRef(userId),
    {
      ...update,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}
