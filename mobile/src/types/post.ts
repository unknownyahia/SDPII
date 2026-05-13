import type { DisplayCategoryId } from '../constants/categories';

export type SpotCategory = 'fishing' | 'event' | 'sighting' | 'weather';

export type SpotPost = {
  id: string;
  userId?: string;
  placeId?: string | null;
  heroImageUrl?: string | null;
  title?: string | null;
  text: string;
  category?: SpotCategory;
  displayCategory?: DisplayCategoryId | null;
  lat: number;
  lng: number;
  locationName?: string | null;
  createdAt?: unknown;
};

export type CreateSpotPostInput = {
  userId: string;
  title: string;
  text: string;
  category: SpotCategory;
  displayCategory?: DisplayCategoryId | null;
  lat: number;
  lng: number;
  placeId?: string | null;
  heroImageUrl?: string | null;
  locationName?: string | null;
};

export type SummarizableSpotPost = Pick<SpotPost, 'title' | 'text' | 'category'>;
