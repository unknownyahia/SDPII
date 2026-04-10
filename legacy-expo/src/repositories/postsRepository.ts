import {
  addDoc,
  collection,
  onSnapshot,
  serverTimestamp,
  type DocumentData,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';

import { db } from '../firebase/firebaseConfig';
import type { CreateSpotPostInput, SpotCategory, SpotPost } from '../types/post';

const POSTS_COLLECTION = 'posts';
const SPOT_CATEGORIES: SpotCategory[] = [
  'fishing',
  'event',
  'sighting',
  'weather',
];

function isSpotCategory(value: unknown): value is SpotCategory {
  return typeof value === 'string' && SPOT_CATEGORIES.includes(value as SpotCategory);
}

function mapPostDocument(docSnap: QueryDocumentSnapshot<DocumentData>): SpotPost | null {
  const data = docSnap.data();

  if (typeof data.lat !== 'number' || typeof data.lng !== 'number') {
    return null;
  }

  return {
    id: docSnap.id,
    userId: typeof data.userId === 'string' ? data.userId : undefined,
    text: typeof data.text === 'string' ? data.text : '',
    category: isSpotCategory(data.category) ? data.category : undefined,
    lat: data.lat,
    lng: data.lng,
    locationName:
      typeof data.locationName === 'string' ? data.locationName : null,
    createdAt: data.createdAt,
  };
}

export function subscribeToPosts(
  onPosts: (posts: SpotPost[]) => void,
  onError?: (error: Error) => void
) {
  return onSnapshot(
    collection(db, POSTS_COLLECTION),
    (snapshot) => {
      const posts = snapshot.docs
        .map(mapPostDocument)
        .filter((post): post is SpotPost => post !== null);

      onPosts(posts);
    },
    (error) => {
      if (onError) {
        onError(error);
      }
    }
  );
}

export async function createPost(input: CreateSpotPostInput) {
  return addDoc(collection(db, POSTS_COLLECTION), {
    ...input,
    createdAt: serverTimestamp(),
  });
}

export async function createPosts(inputs: CreateSpotPostInput[]) {
  return Promise.all(inputs.map((input) => createPost(input)));
}
