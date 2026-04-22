export type SpotCategory = 'fishing' | 'event' | 'sighting' | 'weather';

export type SpotPost = {
  id: string;
  userId?: string;
  placeId?: string | null;
  heroImageUrl?: string | null;
  text: string;
  category?: SpotCategory;
  lat: number;
  lng: number;
  locationName?: string | null;
  createdAt?: unknown;
};

export type CreateSpotPostInput = {
  userId: string;
  text: string;
  category: SpotCategory;
  lat: number;
  lng: number;
  placeId?: string | null;
  locationName?: string | null;
};

export type SummarizableSpotPost = Pick<SpotPost, 'text' | 'category'>;
