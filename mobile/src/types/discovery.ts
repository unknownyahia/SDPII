import type { PromotedEvent } from './event';
import type { SpotPost } from './post';

export type DiscoveryTone =
  | 'neutral'
  | 'primary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info';

export type DiscoveryCoordinates = {
  latitude: number;
  longitude: number;
};

export type DiscoveryHero = {
  imageUrl?: string | null;
  eyebrow: string;
  title: string;
  subtitle: string;
  badgeLabel?: string | null;
  badgeTone?: DiscoveryTone;
};

export type DiscoveryTrustSignal = {
  id: string;
  label: string;
  tone: DiscoveryTone;
};

export type DiscoverySocialSignal = {
  id: string;
  label: string;
  tone?: DiscoveryTone;
};

export type DiscoveryAction = {
  id: 'save' | 'like' | 'interested' | 'comment' | 'directions' | 'share' | 'report';
  label: string;
  tone?: 'primary' | 'neutral';
  active?: boolean;
  disabled?: boolean;
  loading?: boolean;
  onPress?: () => void;
};

export type DiscoveryFact = {
  label: string;
  value: string;
  subtle?: boolean;
};

export type DiscoveryFilterOption = {
  id: string;
  label: string;
  count?: number;
};

type DiscoveryBase = {
  id: string;
  title: string;
  categoryLabel: string;
  areaLabel: string;
  locationLabel: string;
  distanceLabel: string;
  description: string;
  summary: string;
  hero: DiscoveryHero;
  trustSignals: DiscoveryTrustSignal[];
  socialSignal: DiscoverySocialSignal | null;
  facts: DiscoveryFact[];
  rankingScore: number;
};

export type DiscoverySpot = DiscoveryBase & {
  kind: 'spot';
  postId: string;
  rawPost: SpotPost;
  commentCount: number;
  likeCount: number;
  saved: boolean;
  updatedLabel: string;
};

export type DiscoveryEvent = DiscoveryBase & {
  kind: 'event';
  eventId: string;
  rawEvent: PromotedEvent;
  activeNow: boolean;
  scheduleLabel: string;
  organizerLabel: string;
  venueLabel: string;
  nearbyActivityCount: number;
};

export type DiscoveryItem = DiscoverySpot | DiscoveryEvent;
