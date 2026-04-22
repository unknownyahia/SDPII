import type { SpotCategory } from './post';

export type EventStatus = 'active' | 'hidden' | 'cancelled';

export type PromotedEvent = {
  id: string;
  placeId?: string | null;
  title: string;
  description: string;
  category: SpotCategory;
  locationName?: string | null;
  venueName?: string | null;
  organizerName?: string | null;
  heroImageUrl?: string | null;
  lat: number;
  lng: number;
  startTime: string;
  endTime: string;
  createdBy: string;
  isPromoted: boolean;
  createdAt?: unknown;
  status: EventStatus;
};

export type CreatePromotedEventInput = Omit<PromotedEvent, 'id' | 'createdAt'>;
