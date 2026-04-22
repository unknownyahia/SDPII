import {
  addDoc,
  collection,
  getCountFromServer,
  onSnapshot,
  query,
  serverTimestamp,
  where,
  type DocumentData,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';

import { db } from '../firebase/firebase';
import type { CreatePromotedEventInput, EventStatus, PromotedEvent } from '../types/event';
import type { SpotCategory } from '../types/post';

const EVENTS_COLLECTION = 'events';
const SUPPORTED_CATEGORIES: SpotCategory[] = [
  'fishing',
  'event',
  'sighting',
  'weather',
];
const SUPPORTED_STATUSES: EventStatus[] = ['active', 'hidden', 'cancelled'];

function isSpotCategory(value: unknown): value is SpotCategory {
  return typeof value === 'string' && SUPPORTED_CATEGORIES.includes(value as SpotCategory);
}

function isEventStatus(value: unknown): value is EventStatus {
  return typeof value === 'string' && SUPPORTED_STATUSES.includes(value as EventStatus);
}

function mapEventDocument(
  docSnap: QueryDocumentSnapshot<DocumentData>
): PromotedEvent | null {
  const data = docSnap.data();

  if (
    typeof data.title !== 'string' ||
    typeof data.description !== 'string' ||
    typeof data.lat !== 'number' ||
    typeof data.lng !== 'number'
  ) {
    return null;
  }

  return {
    id: docSnap.id,
    placeId: typeof data.placeId === 'string' ? data.placeId : null,
    title: data.title,
    description: data.description,
    category: isSpotCategory(data.category) ? data.category : 'event',
    locationName:
      typeof data.locationName === 'string' ? data.locationName : null,
    venueName:
      typeof data.venueName === 'string' ? data.venueName : null,
    organizerName:
      typeof data.organizerName === 'string' ? data.organizerName : null,
    heroImageUrl:
      typeof data.heroImageUrl === 'string' ? data.heroImageUrl : null,
    lat: data.lat,
    lng: data.lng,
    startTime: typeof data.startTime === 'string' ? data.startTime : '',
    endTime: typeof data.endTime === 'string' ? data.endTime : '',
    createdBy: typeof data.createdBy === 'string' ? data.createdBy : '',
    isPromoted: data.isPromoted === true,
    createdAt: data.createdAt,
    status: isEventStatus(data.status) ? data.status : 'active',
  };
}

export async function createEvent(input: CreatePromotedEventInput) {
  return addDoc(collection(db, EVENTS_COLLECTION), {
    ...input,
    createdAt: serverTimestamp(),
  });
}

export async function getActivePromotedEventsCountByCreator(userId: string) {
  const snapshot = await getCountFromServer(
    query(
      collection(db, EVENTS_COLLECTION),
      where('createdBy', '==', userId),
      where('status', '==', 'active'),
      where('isPromoted', '==', true)
    )
  );

  return snapshot.data().count;
}

export function subscribeToActivePromotedEventsCountByCreator(
  userId: string,
  onCount: (count: number) => void,
  onError?: (error: Error) => void
) {
  return onSnapshot(
    query(
      collection(db, EVENTS_COLLECTION),
      where('createdBy', '==', userId),
      where('status', '==', 'active'),
      where('isPromoted', '==', true)
    ),
    (snapshot) => {
      onCount(snapshot.size);
    },
    (error) => {
      if (onError) {
        onError(error);
      }
    }
  );
}

export function subscribeToEvents(
  onEvents: (events: PromotedEvent[]) => void,
  onError?: (error: Error) => void
) {
  return onSnapshot(
    query(collection(db, EVENTS_COLLECTION), where('status', '==', 'active')),
    (snapshot) => {
      onEvents(
        snapshot.docs
          .map(mapEventDocument)
          .filter((event): event is PromotedEvent => event !== null)
      );
    },
    (error) => {
      if (onError) {
        onError(error);
      }
    }
  );
}
