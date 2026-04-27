import {
  addDoc,
  collection,
  onSnapshot,
  serverTimestamp,
  type DocumentData,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';

import { db } from '../firebase/firebase';
import { isDisplayCategoryId, isSpotCategory } from '../constants/categories';
import type { CreateSpotPostInput, SpotPost } from '../types/post';

const POSTS_COLLECTION = 'posts';

function mapPostDocument(
  docSnap: QueryDocumentSnapshot<DocumentData>
): SpotPost | null {
  const data = docSnap.data();

  if (
    typeof data.lat !== 'number' ||
    typeof data.lng !== 'number' ||
    data.isHidden === true
  ) {
    return null;
  }

  return {
    id: docSnap.id,
    userId: typeof data.userId === 'string' ? data.userId : undefined,
    placeId: typeof data.placeId === 'string' ? data.placeId : null,
    heroImageUrl:
      typeof data.heroImageUrl === 'string' ? data.heroImageUrl : null,
    text: typeof data.text === 'string' ? data.text : '',
    category: isSpotCategory(data.category) ? data.category : undefined,
    displayCategory: isDisplayCategoryId(data.displayCategory)
      ? data.displayCategory
      : null,
    lat: data.lat,
    lng: data.lng,
    locationName:
      typeof data.locationName === 'string' ? data.locationName : null,
    createdAt: data.createdAt,
  };
}

export async function createPost(input: CreateSpotPostInput) {
  return addDoc(collection(db, POSTS_COLLECTION), {
    ...input,
    createdAt: serverTimestamp(),
  });
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
