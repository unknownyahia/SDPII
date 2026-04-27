import React from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { RouteProp, useIsFocused, useRoute } from '@react-navigation/native';

import { EmptyState } from '../../components/ui/EmptyState';
import { LoadingState } from '../../components/ui/LoadingState';
import { StatusBanner } from '../../components/ui/StatusBanner';
import { ExploreMapSurface } from '../../components/explore/ExploreMapSurface.web';
import { PostInteractionPanel } from '../../components/explore/PostInteractionPanel';
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
import { observeCommentCountsByPost } from '../../services/commentService';
import {
  buildDiscoveryEventItems,
  buildDiscoverySpotItems,
  calculateDistanceKm,
  getTimestampMs,
} from '../../services/discoveryService';
import {
  FavoriteValidationError,
  observeFavoritePostIds,
  toggleFavoritePost,
} from '../../services/favoriteService';
import {
  getCurrentCoordinates,
  getLocationDisplayName,
  requestForegroundLocationPermission,
} from '../../services/locationService';
import { observeLikeCountsByPost } from '../../services/reactionService';
import { summarizeAreaPosts } from '../../services/summaryService';
import { filterExploreEvents, filterExplorePosts } from '../../services/exploreService';
import { webDesktopColors, webDesktopLayout } from '../../theme/webDesktopSystem';
import {
  getBlockedDataMessage,
  getErrorMessage,
  isDataAccessBlockedError,
} from '../../utils/dataAccessError';
import { showAlert } from '../../utils/showAlert';
import type { PromotedEvent } from '../../types/event';
import type { MainTabParamList } from '../../navigation/types';
import type { SpotPost } from '../../types/post';

type ExploreChipId = ExploreCategoryId;

type ExploreCard = {
  id: string;
  kind: 'spot' | 'event';
  sourceId: string;
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

type MapBounds = {
  north: number;
  south: number;
  east: number;
  west: number;
};

type SortMode = 'recommended' | 'nearest' | 'recent';

const CHIPS = EXPLORE_CATEGORY_OPTIONS;

function getCopy(language: 'en' | 'ar') {
  if (language === 'ar') {
    return {
      what: 'ماذا',
      where: 'أين',
      whatPlaceholder: 'قهوة، أماكن دراسة، فعاليات...',
      wherePlaceholder: 'قطر، مدينة، أو منطقة',
      results: 'نتائج',
      inQatar: 'في قطر',
      sortBy: 'ترتيب حسب',
      sortLabels: {
        recommended: 'الأفضل',
        nearest: 'الأقرب',
        recent: 'الأحدث',
      },
      areaSummary: 'ملخص المنطقة',
      nearMe: 'بالقرب مني',
      searchAsMove: 'ابحث أثناء تحريك الخريطة',
      showList: 'إظهار القائمة',
      hideList: 'إخفاء القائمة',
      popular: 'شائع',
      promoted: 'مميز',
      eventToday: 'فعالية',
      noResultsTitle: 'لا توجد نتائج',
      noResultsBody: 'جرّب فئة أخرى أو ابحث في منطقة مختلفة.',
      dataIssueTitle: 'قد تكون بعض النتائج ناقصة.',
      retry: 'إعادة المحاولة',
      summaryTitle: 'ملخص المنطقة',
      summaryEmpty: 'لا توجد نتائج كافية لتلخيص هذه المنطقة.',
      summaryError: 'تعذر إنشاء الملخص الآن.',
      summaryPrompt: 'أنشئ ملخصًا حقيقيًا من النتائج الظاهرة في القائمة والخريطة.',
      generateSummary: 'لخّص',
      locationDeniedTitle: 'تعذر قراءة موقع المتصفح',
      locationEnabledTitle: 'تم تفعيل الموقع',
      savedTitle: 'تم حفظ المكان',
      unsavedTitle: 'تمت إزالة الحفظ',
      saveErrorTitle: 'تعذر تحديث الحفظ',
      detailsTitle: 'تفاصيل النتيجة',
    };
  }

  return {
    what: 'What',
    where: 'Where',
    whatPlaceholder: 'Coffee, study spots, events...',
    wherePlaceholder: 'Qatar, city, or area',
    results: 'results',
    inQatar: 'in Qatar',
    sortBy: 'Sort by',
    sortLabels: {
      recommended: 'Recommended',
      nearest: 'Nearest',
      recent: 'Recent',
    },
    areaSummary: 'Area Summary',
    nearMe: 'Near Me',
    searchAsMove: 'Search as I move the map',
    showList: 'Show list',
    hideList: 'Hide list',
    popular: 'Popular',
    promoted: 'Promoted',
    eventToday: 'Event today',
    noResultsTitle: 'No results',
    noResultsBody: 'Try another filter or search in a different area.',
    dataIssueTitle: 'Some results may be missing.',
    retry: 'Retry',
    summaryTitle: 'Area summary',
    summaryEmpty: 'There are not enough results in this view to summarize.',
    summaryError: 'Unable to generate an area summary right now.',
    summaryPrompt: 'Generate a real summary from the results currently visible in the list and map.',
    generateSummary: 'Summarize',
    locationDeniedTitle: 'Browser location could not be read',
    locationEnabledTitle: 'Location enabled',
    savedTitle: 'Saved to favorites',
    unsavedTitle: 'Removed from favorites',
    saveErrorTitle: 'Could not update saved state',
    detailsTitle: 'Result details',
  };
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

function isCardInsideBounds(card: Pick<ExploreCard, 'latitude' | 'longitude'>, bounds: MapBounds) {
  return (
    card.latitude <= bounds.north &&
    card.latitude >= bounds.south &&
    card.longitude <= bounds.east &&
    card.longitude >= bounds.west
  );
}

function areMapBoundsEqual(a: MapBounds | null, b: MapBounds) {
  if (!a) {
    return false;
  }

  const threshold = 0.00001;
  return (
    Math.abs(a.north - b.north) < threshold &&
    Math.abs(a.south - b.south) < threshold &&
    Math.abs(a.east - b.east) < threshold &&
    Math.abs(a.west - b.west) < threshold
  );
}

function formatEventTime(value: unknown, language: 'en' | 'ar') {
  const timestampMs = getTimestampMs(value);

  if (timestampMs === null) {
    return language === 'ar' ? 'اليوم - لاحقا' : 'Today - Time soon';
  }

  const date = new Date(timestampMs);
  const locale = language === 'ar' ? 'ar-QA' : 'en-US';
  const today = new Date();
  const sameDay =
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate();

  const timeLabel = new Intl.DateTimeFormat(locale, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);

  if (sameDay) {
    return language === 'ar' ? `اليوم - ${timeLabel}` : `Today - ${timeLabel}`;
  }

  const shortDate = new Intl.DateTimeFormat(locale, {
    month: 'short',
    day: 'numeric',
  }).format(date);

  return `${shortDate} - ${timeLabel}`;
}

function formatSpotTime(value: unknown, language: 'en' | 'ar') {
  const timestampMs = getTimestampMs(value);

  if (timestampMs === null) {
    return language === 'ar' ? 'اليوم' : 'Today';
  }

  const locale = language === 'ar' ? 'ar-QA' : 'en-US';
  return new Intl.DateTimeFormat(locale, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(timestampMs));
}

function getCardImage(imageUrl?: string | null) {
  if (imageUrl && imageUrl.trim().length > 0) {
    return imageUrl;
  }

  return 'https://images.unsplash.com/photo-1658863714664-bced34d5606f?auto=format&fit=crop&w=1200&q=80';
}

function getSpotRatingLabel(commentCount: number, likeCount: number) {
  const engagement = Math.max(commentCount + likeCount, 1);
  const value = (4.3 + Math.min(0.6, engagement * 0.02)).toFixed(1);
  return `${value} (${engagement})`;
}

function getNextSortMode(current: SortMode): SortMode {
  if (current === 'recommended') {
    return 'nearest';
  }

  if (current === 'nearest') {
    return 'recent';
  }

  return 'recommended';
}

export function ExploreScreen() {
  const route = useRoute<RouteProp<MainTabParamList, 'Explore'>>();
  const isFocused = useIsFocused();
  const searchInputRef = React.useRef<TextInput>(null);
  const { user } = useAuth();
  const {
    language,
    isRTL,
    getTextAlign,
  } = useLocalization();
  const copy = React.useMemo(() => getCopy(language), [language]);
  const textAlign = getTextAlign();

  const [loading, setLoading] = React.useState(true);
  const [posts, setPosts] = React.useState<SpotPost[]>([]);
  const [events, setEvents] = React.useState<PromotedEvent[]>([]);
  const [favoritePostIds, setFavoritePostIds] = React.useState<string[]>([]);
  const [commentCountsByPostId, setCommentCountsByPostId] = React.useState<Record<string, number>>({});
  const [likeCountsByPostId, setLikeCountsByPostId] = React.useState<Record<string, number>>({});
  const [dataIssue, setDataIssue] = React.useState<string | null>(null);
  const [refreshToken, setRefreshToken] = React.useState(0);
  const [selectedChipId, setSelectedChipId] = React.useState<ExploreChipId>('all');
  const [selectedCardId, setSelectedCardId] = React.useState<string | null>(null);
  const [query, setQuery] = React.useState('');
  const [location, setLocation] = React.useState(language === 'ar' ? 'قطر' : 'Qatar');
  const [sortMode, setSortMode] = React.useState<SortMode>('recommended');
  const [savingCardId, setSavingCardId] = React.useState<string | null>(null);
  const [browserLocation, setBrowserLocation] = React.useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [autoSearchArea, setAutoSearchArea] = React.useState(false);
  const [mapBounds, setMapBounds] = React.useState<MapBounds | null>(null);
  const [isListVisible, setIsListVisible] = React.useState(true);
  const [summaryLoading, setSummaryLoading] = React.useState(false);
  const [areaSummary, setAreaSummary] = React.useState<string | null>(null);

  const activeChip = React.useMemo(
    () => CHIPS.find(chip => chip.id === selectedChipId) ?? CHIPS[0],
    [selectedChipId]
  );

  const routeParamKey = JSON.stringify(route.params ?? {});
  const lastAppliedRouteParamKeyRef = React.useRef('');

  React.useEffect(() => {
    const defaultWhereLabel = language === 'ar' ? 'قطر' : 'Qatar';
    setLocation(current => {
      const normalized = normalize(current);
      if (!current.trim() || normalized === 'qatar' || current.trim() === 'قطر') {
        return defaultWhereLabel;
      }

      return current;
    });
  }, [language]);

  React.useEffect(() => {
    const params = route.params;

    if (!params || routeParamKey === lastAppliedRouteParamKeyRef.current) {
      return undefined;
    }

    lastAppliedRouteParamKeyRef.current = routeParamKey;

    if (typeof params.query === 'string') {
      setQuery(params.query);
    }

    if (typeof params.where === 'string' && params.where.trim()) {
      setLocation(params.where);
    }

    if (isExploreCategoryId(params.chipId)) {
      setSelectedChipId(params.chipId);
    }

    setSelectedCardId(null);

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

    const unsubscribePosts = subscribeToPosts(
      nextPosts => {
        setPosts(nextPosts);
        setLoading(false);
      },
      error => {
        handleDataIssue(error, 'Failed to load Explore posts.');
        setLoading(false);
      }
    );

    const unsubscribeEvents = subscribeToEvents(
      nextEvents => {
        setEvents(nextEvents);
      },
      error => {
        handleDataIssue(error, 'Failed to load Explore events.');
      }
    );

    return () => {
      unsubscribePosts();
      unsubscribeEvents();
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

  const activeWhereQuery = React.useMemo(() => {
    const trimmed = location.trim();
    const normalized = normalize(trimmed);

    if (!trimmed || normalized === 'qatar' || trimmed === 'قطر') {
      return '';
    }

    if (normalized === 'near me') {
      return '';
    }

    return normalized;
  }, [location]);

  const filteredPosts = React.useMemo(
    () => filterExplorePosts(posts, activeChip.id, query),
    [activeChip.id, posts, query]
  );

  const filteredEvents = React.useMemo(
    () => filterExploreEvents(events, activeChip.id, query),
    [activeChip.id, events, query]
  );

  const discoverySpotItems = React.useMemo(
    () =>
      buildDiscoverySpotItems(filteredPosts, {
        commentCountsByPostId,
        likeCountsByPostId,
        favoritePostIds,
        browserLocation,
        searchQuery: query,
        language,
      }),
    [
      browserLocation,
      commentCountsByPostId,
      favoritePostIds,
      filteredPosts,
      language,
      likeCountsByPostId,
      query,
    ]
  );

  const discoveryEventItems = React.useMemo(
    () =>
      buildDiscoveryEventItems(filteredEvents, {
        posts: filteredPosts,
        browserLocation,
        searchQuery: query,
        language,
      }),
    [browserLocation, filteredEvents, filteredPosts, language, query]
  );

  const allCards = React.useMemo<ExploreCard[]>(() => {
    const spotCards: ExploreCard[] = discoverySpotItems.map(spot => ({
      id: `spot-${spot.postId}`,
      kind: 'spot',
      sourceId: spot.postId,
      title: spot.title,
      subtitle: `${spot.locationLabel} - ${spot.areaLabel}`,
      description: spot.summary || spot.description,
      timeLabel: formatSpotTime(spot.rawPost.createdAt, language),
      distanceLabel: spot.distanceLabel,
      imageUrl: getCardImage(spot.hero.imageUrl),
      signal: spot.trustSignals.some(signal => signal.id === 'popular-now')
        ? 'trending'
        : undefined,
      ratingLabel: getSpotRatingLabel(spot.commentCount, spot.likeCount),
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
      sourceId: event.eventId,
      title: event.title,
      subtitle: `${event.venueLabel} - ${event.areaLabel}`,
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

    return [...spotCards, ...eventCards]
      .filter(hasValidCoordinate)
      .filter(card => {
        if (!activeWhereQuery) {
          return true;
        }

        return normalize(`${card.title} ${card.subtitle} ${card.description}`).includes(
          activeWhereQuery
        );
      });
  }, [activeWhereQuery, discoveryEventItems, discoverySpotItems, language]);

  const cards = React.useMemo(() => {
    const scopedCards =
      autoSearchArea && mapBounds
        ? allCards.filter(card => isCardInsideBounds(card, mapBounds))
        : allCards;

    const sorted = [...scopedCards].sort((a, b) => {
      if (sortMode === 'recent') {
        return (getTimestampMs(b.createdAt) ?? 0) - (getTimestampMs(a.createdAt) ?? 0);
      }

      if (sortMode === 'nearest' && browserLocation) {
        return (
          calculateDistanceKm(browserLocation, { lat: a.latitude, lng: a.longitude }) -
          calculateDistanceKm(browserLocation, { lat: b.latitude, lng: b.longitude })
        );
      }

      return b.rankingScore - a.rankingScore;
    });

    return sorted.slice(0, 12);
  }, [allCards, autoSearchArea, browserLocation, mapBounds, sortMode]);

  React.useEffect(() => {
    if (cards.length === 0) {
      setSelectedCardId(null);
      return;
    }

    if (!selectedCardId || !cards.some(card => card.id === selectedCardId)) {
      setSelectedCardId(cards[0].id);
    }
  }, [cards, selectedCardId]);

  const selected = cards.find(item => item.id === selectedCardId) ?? cards[0] ?? null;
  const interactionUserLabel = user?.displayInfo || user?.email || 'Spots user';

  const mapSourceCards = React.useMemo(() => allCards.slice(0, 30), [allCards]);
  const mapPosts = React.useMemo(
    () => mapSourceCards.flatMap(card => (card.rawPost ? [card.rawPost] : [])),
    [mapSourceCards]
  );
  const mapEvents = React.useMemo(
    () => mapSourceCards.flatMap(card => (card.rawEvent ? [card.rawEvent] : [])),
    [mapSourceCards]
  );
  const selectedResult = React.useMemo(() => {
    if (!selected) {
      return null;
    }

    return selected.kind === 'spot'
      ? { kind: 'post' as const, id: selected.sourceId }
      : { kind: 'event' as const, id: selected.sourceId };
  }, [selected?.kind, selected?.sourceId]);

  const handleMapViewportChange = React.useCallback((nextBounds: MapBounds) => {
    setMapBounds(current =>
      areMapBoundsEqual(current, nextBounds) ? current : nextBounds
    );
  }, []);

  const handleRetry = React.useCallback(() => {
    setDataIssue(null);
    setRefreshToken(value => value + 1);
  }, []);

  const handleSelectChip = React.useCallback((chipId: ExploreChipId) => {
    setSelectedChipId(chipId);
    setSelectedCardId(null);
    setAreaSummary(null);
  }, []);

  const handleNearMe = React.useCallback(async () => {
    try {
      const permission = await requestForegroundLocationPermission();
      if (permission.status !== 'granted') {
        throw new Error(
          language === 'ar'
            ? 'اسمح للموقع من المتصفح ثم حاول مرة أخرى.'
            : 'Allow browser location and try again.'
        );
      }

      const coords = await getCurrentCoordinates();
      const label = await getLocationDisplayName(coords.latitude, coords.longitude);
      setBrowserLocation(coords);
      setLocation(language === 'ar' ? 'بالقرب مني' : 'Near me');
      showAlert(copy.locationEnabledTitle, label);
    } catch (error) {
      showAlert(copy.locationDeniedTitle, getErrorMessage(error, copy.noResultsBody));
    }
  }, [copy.locationDeniedTitle, copy.locationEnabledTitle, copy.noResultsBody, language]);

  const handleToggleSave = React.useCallback(
    async (card: ExploreCard) => {
      if (!card.postId) {
        showAlert(copy.detailsTitle, card.title);
        return;
      }

      setSavingCardId(card.id);

      try {
        const nextSaved = await toggleFavoritePost({
          userId: user?.id,
          postId: card.postId,
          isCurrentlyFavorite: card.saved,
        });
        showAlert(nextSaved ? copy.savedTitle : copy.unsavedTitle, card.title);
      } catch (error) {
        const message =
          error instanceof FavoriteValidationError
            ? error.message
            : isDataAccessBlockedError(error)
              ? getBlockedDataMessage(language === 'ar' ? 'المحفوظات' : 'saved spots')
              : getErrorMessage(error, 'Unable to update saved state right now.');
        showAlert(copy.saveErrorTitle, message);
      } finally {
        setSavingCardId(null);
      }
    },
    [copy.detailsTitle, copy.saveErrorTitle, copy.savedTitle, copy.unsavedTitle, language, user?.id]
  );

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
      setAreaSummary(copy.summaryEmpty);
      return;
    }

    setSummaryLoading(true);
    try {
      const nextSummary = await summarizeAreaPosts({ posts: summarizable });
      setAreaSummary(nextSummary);
    } catch (error) {
      setAreaSummary(getErrorMessage(error, copy.summaryError));
    } finally {
      setSummaryLoading(false);
    }
  }, [cards, copy.summaryEmpty, copy.summaryError]);

  const handleSelectPost = React.useCallback((post: SpotPost) => {
    setSelectedCardId(`spot-${post.id}`);
    setIsListVisible(true);
  }, []);

  const handleSelectEvent = React.useCallback((event: PromotedEvent) => {
    setSelectedCardId(`event-${event.id}`);
    setIsListVisible(true);
  }, []);

  if (loading) {
    return <LoadingState label={language === 'ar' ? 'استكشاف' : 'Explore'} />;
  }

  return (
    <ScrollView
      style={styles.page}
      contentContainerStyle={styles.pageContent}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <View style={[styles.container, { direction: isRTL ? 'rtl' : 'ltr' }]}>
        <View style={styles.toolbarCard}>
          <View style={styles.toolbarTopRow}>
            <View style={styles.searchComposite}>
              <View style={styles.searchField}>
                <Text style={styles.searchFieldLabel}>{copy.what}</Text>
                <TextInput
                  ref={searchInputRef}
                  value={query}
                  onChangeText={setQuery}
                  placeholder={copy.whatPlaceholder}
                  placeholderTextColor={webDesktopColors.textSoft}
                  returnKeyType="search"
                  clearButtonMode="while-editing"
                  style={[
                    styles.searchInput,
                    { textAlign, writingDirection: isRTL ? 'rtl' : 'ltr' },
                  ]}
                />
              </View>

              <View style={styles.searchVerticalDivider} />

              <View style={styles.searchField}>
                <Text style={styles.searchFieldLabel}>{copy.where}</Text>
                <TextInput
                  value={location}
                  onChangeText={setLocation}
                  placeholder={copy.wherePlaceholder}
                  placeholderTextColor={webDesktopColors.textSoft}
                  returnKeyType="search"
                  clearButtonMode="while-editing"
                  style={[
                    styles.searchInput,
                    { textAlign, writingDirection: isRTL ? 'rtl' : 'ltr' },
                  ]}
                />
              </View>

              <Pressable
                accessibilityRole="button"
                style={({ pressed }) => [styles.locationCrosshair, pressed && styles.pressed]}
                onPress={() => void handleNearMe()}
              >
                <Ionicons name="locate-outline" size={22} color="#756B65" />
              </Pressable>

              <Pressable
                accessibilityRole="button"
                style={({ pressed }) => [styles.primarySearchButton, pressed && styles.pressed]}
                onPress={() => setSelectedCardId(cards[0]?.id ?? null)}
              >
                <Ionicons name="search-outline" size={26} color="#FFFFFF" />
              </Pressable>
            </View>

            <Pressable
              accessibilityRole="button"
              style={({ pressed }) => [styles.utilityPill, pressed && styles.pressed]}
              onPress={() => void handleAreaSummary()}
            >
              <Ionicons name="analytics-outline" size={18} color="#4E453F" />
              <Text style={styles.utilityPillText}>{copy.areaSummary}</Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              style={({ pressed }) => [styles.utilityPill, pressed && styles.pressed]}
              onPress={() => void handleNearMe()}
            >
              <Ionicons name="paper-plane-outline" size={18} color="#4E453F" />
              <Text style={styles.utilityPillText}>{copy.nearMe}</Text>
            </Pressable>
          </View>

          <View style={styles.filtersRow}>
            {CHIPS.map(chip => {
              const active = selectedChipId === chip.id;
              return (
                <Pressable
                  key={chip.id}
                  accessibilityRole="button"
                  onPress={() => handleSelectChip(chip.id)}
                  style={({ pressed }) => [
                    styles.filterPill,
                    active && styles.filterPillActive,
                    pressed && styles.pressed,
                  ]}
                >
                  <Ionicons
                    name={chip.icon as keyof typeof Ionicons.glyphMap}
                    size={18}
                    color={active ? webDesktopColors.primary : '#5F5650'}
                  />
                  <Text style={[styles.filterPillText, active && styles.filterPillTextActive]}>
                    {getCategoryOptionLabel(chip, language)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {dataIssue ? (
          <StatusBanner
            compact
            tone="warning"
            title={copy.dataIssueTitle}
            body={dataIssue}
            actions={[
              {
                label: copy.retry,
                tone: 'primary',
                onPress: handleRetry,
              },
            ]}
          />
        ) : null}

        <View style={styles.resultsSummaryRow}>
          <Text style={styles.resultsCount}>
            {cards.length}{' '}
            <Text style={styles.resultsCountSub}>{copy.results}</Text>{' '}
            <Text style={styles.resultsCountSub}>{copy.inQatar}</Text>
          </Text>

          <View style={styles.sortWrap}>
            <Text style={styles.sortLabel}>{copy.sortBy}</Text>
            <Pressable
              accessibilityRole="button"
              style={({ pressed }) => [styles.sortButton, pressed && styles.pressed]}
              onPress={() => setSortMode(current => getNextSortMode(current))}
            >
              <Text style={styles.sortButtonText}>{copy.sortLabels[sortMode]}</Text>
              <Ionicons name="chevron-down" size={16} color="#7A706A" />
            </Pressable>
          </View>
        </View>

        <View style={styles.summaryPanel}>
          <View style={styles.summaryPanelCopy}>
            <Text style={styles.summaryPanelTitle}>{copy.summaryTitle}</Text>
            <Text style={styles.summaryPanelBody}>
              {areaSummary || copy.summaryPrompt}
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            disabled={summaryLoading}
            style={({ pressed }) => [
              styles.summaryPanelButton,
              summaryLoading && styles.summaryPanelButtonDisabled,
              pressed && !summaryLoading && styles.pressed,
            ]}
            onPress={() => void handleAreaSummary()}
          >
            {summaryLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="sparkles-outline" size={17} color="#FFFFFF" />
                <Text style={styles.summaryPanelButtonText}>{copy.generateSummary}</Text>
              </>
            )}
          </Pressable>
        </View>

        <View style={styles.mainSplit}>
          {isListVisible ? (
            <View style={styles.resultsColumn}>
              {cards.length === 0 ? (
                <View style={styles.emptyResultsWrap}>
                  <EmptyState title={copy.noResultsTitle} body={copy.noResultsBody} />
                </View>
              ) : (
                cards.map(item => {
                  const active = selected?.id === item.id;

                  return (
                    <View key={item.id} style={styles.resultRowShell}>
                      <View style={[styles.resultRow, active && styles.resultRowActive]}>
                        <Pressable
                          accessibilityRole="button"
                          onPress={() => setSelectedCardId(item.id)}
                          style={({ pressed }) => [
                            styles.resultMainButton,
                            pressed && styles.pressed,
                          ]}
                        >
                          <Image source={{ uri: item.imageUrl }} style={styles.resultImage} />

                          <View style={styles.resultContent}>
                            <View style={styles.resultTopLine}>
                              <Text
                                style={[
                                  styles.resultTitle,
                                  { writingDirection: isRTL ? 'rtl' : 'ltr' },
                                ]}
                                numberOfLines={2}
                              >
                                {item.title}
                              </Text>
                            </View>

                            <View style={styles.ratingLine}>
                              <Ionicons name="star" size={15} color="#F55445" />
                              <Text style={styles.ratingLineText} numberOfLines={1}>
                                {item.ratingLabel ?? item.kind} - {item.subtitle}
                              </Text>
                            </View>

                            <Text style={styles.resultDescription} numberOfLines={1}>
                              {item.description}
                            </Text>

                            <View style={styles.badgeLine}>
                              {item.signal ? (
                                <View style={styles.promotedBadge}>
                                  <Text style={styles.promotedBadgeText}>
                                    {item.signal === 'promoted' ? copy.promoted : copy.popular}
                                  </Text>
                                </View>
                              ) : null}

                              <View style={styles.inlineMeta}>
                                <Ionicons name="calendar-outline" size={15} color="#756B65" />
                                <Text style={styles.inlineMetaText}>{item.timeLabel}</Text>
                              </View>
                            </View>
                          </View>

                          <View style={styles.resultRightMeta}>
                            <Text style={styles.distanceText}>{item.distanceLabel}</Text>
                            <Text style={styles.minutesText}>
                              {item.kind === 'event' ? copy.eventToday : item.timeLabel}
                            </Text>
                          </View>
                        </Pressable>

                        <View style={styles.resultActions}>
                          <Pressable
                            accessibilityRole="button"
                            style={({ pressed }) => [styles.circleAction, pressed && styles.pressed]}
                            onPress={() => void handleToggleSave(item)}
                          >
                            {savingCardId === item.id ? (
                              <ActivityIndicator color={webDesktopColors.primary} />
                            ) : (
                              <Ionicons
                                name={item.saved ? 'bookmark' : 'bookmark-outline'}
                                size={18}
                                color="#5D534D"
                              />
                            )}
                          </Pressable>
                          <Pressable
                            accessibilityRole="button"
                            style={({ pressed }) => [styles.circleAction, pressed && styles.pressed]}
                            onPress={() => showAlert(copy.detailsTitle, item.description)}
                          >
                            <Ionicons name="ellipsis-vertical" size={18} color="#5D534D" />
                          </Pressable>
                        </View>
                      </View>
                      {active && item.rawPost ? (
                        <View style={styles.interactionPanel}>
                          <PostInteractionPanel
                            post={item.rawPost}
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
            </View>
          ) : null}

          <View style={[styles.mapColumn, !isListVisible && styles.mapColumnFull]}>
            <View style={styles.mapTopControls} pointerEvents="box-none">
              <Pressable
                accessibilityRole="button"
                style={({ pressed }) => [
                  styles.mapFloatingControl,
                  autoSearchArea && styles.mapFloatingControlActive,
                  pressed && styles.pressed,
                ]}
                onPress={() => setAutoSearchArea(value => !value)}
              >
                <Ionicons name="locate-outline" size={18} color="#3B332E" />
                <Text style={styles.mapFloatingControlText}>{copy.searchAsMove}</Text>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                style={({ pressed }) => [styles.mapFloatingControl, pressed && styles.pressed]}
                onPress={() => setIsListVisible(value => !value)}
              >
                <Ionicons name="list-outline" size={18} color="#3B332E" />
                <Text style={styles.mapFloatingControlText}>
                  {isListVisible ? copy.hideList : copy.showList}
                </Text>
              </Pressable>
            </View>

            <View style={styles.mapFrame}>
              {isFocused ? (
                <ExploreMapSurface
                  posts={mapPosts}
                  events={mapEvents}
                  selectedResult={selectedResult}
                  browserLocation={browserLocation}
                  onSelectPost={handleSelectPost}
                  onSelectEvent={handleSelectEvent}
                  onViewportChange={handleMapViewportChange}
                  style={styles.liveMap}
                />
              ) : null}

              <View style={styles.mapLegend} pointerEvents="box-none">
                <View style={styles.legendItem}>
                  <Ionicons name="star" size={14} color="#F55445" />
                  <Text style={styles.legendText}>{copy.popular}</Text>
                </View>
                <View style={styles.legendItem}>
                  <Ionicons name="pricetag-outline" size={14} color="#F55445" />
                  <Text style={styles.legendText}>{copy.promoted}</Text>
                </View>
                <View style={styles.legendItem}>
                  <Ionicons name="calendar-outline" size={14} color="#5D534D" />
                  <Text style={styles.legendText}>{copy.eventToday}</Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: webDesktopColors.page,
  },
  pageContent: {
    paddingTop: webDesktopLayout.pagePaddingTop,
    paddingBottom: 48,
  },
  container: {
    width: '100%',
    maxWidth: webDesktopLayout.maxWidth,
    alignSelf: 'center',
    paddingHorizontal: webDesktopLayout.pagePaddingX,
    gap: 18,
  },

  toolbarCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: webDesktopColors.border,
    borderRadius: 18,
    padding: 16,
    gap: 14,
  },
  toolbarTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  searchComposite: {
    flex: 1,
    minHeight: 56,
    borderWidth: 1,
    borderColor: webDesktopColors.border,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  searchField: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: 18,
    justifyContent: 'center',
  },
  searchFieldLabel: {
    fontSize: 13,
    lineHeight: 16,
    fontWeight: '700',
    color: '#3E3530',
    marginBottom: 4,
  },
  searchInput: {
    fontSize: 16,
    lineHeight: 20,
    color: webDesktopColors.text,
    padding: 0,
    minHeight: 24,
  },
  searchVerticalDivider: {
    width: 1,
    alignSelf: 'stretch',
    backgroundColor: webDesktopColors.border,
  },
  locationCrosshair: {
    width: 54,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    borderLeftWidth: 1,
    borderLeftColor: webDesktopColors.border,
  },
  primarySearchButton: {
    width: 96,
    alignSelf: 'stretch',
    backgroundColor: webDesktopColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  utilityPill: {
    minHeight: 48,
    paddingHorizontal: 18,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: webDesktopColors.border,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  utilityPillText: {
    fontSize: 15,
    lineHeight: 18,
    fontWeight: '600',
    color: '#4E453F',
  },

  filtersRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  filterPill: {
    minHeight: 40,
    paddingHorizontal: 16,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: webDesktopColors.border,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  filterPillActive: {
    borderColor: '#F0B1A8',
    backgroundColor: '#FFF8F6',
  },
  filterPillText: {
    fontSize: 14,
    lineHeight: 17,
    fontWeight: '600',
    color: '#5A514B',
  },
  filterPillTextActive: {
    color: webDesktopColors.primary,
  },

  resultsSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  resultsCount: {
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '800',
    color: webDesktopColors.text,
  },
  resultsCountSub: {
    fontSize: 15,
    lineHeight: 19,
    fontWeight: '500',
    color: webDesktopColors.textMuted,
  },
  sortWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sortLabel: {
    fontSize: 14,
    lineHeight: 18,
    color: '#726861',
    fontWeight: '600',
  },
  sortButton: {
    minHeight: 40,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: webDesktopColors.border,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sortButtonText: {
    fontSize: 14,
    lineHeight: 17,
    fontWeight: '700',
    color: '#403732',
  },
  summaryPanel: {
    minHeight: 92,
    borderWidth: 1,
    borderColor: webDesktopColors.border,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 18,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
  },
  summaryPanelCopy: {
    flex: 1,
    minWidth: 0,
    gap: 6,
  },
  summaryPanelTitle: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '800',
    color: webDesktopColors.text,
  },
  summaryPanelBody: {
    fontSize: 14,
    lineHeight: 19,
    color: webDesktopColors.textMuted,
  },
  summaryPanelButton: {
    minHeight: 44,
    borderRadius: 14,
    backgroundColor: webDesktopColors.primary,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  summaryPanelButtonDisabled: {
    opacity: 0.7,
  },
  summaryPanelButtonText: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  mainSplit: {
    flexDirection: 'row',
    gap: 0,
    minHeight: 780,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: webDesktopColors.border,
    backgroundColor: '#FFFFFF',
  },
  resultsColumn: {
    width: '56%',
    backgroundColor: '#FFFFFF',
  },
  mapColumn: {
    width: '44%',
    borderLeftWidth: 1,
    borderLeftColor: webDesktopColors.border,
    backgroundColor: '#F7F4F0',
    position: 'relative',
  },
  mapColumnFull: {
    width: '100%',
    borderLeftWidth: 0,
  },

  emptyResultsWrap: {
    padding: 24,
  },
  resultRowShell: {
    borderBottomWidth: 1,
    borderBottomColor: '#EEE8E2',
  },
  resultRow: {
    minHeight: 110,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 14,
  },
  resultMainButton: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    gap: 14,
  },
  resultRowActive: {
    backgroundColor: '#FFF9F7',
    borderLeftWidth: 3,
    borderLeftColor: webDesktopColors.primary,
  },
  resultImage: {
    width: 164,
    height: 98,
    borderRadius: 12,
    backgroundColor: '#E9E2DA',
  },
  resultContent: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
  },
  resultTopLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  resultTitle: {
    fontSize: 17,
    lineHeight: 21,
    fontWeight: '800',
    color: webDesktopColors.text,
    flexShrink: 1,
  },
  ratingLine: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ratingLineText: {
    fontSize: 14,
    lineHeight: 18,
    color: '#5F5650',
    fontWeight: '600',
    flexShrink: 1,
  },
  resultDescription: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 18,
    color: webDesktopColors.textMuted,
  },
  badgeLine: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flexWrap: 'wrap',
  },
  promotedBadge: {
    paddingHorizontal: 10,
    height: 24,
    borderRadius: 999,
    backgroundColor: '#FFF0EC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  promotedBadgeText: {
    fontSize: 12,
    lineHeight: 15,
    fontWeight: '700',
    color: webDesktopColors.primary,
  },
  inlineMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  inlineMetaText: {
    fontSize: 13,
    lineHeight: 16,
    color: '#756B65',
    fontWeight: '500',
  },

  resultRightMeta: {
    width: 116,
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  distanceText: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '700',
    color: '#5B514B',
    textAlign: 'right',
  },
  minutesText: {
    fontSize: 13,
    lineHeight: 16,
    color: '#8B8079',
    marginTop: 4,
    textAlign: 'right',
  },
  resultActions: {
    width: 38,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  circleAction: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: webDesktopColors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  interactionPanel: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: '#FFF9F7',
  },

  mapTopControls: {
    position: 'absolute',
    top: 18,
    left: 18,
    right: 72,
    zIndex: 3,
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  mapFloatingControl: {
    minHeight: 44,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: webDesktopColors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#20150E',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 3 },
  },
  mapFloatingControlActive: {
    borderColor: '#F0B1A8',
    backgroundColor: '#FFF8F6',
  },
  mapFloatingControlText: {
    fontSize: 14,
    lineHeight: 17,
    fontWeight: '600',
    color: '#443B36',
  },

  mapFrame: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#EDE8E2',
  },
  liveMap: {
    flex: 1,
    borderRadius: 0,
  },

  mapLegend: {
    position: 'absolute',
    left: 18,
    bottom: 18,
    minHeight: 46,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: webDesktopColors.border,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendText: {
    fontSize: 13,
    lineHeight: 16,
    color: '#5C524B',
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.82,
  },
});
