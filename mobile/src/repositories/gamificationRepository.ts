import {
  doc,
  runTransaction,
  type Transaction,
} from 'firebase/firestore';

import { db } from '../firebase/firebase';
import type { XpEventType } from '../types/gamification';

const USERS_COLLECTION = 'users';
const XP_EVENTS_COLLECTION = 'xpEvents';

type AwardXpInput = {
  userId: string;
  eventId: string;
  points: number;
  type: XpEventType;
};

function getProfileDocRef(userId: string) {
  return doc(db, USERS_COLLECTION, userId);
}

function getXpEventDocRef(userId: string, eventId: string) {
  return doc(db, USERS_COLLECTION, userId, XP_EVENTS_COLLECTION, eventId);
}

async function applyXpAward(
  transaction: Transaction,
  input: AwardXpInput
) {
  const profileRef = getProfileDocRef(input.userId);
  const xpEventRef = getXpEventDocRef(input.userId, input.eventId);

  const [profileSnap, xpEventSnap] = await Promise.all([
    transaction.get(profileRef),
    transaction.get(xpEventRef),
  ]);

  if (xpEventSnap.exists()) {
    return false;
  }

  if (!profileSnap.exists()) {
    throw new Error('User profile not found for XP award.');
  }

  const currentXp =
    typeof profileSnap.data()?.xp === 'number' ? profileSnap.data()?.xp : 0;

  transaction.set(
    profileRef,
    {
      xp: currentXp + input.points,
      updatedAt: new Date(),
    },
    { merge: true }
  );

  transaction.set(xpEventRef, {
    type: input.type,
    points: input.points,
    createdAt: new Date(),
  });

  return true;
}

export async function awardXpIfNotExists(input: AwardXpInput) {
  return runTransaction(db, async (transaction) => applyXpAward(transaction, input));
}
