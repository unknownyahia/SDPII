import type { PromotedEvent } from '../types/event';
import {
  formatCompactDateTime,
  formatNumber,
  getCategoryLabel,
  getPluralSuffix,
  translate,
} from '../i18n';
import type {
  DiscoveryCoordinates,
  DiscoveryEvent,
  DiscoveryItem,
  DiscoverySocialSignal,
  DiscoverySpot,
  DiscoveryTrustSignal,
} from '../types/discovery';
import type { SpotCategory, SpotPost } from '../types/post';

type SpotDiscoveryOptions = {
  commentCountsByPostId?: Record<string, number>;
  likeCountsByPostId?: Record<string, number>;
  favoritePostIds?: Iterable<string>;
  browserLocation?: DiscoveryCoordinates | null;
  searchQuery?: string;
  nowMs?: number;
};

type EventDiscoveryOptions = {
  posts?: SpotPost[];
  browserLocation?: DiscoveryCoordinates | null;
  searchQuery?: string;
  nowMs?: number;
};

export function formatCategoryLabel(category?: SpotCategory) {
  return getCategoryLabel(category);
}

export function formatLocationLabel(input: {
  locationName?: string | null;
  lat: number;
  lng: number;
}) {
  return (
    input.locationName ||
    translate('discovery.areaFallback', {
      lat: formatNumber(Number(input.lat.toFixed(2))),
      lng: formatNumber(Number(input.lng.toFixed(2))),
    })
  );
}

export function getTimestampMs(value: unknown) {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value.getTime();
  }

  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed.getTime();
  }

  if (typeof value === 'object') {
    const candidate = value as {
      toDate?: () => Date;
      seconds?: number;
    };

    if (typeof candidate.toDate === 'function') {
      const parsed = candidate.toDate();
      return Number.isNaN(parsed.getTime()) ? null : parsed.getTime();
    }

    if (typeof candidate.seconds === 'number') {
      return candidate.seconds * 1000;
    }
  }

  return null;
}

export function formatDateLabel(value: string) {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : formatCompactDateTime(parsed);
}

export function calculateDistanceKm(
  origin: DiscoveryCoordinates,
  destination: { lat: number; lng: number }
) {
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const latitudeDelta = toRadians(destination.lat - origin.latitude);
  const longitudeDelta = toRadians(destination.lng - origin.longitude);
  const originLatitude = toRadians(origin.latitude);
  const destinationLatitude = toRadians(destination.lat);

  const a =
    Math.sin(latitudeDelta / 2) * Math.sin(latitudeDelta / 2) +
    Math.cos(originLatitude) *
      Math.cos(destinationLatitude) *
      Math.sin(longitudeDelta / 2) *
      Math.sin(longitudeDelta / 2);

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function formatDistanceLabel(distanceKm: number | null) {
  if (distanceKm === null) {
    return translate('discovery.distanceUnavailable');
  }

  if (distanceKm < 1) {
    return translate('discovery.metersAway', {
      value: formatNumber(Math.round(distanceKm * 1000)),
    });
  }

  return translate('discovery.kmAway', {
    value: formatNumber(Number(distanceKm.toFixed(distanceKm < 10 ? 1 : 0))),
  });
}

export function formatRelativeTime(valueMs: number | null, nowMs = Date.now()) {
  if (valueMs === null) {
    return translate('discovery.pendingUpdate');
  }

  const minutes = Math.max(1, Math.round((nowMs - valueMs) / 60000));

  if (minutes < 60) {
    return translate('discovery.minutesAgo', {
      value: formatNumber(minutes),
    });
  }

  const hours = Math.round(minutes / 60);
  if (hours < 24) {
    return translate('discovery.hoursAgo', {
      value: formatNumber(hours),
    });
  }

  const days = Math.round(hours / 24);
  return translate('discovery.daysAgo', {
    value: formatNumber(days),
    suffix: getPluralSuffix(days),
  });
}

function normalizeLocationName(value?: string | null) {
  return (value ?? '').trim().toLowerCase();
}

function getLocationKey(input: {
  locationName?: string | null;
  lat: number;
  lng: number;
}) {
  const normalizedLocation = normalizeLocationName(input.locationName);
  if (normalizedLocation) {
    return `loc:${normalizedLocation}`;
  }

  return `geo:${input.lat.toFixed(2)}:${input.lng.toFixed(2)}`;
}

function getAreaParts(input?: string | null) {
  const raw = (input ?? '').trim();

  if (!raw) {
    return {
      title: null,
      area: null,
    };
  }

  const segments = raw
    .split(',')
    .map(segment => segment.trim())
    .filter(Boolean);

  if (segments.length === 0) {
    return {
      title: raw,
      area: raw,
    };
  }

  return {
    title: segments[0],
    area: segments.length > 1 ? segments[segments.length - 1] : segments[0],
  };
}

function getSpotTitle(post: SpotPost) {
  const parts = getAreaParts(post.locationName);
  const baseTitle =
    parts.title ||
    translate('discovery.spotFallback', {
      category: formatCategoryLabel(post.category),
    });

  if (!parts.title) {
    return baseTitle;
  }

  switch (post.category) {
    case 'event':
      return `${baseTitle} Tonight`;
    case 'weather':
      return `${baseTitle} Conditions`;
    case 'fishing':
      return `${baseTitle} Fishing Window`;
    case 'sighting':
    default:
      return `${baseTitle} Right Now`;
  }
}

function getAreaLabel(input: {
  locationName?: string | null;
  lat: number;
  lng: number;
}) {
  const parts = getAreaParts(input.locationName);
  return (
    parts.area ||
    translate('discovery.areaFallback', {
      lat: formatNumber(Number(input.lat.toFixed(2))),
      lng: formatNumber(Number(input.lng.toFixed(2))),
    })
  );
}

function getEventVenueLabel(event: PromotedEvent) {
  return event.venueName || formatLocationLabel(event);
}

function getEventOrganizerLabel(event: PromotedEvent) {
  return event.organizerName || event.createdBy || translate('discovery.unknownOrganizer');
}

function getSearchScore(searchQuery: string | undefined, fields: string[]) {
  const query = (searchQuery ?? '').trim().toLowerCase();
  if (!query) {
    return 8;
  }

  let score = 0;
  fields.forEach(field => {
    const normalized = field.trim().toLowerCase();

    if (!normalized) {
      return;
    }

    if (normalized === query) {
      score = Math.max(score, 40);
      return;
    }

    if (normalized.startsWith(query)) {
      score = Math.max(score, 28);
      return;
    }

    if (normalized.includes(query)) {
      score = Math.max(score, 18);
    }
  });

  return score;
}

function getDiscoveryGroupKey(item: DiscoveryItem) {
  if (item.kind === 'spot') {
    return item.rawPost.placeId || `spot:${item.title}:${item.areaLabel}`;
  }

  return item.rawEvent.placeId || `event:${item.title}:${item.areaLabel}`;
}

export function diversifyDiscoveryItems<T extends DiscoveryItem>(items: T[]) {
  const remaining = [...items];
  const result: T[] = [];
  const seenGroupCounts = new Map<string, number>();
  const seenAreaCounts = new Map<string, number>();

  while (remaining.length > 0) {
    let bestIndex = 0;
    let bestScore = Number.NEGATIVE_INFINITY;

    remaining.forEach((item, index) => {
      const groupKey = getDiscoveryGroupKey(item);
      const groupCount = seenGroupCounts.get(groupKey) ?? 0;
      const areaCount = seenAreaCounts.get(item.areaLabel) ?? 0;
      const heroBonus = item.hero.imageUrl ? 4 : 0;
      const adjustedScore =
        item.rankingScore +
        heroBonus -
        groupCount * 16 -
        areaCount * 0.8;

      if (adjustedScore > bestScore) {
        bestIndex = index;
        bestScore = adjustedScore;
      }
    });

    const [selected] = remaining.splice(bestIndex, 1);
    result.push(selected);

    const groupKey = getDiscoveryGroupKey(selected);
    seenGroupCounts.set(groupKey, (seenGroupCounts.get(groupKey) ?? 0) + 1);
    seenAreaCounts.set(
      selected.areaLabel,
      (seenAreaCounts.get(selected.areaLabel) ?? 0) + 1
    );
  }

  return result;
}

function getDistanceScore(distanceKm: number | null) {
  if (distanceKm === null) {
    return 5;
  }

  if (distanceKm <= 1) {
    return 20;
  }

  if (distanceKm <= 3) {
    return 16;
  }

  if (distanceKm <= 5) {
    return 12;
  }

  if (distanceKm <= 10) {
    return 8;
  }

  if (distanceKm <= 25) {
    return 4;
  }

  return 1;
}

function getFreshnessScore(timestampMs: number | null, nowMs: number) {
  if (timestampMs === null) {
    return 0;
  }

  const ageMs = nowMs - timestampMs;

  if (ageMs <= 30 * 60 * 1000) {
    return 15;
  }

  if (ageMs <= 2 * 60 * 60 * 1000) {
    return 12;
  }

  if (ageMs <= 6 * 60 * 60 * 1000) {
    return 8;
  }

  if (ageMs <= 24 * 60 * 60 * 1000) {
    return 4;
  }

  return 1;
}

function createSpotTrustSignals(input: {
  nowMs: number;
  createdAtMs: number | null;
  commentCount: number;
  likeCount: number;
  recentPostsCount: number;
}): DiscoveryTrustSignal[] {
  const signals: DiscoveryTrustSignal[] = [];
  const engagementScore = input.commentCount * 2 + input.likeCount;

  if (engagementScore >= 10) {
    signals.push({
      id: 'popular-now',
      label: translate('discovery.popularNow'),
      tone: 'warning',
    });
  }

  if (input.createdAtMs !== null) {
    signals.push({
      id: 'updated',
      label: translate('discovery.updatedSignal', {
        value: formatRelativeTime(input.createdAtMs, input.nowMs),
      }),
      tone: 'info',
    });
  }

  if (input.recentPostsCount >= 3) {
    signals.push({
      id: 'recent-posts',
      label: translate('discovery.recentPostsSignal', {
        count: formatNumber(input.recentPostsCount),
      }),
      tone: 'info',
    });
  }

  if (signals.length === 0) {
    signals.push({
      id: 'community',
      label: translate('discovery.communitySignal'),
      tone: 'neutral',
    });
  }

  return signals;
}

function createSpotSocialSignal(input: {
  commentCount: number;
  likeCount: number;
  recentPostsCount: number;
  saved: boolean;
}): DiscoverySocialSignal | null {
  if (input.commentCount > 0) {
    return {
      id: 'comments',
      label: translate('discovery.comments', {
        count: formatNumber(input.commentCount),
        suffix: getPluralSuffix(input.commentCount),
      }),
      tone: 'info',
    };
  }

  if (input.likeCount > 0) {
    return {
      id: 'likes',
      label: translate('discovery.likes', {
        count: formatNumber(input.likeCount),
        suffix: getPluralSuffix(input.likeCount),
      }),
      tone: 'primary',
    };
  }

  if (input.saved) {
    return {
      id: 'saved',
      label: translate('discovery.saved'),
      tone: 'primary',
    };
  }

  if (input.recentPostsCount > 1) {
    return {
      id: 'activity',
      label: translate('discovery.nearbyUpdates', {
        count: formatNumber(input.recentPostsCount),
      }),
      tone: 'info',
    };
  }

  return null;
}

function getEventTimeScore(event: PromotedEvent, nowMs: number) {
  const startMs = getTimestampMs(event.startTime);
  const endMs = getTimestampMs(event.endTime);

  if (startMs !== null && endMs !== null && nowMs >= startMs && nowMs <= endMs) {
    return 20;
  }

  if (startMs !== null) {
    const deltaMs = startMs - nowMs;

    if (deltaMs >= 0 && deltaMs <= 2 * 60 * 60 * 1000) {
      return 16;
    }

    if (deltaMs >= 0 && deltaMs <= 24 * 60 * 60 * 1000) {
      return 12;
    }

    if (deltaMs >= 0 && deltaMs <= 3 * 24 * 60 * 60 * 1000) {
      return 8;
    }
  }

  return 2;
}

function createEventTrustSignals(input: {
  event: PromotedEvent;
  nowMs: number;
  nearbyActivityCount: number;
}): DiscoveryTrustSignal[] {
  const signals: DiscoveryTrustSignal[] = [];
  const startMs = getTimestampMs(input.event.startTime);
  const endMs = getTimestampMs(input.event.endTime);
  const createdAtMs = getTimestampMs(input.event.createdAt);
  const isActiveNow =
    startMs !== null &&
    endMs !== null &&
    input.nowMs >= startMs &&
    input.nowMs <= endMs;

  if (isActiveNow) {
    signals.push({
      id: 'active-now',
      label: translate('discovery.activeNow'),
      tone: 'success',
    });
  }

  if (input.event.isPromoted) {
    signals.push({
      id: 'promoted',
      label: translate('discovery.promoted'),
      tone: 'primary',
    });
  }

  if (
    !isActiveNow &&
    startMs !== null &&
    startMs > input.nowMs &&
    startMs - input.nowMs <= 3 * 60 * 60 * 1000
  ) {
    signals.push({
      id: 'starts-soon',
      label: translate('discovery.startingSoon'),
      tone: 'warning',
    });
  }

  if (input.nearbyActivityCount >= 3) {
    signals.push({
      id: 'nearby-posts',
      label: translate('discovery.nearbyPostsSignal', {
        count: formatNumber(input.nearbyActivityCount),
      }),
      tone: 'info',
    });
  }

  if (createdAtMs !== null) {
    signals.push({
      id: 'updated',
      label: translate('discovery.updatedSignal', {
        value: formatRelativeTime(createdAtMs, input.nowMs),
      }),
      tone: 'info',
    });
  }

  if (signals.length === 0) {
    signals.push({
      id: 'scheduled',
      label: translate('discovery.scheduled'),
      tone: 'neutral',
    });
  }

  return signals;
}

function createEventSocialSignal(nearbyActivityCount: number): DiscoverySocialSignal | null {
  if (nearbyActivityCount <= 0) {
    return null;
  }

  return {
    id: 'nearby-activity',
    label: translate('discovery.nearbyPosts', {
      count: formatNumber(nearbyActivityCount),
      suffix: getPluralSuffix(nearbyActivityCount),
    }),
    tone: 'info',
  };
}

function createNearbyPostsCountMap(posts: SpotPost[], nowMs: number) {
  const counts: Record<string, number> = {};

  posts.forEach(post => {
    const createdAtMs = getTimestampMs(post.createdAt);
    if (createdAtMs === null) {
      return;
    }

    if (nowMs - createdAtMs > 7 * 24 * 60 * 60 * 1000) {
      return;
    }

    const key = getLocationKey(post);
    counts[key] = (counts[key] ?? 0) + 1;
  });

  return counts;
}

export function buildDiscoverySpotItems(
  posts: SpotPost[],
  options: SpotDiscoveryOptions = {}
) {
  const favoritePostIds = new Set(options.favoritePostIds ?? []);
  const commentCountsByPostId = options.commentCountsByPostId ?? {};
  const likeCountsByPostId = options.likeCountsByPostId ?? {};
  const browserLocation = options.browserLocation ?? null;
  const nowMs = options.nowMs ?? Date.now();
  const nearbyPostsCountByLocation = createNearbyPostsCountMap(posts, nowMs);

  return posts
    .map<DiscoverySpot>(post => {
      const createdAtMs = getTimestampMs(post.createdAt);
      const distanceKm = browserLocation
        ? calculateDistanceKm(browserLocation, post)
        : null;
      const commentCount = commentCountsByPostId[post.id] ?? 0;
      const likeCount = likeCountsByPostId[post.id] ?? 0;
      const saved = favoritePostIds.has(post.id);
      const locationKey = getLocationKey(post);
      const recentPostsCount = nearbyPostsCountByLocation[locationKey] ?? 1;
      const categoryLabel = formatCategoryLabel(post.category);
      const title = getSpotTitle(post);
      const areaLabel = getAreaLabel(post);
      const trustSignals = createSpotTrustSignals({
        nowMs,
        createdAtMs,
        commentCount,
        likeCount,
        recentPostsCount,
      });
      const socialSignal = createSpotSocialSignal({
        commentCount,
        likeCount,
        recentPostsCount,
        saved,
      });
      const rankingScore =
        getSearchScore(options.searchQuery, [
          title,
          areaLabel,
          categoryLabel,
          post.text,
          post.locationName ?? '',
        ]) +
        getDistanceScore(distanceKm) +
        getFreshnessScore(createdAtMs, nowMs) +
        Math.min(12, commentCount * 2 + likeCount + Math.min(4, recentPostsCount)) +
        (saved ? 4 : 0);

      return {
        id: `spot-${post.id}`,
        kind: 'spot',
        postId: post.id,
        rawPost: post,
        title,
        categoryLabel,
        areaLabel,
        locationLabel: formatLocationLabel(post),
        distanceLabel: formatDistanceLabel(distanceKm),
        description: post.text,
        summary: post.text,
        hero: {
          imageUrl: post.heroImageUrl ?? null,
          eyebrow: categoryLabel,
          title,
          subtitle: areaLabel,
          badgeLabel: trustSignals[0]?.label ?? null,
          badgeTone: trustSignals[0]?.tone,
        },
        trustSignals,
        socialSignal,
        facts: [
          { label: translate('discovery.locationFact'), value: formatLocationLabel(post) },
          {
            label: translate('discovery.updatedFact'),
            value:
              createdAtMs === null
                ? translate('common.pendingTimestamp')
                : formatDateLabel(new Date(createdAtMs).toISOString()),
            subtle: true,
          },
          {
            label: translate('discovery.distanceFact'),
            value: formatDistanceLabel(distanceKm),
            subtle: true,
          },
        ],
        rankingScore,
        commentCount,
        likeCount,
        saved,
        updatedLabel: formatRelativeTime(createdAtMs, nowMs),
      };
    })
    .sort((left, right) => right.rankingScore - left.rankingScore);
}

export function buildDiscoveryEventItems(
  events: PromotedEvent[],
  options: EventDiscoveryOptions = {}
) {
  const browserLocation = options.browserLocation ?? null;
  const nowMs = options.nowMs ?? Date.now();
  const nearbyPostsCountByLocation = createNearbyPostsCountMap(options.posts ?? [], nowMs);

  return events
    .map<DiscoveryEvent>(event => {
      const distanceKm = browserLocation
        ? calculateDistanceKm(browserLocation, event)
        : null;
      const locationKey = getLocationKey(event);
      const nearbyActivityCount = nearbyPostsCountByLocation[locationKey] ?? 0;
      const trustSignals = createEventTrustSignals({
        event,
        nowMs,
        nearbyActivityCount,
      });
      const startLabel = formatDateLabel(event.startTime);
      const endLabel = formatDateLabel(event.endTime);
      const title = event.title;
      const areaLabel = getAreaLabel(event);
      const venueLabel = getEventVenueLabel(event);
      const organizerLabel = getEventOrganizerLabel(event);
      const isActiveNow = trustSignals.some(signal => signal.id === 'active-now');
      const rankingScore =
        getSearchScore(options.searchQuery, [
          title,
          areaLabel,
          event.description,
          venueLabel,
          organizerLabel,
          event.locationName ?? '',
          event.organizerName ?? '',
          event.createdBy,
        ]) +
        getDistanceScore(distanceKm) +
        getEventTimeScore(event, nowMs) +
        Math.min(12, nearbyActivityCount * 3) +
        (event.isPromoted ? 5 : 0);

      return {
        id: `event-${event.id}`,
        kind: 'event',
        eventId: event.id,
        rawEvent: event,
        title,
        categoryLabel: formatCategoryLabel(event.category),
        areaLabel,
        locationLabel: formatLocationLabel(event),
        distanceLabel: formatDistanceLabel(distanceKm),
        description: event.description,
        summary: event.description,
        hero: {
          imageUrl: event.heroImageUrl ?? null,
          eyebrow: translate('explore.promotedEvent'),
          title,
          subtitle: areaLabel,
          badgeLabel: trustSignals[0]?.label ?? null,
          badgeTone: trustSignals[0]?.tone,
        },
        trustSignals,
        socialSignal: createEventSocialSignal(nearbyActivityCount),
        facts: [
          { label: translate('discovery.venueFact'), value: venueLabel },
          { label: translate('discovery.startsFact'), value: startLabel, subtle: true },
          { label: translate('discovery.endsFact'), value: endLabel, subtle: true },
          {
            label: translate('discovery.organizerFact'),
            value: organizerLabel,
            subtle: true,
          },
          {
            label: translate('discovery.distanceFact'),
            value: formatDistanceLabel(distanceKm),
            subtle: true,
          },
        ],
        rankingScore,
        activeNow: isActiveNow,
        scheduleLabel: startLabel,
        organizerLabel,
        venueLabel,
        nearbyActivityCount,
      };
    })
    .sort((left, right) => right.rankingScore - left.rankingScore);
}
