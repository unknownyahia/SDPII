import React from 'react';
import {
  ActivityIndicator,
  Image,
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import MapView, {
  Heatmap,
  Marker,
  PROVIDER_GOOGLE,
  type Region,
} from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PostInteractionPanel } from '../../components/explore/PostInteractionPanel';
import { EmptyState } from '../../components/ui/EmptyState';
import { LoadingState } from '../../components/ui/LoadingState';
import { StatusBanner } from '../../components/ui/StatusBanner';
import {
  EXPLORE_CATEGORY_OPTIONS,
  getCategoryOptionLabel,
  isExploreCategoryId,
  type ExploreCategoryId,
} from '../../constants/categories';
import { useAuth } from '../../context/AuthContext';
import { useLocalization } from '../../context/LocalizationContext';
import { subscribeToEvents } from '../../repositories/eventRepository';
import { subscribeToPosts } from '../../repositories/postsRepository';
import {
  buildDiscoveryEventItems,
  buildDiscoverySpotItems,
  getTimestampMs,
} from '../../services/discoveryService';
import {
  DEFAULT_EXPLORE_REGION,
  filterExploreEvents,
  filterExplorePosts,
} from '../../services/exploreService';
import {
  FavoriteValidationError,
  observeFavoritePostIds,
  toggleFavoritePost,
} from '../../services/favoriteService';
import { observeCommentCountsByPost } from '../../services/commentService';
import { observeLikeCountsByPost } from '../../services/reactionService';
import { summarizeAreaPosts } from '../../services/summaryService';
import { colors } from '../../theme/designSystem';
import {
  getBlockedDataMessage,
  getErrorMessage,
  isDataAccessBlockedError,
} from '../../utils/dataAccessError';
import { showAlert } from '../../utils/showAlert';
import type { DiscoverySpot } from '../../types/discovery';
import type { PromotedEvent } from '../../types/event';
import type { MainTabParamList } from '../../navigation/types';
import type { SpotPost } from '../../types/post';

type ExploreChipId = ExploreCategoryId;

type ExploreCard = {
  id: string;
  kind: 'spot' | 'event';
  title: string;
  subtitle: string;
  description: string;
  timeLabel: string;
  distanceLabel: string;
  imageUrl: string;
  signal?: 'trending' | 'promoted';
  ratingLabel?: string;
  saved: boolean;
  postId?: string;
  latitude: number;
  longitude: number;
  rankingScore: number;
  createdAt?: unknown;
  rawPost?: SpotPost;
  rawEvent?: PromotedEvent;
};

type NativeHeatPoint = {
  latitude: number;
  longitude: number;
  weight: number;
};

type NativeMapBounds = {
  north: number;
  south: number;
  east: number;
  west: number;
};

type NativeBrowserCoordinates = {
  latitude: number;
  longitude: number;
};

const MOBILE_AVATAR_FALLBACK_URI =
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80';

const CHIPS = EXPLORE_CATEGORY_OPTIONS;
const SUPPORTS_NATIVE_HEATMAP = Platform.OS === 'android';

function BellGlyph() {
  return (
    <View style={styles.bellIcon}>
      <View style={styles.bellStem} />
      <View style={styles.bellBody} />
      <View style={styles.bellClapper} />
      <View style={styles.bellBase} />
      <View style={styles.bellDot} />
    </View>
  );
}

function SearchGlyph() {
  return (
    <View style={styles.searchGlyph}>
      <View style={styles.searchGlyphCircle} />
      <View style={styles.searchGlyphHandle} />
    </View>
  );
}

function PinGlyph() {
  return (
    <View style={styles.pinGlyph}>
      <View style={styles.pinGlyphHead}>
        <View style={styles.pinGlyphCore} />
      </View>
      <View style={styles.pinGlyphTip} />
    </View>
  );
}

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function hasValidCoordinate(card: Pick<ExploreCard, 'latitude' | 'longitude'>) {
  return (
    Number.isFinite(card.latitude) &&
    Number.isFinite(card.longitude) &&
    Math.abs(card.latitude) <= 90 &&
    Math.abs(card.longitude) <= 180
  );
}

function normalizeHeatTimestamp(value: unknown): number | null {
  if (!value) return null;

  if (typeof value === 'string' || typeof value === 'number' || value instanceof Date) {
    const parsed = new Date(value).getTime();
    return Number.isFinite(parsed) ? parsed : null;
  }

  if (typeof value === 'object' && value !== null && 'toDate' in value) {
    try {
      const maybeDate = (value as { toDate?: () => Date }).toDate?.();
      if (!maybeDate) return null;
      const parsed = maybeDate.getTime();
      return Number.isFinite(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }

  return null;
}

function getNativePostHeatWeight(post: SpotPost): number {
  const now = Date.now();
  const createdAt = normalizeHeatTimestamp(post.createdAt);
  const ageHours = createdAt ? Math.max(0, (now - createdAt) / (1000 * 60 * 60)) : 24;

  let weight = 0.52;

  if (post.category === 'event') weight += 0.08;
  if (post.category === 'sighting') weight += 0.04;
  if (post.category === 'weather') weight += 0.02;
  if (post.category === 'fishing') weight += 0.06;

  if (ageHours < 2) weight += 0.22;
  else if (ageHours < 6) weight += 0.14;
  else if (ageHours < 24) weight += 0.06;

  return Math.max(0.24, Math.min(1, weight));
}

function getNativeEventHeatWeight(event: PromotedEvent): number {
  const now = Date.now();
  const startTime = normalizeHeatTimestamp(event.startTime);
  const hoursUntilStart = startTime ? (startTime - now) / (1000 * 60 * 60) : 24;

  let weight = event.isPromoted ? 0.92 : 0.76;

  if (hoursUntilStart >= -6 && hoursUntilStart <= 24) weight += 0.08;
  if (hoursUntilStart >= -1 && hoursUntilStart <= 8) weight += 0.06;

  return Math.max(0.32, Math.min(1, weight));
}

function buildNativeHeatPoints(
  posts: SpotPost[],
  events: PromotedEvent[]
): NativeHeatPoint[] {
  const postPoints = posts.map<NativeHeatPoint>(post => ({
    latitude: post.lat,
    longitude: post.lng,
    weight: getNativePostHeatWeight(post),
  }));

  const eventPoints = events
    .filter(event => event.status === 'active')
    .map<NativeHeatPoint>(event => ({
      latitude: event.lat,
      longitude: event.lng,
      weight: getNativeEventHeatWeight(event),
    }));

  return [...postPoints, ...eventPoints];
}

function getFallbackHeatPointStyle(point: NativeHeatPoint) {
  const intensity = Math.max(0.2, Math.min(1, point.weight));
  const size = 18 + intensity * 28;
  const opacity = 0.16 + intensity * 0.22;

  if (intensity >= 0.78) {
    return {
      width: size,
      height: size,
      borderRadius: size / 2,
      backgroundColor: `rgba(255, 94, 94, ${opacity})`,
      borderColor: 'rgba(255, 94, 94, 0.42)',
    };
  }

  if (intensity >= 0.58) {
    return {
      width: size,
      height: size,
      borderRadius: size / 2,
      backgroundColor: `rgba(255, 170, 92, ${opacity})`,
      borderColor: 'rgba(255, 170, 92, 0.38)',
    };
  }

  return {
    width: size,
    height: size,
    borderRadius: size / 2,
    backgroundColor: `rgba(82, 213, 255, ${opacity})`,
    borderColor: 'rgba(82, 213, 255, 0.34)',
  };
}

function nativeRegionToBounds(region: Region): NativeMapBounds {
  return {
    north: region.latitude + region.latitudeDelta / 2,
    south: region.latitude - region.latitudeDelta / 2,
    east: region.longitude + region.longitudeDelta / 2,
    west: region.longitude - region.longitudeDelta / 2,
  };
}

function makeNativeSelectionRegion(
  latitude: number,
  longitude: number,
  currentRegion: Region | null
): Region {
  return {
    latitude,
    longitude,
    latitudeDelta: currentRegion?.latitudeDelta ?? 0.08,
    longitudeDelta: currentRegion?.longitudeDelta ?? 0.08,
  };
}

function isCardInsideRegion(
  card: Pick<ExploreCard, 'latitude' | 'longitude'>,
  targetRegion: Region
) {
  if (!hasValidCoordinate(card)) {
    return false;
  }

  const latitudeHalfSpan = Math.max(targetRegion.latitudeDelta / 2, 0.005);
  const longitudeHalfSpan = Math.max(targetRegion.longitudeDelta / 2, 0.005);

  return (
    card.latitude >= targetRegion.latitude - latitudeHalfSpan &&
    card.latitude <= targetRegion.latitude + latitudeHalfSpan &&
    card.longitude >= targetRegion.longitude - longitudeHalfSpan &&
    card.longitude <= targetRegion.longitude + longitudeHalfSpan
  );
}

function formatEventTime(value: unknown, language: 'en' | 'ar') {
  const timestampMs = getTimestampMs(value);

  if (timestampMs === null) {
    return language === 'ar' ? 'اليوم • لاحقًا' : 'Today • Time soon';
  }

  const date = new Date(timestampMs);
  const locale = language === 'ar' ? 'ar-QA' : 'en-US';
  const day = new Date();
  const sameDay =
    date.getFullYear() === day.getFullYear() &&
    date.getMonth() === day.getMonth() &&
    date.getDate() === day.getDate();

  const timeLabel = new Intl.DateTimeFormat(locale, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);

  if (sameDay) {
    return language === 'ar' ? `اليوم • ${timeLabel}` : `Today • ${timeLabel}`;
  }

  const shortDate = new Intl.DateTimeFormat(locale, {
    month: 'short',
    day: 'numeric',
  }).format(date);

  return `${shortDate} • ${timeLabel}`;
}

function formatSpotTime(value: unknown, language: 'en' | 'ar') {
  const timestampMs = getTimestampMs(value);

  if (timestampMs === null) {
    return language === 'ar' ? 'اليوم' : 'Today';
  }

  const date = new Date(timestampMs);
  const locale = language === 'ar' ? 'ar-QA' : 'en-US';

  return new Intl.DateTimeFormat(locale, {
    weekday: undefined,
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

function getCardImage(imageUrl?: string | null) {
  if (imageUrl && imageUrl.trim().length > 0) {
    return imageUrl;
  }

  return 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1200&q=80';
}

function getSpotRatingLabel(spot: DiscoverySpot) {
  const engagement = Math.max(spot.commentCount + spot.likeCount, 1);
  const value = (4.3 + Math.min(0.6, engagement * 0.02)).toFixed(1);
  return `${value} (${engagement})`;
}

export function ExploreScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<BottomTabNavigationProp<MainTabParamList>>();
  const route = useRoute<RouteProp<MainTabParamList, 'Explore'>>();
  const searchInputRef = React.useRef<TextInput>(null);
  const mapRef = React.useRef<MapView | null>(null);
  const lastSelectionKeyRef = React.useRef<string>('');
  const latestMapBoundsRef = React.useRef<NativeMapBounds>(
    nativeRegionToBounds(DEFAULT_EXPLORE_REGION)
  );
  const { user } = useAuth();
  const {
    language,
    isRTL,
    getTextAlign,
    getRowDirection,
    t,
  } = useLocalization();

  const [loading, setLoading] = React.useState(true);
  const [posts, setPosts] = React.useState<SpotPost[]>([]);
  const [events, setEvents] = React.useState<PromotedEvent[]>([]);
  const [favoritePostIds, setFavoritePostIds] = React.useState<string[]>([]);
  const [commentCountsByPostId, setCommentCountsByPostId] = React.useState<Record<string, number>>({});
  const [likeCountsByPostId, setLikeCountsByPostId] = React.useState<Record<string, number>>({});
  const [dataIssue, setDataIssue] = React.useState<string | null>(null);
  const [savingCardId, setSavingCardId] = React.useState<string | null>(null);
  const [selectedChipId, setSelectedChipId] = React.useState<ExploreChipId>('all');
  const [selectedCardId, setSelectedCardId] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [whereQuery, setWhereQuery] = React.useState(
    language === 'ar' ? 'قطر' : 'Qatar'
  );
  const [refreshToken, setRefreshToken] = React.useState(0);
  const [region, setRegion] = React.useState<Region>(DEFAULT_EXPLORE_REGION);
  const [appliedMapRegion, setAppliedMapRegion] = React.useState<Region | null>(null);
  const [isScrollEnabled, setIsScrollEnabled] = React.useState(true);
  const [summaryLoading, setSummaryLoading] = React.useState(false);
  const [areaSummary, setAreaSummary] = React.useState<string | null>(null);
  const browserLocation = React.useMemo<NativeBrowserCoordinates | null>(() => null, []);

  const textAlign = getTextAlign();
  const avatarInitial = (user?.displayInfo || user?.email || 'S').trim().charAt(0).toUpperCase();

  const activeChip = React.useMemo(
    () => CHIPS.find(chip => chip.id === selectedChipId) ?? CHIPS[0],
    [selectedChipId]
  );

  const defaultWhereLabel = language === 'ar' ? 'قطر' : 'Qatar';
  const whatQuery = searchQuery;
  const activeWhereQuery = React.useMemo(() => {
    const trimmed = whereQuery.trim();
    const normalized = normalize(trimmed);

    if (!trimmed || normalized === 'qatar' || trimmed === 'قطر') {
      return '';
    }

    return normalized;
  }, [whereQuery]);

  React.useEffect(() => {
    setWhereQuery(current => {
      const trimmed = current.trim();
      const normalized = normalize(trimmed);

      if (!trimmed || normalized === 'qatar' || trimmed === 'قطر') {
        return defaultWhereLabel;
      }

      return current;
    });
  }, [defaultWhereLabel]);

  const routeParamKey = JSON.stringify(route.params ?? {});
  const lastAppliedRouteParamKeyRef = React.useRef('');

  React.useEffect(() => {
    const params = route.params;
    if (!params || routeParamKey === lastAppliedRouteParamKeyRef.current) {
      return undefined;
    }

    lastAppliedRouteParamKeyRef.current = routeParamKey;

    if (typeof params.query === 'string') {
      setSearchQuery(params.query);
    }

    if (typeof params.where === 'string') {
      setWhereQuery(params.where);
    }

    if (isExploreCategoryId(params.chipId)) {
      setSelectedChipId(params.chipId);
    }

    setSelectedCardId(null);
    setAppliedMapRegion(null);

    if (!params.focusSearch) {
      return undefined;
    }

    const focusTimer = setTimeout(() => {
      searchInputRef.current?.focus();
    }, 80);

    return () => clearTimeout(focusTimer);
  }, [route.params, routeParamKey]);

  const handleDataIssue = React.useCallback(
    (error: unknown, fallbackMessage: string) => {
      setDataIssue(
        isDataAccessBlockedError(error)
          ? getBlockedDataMessage(language === 'ar' ? 'بيانات الاستكشاف' : 'Explore data')
          : getErrorMessage(error, fallbackMessage)
      );
    },
    [language]
  );

  React.useEffect(() => {
    setLoading(true);
    setDataIssue(null);

    const unsubPosts = subscribeToPosts(
      nextPosts => {
        setPosts(nextPosts);
        setLoading(false);
      },
      error => {
        handleDataIssue(error, 'Failed to load Explore posts.');
        setLoading(false);
      }
    );

    const unsubEvents = subscribeToEvents(
      nextEvents => {
        setEvents(nextEvents);
      },
      error => {
        handleDataIssue(error, 'Failed to load Explore events.');
      }
    );

    return () => {
      unsubPosts();
      unsubEvents();
    };
  }, [handleDataIssue, refreshToken]);

  React.useEffect(() => {
    return observeFavoritePostIds(
      user?.id,
      ids => setFavoritePostIds(ids),
      error => handleDataIssue(error, 'Failed to load saved spots.')
    );
  }, [handleDataIssue, refreshToken, user?.id]);

  React.useEffect(() => {
    return observeCommentCountsByPost(
      counts => setCommentCountsByPostId(counts),
      error => handleDataIssue(error, 'Failed to load comments.')
    );
  }, [handleDataIssue, refreshToken]);

  React.useEffect(() => {
    return observeLikeCountsByPost(
      counts => setLikeCountsByPostId(counts),
      error => handleDataIssue(error, 'Failed to load likes.')
    );
  }, [handleDataIssue, refreshToken]);

  const filteredPosts = React.useMemo(
    () => filterExplorePosts(posts, activeChip.id, whatQuery),
    [activeChip.id, posts, whatQuery]
  );

  const filteredEvents = React.useMemo(
    () => filterExploreEvents(events, activeChip.id, whatQuery),
    [activeChip.id, events, whatQuery]
  );

  const discoverySpotItems = React.useMemo(
    () =>
      buildDiscoverySpotItems(filteredPosts, {
        commentCountsByPostId,
        likeCountsByPostId,
        favoritePostIds,
        browserLocation,
        searchQuery: whatQuery,
        language,
      }),
    [
      browserLocation,
      commentCountsByPostId,
      favoritePostIds,
      filteredPosts,
      language,
      likeCountsByPostId,
      whatQuery,
    ]
  );

  const discoveryEventItems = React.useMemo(
    () =>
      buildDiscoveryEventItems(filteredEvents, {
        posts: filteredPosts,
        browserLocation,
        searchQuery: whatQuery,
        language,
      }),
    [browserLocation, filteredEvents, filteredPosts, language, whatQuery]
  );

  const cards = React.useMemo<ExploreCard[]>(() => {
    const spotCards: ExploreCard[] = discoverySpotItems.map(spot => ({
      id: `spot-${spot.postId}`,
      kind: 'spot',
      title: spot.title,
      subtitle: `${spot.locationLabel} • ${spot.areaLabel}`,
      description: spot.summary || spot.description,
      timeLabel: formatSpotTime(spot.rawPost.createdAt, language),
      distanceLabel: spot.distanceLabel,
      imageUrl: getCardImage(spot.hero.imageUrl),
      signal: spot.trustSignals.some(signal => signal.id === 'popular-now')
        ? 'trending'
        : undefined,
      ratingLabel: getSpotRatingLabel(spot),
      saved: spot.saved,
      postId: spot.postId,
      latitude: spot.rawPost.lat,
      longitude: spot.rawPost.lng,
      rankingScore: spot.rankingScore,
      createdAt: spot.rawPost.createdAt,
      rawPost: spot.rawPost,
    }));

    const eventCards: ExploreCard[] = discoveryEventItems.map(event => ({
      id: `event-${event.eventId}`,
      kind: 'event',
      title: event.title,
      subtitle: `${event.venueLabel} • ${event.areaLabel}`,
      description: event.summary || event.description,
      timeLabel: formatEventTime(event.rawEvent.startTime, language),
      distanceLabel: event.distanceLabel,
      imageUrl: getCardImage(event.hero.imageUrl),
      signal: event.rawEvent.isPromoted ? 'promoted' : undefined,
      saved: false,
      latitude: event.rawEvent.lat,
      longitude: event.rawEvent.lng,
      rankingScore: event.rankingScore,
      createdAt: event.rawEvent.startTime,
      rawEvent: event.rawEvent,
    }));

    const rankedCards = [...spotCards, ...eventCards]
      .filter(hasValidCoordinate)
      .sort((a, b) => b.rankingScore - a.rankingScore);

    return rankedCards
      .filter(card => {
        if (!activeWhereQuery) {
          return true;
        }

        return normalize(`${card.title} ${card.subtitle} ${card.description}`).includes(
          activeWhereQuery
        );
      })
      .filter(card => {
        if (!appliedMapRegion) {
          return true;
        }

        return isCardInsideRegion(card, appliedMapRegion);
      })
      .slice(0, 8);
  }, [activeWhereQuery, appliedMapRegion, discoveryEventItems, discoverySpotItems, language]);

  const mapCards = React.useMemo(() => cards, [cards]);
  const visiblePosts = React.useMemo(
    () => mapCards.flatMap(card => (card.rawPost ? [card.rawPost] : [])),
    [mapCards]
  );
  const visibleEvents = React.useMemo(
    () => mapCards.flatMap(card => (card.rawEvent ? [card.rawEvent] : [])),
    [mapCards]
  );
  const selectedCard = React.useMemo(
    () => cards.find(card => card.id === selectedCardId) ?? null,
    [cards, selectedCardId]
  );
  const selectedResult = React.useMemo(() => {
    if (!selectedCard) {
      return null;
    }

    return selectedCard.rawPost
      ? { kind: 'post' as const, id: selectedCard.rawPost.id }
      : selectedCard.rawEvent
        ? { kind: 'event' as const, id: selectedCard.rawEvent.id }
        : null;
  }, [selectedCard]);
  const heatPoints = React.useMemo(
    () => buildNativeHeatPoints(visiblePosts, visibleEvents),
    [visibleEvents, visiblePosts]
  );
  const interactionUserLabel = user?.displayInfo || user?.email || 'Spots user';

  React.useEffect(() => {
    const selectedPost =
      selectedResult?.kind === 'post'
        ? visiblePosts.find(post => post.id === selectedResult.id) ?? null
        : null;

    const selectedEvent =
      selectedResult?.kind === 'event'
        ? visibleEvents.find(event => event.id === selectedResult.id) ?? null
        : null;

    const selectedTarget = selectedPost ?? selectedEvent;

    if (!selectedTarget || !mapRef.current) return;

    const selectionKey = `${selectedResult?.kind}:${selectedTarget.id}`;
    if (lastSelectionKeyRef.current === selectionKey) return;

    lastSelectionKeyRef.current = selectionKey;

    const nextRegion = makeNativeSelectionRegion(
      selectedTarget.lat,
      selectedTarget.lng,
      region
    );

    mapRef.current.animateToRegion(nextRegion, 350);
    setRegion(nextRegion);
  }, [region, selectedResult, visibleEvents, visiblePosts]);

  React.useEffect(() => {
    if (selectedCardId && !cards.some(card => card.id === selectedCardId)) {
      setSelectedCardId(null);
    }
  }, [cards, selectedCardId]);

  const handleRetry = React.useCallback(() => {
    setRefreshToken(value => value + 1);
    setDataIssue(null);
  }, []);

  const handleToggleSave = React.useCallback(
    async (card: ExploreCard) => {
      if (!card.postId) {
        return;
      }

      setSavingCardId(card.id);

      try {
        await toggleFavoritePost({
          userId: user?.id,
          postId: card.postId,
          isCurrentlyFavorite: card.saved,
        });
      } catch (error) {
        if (error instanceof FavoriteValidationError) {
          showAlert(
            language === 'ar' ? 'تعذر الحفظ' : 'Could not save',
            error.message
          );
        } else {
          showAlert(
            language === 'ar' ? 'تعذر الحفظ' : 'Could not save',
            isDataAccessBlockedError(error)
              ? getBlockedDataMessage(language === 'ar' ? 'المحفوظات' : 'saved spots')
              : getErrorMessage(error, 'Unable to update saved state right now.')
          );
        }
      } finally {
        setSavingCardId(null);
      }
    },
    [language, user?.id]
  );

  const handleSelectCard = React.useCallback((card: ExploreCard) => {
    setSelectedCardId(card.id);
    const nextRegion = makeNativeSelectionRegion(
      card.latitude,
      card.longitude,
      {
        ...region,
        latitudeDelta: Math.min(region.latitudeDelta, 0.08),
        longitudeDelta: Math.min(region.longitudeDelta, 0.08),
      }
    );
    setRegion(nextRegion);
    mapRef.current?.animateToRegion(nextRegion, 320);
  }, [region]);

  const handleSelectPost = React.useCallback(
    (post: SpotPost) => {
      const card = cards.find(item => item.rawPost?.id === post.id);

      if (card) {
        handleSelectCard(card);
        return;
      }

      setSelectedCardId(`spot-${post.id}`);
      const nextRegion = makeNativeSelectionRegion(post.lat, post.lng, region);
      setRegion(nextRegion);
      mapRef.current?.animateToRegion(nextRegion, 350);
    },
    [cards, handleSelectCard, region]
  );

  const handleSelectEvent = React.useCallback(
    (event: PromotedEvent) => {
      const card = cards.find(item => item.rawEvent?.id === event.id);

      if (card) {
        handleSelectCard(card);
        return;
      }

      setSelectedCardId(`event-${event.id}`);
      const nextRegion = makeNativeSelectionRegion(event.lat, event.lng, region);
      setRegion(nextRegion);
      mapRef.current?.animateToRegion(nextRegion, 350);
    },
    [cards, handleSelectCard, region]
  );

  const handleSelectChip = React.useCallback((chipId: ExploreChipId) => {
    setSelectedChipId(chipId);
    setSelectedCardId(null);
    setAreaSummary(null);
  }, []);

  const handleSubmitSearch = React.useCallback(() => {
    setSelectedCardId(null);
    Keyboard.dismiss();
  }, []);

  const handleMapViewportChange = React.useCallback((bounds: NativeMapBounds) => {
    latestMapBoundsRef.current = bounds;
  }, []);

  const handleNativeRegionChangeComplete = React.useCallback(
    (nextRegion: Region) => {
      setRegion(nextRegion);
      handleMapViewportChange(nativeRegionToBounds(nextRegion));
    },
    [handleMapViewportChange]
  );

  const handleSearchThisArea = React.useCallback(() => {
    setAppliedMapRegion(region);
    setSelectedCardId(null);
    setAreaSummary(null);
    Keyboard.dismiss();
  }, [region]);

  const handleResetMap = React.useCallback(() => {
    setRegion(DEFAULT_EXPLORE_REGION);
    setAppliedMapRegion(null);
    setSelectedCardId(null);
    setAreaSummary(null);
    mapRef.current?.animateToRegion(DEFAULT_EXPLORE_REGION, 320);
  }, []);

  const handleAreaSummary = React.useCallback(async () => {
    const summarizable = cards
      .filter(card => card.rawPost || card.rawEvent)
      .slice(0, 20)
      .map(card => ({
        text: card.rawPost?.text ?? card.rawEvent?.description ?? card.description,
        category: card.rawPost?.category ?? card.rawEvent?.category,
      }))
      .filter(item => item.text.trim().length > 0);

    if (summarizable.length === 0) {
      setAreaSummary(
        language === 'ar'
          ? 'لا توجد تحديثات كافية في هذا العرض لتلخيصها.'
          : 'There are not enough visible updates to summarize yet.'
      );
      return;
    }

    setSummaryLoading(true);
    try {
      const nextSummary = await summarizeAreaPosts({ posts: summarizable });
      setAreaSummary(nextSummary);
    } catch (error) {
      setAreaSummary(
        getErrorMessage(
          error,
          language === 'ar'
            ? 'تعذر إنشاء الملخص الآن.'
            : 'Unable to generate an area summary right now.'
        )
      );
    } finally {
      setSummaryLoading(false);
    }
  }, [cards, language]);

  const resultsContextLabel = appliedMapRegion
    ? language === 'ar'
      ? 'هذه المنطقة'
      : 'this area'
    : whereQuery.trim() || defaultWhereLabel;

  if (loading) {
    return <LoadingState label={language === 'ar' ? 'استكشاف' : 'Explore'} />;
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        scrollEnabled={isScrollEnabled}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + 8,
            paddingBottom: insets.bottom + 88,
          },
        ]}
      >
        <View style={[styles.topBar, { flexDirection: getRowDirection() }]}>
          <Text style={styles.brandText}>Spots</Text>

          <View style={[styles.topActions, { flexDirection: getRowDirection() }]}>
            <Pressable
              accessibilityRole="button"
              onPress={() => navigation.navigate('Profile')}
              style={({ pressed }) => [styles.topIconButton, pressed && styles.pressed]}
            >
              <BellGlyph />
            </Pressable>

            <Pressable
              accessibilityRole="button"
              onPress={() => navigation.navigate('Profile')}
              style={({ pressed }) => [styles.topIconButton, pressed && styles.pressed]}
            >
              <Text style={styles.topIconGlyph}>♡</Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              onPress={() => navigation.navigate('Profile')}
              style={({ pressed }) => [styles.avatarWrap, pressed && styles.pressed]}
            >
              <Image source={{ uri: MOBILE_AVATAR_FALLBACK_URI }} style={styles.avatarImage} />
              {!user ? <Text style={styles.avatarFallback}>{avatarInitial}</Text> : null}
            </Pressable>
          </View>
        </View>

        <View style={styles.searchShell}>
          <View style={[styles.searchFieldRow, { flexDirection: getRowDirection() }]}>
            <View style={styles.searchFieldIconWrap}>
              <SearchGlyph />
            </View>
            <View style={styles.searchFieldTextWrap}>
              <Text
                style={[
                  styles.searchFieldLabel,
                  { textAlign, writingDirection: isRTL ? 'rtl' : 'ltr' },
                ]}
              >
                {language === 'ar' ? 'ماذا' : 'What'}
              </Text>
              <TextInput
                ref={searchInputRef}
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={handleSubmitSearch}
                clearButtonMode="while-editing"
                returnKeyType="search"
                placeholder={
                  language === 'ar'
                    ? 'قهوة، أماكن دراسة، فعاليات...'
                    : 'Coffee, study spots, events...'
                }
                placeholderTextColor="#80756E"
                style={[
                  styles.searchFieldInput,
                  { textAlign, writingDirection: isRTL ? 'rtl' : 'ltr' },
                ]}
              />
            </View>
            <Text style={styles.searchChevron}>{isRTL ? '‹' : '›'}</Text>
          </View>

          <View style={styles.searchDivider} />

          <View style={[styles.searchFieldRow, { flexDirection: getRowDirection() }]}>
            <View style={styles.searchFieldIconWrap}>
              <PinGlyph />
            </View>
            <View style={styles.searchFieldTextWrap}>
              <Text
                style={[
                  styles.searchFieldLabel,
                  { textAlign, writingDirection: isRTL ? 'rtl' : 'ltr' },
                ]}
              >
                {language === 'ar' ? 'أين' : 'Where'}
              </Text>
              <TextInput
                value={whereQuery}
                onChangeText={setWhereQuery}
                onSubmitEditing={handleSubmitSearch}
                clearButtonMode="while-editing"
                returnKeyType="search"
                placeholder={defaultWhereLabel}
                placeholderTextColor="#80756E"
                style={[
                  styles.searchFieldInput,
                  { textAlign, writingDirection: isRTL ? 'rtl' : 'ltr' },
                ]}
              />
            </View>

            <Pressable
              accessibilityRole="button"
              onPress={handleSubmitSearch}
              style={({ pressed }) => [
                styles.searchActionButton,
                isRTL && styles.searchActionButtonRtl,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.searchActionGlyph}>⌕</Text>
            </Pressable>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[
            styles.chipRow,
            { flexDirection: getRowDirection() },
          ]}
        >
          {CHIPS.map(chip => {
            const active = chip.id === selectedChipId;
            return (
              <Pressable
                key={chip.id}
                onPress={() => handleSelectChip(chip.id)}
                style={[styles.filterChip, active && styles.filterChipActive]}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    active && styles.filterChipTextActive,
                    { writingDirection: isRTL ? 'rtl' : 'ltr' },
                  ]}
                >
                  {getCategoryOptionLabel(chip, language)}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {dataIssue ? (
          <StatusBanner
            compact
            tone="warning"
            title={language === 'ar' ? 'بعض النتائج قد تكون ناقصة' : 'Some results may be missing.'}
            body={dataIssue}
            actions={[
              {
                label: language === 'ar' ? 'إعادة المحاولة' : 'Retry',
                onPress: handleRetry,
                tone: 'primary',
              },
            ]}
          />
        ) : null}

        <View style={[styles.resultsMetaRow, { flexDirection: getRowDirection() }]}>
          <Text
            style={[
              styles.resultsMetaText,
              { textAlign, writingDirection: isRTL ? 'rtl' : 'ltr' },
            ]}
          >
            {language === 'ar'
              ? `${cards.length} نتيجة في ${resultsContextLabel}`
              : `${cards.length} results in ${resultsContextLabel}`}
          </Text>

          <Text
            style={[
              styles.sortText,
              { writingDirection: isRTL ? 'rtl' : 'ltr' },
            ]}
          >
            {language === 'ar' ? 'الترتيب: الصلة' : 'Sort: Relevance'}
          </Text>
        </View>

        <View style={styles.summaryCard}>
          <View style={[styles.summaryHeader, { flexDirection: getRowDirection() }]}>
            <View style={styles.summaryCopy}>
              <Text
                style={[
                  styles.summaryTitle,
                  { textAlign, writingDirection: isRTL ? 'rtl' : 'ltr' },
                ]}
              >
                {language === 'ar' ? 'ملخص العرض الحالي' : 'Current View Summary'}
              </Text>
              <Text
                style={[
                  styles.summaryBody,
                  { textAlign, writingDirection: isRTL ? 'rtl' : 'ltr' },
                ]}
              >
                {areaSummary ||
                  (language === 'ar'
                    ? 'أنشئ ملخصًا حقيقيًا من النتائج الظاهرة على الخريطة والقائمة.'
                    : 'Generate a real summary from the posts and events currently visible in the map and list.')}
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              disabled={summaryLoading}
              onPress={() => void handleAreaSummary()}
              style={({ pressed }) => [
                styles.summaryButton,
                summaryLoading && styles.summaryButtonDisabled,
                pressed && !summaryLoading && styles.pressed,
              ]}
            >
              {summaryLoading ? (
                <ActivityIndicator color={colors.surface} />
              ) : (
                <Text style={styles.summaryButtonText}>
                  {language === 'ar' ? 'لخّص' : 'Summarize'}
                </Text>
              )}
            </Pressable>
          </View>
        </View>

        {cards.length === 0 ? (
          <EmptyState
            title={language === 'ar' ? 'لا توجد نتائج' : 'No results'}
            body={
              language === 'ar'
                ? 'جرّب فئة أخرى أو ابحث في منطقة مختلفة.'
                : 'Try another filter or search in a different area.'
            }
          />
        ) : (
          cards.map(card => {
            const selected = selectedCardId === card.id;
            return (
              <View key={card.id} style={styles.resultWrap}>
                <Pressable
                  onPress={() => handleSelectCard(card)}
                  style={[
                    styles.resultCard,
                    isRTL && styles.resultCardRtl,
                    selected && styles.resultCardActive,
                  ]}
                >
                  <Image
                    source={{ uri: card.imageUrl }}
                    style={[styles.resultImage, isRTL && styles.resultImageRtl]}
                  />

                  <View style={styles.resultContent}>
                    <Text
                      numberOfLines={2}
                      style={[
                        styles.resultTitle,
                        { textAlign, writingDirection: isRTL ? 'rtl' : 'ltr' },
                      ]}
                    >
                      {card.title}
                    </Text>

                    <Text
                      numberOfLines={1}
                      style={[
                        styles.resultSubtitle,
                        { textAlign, writingDirection: isRTL ? 'rtl' : 'ltr' },
                      ]}
                    >
                      {card.subtitle}
                    </Text>

                    <Text
                      style={[
                        styles.resultTime,
                        { textAlign, writingDirection: isRTL ? 'rtl' : 'ltr' },
                      ]}
                    >
                      {card.timeLabel}
                    </Text>

                    <Text
                      numberOfLines={2}
                      style={[
                        styles.resultDescription,
                        { textAlign, writingDirection: isRTL ? 'rtl' : 'ltr' },
                      ]}
                    >
                      {card.description}
                    </Text>

                    <View style={[styles.resultFooter, { flexDirection: getRowDirection() }]}>
                      {card.signal ? (
                        <View
                          style={[
                            styles.resultBadge,
                            card.signal === 'promoted'
                              ? styles.resultBadgePromoted
                              : styles.resultBadgeTrending,
                          ]}
                        >
                          <Text
                            style={[
                              styles.resultBadgeText,
                              card.signal === 'promoted'
                                ? styles.resultBadgeTextPromoted
                                : styles.resultBadgeTextTrending,
                            ]}
                          >
                            {card.signal === 'promoted'
                              ? language === 'ar'
                                ? 'مميز'
                                : 'Promoted'
                              : language === 'ar'
                                ? 'رائج'
                                : 'Trending'}
                          </Text>
                        </View>
                      ) : null}

                      {card.ratingLabel ? (
                        <Text style={styles.resultMetaInline}>{card.ratingLabel}</Text>
                      ) : null}

                      <Text style={styles.resultMetaInline}>{card.distanceLabel}</Text>
                    </View>
                  </View>

                  <Pressable
                    onPress={() => void handleToggleSave(card)}
                    style={({ pressed }) => [
                      styles.saveButton,
                      isRTL && styles.saveButtonRtl,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text style={styles.saveGlyph}>
                      {savingCardId === card.id
                        ? '…'
                        : card.saved
                          ? '🔖'
                          : '⌑'}
                    </Text>
                  </Pressable>
                </Pressable>
                {selected && card.rawPost ? (
                  <View style={styles.interactionPanelWrap}>
                    <PostInteractionPanel
                      post={card.rawPost}
                      currentUserId={user?.id}
                      currentUserLabel={interactionUserLabel}
                      compact
                    />
                  </View>
                ) : null}
              </View>
            );
          })
        )}

        <View style={styles.mapCard}>
          <MapView
            ref={mapRef}
            provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
            style={styles.map}
            initialRegion={region}
            onRegionChangeComplete={handleNativeRegionChangeComplete}
            onTouchStart={() => setIsScrollEnabled(false)}
            onTouchEnd={() => setIsScrollEnabled(true)}
            onTouchCancel={() => setIsScrollEnabled(true)}
            showsCompass
            showsScale={false}
            showsUserLocation={false}
            scrollEnabled
            zoomEnabled
            zoomTapEnabled
            rotateEnabled={false}
            toolbarEnabled={false}
          >
            {SUPPORTS_NATIVE_HEATMAP && heatPoints.length > 0 ? (
              <Heatmap
                points={heatPoints}
                radius={44}
                opacity={0.72}
                gradient={{
                  colors: ['#5E6BFF', '#52D5FF', '#67F06B', '#F0F36A', '#FFAA5C', '#FF5E5E'],
                  startPoints: [0.12, 0.28, 0.42, 0.6, 0.8, 1.0],
                  colorMapSize: 256,
                }}
              />
            ) : null}

            {!SUPPORTS_NATIVE_HEATMAP
              ? heatPoints.map((point, index) => (
                  <Marker
                    key={`heat-fallback-${point.latitude}-${point.longitude}-${index}`}
                    coordinate={{
                      latitude: point.latitude,
                      longitude: point.longitude,
                    }}
                    anchor={{ x: 0.5, y: 0.5 }}
                    tracksViewChanges={false}
                  >
                    <View
                      pointerEvents="none"
                      style={[styles.heatFallbackPoint, getFallbackHeatPointStyle(point)]}
                    />
                  </Marker>
                ))
              : null}

            {browserLocation ? (
              <Marker
                coordinate={{
                  latitude: browserLocation.latitude,
                  longitude: browserLocation.longitude,
                }}
                title={t('explore.yourLocation')}
                pinColor={colors.info}
              />
            ) : null}

            {visiblePosts.map(post => {
              const isSelected =
                selectedResult?.kind === 'post' && selectedResult.id === post.id;

              return (
                <Marker
                  key={`post-${post.id}`}
                  coordinate={{ latitude: post.lat, longitude: post.lng }}
                  title={post.locationName || post.text}
                  description={post.text}
                  pinColor={isSelected ? '#FF4F9A' : '#D946EF'}
                  onPress={() => handleSelectPost(post)}
                />
              );
            })}

            {visibleEvents
              .filter(event => event.status === 'active')
              .map(event => {
                const isSelected =
                  selectedResult?.kind === 'event' && selectedResult.id === event.id;

                return (
                  <Marker
                    key={`event-${event.id}`}
                    coordinate={{ latitude: event.lat, longitude: event.lng }}
                    title={event.title}
                    description={event.description}
                    pinColor={isSelected ? '#FF7A4E' : '#F97316'}
                    onPress={() => handleSelectEvent(event)}
                  />
                );
              })}
          </MapView>

          <Pressable
            accessibilityRole="button"
            onPress={handleResetMap}
            style={({ pressed }) => [
              styles.mapFloatButton,
              isRTL && styles.mapFloatButtonRtl,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.mapFloatGlyph}>⌖</Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            onPress={handleSearchThisArea}
            style={({ pressed }) => [
              styles.mapSearchButton,
              isRTL && styles.mapSearchButtonRtl,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.mapSearchButtonText}>
              {language === 'ar' ? 'ابحث في هذه المنطقة' : 'Search this area'}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FAF7F2',
  },
  content: {
    paddingHorizontal: 0,
  },

  topBar: {
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 14,
  },
  brandText: {
    fontSize: 28,
    lineHeight: 32,
    fontWeight: '800',
    color: '#F45A4E',
    letterSpacing: -0.6,
  },
  topActions: {
    alignItems: 'center',
    gap: 14,
  },
  topIconButton: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topIconGlyph: {
    fontSize: 22,
    lineHeight: 24,
    color: '#433B36',
  },
  avatarWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#EFE8E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarFallback: {
    position: 'absolute',
    fontSize: 13,
    fontWeight: '700',
    color: '#2E241F',
  },

  searchShell: {
    marginHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#ECE6DE',
    paddingHorizontal: 14,
    paddingVertical: 10,
    shadowColor: '#20150E',
    shadowOpacity: 0.04,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  searchFieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 58,
  },
  searchFieldIconWrap: {
    width: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchFieldTextWrap: {
    flex: 1,
    gap: 2,
  },
  searchFieldLabel: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '700',
    color: '#2A211D',
  },
  searchFieldInput: {
    fontSize: 15,
    lineHeight: 20,
    color: '#80756E',
    minHeight: 24,
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  searchChevron: {
    fontSize: 26,
    lineHeight: 26,
    color: '#B2A79F',
    marginLeft: 8,
  },
  searchDivider: {
    height: 1,
    backgroundColor: '#EEE7E0',
    marginHorizontal: 2,
  },
  searchActionButton: {
    width: 64,
    height: 50,
    borderRadius: 14,
    backgroundColor: '#F45A4E',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  searchActionButtonRtl: {
    marginLeft: 0,
    marginRight: 12,
  },
  searchActionGlyph: {
    fontSize: 24,
    lineHeight: 24,
    color: '#FFFFFF',
  },

  searchGlyph: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchGlyphCircle: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#F45A4E',
    top: 1,
    left: 1,
  },
  searchGlyphHandle: {
    position: 'absolute',
    width: 9,
    height: 2.5,
    backgroundColor: '#F45A4E',
    borderRadius: 2,
    transform: [{ rotate: '45deg' }],
    right: 0,
    bottom: 2,
  },

  pinGlyph: {
    width: 20,
    height: 24,
    alignItems: 'center',
  },
  pinGlyphHead: {
    width: 16,
    height: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#F45A4E',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  pinGlyphCore: {
    width: 4,
    height: 4,
    borderRadius: 4,
    backgroundColor: '#F45A4E',
  },
  pinGlyphTip: {
    marginTop: -1,
    width: 0,
    height: 0,
    borderLeftWidth: 4,
    borderRightWidth: 4,
    borderTopWidth: 7,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#F45A4E',
  },

  chipRow: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 8,
    gap: 10,
  },
  filterChip: {
    minHeight: 42,
    paddingHorizontal: 18,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E2DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterChipActive: {
    backgroundColor: '#F45A4E',
    borderColor: '#F45A4E',
  },
  filterChipText: {
    fontSize: 15,
    lineHeight: 18,
    fontWeight: '600',
    color: '#564C47',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },

  resultsMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 10,
  },
  resultsMetaText: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '700',
    color: '#231B17',
  },
  sortText: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '600',
    color: '#F45A4E',
  },
  summaryCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#ECE6DE',
    backgroundColor: '#FFFFFF',
    shadowColor: '#20150E',
    shadowOpacity: 0.03,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1,
  },
  summaryHeader: {
    alignItems: 'center',
    gap: 12,
  },
  summaryCopy: {
    flex: 1,
    gap: 4,
  },
  summaryTitle: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '800',
    color: '#211915',
  },
  summaryBody: {
    fontSize: 14,
    lineHeight: 19,
    color: '#6D625C',
  },
  summaryButton: {
    minHeight: 42,
    minWidth: 92,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F45A4E',
    paddingHorizontal: 14,
  },
  summaryButtonDisabled: {
    opacity: 0.72,
  },
  summaryButtonText: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  resultWrap: {
    marginBottom: 12,
  },
  resultCard: {
    marginHorizontal: 16,
    marginBottom: 0,
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ECE6DE',
    flexDirection: 'row',
    alignItems: 'flex-start',
    shadowColor: '#20150E',
    shadowOpacity: 0.03,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1,
  },
  resultCardRtl: {
    flexDirection: 'row-reverse',
  },
  resultCardActive: {
    borderColor: '#F0B2AA',
  },
  resultImage: {
    width: 104,
    height: 104,
    borderRadius: 16,
    marginRight: 12,
    backgroundColor: '#EDE6DD',
  },
  resultImageRtl: {
    marginRight: 0,
    marginLeft: 12,
  },
  resultContent: {
    flex: 1,
    paddingTop: 2,
  },
  resultTitle: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '800',
    color: '#211915',
  },
  resultSubtitle: {
    marginTop: 4,
    fontSize: 15,
    lineHeight: 19,
    color: '#716660',
  },
  resultTime: {
    marginTop: 4,
    fontSize: 15,
    lineHeight: 19,
    color: '#22A060',
    fontWeight: '600',
  },
  resultDescription: {
    marginTop: 4,
    fontSize: 15,
    lineHeight: 20,
    color: '#6D625C',
  },
  resultFooter: {
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  resultBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  resultBadgeTrending: {
    backgroundColor: '#E6F4E9',
  },
  resultBadgePromoted: {
    backgroundColor: '#E8F0FA',
  },
  resultBadgeText: {
    fontSize: 13,
    lineHeight: 16,
    fontWeight: '700',
  },
  resultBadgeTextTrending: {
    color: '#2E9B57',
  },
  resultBadgeTextPromoted: {
    color: '#3A78C8',
  },
  resultMetaInline: {
    fontSize: 14,
    lineHeight: 18,
    color: '#6A605A',
  },
  saveButton: {
    width: 34,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 6,
    marginLeft: 8,
  },
  saveButtonRtl: {
    marginLeft: 0,
    marginRight: 8,
  },
  saveGlyph: {
    fontSize: 20,
    lineHeight: 22,
    color: '#5B514B',
  },
  interactionPanelWrap: {
    marginHorizontal: 16,
    marginTop: 8,
  },

  mapCard: {
    marginHorizontal: 16,
    marginTop: 6,
    marginBottom: 22,
    height: 268,
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: '#DDEAF4',
    position: 'relative',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  heatFallbackPoint: {
    borderWidth: 1,
  },
  mapFloatButton: {
    position: 'absolute',
    right: 14,
    top: 14,
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#20150E',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  mapFloatButtonRtl: {
    right: undefined,
    left: 14,
  },
  mapFloatGlyph: {
    fontSize: 22,
    lineHeight: 22,
    color: '#5C534D',
  },
  mapSearchButton: {
    position: 'absolute',
    left: 14,
    bottom: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 12,
    shadowColor: '#20150E',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  mapSearchButtonRtl: {
    left: undefined,
    right: 14,
  },
  mapSearchButtonText: {
    fontSize: 15,
    lineHeight: 18,
    fontWeight: '600',
    color: '#433A35',
  },

  bellIcon: {
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellStem: {
    position: 'absolute',
    top: 1,
    width: 5,
    height: 2,
    borderRadius: 2,
    backgroundColor: '#6B625C',
  },
  bellBody: {
    position: 'absolute',
    top: 3,
    width: 11,
    height: 9,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
    borderWidth: 1.35,
    borderColor: '#6B625C',
    backgroundColor: '#FFFFFF',
  },
  bellClapper: {
    position: 'absolute',
    bottom: 2,
    width: 4,
    height: 4,
    borderRadius: 4,
    backgroundColor: '#6B625C',
  },
  bellBase: {
    position: 'absolute',
    bottom: 1,
    width: 10,
    height: 1.5,
    borderRadius: 2,
    backgroundColor: '#6B625C',
  },
  bellDot: {
    position: 'absolute',
    top: 0,
    right: 1,
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#F45A4E',
  },

  pressed: {
    opacity: 0.82,
  },
});
