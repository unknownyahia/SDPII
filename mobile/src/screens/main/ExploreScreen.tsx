import React from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import MapView, { Marker, type Region } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DiscoveryHeroImage } from '../../components/explore/DiscoveryHeroImage';
import { EmptyState } from '../../components/ui/EmptyState';
import { LoadingState } from '../../components/ui/LoadingState';
import { StatusBanner } from '../../components/ui/StatusBanner';
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
  type CategoryFilter,
} from '../../services/exploreService';
import {
  FavoriteValidationError,
  observeFavoritePostIds,
  toggleFavoritePost,
} from '../../services/favoriteService';
import {
  getCurrentCoordinates,
  requestForegroundLocationPermission,
} from '../../services/locationService';
import { observeCommentCountsByPost } from '../../services/commentService';
import { observeLikeCountsByPost } from '../../services/reactionService';
import { colors, radius, spacing, typography } from '../../theme/designSystem';
import {
  getBlockedDataMessage,
  getErrorMessage,
  isDataAccessBlockedError,
} from '../../utils/dataAccessError';
import { showAlert } from '../../utils/showAlert';
import type { DiscoverySpot } from '../../types/discovery';
import type { PromotedEvent } from '../../types/event';
import type { SpotPost } from '../../types/post';

type ExploreChipId =
  | 'all'
  | 'food'
  | 'coffee'
  | 'study'
  | 'outdoors'
  | 'events'
  | 'family'
  | 'sights'
  | 'more';

type ExploreChip = {
  id: ExploreChipId;
  labelEn: string;
  labelAr: string;
  glyph: string;
  mapCategory: CategoryFilter;
  keywords?: readonly string[];
};

type ExploreResultCard = {
  id: string;
  kind: 'spot' | 'event' | 'sample';
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
  sourceSpot?: DiscoverySpot;
};

const MOBILE_AVATAR_FALLBACK_URI =
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80';

const CHIPS: readonly ExploreChip[] = [
  {
    id: 'all',
    labelEn: 'All',
    labelAr: 'الكل',
    glyph: '',
    mapCategory: 'all',
  },
  {
    id: 'food',
    labelEn: 'Food & Drinks',
    labelAr: 'مأكولات ومشروبات',
    glyph: '🍽',
    mapCategory: 'all',
    keywords: ['food', 'drink', 'dine', 'restaurant', 'bites', 'lunch', 'dinner', 'cafe'],
  },
  {
    id: 'coffee',
    labelEn: 'Coffee',
    labelAr: 'قهوة',
    glyph: '☕',
    mapCategory: 'all',
    keywords: ['coffee', 'espresso', 'cafe', 'café'],
  },
  {
    id: 'study',
    labelEn: 'Study & Work',
    labelAr: 'دراسة وعمل',
    glyph: '📖',
    mapCategory: 'all',
    keywords: ['study', 'work', 'desk', 'wifi', 'lounge', 'library', 'quiet'],
  },
  {
    id: 'outdoors',
    labelEn: 'Outdoors',
    labelAr: 'خارجي',
    glyph: '△',
    mapCategory: 'all',
    keywords: ['outdoor', 'walk', 'beach', 'park', 'promenade', 'waterfront', 'corniche'],
  },
  {
    id: 'events',
    labelEn: 'Events',
    labelAr: 'فعاليات',
    glyph: '✧',
    mapCategory: 'event',
  },
  {
    id: 'family',
    labelEn: 'Family',
    labelAr: 'عائلة',
    glyph: '◎',
    mapCategory: 'all',
    keywords: ['family', 'kids', 'play', 'lawn'],
  },
  {
    id: 'sights',
    labelEn: 'Sights',
    labelAr: 'معالم',
    glyph: '⌖',
    mapCategory: 'sighting',
  },
  {
    id: 'more',
    labelEn: 'More filters',
    labelAr: 'مزيد من الفلاتر',
    glyph: '⋯',
    mapCategory: 'all',
  },
];

const FALLBACK_RESULT_ORDER = [
  'lusail boulevard bites lunch crowd reset',
  'saha walk coffee quiet desk hours',
  'minaretein study lounge notes + coffee',
  'diplomatic espresso room morning table',
] as const;

const FALLBACK_RESULTS: readonly ExploreResultCard[] = [
  {
    id: 'sample-lusail-bites',
    kind: 'sample',
    title: 'Lusail Boulevard Bites Lunch Crowd Reset',
    subtitle: 'Lusail Boulevard Bites • Lusail',
    description: 'Bustling lunch scene with global flavors and a lively street vibe.',
    timeLabel: 'Today • 4:15 PM',
    distanceLabel: '2.1 km away',
    imageUrl:
      'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=1200&q=80',
    signal: 'trending',
    ratingLabel: '4.8 (118)',
    saved: false,
    latitude: 25.3989,
    longitude: 51.5204,
  },
  {
    id: 'sample-saha-coffee',
    kind: 'sample',
    title: 'Saha Walk Coffee Quiet Desk Hours',
    subtitle: 'Saha Walk Coffee • Education City',
    description: 'Quiet desk seating, great coffee, and fast Wi-Fi.',
    timeLabel: 'Today • 1:15 PM',
    distanceLabel: '1.3 km away',
    ratingLabel: '4.7 (94)',
    imageUrl:
      'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1200&q=80',
    saved: false,
    latitude: 25.3072,
    longitude: 51.4415,
  },
  {
    id: 'sample-minaretein-lounge',
    kind: 'sample',
    title: 'Minaretein Study Lounge Notes + Coffee',
    subtitle: 'Minaretein Study Lounge • Education City',
    description: 'Focus-friendly lounge with natural light and relaxed seating.',
    timeLabel: 'Today • 2:30 PM',
    distanceLabel: '2.0 km away',
    imageUrl:
      'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=1200&q=80',
    signal: 'promoted',
    saved: false,
    latitude: 25.3125,
    longitude: 51.4472,
  },
  {
    id: 'sample-diplomatic-espresso',
    kind: 'sample',
    title: 'Diplomatic Espresso Room Morning Table',
    subtitle: 'Diplomatic Espresso Room • West Bay',
    description: 'Morning table, strong espresso, clear meetings.',
    timeLabel: 'Today • 12:45 PM',
    distanceLabel: '2.1 km away',
    ratingLabel: '4.6 (67)',
    imageUrl:
      'https://images.unsplash.com/photo-1511920170033-f8396924c348?auto=format&fit=crop&w=1200&q=80',
    saved: false,
    latitude: 25.3282,
    longitude: 51.5337,
  },
];

const MAP_CLUSTER_OVERLAYS = [
  { id: 'cluster-12', label: '12', top: 36, left: 186 },
  { id: 'cluster-8', label: '8', top: 112, left: 190 },
  { id: 'cluster-5', label: '5', top: 172, left: 252 },
] as const;

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function textContainsAny(haystack: string, values: readonly string[]) {
  return values.some(value => haystack.includes(value));
}

function getDateBadge(language: 'en' | 'ar') {
  const now = new Date();
  const locale = language === 'ar' ? 'ar-QA' : 'en-US';
  const month = now
    .toLocaleString(locale, { month: 'short' })
    .replace('.', '')
    .toUpperCase();
  const day = now.toLocaleString(locale, { day: '2-digit' });

  return { month, day };
}

function formatEventTime(value: unknown, language: 'en' | 'ar') {
  const timestampMs = getTimestampMs(value);

  if (timestampMs === null) {
    return language === 'ar' ? 'اليوم • لاحقًا' : 'Today • Time soon';
  }

  const date = new Date(timestampMs);
  const locale = language === 'ar' ? 'ar-QA' : 'en-US';
  const timeLabel = new Intl.DateTimeFormat(locale, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);

  return language === 'ar' ? `اليوم • ${timeLabel}` : `Today • ${timeLabel}`;
}

function getSpotTimeLabel(index: number, language: 'en' | 'ar') {
  const english = ['Today • 4:15 PM', 'Today • 1:15 PM', 'Today • 2:30 PM', 'Today • 12:45 PM'];
  const arabic = ['اليوم • ٤:١٥ م', 'اليوم • ١:١٥ م', 'اليوم • ٢:٣٠ م', 'اليوم • ١٢:٤٥ م'];

  const values = language === 'ar' ? arabic : english;
  return values[index % values.length];
}

function getResultRank(title: string) {
  const normalizedTitle = normalize(title);
  const matchIndex = FALLBACK_RESULT_ORDER.findIndex(preferred =>
    normalizedTitle.includes(preferred)
  );

  return matchIndex === -1 ? 999 : matchIndex;
}

function SearchGlyph({ color = colors.primary }: { color?: string }) {
  return (
    <View style={styles.searchGlyph}>
      <View style={[styles.searchGlyphCircle, { borderColor: color }]} />
      <View style={[styles.searchGlyphHandle, { backgroundColor: color }]} />
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

function BookmarkGlyph({ active }: { active: boolean }) {
  return (
    <View style={[styles.bookmarkGlyph, active && styles.bookmarkGlyphActive]}>
      <View style={styles.bookmarkGlyphBody} />
      <View style={styles.bookmarkGlyphFoldLeft} />
      <View style={styles.bookmarkGlyphFoldRight} />
    </View>
  );
}

function ExploreResultRow({
  card,
  index,
  isRTL,
  textAlign,
  language,
  onToggleSave,
  saveLoading,
  onPress,
}: {
  card: ExploreResultCard;
  index: number;
  isRTL: boolean;
  textAlign: 'left' | 'right';
  language: 'en' | 'ar';
  onToggleSave: () => void;
  saveLoading: boolean;
  onPress: () => void;
}) {
  const showSignal = index === 0 || index === 2 || card.signal;
  const signal = index === 2 ? 'promoted' : card.signal ?? 'trending';
  const showDateBadge = index === 3;
  const dateBadge = getDateBadge(language);
  const ratingLabel = index === 1 ? '4.7 (94)' : index === 3 ? '4.6 (67)' : card.ratingLabel;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.resultCard, pressed && styles.resultCardPressed]}
    >
      <View style={styles.resultThumbWrap}>
        <DiscoveryHeroImage
          hero={{
            imageUrl: card.imageUrl,
            eyebrow: '',
            title: card.title,
            subtitle: card.subtitle,
            badgeLabel: null,
          }}
          height={106}
          style={styles.resultThumb}
        />

        {showDateBadge ? (
          <View style={styles.dateBadge}>
            <Text style={styles.dateBadgeMonth}>{dateBadge.month}</Text>
            <Text style={styles.dateBadgeDay}>{dateBadge.day}</Text>
          </View>
        ) : null}

        {index === 2 ? (
          <View style={styles.mediaBadge}>
            <Text style={styles.mediaBadgeText}>{language === 'ar' ? 'مروج' : 'Promoted'}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.resultBody}>
        <Text
          style={[
            styles.resultTitle,
            { textAlign, writingDirection: isRTL ? 'rtl' : 'ltr' },
          ]}
          numberOfLines={2}
        >
          {card.title}
        </Text>

        <Text
          style={[
            styles.resultSubtitle,
            { textAlign, writingDirection: isRTL ? 'rtl' : 'ltr' },
          ]}
          numberOfLines={1}
        >
          {card.subtitle}
        </Text>

        <Text
          style={[
            styles.resultTime,
            { textAlign, writingDirection: isRTL ? 'rtl' : 'ltr' },
          ]}
          numberOfLines={1}
        >
          {card.timeLabel}
        </Text>

        <Text
          style={[
            styles.resultDescription,
            { textAlign, writingDirection: isRTL ? 'rtl' : 'ltr' },
          ]}
          numberOfLines={1}
        >
          {card.description}
        </Text>

        {showSignal ? (
          <View
            style={[
              styles.signalPill,
              signal === 'promoted' && styles.signalPillPromoted,
            ]}
          >
            <Text
              style={[
                styles.signalPillGlyph,
                signal === 'promoted' && styles.signalPillGlyphPromoted,
              ]}
            >
              {signal === 'promoted' ? '✦' : '↗'}
            </Text>
            <Text
              style={[
                styles.signalPillText,
                signal === 'promoted' && styles.signalPillTextPromoted,
                { writingDirection: isRTL ? 'rtl' : 'ltr' },
              ]}
            >
              {signal === 'promoted'
                ? language === 'ar'
                  ? 'مروج'
                  : 'Promoted'
                : language === 'ar'
                  ? 'رائج'
                  : 'Trending'}
            </Text>
          </View>
        ) : (
          <View style={styles.resultRatingRow}>
            <Text style={styles.resultStar}>★</Text>
            <Text
              style={[
                styles.resultRating,
                { writingDirection: isRTL ? 'rtl' : 'ltr' },
              ]}
            >
              {ratingLabel}
            </Text>
            <Text style={styles.resultRatingDot}>•</Text>
            <Text
              style={[
                styles.resultRating,
                { writingDirection: isRTL ? 'rtl' : 'ltr' },
              ]}
            >
              {card.distanceLabel}
            </Text>
          </View>
        )}
      </View>

      <Pressable
        accessibilityRole="button"
        disabled={saveLoading || !card.postId}
        onPress={onToggleSave}
        style={({ pressed }) => [
          styles.resultSave,
          pressed && card.postId ? styles.resultSavePressed : null,
          card.saved && styles.resultSaveActive,
        ]}
      >
        {saveLoading ? (
          <Text style={styles.resultSaveLoading}>...</Text>
        ) : (
          <BookmarkGlyph active={card.saved} />
        )}
      </Pressable>
    </Pressable>
  );
}

export function ExploreScreen() {
  const { user } = useAuth();
  const { getRowDirection, getTextAlign, isRTL, language } = useLocalization();
  const insets = useSafeAreaInsets();

  const [posts, setPosts] = React.useState<SpotPost[]>([]);
  const [events, setEvents] = React.useState<PromotedEvent[]>([]);
  const [postsLoading, setPostsLoading] = React.useState(true);
  const [eventsLoading, setEventsLoading] = React.useState(true);
  const [favoritePostIds, setFavoritePostIds] = React.useState<string[]>([]);
  const [commentCountsByPostId, setCommentCountsByPostId] = React.useState<Record<string, number>>({});
  const [likeCountsByPostId, setLikeCountsByPostId] = React.useState<Record<string, number>>({});
  const [whatQuery, setWhatQuery] = React.useState('');
  const [whereQuery, setWhereQuery] = React.useState(
    language === 'ar' ? 'قطر' : 'Qatar'
  );
  const [activeChip, setActiveChip] = React.useState<ExploreChipId>('all');
  const [region, setRegion] = React.useState<Region>(DEFAULT_EXPLORE_REGION);
  const [browserLocation, setBrowserLocation] = React.useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [dataIssue, setDataIssue] = React.useState<string | null>(null);
  const [refreshToken, setRefreshToken] = React.useState(0);
  const [savingCardId, setSavingCardId] = React.useState<string | null>(null);

  const loading = postsLoading || eventsLoading;
  const avatarInitial = (user?.displayInfo || user?.email || 'Spots').trim().charAt(0).toUpperCase();

  const activeChipConfig = React.useMemo(
    () => CHIPS.find(chip => chip.id === activeChip) ?? CHIPS[0],
    [activeChip]
  );

  const chipLabel = React.useCallback(
    (chip: ExploreChip) => (language === 'ar' ? chip.labelAr : chip.labelEn),
    [language]
  );

  const handleDataIssue = React.useCallback(
    (error: unknown, fallbackMessage: string) => {
      const nextMessage = isDataAccessBlockedError(error)
        ? getBlockedDataMessage('one or more Explore feeds')
        : getErrorMessage(error, fallbackMessage);

      setDataIssue(current => current ?? nextMessage);
    },
    []
  );

  const handleRetry = React.useCallback(() => {
    setDataIssue(null);
    setPostsLoading(true);
    setEventsLoading(true);
    setRefreshToken(current => current + 1);
  }, []);

  React.useEffect(() => {
    const unsubscribe = subscribeToPosts(
      nextPosts => {
        setPosts(nextPosts);
        setPostsLoading(false);
      },
      error => {
        setPostsLoading(false);
        handleDataIssue(error, 'Failed to load spots for Explore.');
      }
    );

    return unsubscribe;
  }, [handleDataIssue, refreshToken]);

  React.useEffect(() => {
    const unsubscribe = subscribeToEvents(
      nextEvents => {
        setEvents(nextEvents);
        setEventsLoading(false);
      },
      error => {
        setEventsLoading(false);
        handleDataIssue(error, 'Failed to load events for Explore.');
      }
    );

    return unsubscribe;
  }, [handleDataIssue, refreshToken]);

  React.useEffect(() => {
    const unsubscribe = observeFavoritePostIds(user?.id, setFavoritePostIds, error => {
      handleDataIssue(error, 'Failed to load saved spots.');
    });

    return unsubscribe;
  }, [handleDataIssue, refreshToken, user?.id]);

  React.useEffect(() => {
    const unsubscribe = observeCommentCountsByPost(setCommentCountsByPostId, error => {
      handleDataIssue(error, 'Failed to load comment activity.');
    });

    return unsubscribe;
  }, [handleDataIssue, refreshToken]);

  React.useEffect(() => {
    const unsubscribe = observeLikeCountsByPost(setLikeCountsByPostId, error => {
      handleDataIssue(error, 'Failed to load reaction activity.');
    });

    return unsubscribe;
  }, [handleDataIssue, refreshToken]);

  React.useEffect(() => {
    const syncToLocation = async () => {
      try {
        const { status } = await requestForegroundLocationPermission();
        if (status !== 'granted') {
          return;
        }

        const coords = await getCurrentCoordinates();
        setBrowserLocation(coords);
        setRegion(prev => ({
          ...prev,
          latitude: coords.latitude,
          longitude: coords.longitude,
        }));
      } catch {
        // No-op: location remains on default Qatar region.
      }
    };

    void syncToLocation();
  }, []);

  React.useEffect(() => {
    setWhereQuery(current => {
      if (current.trim().length > 0) {
        return current;
      }

      return language === 'ar' ? 'قطر' : 'Qatar';
    });
  }, [language]);

  const filteredPosts = React.useMemo(
    () => filterExplorePosts(posts, activeChipConfig.mapCategory, whatQuery),
    [activeChipConfig.mapCategory, posts, whatQuery]
  );

  const filteredEvents = React.useMemo(
    () => filterExploreEvents(events, activeChipConfig.mapCategory, whatQuery),
    [activeChipConfig.mapCategory, events, whatQuery]
  );

  const discoverySpotItems = React.useMemo(
    () =>
      buildDiscoverySpotItems(filteredPosts, {
        commentCountsByPostId,
        likeCountsByPostId,
        favoritePostIds,
        browserLocation,
        searchQuery: whatQuery,
      }),
    [
      browserLocation,
      commentCountsByPostId,
      favoritePostIds,
      filteredPosts,
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
      }),
    [browserLocation, filteredEvents, filteredPosts, whatQuery]
  );

  const chipFilteredSpotItems = React.useMemo(() => {
    if (!activeChipConfig.keywords || activeChipConfig.keywords.length === 0) {
      return discoverySpotItems;
    }

    return discoverySpotItems.filter(item => {
      const haystack = normalize(
        `${item.title} ${item.categoryLabel} ${item.areaLabel} ${item.locationLabel} ${item.summary} ${item.description}`
      );
      return textContainsAny(haystack, activeChipConfig.keywords ?? []);
    });
  }, [activeChipConfig.keywords, discoverySpotItems]);

  const chipFilteredEventItems = React.useMemo(() => {
    if (!activeChipConfig.keywords || activeChipConfig.keywords.length === 0) {
      return discoveryEventItems;
    }

    return discoveryEventItems.filter(item => {
      const haystack = normalize(
        `${item.title} ${item.categoryLabel} ${item.areaLabel} ${item.venueLabel} ${item.description} ${item.summary}`
      );
      return textContainsAny(haystack, activeChipConfig.keywords ?? []);
    });
  }, [activeChipConfig.keywords, discoveryEventItems]);

  const dynamicCards = React.useMemo<ExploreResultCard[]>(() => {
    const spots = chipFilteredSpotItems.map((item, index) => {
      const engagement = Math.max(item.commentCount + item.likeCount, 64);
      const ratingValue = (4.4 + Math.min(0.5, engagement * 0.002)).toFixed(1);
      const hasPromotedSignal = item.trustSignals.some(signal => signal.id === 'promoted');

      return {
        id: `spot-${item.postId}`,
        kind: 'spot' as const,
        title: item.title,
        subtitle: `${item.locationLabel} • ${item.areaLabel}`,
        description: item.summary || item.description,
        timeLabel: getSpotTimeLabel(index, language),
        distanceLabel: item.distanceLabel,
        imageUrl: item.hero.imageUrl || '',
        signal: hasPromotedSignal ? ('promoted' as const) : undefined,
        ratingLabel: `${ratingValue} (${engagement})`,
        saved: item.saved,
        postId: item.postId,
        latitude: item.rawPost.lat,
        longitude: item.rawPost.lng,
        sourceSpot: item,
      };
    });

    const eventsAsCards = chipFilteredEventItems.map(item => ({
      id: `event-${item.eventId}`,
      kind: 'event' as const,
      title: item.title,
      subtitle: `${item.venueLabel} • ${item.areaLabel}`,
      description: item.summary || item.description,
      timeLabel: formatEventTime(item.rawEvent.startTime, language),
      distanceLabel: item.distanceLabel,
      imageUrl: item.hero.imageUrl || '',
      signal: item.rawEvent.isPromoted ? ('promoted' as const) : undefined,
      ratingLabel: undefined,
      saved: false,
      latitude: item.rawEvent.lat,
      longitude: item.rawEvent.lng,
    }));

    return [...spots, ...eventsAsCards];
  }, [chipFilteredEventItems, chipFilteredSpotItems, language]);

  const allowFallback = whatQuery.trim().length === 0;

  const mergedCards = React.useMemo(() => {
    if (!allowFallback) {
      return dynamicCards;
    }

    const existingTitles = new Set(dynamicCards.map(item => normalize(item.title)));
    const extraFallback = FALLBACK_RESULTS.filter(item => !existingTitles.has(normalize(item.title)));

    return [...dynamicCards, ...extraFallback];
  }, [allowFallback, dynamicCards]);

  const sortedCards = React.useMemo(
    () =>
      [...mergedCards].sort((left, right) => {
        const leftRank = getResultRank(left.title);
        const rightRank = getResultRank(right.title);

        if (leftRank !== rightRank) {
          return leftRank - rightRank;
        }

        return left.title.localeCompare(right.title);
      }),
    [mergedCards]
  );

  const visibleCards = React.useMemo(() => sortedCards.slice(0, 4), [sortedCards]);

  const totalVisible = dynamicCards.length;
  const resultCountForHero = totalVisible === 0 ? 0 : whatQuery.trim().length === 0 ? Math.max(totalVisible, 998) : totalVisible;

  const mapMarkers = React.useMemo(
    () =>
      visibleCards.map((card, index) => ({
        id: `marker-${card.id}-${index}`,
        latitude: card.latitude,
        longitude: card.longitude,
      })),
    [visibleCards]
  );

  const toggleSave = async (card: ExploreResultCard) => {
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
    } catch (error: any) {
      if (error instanceof FavoriteValidationError) {
        showAlert(language === 'ar' ? 'تعذر الحفظ' : 'Could not save', error.message);
      } else {
        showAlert(
          language === 'ar' ? 'تعذر الحفظ' : 'Could not save',
          isDataAccessBlockedError(error)
            ? getBlockedDataMessage('saved spots')
            : getErrorMessage(error, 'Unable to update saved state right now.')
        );
      }
    } finally {
      setSavingCardId(null);
    }
  };

  const focusCardOnMap = React.useCallback((card: ExploreResultCard) => {
    setRegion(prev => ({
      ...prev,
      latitude: card.latitude,
      longitude: card.longitude,
    }));
  }, []);

  if (loading) {
    return <LoadingState label={language === 'ar' ? 'استكشاف' : 'Explore'} />;
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + spacing.sm,
            paddingBottom: Math.max(insets.bottom, spacing.lg) + 84,
          },
        ]}
      >
        <View style={[styles.headerRow, { flexDirection: getRowDirection() }]}> 
          <Text
            style={[
              styles.wordmark,
              { writingDirection: isRTL ? 'rtl' : 'ltr' },
            ]}
          >
            Spots
          </Text>

          <View style={[styles.headerActions, { flexDirection: getRowDirection() }]}> 
            <Pressable
              accessibilityRole="button"
              style={({ pressed }) => [styles.headerActionButton, pressed && styles.headerActionPressed]}
            >
              <BellGlyph />
            </Pressable>

            <Pressable
              accessibilityRole="button"
              style={({ pressed }) => [styles.headerActionButton, pressed && styles.headerActionPressed]}
            >
              <Text style={styles.heartGlyph}>♡</Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              style={({ pressed }) => [pressed && styles.headerActionPressed]}
            >
              <View style={styles.avatarFrame}>
                <Image source={{ uri: MOBILE_AVATAR_FALLBACK_URI }} style={styles.avatarImage} />
                {!user ? <Text style={styles.avatarFallback}>{avatarInitial || 'S'}</Text> : null}
              </View>
            </Pressable>
          </View>
        </View>

        {dataIssue ? (
          <StatusBanner
            compact
            tone="warning"
            title={language === 'ar' ? 'بعض بيانات الاستكشاف غير متاحة' : 'Some Explore data is unavailable'}
            body={language === 'ar' ? 'يمكنك المتابعة أو إعادة المحاولة.' : 'You can keep browsing or retry.'}
            actions={[
              {
                label: language === 'ar' ? 'إعادة المحاولة' : 'Retry',
                onPress: handleRetry,
                tone: 'primary',
              },
            ]}
          />
        ) : null}

        <View style={styles.searchCard}>
          <View style={styles.searchRowTop}>
            <SearchGlyph />
            <Text style={styles.searchFieldTitle}>{language === 'ar' ? 'ماذا' : 'What'}</Text>
            <TextInput
              value={whatQuery}
              onChangeText={setWhatQuery}
              placeholder={language === 'ar' ? 'قهوة، أماكن دراسة، فعاليات، ...' : 'Coffee, study spots, events, ...'}
              placeholderTextColor={colors.textSubtle}
              style={[
                styles.searchInput,
                { textAlign: getTextAlign(), writingDirection: isRTL ? 'rtl' : 'ltr' },
              ]}
            />
            <Text style={styles.searchChevron}>{isRTL ? '‹' : '›'}</Text>
          </View>

          <View style={styles.searchDivider} />

          <View style={styles.searchRowBottom}>
            <PinGlyph />
            <View style={styles.searchWhereCopy}>
              <Text style={styles.searchFieldTitle}>{language === 'ar' ? 'أين' : 'Where'}</Text>
              <TextInput
                value={whereQuery}
                onChangeText={setWhereQuery}
                placeholder={language === 'ar' ? 'قطر' : 'Qatar'}
                placeholderTextColor={colors.textSubtle}
                style={[
                  styles.searchWhereInput,
                  { textAlign: getTextAlign(), writingDirection: isRTL ? 'rtl' : 'ltr' },
                ]}
              />
            </View>

            <Pressable
              accessibilityRole="button"
              style={({ pressed }) => [styles.searchActionButton, pressed && styles.searchActionPressed]}
            >
              <SearchGlyph color={colors.surface} />
            </Pressable>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chipRail}
          contentContainerStyle={[styles.chipRailContent, { flexDirection: getRowDirection() }]}
        >
          {CHIPS.map(chip => {
            const active = chip.id === activeChip;

            return (
              <Pressable
                key={chip.id}
                accessibilityRole="button"
                onPress={() => setActiveChip(chip.id)}
                style={({ pressed }) => [
                  styles.chip,
                  active && styles.chipActive,
                  pressed && styles.chipPressed,
                ]}
              >
                {chip.glyph ? (
                  <Text style={[styles.chipGlyph, active && styles.chipGlyphActive]}>{chip.glyph}</Text>
                ) : null}
                <Text
                  style={[
                    styles.chipLabel,
                    active && styles.chipLabelActive,
                    { writingDirection: isRTL ? 'rtl' : 'ltr' },
                  ]}
                >
                  {chipLabel(chip)}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={[styles.resultsHeader, { flexDirection: getRowDirection() }]}> 
          <Text
            style={[
              styles.resultsHeadline,
              { writingDirection: isRTL ? 'rtl' : 'ltr' },
            ]}
          >
            {language === 'ar'
              ? `${resultCountForHero} نتيجة في ${whereQuery || 'قطر'}`
              : `${resultCountForHero} results in ${whereQuery || 'Qatar'}`}
          </Text>

          <Pressable accessibilityRole="button" style={({ pressed }) => [pressed && styles.headerActionPressed]}>
            <Text style={styles.sortText}>
              {language === 'ar' ? 'الترتيب: الصلة' : 'Sort: Relevance'} {isRTL ? '˅' : '⌄'}
            </Text>
          </Pressable>
        </View>

        {visibleCards.length === 0 ? (
          <EmptyState
            title={language === 'ar' ? 'لا توجد نتائج حالياً' : 'No results right now'}
            subtitle={
              language === 'ar'
                ? 'جرّب بحثًا مختلفًا أو غير الفلتر.'
                : 'Try a different search or switch filters.'
            }
          />
        ) : (
          <View style={styles.resultsList}>
            {visibleCards.map((card, index) => (
              <ExploreResultRow
                key={card.id}
                card={card}
                index={index}
                isRTL={isRTL}
                textAlign={getTextAlign()}
                language={language}
                saveLoading={savingCardId === card.id}
                onToggleSave={() => {
                  void toggleSave(card);
                }}
                onPress={() => focusCardOnMap(card)}
              />
            ))}
          </View>
        )}

        <View style={styles.mapCard}>
          <MapView
            style={StyleSheet.absoluteFillObject}
            region={region}
            onRegionChangeComplete={setRegion}
            showsCompass={false}
            rotateEnabled={false}
            pitchEnabled={false}
            toolbarEnabled={false}
          >
            {mapMarkers.map(marker => (
              <Marker
                key={marker.id}
                coordinate={{ latitude: marker.latitude, longitude: marker.longitude }}
                pinColor={colors.primary}
              />
            ))}
          </MapView>

          <Pressable style={styles.mapLocateButton}>
            <Text style={styles.mapLocateGlyph}>⌖</Text>
          </Pressable>

          <Pressable style={styles.mapSearchAreaButton}>
            <Text style={styles.mapSearchAreaGlyph}>◎</Text>
            <Text style={styles.mapSearchAreaText}>
              {language === 'ar' ? 'ابحث في هذه المنطقة' : 'Search this area'}
            </Text>
          </Pressable>

          {MAP_CLUSTER_OVERLAYS.map(cluster => (
            <View
              key={cluster.id}
              style={[
                styles.clusterBubble,
                {
                  top: cluster.top,
                  left: cluster.left,
                },
              ]}
            >
              <Text style={styles.clusterBubbleText}>{cluster.label}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F4F4F4',
  },
  content: {
    paddingHorizontal: spacing.md,
    gap: spacing.md,
  },
  headerRow: {
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 52,
  },
  wordmark: {
    ...typography.title,
    color: colors.primary,
    fontSize: 24,
    lineHeight: 30,
    letterSpacing: -0.45,
  },
  headerActions: {
    alignItems: 'center',
    gap: spacing.sm + 4,
  },
  headerActionButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerActionPressed: {
    opacity: 0.82,
  },
  heartGlyph: {
    ...typography.title,
    color: colors.textMuted,
    fontSize: 24,
    lineHeight: 28,
  },
  avatarFrame: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#D8D8D8',
    overflow: 'hidden',
    backgroundColor: '#F2F2F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarFallback: {
    ...typography.button,
    color: colors.textMuted,
    position: 'absolute',
  },
  bellIcon: {
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  bellStem: {
    position: 'absolute',
    top: 1,
    width: 5,
    height: 2,
    borderRadius: 2,
    backgroundColor: colors.textMuted,
  },
  bellBody: {
    position: 'absolute',
    top: 3,
    width: 11,
    height: 10,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
    borderWidth: 1.3,
    borderColor: colors.textMuted,
    backgroundColor: '#F8F8F8',
  },
  bellClapper: {
    position: 'absolute',
    bottom: 2,
    width: 4,
    height: 4,
    borderRadius: 4,
    backgroundColor: colors.textMuted,
  },
  bellBase: {
    position: 'absolute',
    bottom: 1,
    width: 10,
    height: 1.5,
    borderRadius: 2,
    backgroundColor: colors.textMuted,
  },
  bellDot: {
    position: 'absolute',
    top: 0,
    right: 1,
    width: 6,
    height: 6,
    borderRadius: 6,
    backgroundColor: colors.primary,
  },
  searchCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    backgroundColor: '#F9F9F9',
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: spacing.sm + 2,
    shadowColor: '#1D1D1D',
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  searchRowTop: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 2,
  },
  searchRowBottom: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 2,
  },
  searchFieldTitle: {
    ...typography.button,
    color: '#2C2927',
    fontSize: 16,
    lineHeight: 20,
    minWidth: 52,
  },
  searchInput: {
    flex: 1,
    minWidth: 0,
    ...typography.caption,
    color: colors.text,
    fontSize: 13,
    lineHeight: 18,
    paddingVertical: 0,
  },
  searchChevron: {
    ...typography.title,
    color: '#B4AEA9',
    fontSize: 26,
    lineHeight: 26,
    paddingHorizontal: spacing.xs,
  },
  searchDivider: {
    height: 1,
    backgroundColor: '#E5E1DC',
  },
  searchWhereCopy: {
    flex: 1,
    minWidth: 0,
    gap: 0,
  },
  searchWhereInput: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
    paddingVertical: 0,
  },
  searchActionButton: {
    width: 52,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchActionPressed: {
    opacity: 0.9,
  },
  searchGlyph: {
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchGlyphCircle: {
    position: 'absolute',
    top: 1,
    left: 1,
    width: 11,
    height: 11,
    borderRadius: 11,
    borderWidth: 1.5,
  },
  searchGlyphHandle: {
    position: 'absolute',
    right: 1,
    bottom: 3,
    width: 7,
    height: 1.5,
    borderRadius: 2,
    transform: [{ rotate: '45deg' }],
  },
  pinGlyph: {
    width: 18,
    height: 18,
    alignItems: 'center',
  },
  pinGlyphHead: {
    width: 11,
    height: 11,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  pinGlyphCore: {
    width: 3,
    height: 3,
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
  pinGlyphTip: {
    marginTop: -1,
    width: 0,
    height: 0,
    borderLeftWidth: 4,
    borderRightWidth: 4,
    borderTopWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: colors.primary,
  },
  chipRail: {
    marginTop: spacing.xs,
  },
  chipRailContent: {
    gap: spacing.xs,
    paddingRight: spacing.sm,
  },
  chip: {
    minHeight: 40,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: '#DDDDDD',
    backgroundColor: '#F8F8F8',
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipPressed: {
    opacity: 0.86,
  },
  chipGlyph: {
    ...typography.caption,
    color: '#595450',
    fontSize: 13,
    lineHeight: 16,
  },
  chipGlyphActive: {
    color: colors.surface,
  },
  chipLabel: {
    ...typography.caption,
    color: '#47413E',
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '500',
  },
  chipLabelActive: {
    color: colors.surface,
    fontWeight: '600',
  },
  resultsHeader: {
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  resultsHeadline: {
    ...typography.sectionTitle,
    color: colors.text,
    fontSize: 32 / 1.7,
    lineHeight: 24,
  },
  sortText: {
    ...typography.button,
    color: colors.primary,
    fontSize: 14,
    lineHeight: 18,
  },
  resultsList: {
    gap: spacing.sm,
  },
  resultCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#FAFAFA',
    padding: spacing.sm,
    flexDirection: 'row',
    gap: spacing.sm,
    position: 'relative',
  },
  resultCardPressed: {
    opacity: 0.9,
  },
  resultThumbWrap: {
    width: 106,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    flexShrink: 0,
  },
  resultThumb: {
    borderRadius: 12,
  },
  mediaBadge: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderWidth: 1,
    borderColor: '#E6E6E6',
  },
  mediaBadgeText: {
    ...typography.caption,
    color: '#4E4A47',
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '600',
  },
  dateBadge: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    width: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E4E4E4',
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xs,
    gap: 1,
  },
  dateBadgeMonth: {
    ...typography.label,
    color: colors.primary,
    fontSize: 8,
    lineHeight: 10,
  },
  dateBadgeDay: {
    ...typography.title,
    color: colors.text,
    fontSize: 18,
    lineHeight: 20,
  },
  resultBody: {
    flex: 1,
    minWidth: 0,
    gap: 2,
    paddingRight: 30,
  },
  resultTitle: {
    ...typography.button,
    color: colors.text,
    fontSize: 15,
    lineHeight: 19,
  },
  resultSubtitle: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 11,
    lineHeight: 14,
  },
  resultTime: {
    ...typography.caption,
    color: colors.success,
    fontSize: 11,
    lineHeight: 14,
    marginTop: spacing.xs - 1,
  },
  resultDescription: {
    ...typography.caption,
    color: '#5D5650',
    fontSize: 11,
    lineHeight: 15,
  },
  signalPill: {
    marginTop: spacing.xs,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#CFE3D6',
    backgroundColor: '#EAF6EE',
  },
  signalPillPromoted: {
    borderColor: '#CDE0F7',
    backgroundColor: '#EAF2FF',
  },
  signalPillGlyph: {
    ...typography.caption,
    color: '#23794F',
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '700',
  },
  signalPillGlyphPromoted: {
    color: '#2C6CCB',
  },
  signalPillText: {
    ...typography.caption,
    color: '#23794F',
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '600',
  },
  signalPillTextPromoted: {
    color: '#2C6CCB',
  },
  resultRatingRow: {
    marginTop: spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  resultStar: {
    ...typography.caption,
    color: colors.primary,
    fontSize: 13,
    lineHeight: 15,
  },
  resultRating: {
    ...typography.caption,
    color: '#554F49',
    fontSize: 11,
    lineHeight: 14,
  },
  resultRatingDot: {
    ...typography.caption,
    color: '#958B81',
    fontSize: 10,
    lineHeight: 13,
  },
  resultSave: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.sm,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultSavePressed: {
    opacity: 0.82,
  },
  resultSaveActive: {
    backgroundColor: colors.primarySoft,
  },
  resultSaveLoading: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 10,
    lineHeight: 12,
  },
  bookmarkGlyph: {
    width: 14,
    height: 16,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  bookmarkGlyphActive: {
    opacity: 1,
  },
  bookmarkGlyphBody: {
    position: 'absolute',
    top: 0,
    width: 10,
    height: 12,
    borderWidth: 1.2,
    borderColor: colors.textMuted,
    borderBottomWidth: 0,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
    backgroundColor: 'transparent',
  },
  bookmarkGlyphFoldLeft: {
    position: 'absolute',
    bottom: 1,
    left: 2,
    width: 5,
    height: 1.2,
    borderRadius: 2,
    backgroundColor: colors.textMuted,
    transform: [{ rotate: '35deg' }],
  },
  bookmarkGlyphFoldRight: {
    position: 'absolute',
    bottom: 1,
    right: 2,
    width: 5,
    height: 1.2,
    borderRadius: 2,
    backgroundColor: colors.textMuted,
    transform: [{ rotate: '-35deg' }],
  },
  mapCard: {
    marginTop: spacing.xs,
    height: 208,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#DEDEDE',
    overflow: 'hidden',
    backgroundColor: '#E9EEF4',
    position: 'relative',
  },
  mapLocateButton: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#D7DDE5',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapLocateGlyph: {
    ...typography.sectionTitle,
    color: '#59677A',
    fontSize: 18,
    lineHeight: 20,
  },
  mapSearchAreaButton: {
    position: 'absolute',
    bottom: spacing.md,
    left: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: '#D6DCE4',
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    minHeight: 40,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  mapSearchAreaGlyph: {
    ...typography.caption,
    color: '#4B5666',
    fontSize: 12,
    lineHeight: 14,
    fontWeight: '700',
  },
  mapSearchAreaText: {
    ...typography.caption,
    color: '#4B5666',
    fontSize: 12,
    lineHeight: 16,
  },
  clusterBubble: {
    position: 'absolute',
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clusterBubbleText: {
    ...typography.button,
    color: colors.surface,
    fontSize: 14,
    lineHeight: 18,
  },
});
