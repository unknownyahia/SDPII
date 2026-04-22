import React from 'react';
import {
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';

import { DiscoveryHeroImage } from '../../components/explore/DiscoveryHeroImage';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { LoadingState } from '../../components/ui/LoadingState';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { StatusBanner } from '../../components/ui/StatusBanner';
import { useAuth } from '../../context/AuthContext';
import { useLocalization } from '../../context/LocalizationContext';
import { subscribeToEvents } from '../../repositories/eventRepository';
import { subscribeToPosts } from '../../repositories/postsRepository';
import { observeCommentCountsByPost } from '../../services/commentService';
import {
  buildDiscoveryEventItems,
  buildDiscoverySpotItems,
  getTimestampMs,
} from '../../services/discoveryService';
import { observeFavoritePostIds } from '../../services/favoriteService';
import {
  getCurrentCoordinates,
  requestForegroundLocationPermission,
} from '../../services/locationService';
import { observeNotifications } from '../../services/notificationService';
import { observeLikeCountsByPost } from '../../services/reactionService';
import { colors, spacing, typography } from '../../theme/designSystem';
import {
  webDesktopChip,
  webDesktopControl,
  webDesktopLayout,
  webDesktopSurface,
  webDesktopSupportSurface,
} from '../../theme/webDesktopSystem';
import {
  getBlockedDataMessage,
  getErrorMessage,
  isDataAccessBlockedError,
} from '../../utils/dataAccessError';
import type { DiscoveryEvent, DiscoverySpot } from '../../types/discovery';
import type { PromotedEvent } from '../../types/event';
import type { MainTabParamList } from '../../navigation/types';
import type { AppNotification } from '../../types/notification';
import type { SpotPost } from '../../types/post';

const MOBILE_AVATAR_FALLBACK_URI =
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80';

function uniqueItemsById<T extends { id: string }>(items: readonly T[]) {
  const seen = new Set<string>();
  return items.filter(item => {
    if (seen.has(item.id)) {
      return false;
    }

    seen.add(item.id);
    return true;
  });
}

function uniqueSpotItemsByPlace<
  T extends {
    title: string;
    areaLabel: string;
    rawPost: {
      placeId?: string | null;
    };
  },
>(items: readonly T[]) {
  const seen = new Set<string>();
  return items.filter(item => {
    const key = item.rawPost.placeId || `${item.title}:${item.areaLabel}`;
    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function getSpotRating(spot: DiscoverySpot) {
  const engagementCount = Math.max(spot.likeCount + spot.commentCount, 1);
  const ratingValue = (4.2 + Math.min(0.7, engagementCount * 0.08)).toFixed(1);

  return {
    ratingValue,
    engagementCount,
  };
}

function getEventCalendarParts(
  value: unknown,
  language: 'en' | 'ar'
) {
  const date = value instanceof Date ? value : new Date(String(value));

  if (Number.isNaN(date.getTime())) {
    return {
      month: language === 'ar' ? 'فع' : 'NOW',
      day: '--',
      time: language === 'ar' ? 'الوقت لاحقًا' : 'Time soon',
    };
  }

  const locale = language === 'ar' ? 'ar-QA' : 'en-US';

  return {
    month: date
      .toLocaleString(locale, { month: 'short' })
      .replace('.', '')
      .toUpperCase(),
    day: date.toLocaleString(locale, { day: '2-digit' }),
    time: date.toLocaleString(locale, {
      hour: 'numeric',
      minute: '2-digit',
    }),
  };
}

function getUpdateSummary(spot: DiscoverySpot) {
  const source = (spot.socialSignal?.label || spot.summary || spot.description || '').trim();

  if (!source) {
    return 'Local updates are coming in.';
  }

  return source.length > 48 ? `${source.slice(0, 45).trimEnd()}...` : source;
}

function getSpotDescriptor(spot: DiscoverySpot) {
  const source = (spot.summary || spot.description || '').trim();

  if (!source) {
    return '';
  }

  return source.length > 26 ? `${source.slice(0, 23).trimEnd()}...` : source;
}

function getDistancePreview(label: string) {
  return label.replace(/(\d+)\.0(\s)/g, '$1$2');
}

function getEventPreviewTimeLabel(value: unknown, language: 'en' | 'ar') {
  const timestampMs = getTimestampMs(value);
  if (timestampMs === null) {
    return language === 'ar' ? 'الوقت لاحقًا' : 'Time soon';
  }

  const eventDate = new Date(timestampMs);
  const now = new Date();
  const eventDay = Date.UTC(
    eventDate.getFullYear(),
    eventDate.getMonth(),
    eventDate.getDate()
  );
  const currentDay = Date.UTC(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );
  const dayDelta = Math.round((eventDay - currentDay) / (24 * 60 * 60 * 1000));
  const locale = language === 'ar' ? 'ar-QA' : 'en-US';
  const timeLabel = new Intl.DateTimeFormat(locale, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(eventDate);

  if (dayDelta === 0) {
    return language === 'ar' ? `اليوم · ${timeLabel}` : `Today · ${timeLabel}`;
  }

  if (dayDelta === 1) {
    return language === 'ar' ? `غدًا · ${timeLabel}` : `Tomorrow · ${timeLabel}`;
  }

  const dateLabel = new Intl.DateTimeFormat(locale, {
    month: 'short',
    day: 'numeric',
  }).format(eventDate);

  return `${dateLabel} · ${timeLabel}`;
}

function HomeSectionHeader({
  title,
  onPress,
}: {
  title: string;
  onPress: () => void;
}) {
  const { getRowDirection, getTextAlign, isRTL, language } = useLocalization();

  return (
    <View style={[styles.sectionHeader, { flexDirection: getRowDirection() }]}>
      <Text
        style={[
          styles.sectionTitle,
          { textAlign: getTextAlign(), writingDirection: isRTL ? 'rtl' : 'ltr' },
        ]}
      >
        {title}
      </Text>
      <Pressable
        accessibilityRole="button"
        onPress={onPress}
        style={({ pressed }) => [pressed && styles.sectionLinkPressed]}
      >
        <Text
          style={[
            styles.sectionLinkText,
            { writingDirection: isRTL ? 'rtl' : 'ltr' },
          ]}
        >
          {language === 'ar' ? 'عرض الكل' : 'View all'}
        </Text>
      </Pressable>
    </View>
  );
}

function HomeShortcutPill({
  glyph,
  label,
  onPress,
}: {
  glyph: string;
  label: string;
  onPress: () => void;
}) {
  const { getRowDirection, isRTL } = useLocalization();

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.shortcutPill,
        pressed && styles.shortcutPillPressed,
      ]}
    >
      <View style={[styles.shortcutIcon, { flexDirection: getRowDirection() }]}>
        <Text
          style={[
            styles.shortcutIconGlyph,
            { writingDirection: isRTL ? 'rtl' : 'ltr' },
          ]}
        >
          {glyph}
        </Text>
      </View>
      <Text
        style={[
          styles.shortcutLabel,
          { writingDirection: isRTL ? 'rtl' : 'ltr' },
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function HomeSearchGlyph({ color = colors.primary }: { color?: string }) {
  return (
    <View style={styles.searchGlyph}>
      <View style={[styles.searchGlyphCircle, { borderColor: color }]} />
      <View style={[styles.searchGlyphHandle, { backgroundColor: color }]} />
    </View>
  );
}

function HomePinGlyph() {
  return (
    <View style={styles.pinGlyph}>
      <View style={styles.pinGlyphHead}>
        <View style={styles.pinGlyphCore} />
      </View>
      <View style={styles.pinGlyphTip} />
    </View>
  );
}

function HomeBookmarkGlyph() {
  return (
    <View style={styles.bookmarkGlyph}>
      <View style={styles.bookmarkGlyphBody} />
      <View style={styles.bookmarkGlyphFoldLeft} />
      <View style={styles.bookmarkGlyphFoldRight} />
    </View>
  );
}

function HomeBellGlyph() {
  return (
    <View style={styles.mobileBellIcon}>
      <View style={styles.mobileBellStem} />
      <View style={styles.mobileBellBody} />
      <View style={styles.mobileBellClapper} />
      <View style={styles.mobileBellBase} />
      <View style={styles.mobileBellDot} />
    </View>
  );
}

function HomeMobileSectionHeader({
  title,
  onPress,
}: {
  title: string;
  onPress: () => void;
}) {
  const { getRowDirection, isRTL, language } = useLocalization();

  return (
    <View style={[styles.mobileSectionHeader, { flexDirection: getRowDirection() }]}>
      <Text
        style={[
          styles.mobileSectionTitle,
          { writingDirection: isRTL ? 'rtl' : 'ltr' },
        ]}
      >
        {title}
      </Text>
      <Pressable
        accessibilityRole="button"
        onPress={onPress}
        style={({ pressed }) => [pressed && styles.mobileSectionLinkPressed]}
      >
        <Text
          style={[
            styles.mobileSectionLink,
            { writingDirection: isRTL ? 'rtl' : 'ltr' },
          ]}
        >
          {language === 'ar' ? 'عرض الكل' : 'View all'}
        </Text>
      </Pressable>
    </View>
  );
}

function HomeMobileCategoryChip({
  glyph,
  label,
  onPress,
}: {
  glyph: string;
  label: string;
  onPress: () => void;
}) {
  const { getRowDirection, isRTL } = useLocalization();

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.mobileChip,
        pressed && styles.mobileChipPressed,
      ]}
    >
      <View style={[styles.mobileChipInner, { flexDirection: getRowDirection() }]}>
        <Text
          style={[
            styles.mobileChipGlyph,
            { writingDirection: isRTL ? 'rtl' : 'ltr' },
          ]}
        >
          {glyph}
        </Text>
        <Text
          style={[
            styles.mobileChipLabel,
            { writingDirection: isRTL ? 'rtl' : 'ltr' },
          ]}
          numberOfLines={1}
        >
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

function HomeFeatureCard({
  spot,
  onPress,
}: {
  spot: DiscoverySpot;
  onPress: () => void;
}) {
  const isWeb = Platform.OS === 'web';
  const { getRowDirection, getTextAlign, isRTL, t } = useLocalization();
  const subtitle = `${spot.categoryLabel} • ${spot.areaLabel}`;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.featureCard,
        !isWeb && styles.featureCardMobile,
        pressed && styles.featureCardPressed,
      ]}
    >
      <View style={styles.featureImageWrap}>
        <DiscoveryHeroImage
          hero={{ ...spot.hero, badgeLabel: null }}
          height={isWeb ? 168 : 108}
          style={[styles.featureImage, !isWeb && styles.featureImageMobile]}
        />
        <View style={[styles.featureBookmark, !isWeb && styles.featureBookmarkMobile]}>
          <HomeBookmarkGlyph />
        </View>
      </View>

      <View style={[styles.featureBody, !isWeb && styles.featureBodyMobile]}>
        <Text
          style={[
            styles.featureTitle,
            !isWeb && styles.featureTitleMobile,
            { textAlign: getTextAlign(), writingDirection: isRTL ? 'rtl' : 'ltr' },
          ]}
          numberOfLines={2}
        >
          {spot.title}
        </Text>
        <Text
          style={[
            styles.featureSubtitle,
            !isWeb && styles.featureSubtitleMobile,
            { textAlign: getTextAlign(), writingDirection: isRTL ? 'rtl' : 'ltr' },
          ]}
          numberOfLines={1}
        >
          {subtitle}
        </Text>
        <View style={[styles.featureMetaRow, { flexDirection: getRowDirection() }]}>
          <Text
            style={[
              styles.featureMetaText,
              !isWeb && styles.featureMetaTextMobile,
              { writingDirection: isRTL ? 'rtl' : 'ltr' },
            ]}
          >
            {spot.distanceLabel === t('discovery.distanceUnavailable')
              ? spot.areaLabel
              : getDistancePreview(spot.distanceLabel)}
          </Text>
          <Text
            style={[
              styles.featureMetaDivider,
              !isWeb && styles.featureMetaDividerMobile,
              { writingDirection: isRTL ? 'rtl' : 'ltr' },
            ]}
          >
            •
          </Text>
          <Text
            style={[
              styles.featureMetaText,
              !isWeb && styles.featureMetaTextMobile,
              { writingDirection: isRTL ? 'rtl' : 'ltr' },
            ]}
          >
            {`Updated ${spot.updatedLabel}`}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

function HomeTrendingRow({
  spot,
  onPress,
}: {
  spot: DiscoverySpot;
  onPress: () => void;
}) {
  const isWeb = Platform.OS === 'web';
  const { getRowDirection, getTextAlign, isRTL } = useLocalization();
  const { ratingValue, engagementCount } = getSpotRating(spot);
  const descriptor = getSpotDescriptor(spot);

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.trendingRow,
        !isWeb && styles.trendingRowMobile,
        pressed && styles.featureCardPressed,
      ]}
    >
      <DiscoveryHeroImage
        hero={{ ...spot.hero, badgeLabel: null }}
        height={isWeb ? 82 : 72}
        style={[styles.trendingThumb, !isWeb && styles.trendingThumbMobile]}
      />
      <View style={[styles.trendingBody, { flexDirection: getRowDirection() }]}>
        <View style={styles.trendingCopy}>
          <Text
            style={[
              styles.trendingTitle,
              !isWeb && styles.trendingTitleMobile,
              { textAlign: getTextAlign(), writingDirection: isRTL ? 'rtl' : 'ltr' },
            ]}
            numberOfLines={1}
          >
            {spot.title}
          </Text>
          <Text
            style={[
              styles.trendingSubtitle,
              !isWeb && styles.trendingSubtitleMobile,
              { textAlign: getTextAlign(), writingDirection: isRTL ? 'rtl' : 'ltr' },
            ]}
            numberOfLines={1}
          >
            {`${spot.areaLabel} • ${spot.categoryLabel}${descriptor ? ` • ${descriptor}` : ''}`}
          </Text>
          <View style={[styles.trendingMetaRow, { flexDirection: getRowDirection() }]}>
            <Text style={styles.trendingStar}>★</Text>
            <Text
              style={[
                styles.trendingMetaText,
                !isWeb && styles.trendingMetaTextMobile,
                { writingDirection: isRTL ? 'rtl' : 'ltr' },
              ]}
            >
              {`${ratingValue} (${engagementCount})`}
            </Text>
            <Text style={styles.trendingMetaDivider}>•</Text>
            <Text
              style={[
                styles.trendingMetaText,
                !isWeb && styles.trendingMetaTextMobile,
                { writingDirection: isRTL ? 'rtl' : 'ltr' },
              ]}
            >
              {getDistancePreview(spot.distanceLabel)}
            </Text>
          </View>
        </View>
        <View style={styles.inlineBookmark}>
          <HomeBookmarkGlyph />
        </View>
      </View>
    </Pressable>
  );
}

function HomeEventRow({
  event,
  onPress,
}: {
  event: DiscoveryEvent;
  onPress: () => void;
}) {
  const isWeb = Platform.OS === 'web';
  const { getTextAlign, isRTL, language } = useLocalization();
  const { month, day } = getEventCalendarParts(event.rawEvent.startTime, language);
  const timeLabel = getEventPreviewTimeLabel(event.rawEvent.startTime, language);

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.eventRow,
        !isWeb && styles.eventRowMobile,
        pressed && styles.featureCardPressed,
      ]}
    >
      <View style={[styles.eventDateTile, !isWeb && styles.eventDateTileMobile]}>
        <Text
          style={[
            styles.eventDateMonth,
            !isWeb && styles.eventDateMonthMobile,
            { writingDirection: isRTL ? 'rtl' : 'ltr' },
          ]}
        >
          {month}
        </Text>
        <Text
          style={[
            styles.eventDateDay,
            !isWeb && styles.eventDateDayMobile,
            { writingDirection: isRTL ? 'rtl' : 'ltr' },
          ]}
        >
          {day}
        </Text>
      </View>

      <View style={styles.eventRowCopy}>
        <Text
          style={[
            styles.eventRowTitle,
            !isWeb && styles.eventRowTitleMobile,
            { textAlign: getTextAlign(), writingDirection: isRTL ? 'rtl' : 'ltr' },
          ]}
          numberOfLines={2}
        >
          {event.title}
        </Text>
        <Text
          style={[
            styles.eventRowSubtitle,
            !isWeb && styles.eventRowSubtitleMobile,
            { textAlign: getTextAlign(), writingDirection: isRTL ? 'rtl' : 'ltr' },
          ]}
          numberOfLines={1}
        >
          {event.venueLabel || event.areaLabel}
        </Text>
        <Text
          style={[
            styles.eventRowTime,
            !isWeb && styles.eventRowTimeMobile,
            { textAlign: getTextAlign(), writingDirection: isRTL ? 'rtl' : 'ltr' },
          ]}
          numberOfLines={1}
        >
          {timeLabel}
        </Text>
      </View>

      <DiscoveryHeroImage
        hero={{ ...event.hero, badgeLabel: null }}
        height={isWeb ? 70 : 58}
        style={[styles.eventThumb, !isWeb && styles.eventThumbMobile]}
      />
    </Pressable>
  );
}

function HomeSavedUpdateRow({
  spot,
  unread,
  onPress,
}: {
  spot: DiscoverySpot;
  unread: boolean;
  onPress: () => void;
}) {
  const isWeb = Platform.OS === 'web';
  const { getRowDirection, getTextAlign, isRTL, language } = useLocalization();
  const updateText = getUpdateSummary(spot);
  const savedLabel = language === 'ar' ? 'تحديث جديد' : 'New update';

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.savedUpdateRow,
        !isWeb && styles.savedUpdateRowMobile,
        pressed && styles.featureCardPressed,
      ]}
    >
      <DiscoveryHeroImage
        hero={{ ...spot.hero, badgeLabel: null }}
        height={isWeb ? 72 : 58}
        style={[styles.savedUpdateThumb, !isWeb && styles.savedUpdateThumbMobile]}
      />
      <View style={[styles.savedUpdateBody, { flexDirection: getRowDirection() }]}>
        <View style={styles.savedUpdateCopy}>
          <Text
            style={[
              styles.savedUpdateTitle,
              !isWeb && styles.savedUpdateTitleMobile,
              { textAlign: getTextAlign(), writingDirection: isRTL ? 'rtl' : 'ltr' },
            ]}
            numberOfLines={1}
          >
            {spot.title}
          </Text>
          <Text
            style={[
              styles.savedUpdateSummary,
              !isWeb && styles.savedUpdateSummaryMobile,
              { textAlign: getTextAlign(), writingDirection: isRTL ? 'rtl' : 'ltr' },
            ]}
            numberOfLines={1}
          >
            {updateText || savedLabel}
          </Text>
          <Text
            style={[
              styles.savedUpdateTime,
              !isWeb && styles.savedUpdateTimeMobile,
              { textAlign: getTextAlign(), writingDirection: isRTL ? 'rtl' : 'ltr' },
            ]}
          >
            {spot.updatedLabel}
          </Text>
        </View>
        {unread ? <View style={styles.unreadDot} /> : null}
      </View>
    </Pressable>
  );
}

export function HomeScreen() {
  const { isInitializing, user } = useAuth();
  const {
    language,
    getRowDirection,
    getTextAlign,
    isRTL,
    t,
  } = useLocalization();
  const navigation =
    useNavigation<BottomTabNavigationProp<MainTabParamList>>();
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  const isWideLayout = width >= 1100;
  const [posts, setPosts] = React.useState<SpotPost[]>([]);
  const [events, setEvents] = React.useState<PromotedEvent[]>([]);
  const [postsLoading, setPostsLoading] = React.useState(true);
  const [eventsLoading, setEventsLoading] = React.useState(true);
  const [favoritePostIds, setFavoritePostIds] = React.useState<string[]>([]);
  const [commentCountsByPostId, setCommentCountsByPostId] = React.useState<Record<string, number>>({});
  const [likeCountsByPostId, setLikeCountsByPostId] = React.useState<Record<string, number>>({});
  const [notifications, setNotifications] = React.useState<AppNotification[]>([]);
  const [browserLocation, setBrowserLocation] = React.useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [locationShared, setLocationShared] = React.useState(false);
  const [dataIssue, setDataIssue] = React.useState<string | null>(null);
  const [refreshToken, setRefreshToken] = React.useState(0);

  const handleDataIssue = React.useCallback(
    (error: unknown, fallbackMessage: string) => {
      const nextMessage = isDataAccessBlockedError(error)
        ? getBlockedDataMessage('one or more Home data feeds')
        : getErrorMessage(error, fallbackMessage);

      setDataIssue(current => current ?? nextMessage);
    },
    []
  );

  React.useEffect(() => {
    setPostsLoading(true);
    const unsubscribe = subscribeToPosts(
      nextPosts => {
        setPosts(nextPosts);
        setPostsLoading(false);
      },
      error => {
        setPostsLoading(false);
        handleDataIssue(error, 'Failed to load nearby posts for Home.');
      }
    );

    return unsubscribe;
  }, [handleDataIssue, refreshToken]);

  React.useEffect(() => {
    setEventsLoading(true);
    const unsubscribe = subscribeToEvents(
      nextEvents => {
        setEvents(nextEvents);
        setEventsLoading(false);
      },
      error => {
        setEventsLoading(false);
        handleDataIssue(error, 'Failed to load promoted events for Home.');
      }
    );

    return unsubscribe;
  }, [handleDataIssue, refreshToken]);

  React.useEffect(() => {
    const unsubscribe = observeFavoritePostIds(user?.id, setFavoritePostIds, error => {
      handleDataIssue(error, 'Failed to load saved spot activity.');
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
      handleDataIssue(error, 'Failed to load like activity.');
    });
    return unsubscribe;
  }, [handleDataIssue, refreshToken]);

  React.useEffect(() => {
    const unsubscribe = observeNotifications(user?.id, setNotifications, error => {
      handleDataIssue(error, 'Failed to load notifications.');
    });
    return unsubscribe;
  }, [handleDataIssue, refreshToken, user?.id]);

  React.useEffect(() => {
    const syncToUserLocation = async () => {
      try {
        const { status } = await requestForegroundLocationPermission();
        if (status !== 'granted') {
          return;
        }

        const coords = await getCurrentCoordinates();
        setBrowserLocation(coords);
        setLocationShared(true);
      } catch (error) {
        console.log('Home location error:', error);
      }
    };

    void syncToUserLocation();
  }, []);

  const loading = postsLoading || eventsLoading || isInitializing;
  const unreadNotificationsCount = React.useMemo(
    () => notifications.filter(notification => !notification.isRead).length,
    [notifications]
  );

  const discoverySpotItems = React.useMemo(
    () =>
      buildDiscoverySpotItems(posts, {
        commentCountsByPostId,
        likeCountsByPostId,
        favoritePostIds,
        browserLocation,
      }),
    [
      browserLocation,
      commentCountsByPostId,
      favoritePostIds,
      likeCountsByPostId,
      posts,
    ]
  );

  const discoveryEventItems = React.useMemo(
    () =>
      buildDiscoveryEventItems(events, {
        posts,
        browserLocation,
      }),
    [browserLocation, events, posts]
  );

  const savedSpotItems = React.useMemo(
    () => uniqueSpotItemsByPlace(discoverySpotItems.filter(item => item.saved)),
    [discoverySpotItems]
  );

  const savedCategorySet = React.useMemo(
    () => new Set(savedSpotItems.map(item => item.categoryLabel)),
    [savedSpotItems]
  );
  const savedAreaSet = React.useMemo(
    () => new Set(savedSpotItems.map(item => item.areaLabel)),
    [savedSpotItems]
  );

  const becauseYouSavedItems = React.useMemo(
    () =>
      uniqueSpotItemsByPlace(
        discoverySpotItems.filter(
          item =>
            !item.saved &&
            (savedCategorySet.has(item.categoryLabel) || savedAreaSet.has(item.areaLabel))
        )
      ).slice(0, 6),
    [discoverySpotItems, savedAreaSet, savedCategorySet]
  );

  const forYouItems = React.useMemo(
    () =>
      uniqueSpotItemsByPlace([
        ...becauseYouSavedItems,
        ...savedSpotItems,
        ...discoverySpotItems,
      ]).slice(0, 6),
    [becauseYouSavedItems, discoverySpotItems, savedSpotItems]
  );

  const trendingNearbyItems = React.useMemo(
    () =>
      uniqueSpotItemsByPlace(
        discoverySpotItems.filter(item => !savedSpotItems.some(saved => saved.id === item.id))
      ).slice(0, 6),
    [discoverySpotItems, savedSpotItems]
  );

  const savedSpotUpdates = React.useMemo(
    () => savedSpotItems.slice(0, 6),
    [savedSpotItems]
  );

  const popularEventItems = React.useMemo(
    () =>
      uniqueItemsById([
        ...discoveryEventItems.filter(item =>
          item.trustSignals.some(signal =>
            ['active-now', 'promoted', 'nearby-posts'].includes(signal.id)
          )
        ),
        ...discoveryEventItems,
      ]).slice(0, 6),
    [discoveryEventItems]
  );

  const homeHeroTitlePrimary =
    language === 'ar' ? 'اكتشف قطر،' : 'Discover Qatar,';
  const homeHeroTitleAccent =
    language === 'ar'
      ? 'مكانًا رائعًا في كل مرة'
      : 'one great spot at a time';
  const homeHeroDescription =
    language === 'ar'
      ? 'مقاهٍ محلية، زوايا للدراسة، مساحات خارجية وفعاليات حية.\nاعثر على ما يهمك بالقرب منك.'
      : 'Local eats, study corners, outdoor escapes and live events.\nFind what matters near you.';
  const homeSearchWhatLabel =
    language === 'ar' ? 'ماذا تبحث عنه؟' : 'What are you looking for?';
  const homeSearchWhatHint =
    language === 'ar'
      ? 'قهوة، أماكن للدراسة، فعاليات...'
      : 'Coffee, study spots, events, ...';
  const homeSearchWhereLabel =
    language === 'ar' ? 'أين في قطر؟' : 'Where in Qatar?';
  const homeSearchWhereHint =
    locationShared
      ? language === 'ar'
        ? 'بالقرب من موقعك الحالي'
        : 'Near your current location'
      : language === 'ar'
        ? 'مدينة، منطقة، أو معلم'
        : 'City, area, or landmark';
  const homeSearchActionLabel = language === 'ar' ? 'ابحث' : 'Search';
  const homeForYouTitle = language === 'ar' ? 'لك' : 'For You';
  const homeTrendingTitle = language === 'ar' ? 'الأكثر رواجًا بالقرب منك' : 'Trending Nearby';
  const homePopularEventsTitle = language === 'ar' ? 'الفعاليات الشائعة' : 'Popular Events';
  const homeSavedUpdatesTitle = language === 'ar' ? 'تحديثات الأماكن المحفوظة' : 'Saved Spots Updates';
  const homeSearchShortcuts = React.useMemo(
    () =>
      language === 'ar'
        ? [
            { id: 'coffee', glyph: '☕', label: 'قهوة' },
            { id: 'family', glyph: '◎', label: 'عائلة' },
            { id: 'outdoors', glyph: '△', label: 'خارجي' },
            { id: 'food', glyph: '✦', label: 'مأكولات ومشروبات' },
            { id: 'study', glyph: '▣', label: 'دراسة' },
            { id: 'events', glyph: '✷', label: 'فعاليات' },
            { id: 'more', glyph: '⋯', label: 'المزيد' },
          ]
        : [
            { id: 'coffee', glyph: '☕', label: 'Coffee' },
            { id: 'family', glyph: '◎', label: 'Family' },
            { id: 'outdoors', glyph: '△', label: 'Outdoors' },
            { id: 'food', glyph: '✦', label: 'Food & Drinks' },
            { id: 'study', glyph: '▣', label: 'Study' },
            { id: 'events', glyph: '✷', label: 'Events' },
            { id: 'more', glyph: '⋯', label: 'More' },
          ],
    [language]
  );
  const forYouShelfItems = React.useMemo(
    () => (forYouItems.length > 0 ? forYouItems.slice(0, 5) : discoverySpotItems.slice(0, 5)),
    [discoverySpotItems, forYouItems]
  );
  const trendingModuleItems = React.useMemo(
    () =>
      (trendingNearbyItems.length > 0 ? trendingNearbyItems : discoverySpotItems).slice(0, 4),
    [discoverySpotItems, trendingNearbyItems]
  );
  const popularEventModuleItems = React.useMemo(
    () => (popularEventItems.length > 0 ? popularEventItems : discoveryEventItems).slice(0, 4),
    [discoveryEventItems, popularEventItems]
  );
  const savedUpdatesModuleItems = React.useMemo(
    () =>
      (
        savedSpotUpdates.length > 0
          ? savedSpotUpdates
          : savedSpotItems.length > 0
            ? savedSpotItems
            : forYouItems
      ).slice(0, 4),
    [forYouItems, savedSpotItems, savedSpotUpdates]
  );
  const heroVisualItem = React.useMemo(() => {
    const scenicKeywords = ['west bay', 'doha', 'corniche', 'lusail', 'katara', 'pearl'];
    const candidates = [
      ...forYouShelfItems,
      ...trendingModuleItems,
      ...popularEventModuleItems,
      ...savedUpdatesModuleItems,
      ...discoverySpotItems,
      ...discoveryEventItems,
    ];

    return (
      candidates.find(item => {
        const searchText = `${item.title} ${item.areaLabel} ${item.locationLabel}`.toLowerCase();
        return !!item.hero.imageUrl && scenicKeywords.some(keyword => searchText.includes(keyword));
      }) ??
      candidates.find(item => !!item.hero.imageUrl) ??
      null
    );
  }, [
    discoveryEventItems,
    discoverySpotItems,
    forYouShelfItems,
    popularEventModuleItems,
    savedUpdatesModuleItems,
    trendingModuleItems,
  ]);

  const openExplore = React.useCallback(() => {
    navigation.navigate('Explore');
  }, [navigation]);

  const handleRetry = React.useCallback(() => {
    setDataIssue(null);
    setRefreshToken(current => current + 1);
  }, []);
  const avatarInitial = (user?.displayInfo || user?.email || 'Spots')
    .trim()
    .charAt(0)
    .toUpperCase();

  if (loading) {
    return <LoadingState label={t('home.title')} />;
  }

  if (isWeb) {
    return (
      <ScreenContainer
        scroll
        style={styles.desktopScreen}
        contentContainerStyle={[
          styles.desktopContent,
          isWideLayout && styles.desktopContentWide,
        ]}
      >
        <View style={styles.desktopStack}>
          {dataIssue ? (
            <View style={styles.desktopBannerWrap}>
              <StatusBanner
                compact
                tone="warning"
                title={t('home.issueTitle')}
                body={t('home.issueBody')}
                actions={[
                  {
                    label: t('common.retry'),
                    onPress: handleRetry,
                    tone: 'primary',
                  },
                ]}
              />
            </View>
          ) : null}

          <View
            style={[
              styles.heroSection,
              isWideLayout && styles.heroSectionWide,
            ]}
          >
            <View style={styles.heroCopyColumn}>
              <Text
                style={[
                  styles.heroDisplayTitle,
                  { textAlign: getTextAlign(), writingDirection: isRTL ? 'rtl' : 'ltr' },
                ]}
              >
                {homeHeroTitlePrimary}
                {'\n'}
                <Text style={styles.heroDisplayTitleAccent}>
                  {homeHeroTitleAccent}
                </Text>
              </Text>

              <Text
                style={[
                  styles.heroDisplaySubtitle,
                  { textAlign: getTextAlign(), writingDirection: isRTL ? 'rtl' : 'ltr' },
                ]}
              >
                {homeHeroDescription}
              </Text>
            </View>

            <View style={styles.heroMediaColumn}>
              <View style={styles.heroMediaFrame}>
                <View style={styles.heroMediaGlowPrimary} />
                <View style={styles.heroMediaGlowSecondary} />
                {heroVisualItem ? (
                  <DiscoveryHeroImage
                    hero={{ ...heroVisualItem.hero, badgeLabel: null }}
                    height={isWideLayout ? 332 : 272}
                    style={styles.heroMediaImage}
                  />
                ) : (
                  <View style={styles.heroMediaFallback}>
                    <Text
                      style={[
                        styles.heroMediaFallbackText,
                        { textAlign: getTextAlign(), writingDirection: isRTL ? 'rtl' : 'ltr' },
                      ]}
                    >
                      {language === 'ar' ? 'قطر في لمحة' : 'Qatar at a glance'}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          <View style={styles.heroSearchBar}>
            <Pressable
              accessibilityRole="button"
              onPress={openExplore}
              style={({ pressed }) => [
                styles.heroSearchField,
                styles.heroSearchFieldPrimary,
                pressed && styles.heroSearchFieldPressed,
              ]}
            >
              <HomeSearchGlyph />
              <View style={styles.heroSearchFieldCopy}>
                <Text
                  style={[
                    styles.heroSearchFieldLabel,
                    { textAlign: getTextAlign(), writingDirection: isRTL ? 'rtl' : 'ltr' },
                  ]}
                >
                  {homeSearchWhatLabel}
                </Text>
                <Text
                  style={[
                    styles.heroSearchFieldHint,
                    { textAlign: getTextAlign(), writingDirection: isRTL ? 'rtl' : 'ltr' },
                  ]}
                >
                  {homeSearchWhatHint}
                </Text>
              </View>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              onPress={openExplore}
              style={({ pressed }) => [
                styles.heroSearchField,
                styles.heroSearchFieldSecondary,
                pressed && styles.heroSearchFieldPressed,
              ]}
            >
              <HomePinGlyph />
              <View style={styles.heroSearchFieldCopy}>
                <Text
                  style={[
                    styles.heroSearchFieldLabel,
                    { textAlign: getTextAlign(), writingDirection: isRTL ? 'rtl' : 'ltr' },
                  ]}
                >
                  {homeSearchWhereLabel}
                </Text>
                <Text
                  style={[
                    styles.heroSearchFieldHint,
                    { textAlign: getTextAlign(), writingDirection: isRTL ? 'rtl' : 'ltr' },
                  ]}
                >
                  {homeSearchWhereHint}
                </Text>
              </View>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              onPress={openExplore}
              style={({ pressed }) => [
                styles.heroSearchButton,
                pressed && styles.heroSearchFieldPressed,
              ]}
            >
              <HomeSearchGlyph color={colors.surface} />
              <Text
                style={[
                  styles.heroSearchButtonLabel,
                  { writingDirection: isRTL ? 'rtl' : 'ltr' },
                ]}
              >
                {homeSearchActionLabel}
              </Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              onPress={openExplore}
              style={({ pressed }) => [
                styles.heroExploreButton,
                pressed && styles.heroSearchFieldPressed,
              ]}
            >
              <Text style={styles.heroExploreButtonIcon}>↗</Text>
              <Text
                style={[
                  styles.heroExploreButtonText,
                  { writingDirection: isRTL ? 'rtl' : 'ltr' },
                ]}
              >
                {t('home.openExplore')}
              </Text>
            </Pressable>
          </View>

          <View style={[styles.shortcutRow, { flexDirection: getRowDirection() }]}>
            {homeSearchShortcuts.map(shortcut => (
              <HomeShortcutPill
                key={shortcut.id}
                glyph={shortcut.glyph}
                label={shortcut.label}
                onPress={openExplore}
              />
            ))}
          </View>

          <View style={styles.desktopSectionCard}>
            <HomeSectionHeader title={t('home.forYouTitle')} onPress={openExplore} />
            {forYouShelfItems.length > 0 ? (
              <View
                style={[
                  styles.featureGrid,
                  isWideLayout && styles.featureGridWide,
                ]}
              >
                {forYouShelfItems.slice(0, isWideLayout ? 4 : 3).map(item => (
                  <View key={item.id} style={styles.featureGridCard}>
                    <HomeFeatureCard spot={item} onPress={openExplore} />
                  </View>
                ))}
              </View>
            ) : (
              <Card style={styles.compactFallbackCard}>
                <EmptyState
                  compact
                  title={t('home.noRecommendationsTitle')}
                  subtitle={t('home.noRecommendationsSubtitle')}
                />
              </Card>
            )}
          </View>

          <View
            style={[
              styles.lowerGrid,
              isWideLayout && styles.lowerGridWide,
            ]}
          >
            <View style={[styles.moduleSection, styles.desktopSectionCard]}>
              <HomeSectionHeader title={t('home.trendingTitle')} onPress={openExplore} />
              {trendingModuleItems.length > 0 ? (
                <View style={styles.moduleList}>
                  {trendingModuleItems.slice(0, 3).map(item => (
                    <HomeTrendingRow key={item.id} spot={item} onPress={openExplore} />
                  ))}
                </View>
              ) : (
                <Card style={styles.compactFallbackCard}>
                  <EmptyState
                    compact
                    title={t('home.noTrendsTitle')}
                    subtitle={t('home.noTrendsSubtitle')}
                  />
                </Card>
              )}
            </View>

            <View style={[styles.moduleSection, styles.desktopSectionCard]}>
              <HomeSectionHeader title={t('home.eventsTitle')} onPress={openExplore} />
              {popularEventModuleItems.length > 0 ? (
                <View style={styles.moduleList}>
                  {popularEventModuleItems.slice(0, 3).map(item => (
                    <HomeEventRow key={item.id} event={item} onPress={openExplore} />
                  ))}
                </View>
              ) : (
                <Card style={styles.compactFallbackCard}>
                  <EmptyState
                    compact
                    title={t('home.noPopularEventsTitle')}
                    subtitle={t('home.noPopularEventsSubtitle')}
                  />
                </Card>
              )}
            </View>

            <View style={[styles.moduleSection, styles.desktopSectionCard]}>
              <HomeSectionHeader title={t('home.savedTitle')} onPress={openExplore} />
              {savedUpdatesModuleItems.length > 0 ? (
                <View style={styles.moduleList}>
                  {savedUpdatesModuleItems.slice(0, 3).map((item, index) => (
                    <HomeSavedUpdateRow
                      key={item.id}
                      spot={item}
                      unread={index < unreadNotificationsCount}
                      onPress={openExplore}
                    />
                  ))}
                </View>
              ) : (
                <Card style={styles.compactFallbackCard}>
                  <EmptyState
                    compact
                    title={t('home.noSavedTitle')}
                    subtitle={t('home.noSavedSubtitle')}
                  />
                </Card>
              )}
            </View>
          </View>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer
      scroll
      padded={false}
      style={styles.mobileScreen}
      contentContainerStyle={styles.mobileContent}
    >
      <View style={styles.mobileShell}>
        <View style={[styles.mobileTopBar, { flexDirection: getRowDirection() }]}>
          <Text
            style={[
              styles.mobileWordmark,
              { writingDirection: isRTL ? 'rtl' : 'ltr' },
            ]}
          >
            Spots
          </Text>

          <View style={[styles.mobileTopActions, { flexDirection: getRowDirection() }]}>
            <Pressable
              accessibilityRole="button"
              onPress={() => navigation.navigate('Profile')}
              style={({ pressed }) => [
                styles.mobileTopActionButton,
                pressed && styles.mobileTopActionPressed,
              ]}
            >
              <HomeBellGlyph />
            </Pressable>

            <Pressable
              accessibilityRole="button"
              onPress={openExplore}
              style={({ pressed }) => [
                styles.mobileTopActionButton,
                pressed && styles.mobileTopActionPressed,
              ]}
            >
              <Text style={styles.mobileTopHeart}>♡</Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              onPress={() => navigation.navigate('Profile')}
              style={({ pressed }) => [pressed && styles.mobileTopActionPressed]}
            >
              <View style={styles.mobileAvatarFrame}>
                <Image source={{ uri: MOBILE_AVATAR_FALLBACK_URI }} style={styles.mobileAvatarImage} />
                {!user ? <Text style={styles.mobileAvatarFallback}>{avatarInitial || 'S'}</Text> : null}
              </View>
            </Pressable>
          </View>
        </View>

        {dataIssue ? (
          <StatusBanner
            compact
            tone="warning"
            title={t('home.issueTitle')}
            body={t('home.issueBody')}
            actions={[
              {
                label: t('common.retry'),
                onPress: handleRetry,
                tone: 'primary',
              },
            ]}
          />
        ) : null}

        <View style={[styles.mobileHero, { flexDirection: getRowDirection() }]}>
          <View style={styles.mobileHeroCopy}>
            <Text
              style={[
                styles.mobileHeroTitle,
                { textAlign: getTextAlign(), writingDirection: isRTL ? 'rtl' : 'ltr' },
              ]}
            >
              {homeHeroTitlePrimary}
              {'\n'}
              <Text style={styles.mobileHeroTitleAccent}>{homeHeroTitleAccent}</Text>
            </Text>
            <Text
              style={[
                styles.mobileHeroBody,
                { textAlign: getTextAlign(), writingDirection: isRTL ? 'rtl' : 'ltr' },
              ]}
            >
              {homeHeroDescription}
            </Text>
          </View>

          <View style={styles.mobileHeroMedia}>
            {heroVisualItem ? (
              <DiscoveryHeroImage
                hero={{ ...heroVisualItem.hero, badgeLabel: null }}
                height={150}
                style={styles.mobileHeroImage}
              />
            ) : (
              <View style={styles.mobileHeroFallback}>
                <Text style={styles.mobileHeroFallbackText}>
                  {language === 'ar' ? 'قطر في لقطة' : 'Qatar at a glance'}
                </Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.mobileSearchCard}>
          <Pressable
            accessibilityRole="button"
            onPress={openExplore}
            style={({ pressed }) => [
              styles.mobileSearchRow,
              styles.mobileSearchRowTop,
              pressed && styles.mobileTopActionPressed,
            ]}
          >
            <HomeSearchGlyph />
            <View style={styles.mobileSearchCopy}>
              <Text
                style={[
                  styles.mobileSearchFieldLabel,
                  { writingDirection: isRTL ? 'rtl' : 'ltr' },
                ]}
              >
                {homeSearchWhatLabel}
              </Text>
              <Text
                style={[
                  styles.mobileSearchFieldHint,
                  { writingDirection: isRTL ? 'rtl' : 'ltr' },
                ]}
              >
                {homeSearchWhatHint}
              </Text>
            </View>
            <Text style={styles.mobileSearchChevron}>{isRTL ? '‹' : '›'}</Text>
          </Pressable>

          <View style={styles.mobileSearchDivider} />

          <View style={styles.mobileSearchRow}>
            <HomePinGlyph />
            <View style={styles.mobileSearchCopy}>
              <Text
                style={[
                  styles.mobileSearchFieldLabel,
                  { writingDirection: isRTL ? 'rtl' : 'ltr' },
                ]}
              >
                {homeSearchWhereLabel}
              </Text>
              <Text
                style={[
                  styles.mobileSearchFieldHint,
                  { writingDirection: isRTL ? 'rtl' : 'ltr' },
                ]}
              >
                {homeSearchWhereHint}
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              onPress={openExplore}
              style={({ pressed }) => [
                styles.mobileSearchAction,
                pressed && styles.mobileSearchActionPressed,
              ]}
            >
              <HomeSearchGlyph color={colors.surface} />
            </Pressable>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.mobileChipRow}
          contentContainerStyle={[
            styles.mobileChipRowContent,
            { flexDirection: getRowDirection() },
          ]}
        >
          {homeSearchShortcuts.map(shortcut => (
            <HomeMobileCategoryChip
              key={shortcut.id}
              glyph={shortcut.glyph}
              label={shortcut.label}
              onPress={openExplore}
            />
          ))}
        </ScrollView>

        <View style={styles.mobileSection}>
          <HomeMobileSectionHeader title={homeForYouTitle} onPress={openExplore} />
          {forYouShelfItems.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.mobileFeatureRail}
              contentContainerStyle={[
                styles.mobileFeatureRailContent,
                { flexDirection: getRowDirection() },
              ]}
            >
              {forYouShelfItems.slice(0, 4).map(item => (
                <View key={item.id} style={styles.mobileFeatureCardWrap}>
                  <HomeFeatureCard spot={item} onPress={openExplore} />
                </View>
              ))}
            </ScrollView>
          ) : (
            <EmptyState
              compact
              title={t('home.noRecommendationsTitle')}
              subtitle={t('home.noRecommendationsSubtitle')}
            />
          )}
        </View>

        <View style={styles.mobileSection}>
          <HomeMobileSectionHeader title={homeTrendingTitle} onPress={openExplore} />
          {trendingModuleItems.length > 0 ? (
            <View style={styles.mobileListStack}>
              {trendingModuleItems.slice(0, 2).map(item => (
                <HomeTrendingRow key={item.id} spot={item} onPress={openExplore} />
              ))}
            </View>
          ) : (
            <EmptyState compact title={t('home.noTrendsTitle')} subtitle={t('home.noTrendsSubtitle')} />
          )}
        </View>

        <View style={styles.mobileSection}>
          <HomeMobileSectionHeader title={homePopularEventsTitle} onPress={openExplore} />
          {popularEventModuleItems.length > 0 ? (
            <View style={[styles.mobileEventGrid, { flexDirection: getRowDirection() }]}>
              {popularEventModuleItems.slice(0, 2).map(item => (
                <View key={item.id} style={styles.mobileEventGridItem}>
                  <HomeEventRow event={item} onPress={openExplore} />
                </View>
              ))}
            </View>
          ) : (
            <EmptyState
              compact
              title={t('home.noPopularEventsTitle')}
              subtitle={t('home.noPopularEventsSubtitle')}
            />
          )}
        </View>

        <View style={[styles.mobileSection, styles.mobileSectionLast]}>
          <HomeMobileSectionHeader title={homeSavedUpdatesTitle} onPress={openExplore} />
          {savedUpdatesModuleItems.length > 0 ? (
            <View style={styles.mobileListStack}>
              {savedUpdatesModuleItems.slice(0, 2).map((item, index) => (
                <HomeSavedUpdateRow
                  key={item.id}
                  spot={item}
                  unread={index < unreadNotificationsCount}
                  onPress={openExplore}
                />
              ))}
            </View>
          ) : (
            <EmptyState compact title={t('home.noSavedTitle')} subtitle={t('home.noSavedSubtitle')} />
          )}
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  mobileScreen: {
    backgroundColor: '#F4F4F4',
  },
  mobileContent: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md + 2,
    paddingBottom: spacing.xxxl + 18,
  },
  mobileShell: {
    gap: spacing.md + 2,
  },
  mobileTopBar: {
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 52,
  },
  mobileWordmark: {
    ...typography.title,
    color: colors.primary,
    fontSize: 24,
    lineHeight: 30,
    letterSpacing: -0.5,
  },
  mobileTopActions: {
    alignItems: 'center',
    gap: spacing.sm + 4,
  },
  mobileTopActionButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  mobileTopActionPressed: {
    opacity: 0.82,
  },
  mobileTopHeart: {
    ...typography.title,
    color: colors.textMuted,
    fontSize: 25,
    lineHeight: 28,
  },
  mobileAvatarFrame: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#D6D6D6',
    backgroundColor: '#F4F4F4',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mobileAvatarImage: {
    width: '100%',
    height: '100%',
  },
  mobileAvatarFallback: {
    position: 'absolute',
    ...typography.button,
    color: colors.textMuted,
  },
  mobileBellIcon: {
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  mobileBellStem: {
    position: 'absolute',
    top: 1,
    width: 5,
    height: 2,
    borderRadius: 2,
    backgroundColor: colors.textMuted,
  },
  mobileBellBody: {
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
    backgroundColor: '#F7F7F7',
  },
  mobileBellClapper: {
    position: 'absolute',
    bottom: 2,
    width: 4,
    height: 4,
    borderRadius: 4,
    backgroundColor: colors.textMuted,
  },
  mobileBellBase: {
    position: 'absolute',
    bottom: 1,
    width: 10,
    height: 1.5,
    borderRadius: 2,
    backgroundColor: colors.textMuted,
  },
  mobileBellDot: {
    position: 'absolute',
    top: 0,
    right: 1,
    width: 6,
    height: 6,
    borderRadius: 6,
    backgroundColor: colors.primary,
  },
  mobileHero: {
    alignItems: 'stretch',
    justifyContent: 'space-between',
    gap: spacing.sm + 2,
  },
  mobileHeroCopy: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
    gap: spacing.sm,
    paddingTop: spacing.sm,
  },
  mobileHeroTitle: {
    ...typography.hero,
    color: colors.text,
    fontSize: 23,
    lineHeight: 29,
    letterSpacing: -0.6,
  },
  mobileHeroTitleAccent: {
    color: colors.primary,
  },
  mobileHeroBody: {
    ...typography.bodyMuted,
    color: '#4E4A47',
    fontSize: 12.5,
    lineHeight: 18,
    maxWidth: 190,
  },
  mobileHeroMedia: {
    flex: 1.24,
  },
  mobileHeroImage: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E2E2',
  },
  mobileHeroFallback: {
    height: 150,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#DDDDDD',
    backgroundColor: '#EFEFEF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mobileHeroFallbackText: {
    ...typography.button,
    color: colors.textMuted,
  },
  mobileSearchCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E6E6E6',
    backgroundColor: '#FAFAFA',
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: spacing.sm + 2,
    shadowColor: '#1A1A1A',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 7 },
    elevation: 4,
  },
  mobileSearchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 2,
    minHeight: 52,
  },
  mobileSearchRowTop: {
    minHeight: 56,
  },
  mobileSearchCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  mobileSearchFieldLabel: {
    ...typography.button,
    color: '#6B6764',
    fontSize: 14,
    lineHeight: 18,
  },
  mobileSearchFieldHint: {
    ...typography.caption,
    color: '#7E7974',
    fontSize: 12,
    lineHeight: 17,
  },
  mobileSearchChevron: {
    ...typography.title,
    color: '#B0AAA5',
    fontSize: 28,
    lineHeight: 28,
    marginTop: -2,
    paddingHorizontal: spacing.xs,
  },
  mobileSearchDivider: {
    height: 1,
    backgroundColor: '#E4E0DC',
  },
  mobileSearchAction: {
    width: 52,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mobileSearchActionPressed: {
    opacity: 0.9,
  },
  mobileChipRow: {
    marginTop: spacing.xs,
  },
  mobileChipRowContent: {
    gap: spacing.xs,
    paddingRight: spacing.sm,
  },
  mobileChip: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#DCDCDC',
    backgroundColor: '#F8F8F8',
    paddingHorizontal: spacing.md,
    minHeight: 40,
    justifyContent: 'center',
  },
  mobileChipPressed: {
    opacity: 0.84,
  },
  mobileChipInner: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  mobileChipGlyph: {
    ...typography.caption,
    color: '#56514D',
    fontSize: 13,
    lineHeight: 16,
  },
  mobileChipLabel: {
    ...typography.caption,
    color: '#4A4541',
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '500',
  },
  mobileSection: {
    gap: spacing.sm,
  },
  mobileSectionLast: {
    paddingBottom: spacing.md,
  },
  mobileSectionHeader: {
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  mobileSectionTitle: {
    ...typography.sectionTitle,
    color: colors.text,
    fontSize: 20,
    lineHeight: 24,
    letterSpacing: -0.2,
  },
  mobileSectionLink: {
    ...typography.button,
    color: colors.primary,
    fontSize: 14,
    lineHeight: 18,
  },
  mobileSectionLinkPressed: {
    opacity: 0.75,
  },
  mobileFeatureRail: {
    marginHorizontal: -spacing.xs,
  },
  mobileFeatureRailContent: {
    gap: spacing.sm + 2,
    paddingHorizontal: spacing.xs,
  },
  mobileFeatureCardWrap: {
    width: 124,
  },
  mobileListStack: {
    gap: spacing.sm,
  },
  mobileEventGrid: {
    gap: spacing.sm,
  },
  mobileEventGridItem: {
    flex: 1,
    minWidth: 0,
  },
  content: {
    paddingBottom: spacing.xxl,
  },
  contentWide: {
    paddingBottom: spacing.xxxl,
  },
  contentWeb: {
    paddingTop: 0,
    paddingHorizontal: spacing.xl + 2,
    maxWidth: webDesktopLayout.maxWidth,
  },
  stack: {
    gap: spacing.md + 2,
  },
  stackWeb: {
    gap: spacing.sm + 1,
  },
  heroBody: {
    gap: spacing.md,
  },
  heroBodyWeb: {
    gap: spacing.xs + 3,
  },
  heroBodyWide: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  heroPrimary: {
    flex: 1.1,
    gap: spacing.sm + 2,
    minWidth: 0,
  },
  heroPrimaryWeb: {
    gap: spacing.xs + 1,
  },
  heroSecondary: {
    flex: 0.92,
    gap: spacing.xs + 2,
    minWidth: 0,
  },
  heroSecondaryWeb: {
    gap: spacing.xs,
  },
  heroLead: {
    ...typography.bodyMuted,
    color: colors.textMuted,
    maxWidth: 560,
  },
  heroLeadWeb: {
    fontSize: 12,
    lineHeight: 17,
    maxWidth: 430,
  },
  heroSummaryCard: {
    borderRadius: 12,
    borderWidth: 0.75,
    borderColor: colors.border,
    backgroundColor: colors.surfaceRaised,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.sm,
    gap: 2,
    maxWidth: 280,
  },
  heroSummaryCardWeb: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs + 1,
    gap: 1,
    maxWidth: 236,
    borderWidth: 0.5,
  },
  heroSummaryLabel: {
    ...typography.caption,
    color: colors.textSubtle,
    fontWeight: '600',
  },
  heroSummaryLabelWeb: {
    fontSize: 10,
    lineHeight: 12,
  },
  heroSummaryValue: {
    ...typography.button,
    color: colors.text,
  },
  heroSummaryValueWeb: {
    fontSize: 13,
    lineHeight: 16,
  },
  headerActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs + 2,
  },
  headerPrimaryButton: {
    minHeight: 38,
    paddingHorizontal: spacing.md,
  },
  metricRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  metricRowWeb: {
    gap: 4,
  },
  heroStatusStrip: {
    borderRadius: 12,
    borderWidth: 0.75,
    borderColor: colors.border,
    backgroundColor: colors.surfaceRaised,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs + 3,
    gap: 2,
  },
  heroStatusStripWeb: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs + 1,
    gap: 1,
    borderWidth: 0.5,
    backgroundColor: colors.surface,
  },
  heroStatusTitle: {
    ...typography.caption,
    color: colors.text,
    fontWeight: '700',
  },
  heroStatusTitleWeb: {
    fontSize: 10,
    lineHeight: 12,
  },
  heroStatusBody: {
    ...typography.caption,
    color: colors.textMuted,
    lineHeight: 15,
  },
  heroStatusBodyWeb: {
    fontSize: 10,
    lineHeight: 13,
  },
  shelfMeta: {
    ...typography.caption,
    color: colors.textSubtle,
    fontWeight: '600',
    fontSize: 12,
    lineHeight: 16,
  },
  priorityGrid: {
    gap: spacing.md + 2,
  },
  priorityGridWeb: {
    gap: spacing.sm,
  },
  priorityGridWide: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  shelfGrid: {
    gap: spacing.md + 2,
  },
  shelfGridWeb: {
    gap: spacing.sm,
  },
  shelfGridWide: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  shelfColumn: {
    flex: 1,
    gap: spacing.md + 2,
    minWidth: 0,
  },
  shelfColumnWeb: {
    gap: spacing.md,
  },
  rail: {
    gap: spacing.xs + 2,
  },
  railCard: {
    width: 264,
  },
  railCardWeb: {
    width: 216,
  },
  desktopScreen: {
    backgroundColor: '#F8F2EB',
  },
  desktopContent: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxxl + 4,
    maxWidth: webDesktopLayout.maxWidth,
  },
  desktopContentWide: {
    paddingBottom: spacing.xxxl + 8,
  },
  desktopStack: {
    gap: spacing.xl + 2,
  },
  desktopBannerWrap: {
    maxWidth: 760,
  },
  heroSection: {
    gap: spacing.xxl,
    alignItems: 'center',
  },
  heroSectionWide: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroCopyColumn: {
    flex: 0.44,
    minWidth: 0,
    gap: spacing.lg,
  },
  heroMediaColumn: {
    flex: 0.56,
    width: '100%',
  },
  heroDisplayTitle: {
    ...typography.hero,
    fontSize: 66,
    lineHeight: 72,
    letterSpacing: -2.2,
    color: colors.text,
    maxWidth: 680,
  },
  heroDisplayTitleAccent: {
    color: colors.primary,
  },
  heroDisplaySubtitle: {
    ...typography.bodyMuted,
    fontSize: 18,
    lineHeight: 30,
    maxWidth: 560,
  },
  heroMediaFrame: {
    borderRadius: 34,
    borderWidth: 1,
    borderColor: '#E8DDD1',
    backgroundColor: '#FFF8F2',
    padding: spacing.md,
    overflow: 'hidden',
    position: 'relative',
  },
  heroMediaGlowPrimary: {
    position: 'absolute',
    top: -54,
    right: -28,
    width: 220,
    height: 220,
    borderRadius: 220,
    backgroundColor: '#F7D9D1',
    opacity: 0.75,
  },
  heroMediaGlowSecondary: {
    position: 'absolute',
    bottom: -76,
    left: -18,
    width: 200,
    height: 200,
    borderRadius: 200,
    backgroundColor: '#F5E8D9',
    opacity: 0.95,
  },
  heroMediaImage: {
    borderRadius: 26,
    borderWidth: 1,
    borderColor: 'rgba(229, 220, 209, 0.84)',
  },
  heroMediaFallback: {
    height: 272,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroMediaFallbackText: {
    ...typography.sectionTitle,
    color: colors.textMuted,
  },
  heroSearchBar: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 0,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: webDesktopControl.borderColor,
    backgroundColor: webDesktopSupportSurface.backgroundColor,
    overflow: 'hidden',
    marginTop: -spacing.xs,
    shadowColor: '#24150F',
    shadowOpacity: 0.05,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
  },
  heroSearchField: {
    flex: 1,
    minHeight: 82,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.xl + 2,
    backgroundColor: webDesktopSupportSurface.backgroundColor,
  },
  heroSearchFieldPrimary: {
    borderRightWidth: 1,
    borderRightColor: '#EAE0D6',
  },
  heroSearchFieldSecondary: {
    borderRightWidth: 1,
    borderRightColor: '#EAE0D6',
  },
  heroSearchFieldPressed: {
    opacity: 0.92,
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
    borderColor: colors.primary,
  },
  searchGlyphHandle: {
    position: 'absolute',
    right: 1,
    bottom: 3,
    width: 7,
    height: 1.5,
    borderRadius: 2,
    backgroundColor: colors.primary,
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
  heroSearchFieldIcon: {
    ...typography.title,
    color: colors.primary,
    fontSize: 20,
    lineHeight: 24,
  },
  heroSearchFieldCopy: {
    gap: 3,
    minWidth: 0,
    flex: 1,
  },
  heroSearchFieldLabel: {
    ...typography.button,
    color: colors.text,
    fontSize: 15,
    lineHeight: 19,
  },
  heroSearchFieldHint: {
    ...typography.caption,
    color: colors.textSubtle,
    fontSize: 13,
    lineHeight: 19,
  },
  heroSearchButton: {
    width: 132,
    minHeight: 82,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    gap: spacing.xs + 2,
  },
  heroSearchButtonLabel: {
    ...typography.button,
    color: colors.surface,
    fontSize: 15,
    lineHeight: 20,
  },
  heroExploreButton: {
    minWidth: 186,
    minHeight: 82,
    paddingHorizontal: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: webDesktopSupportSurface.backgroundColor,
    borderLeftWidth: 1,
    borderLeftColor: '#EAE0D6',
  },
  heroExploreButtonIcon: {
    ...typography.button,
    color: colors.primary,
    fontSize: 16,
    lineHeight: 18,
  },
  heroExploreButtonText: {
    ...typography.button,
    color: colors.primary,
    fontSize: 15,
    lineHeight: 20,
  },
  shortcutRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm + 2,
  },
  shortcutPill: {
    ...webDesktopChip,
    minWidth: 108,
    minHeight: 46,
    borderRadius: 16,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  shortcutPillPressed: {
    opacity: 0.84,
  },
  shortcutIcon: {
    width: 26,
    height: 26,
    borderRadius: 26,
    backgroundColor: colors.surfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shortcutIconGlyph: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 18,
  },
  shortcutLabel: {
    ...typography.caption,
    color: colors.text,
    fontSize: 13,
    lineHeight: 18,
  },
  sectionHeader: {
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.title,
    color: colors.text,
    fontSize: 22,
    lineHeight: 28,
  },
  sectionLinkText: {
    ...typography.caption,
    color: colors.primary,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },
  sectionLinkPressed: {
    opacity: 0.72,
  },
  desktopSectionCard: {
    ...webDesktopSurface,
    borderRadius: 26,
    padding: spacing.xl + 2,
  },
  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.lg,
  },
  featureGridWide: {
    flexWrap: 'nowrap',
  },
  featureGridCard: {
    flex: 1,
    minWidth: 220,
  },
  featureCard: {
    height: '100%',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: webDesktopSupportSurface.borderColor,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    shadowColor: '#24150F',
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  featureCardMobile: {
    borderRadius: 12,
    borderColor: '#DEDEDE',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  featureCardPressed: {
    opacity: 0.88,
  },
  featureImageWrap: {
    position: 'relative',
  },
  featureImage: {
    borderRadius: 0,
    borderWidth: 0,
  },
  featureImageMobile: {
    borderRadius: 0,
  },
  featureBookmark: {
    position: 'absolute',
    top: spacing.sm + 2,
    right: spacing.sm + 2,
    width: 34,
    height: 34,
    borderRadius: 34,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureBookmarkMobile: {
    width: 27,
    height: 27,
    borderRadius: 14,
    top: spacing.sm,
    right: spacing.sm,
  },
  bookmarkGlyph: {
    width: 14,
    height: 16,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  bookmarkGlyphBody: {
    position: 'absolute',
    top: 0,
    width: 10,
    height: 12,
    borderWidth: 1.3,
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
    height: 1.3,
    borderRadius: 2,
    backgroundColor: colors.textMuted,
    transform: [{ rotate: '35deg' }],
  },
  bookmarkGlyphFoldRight: {
    position: 'absolute',
    bottom: 1,
    right: 2,
    width: 5,
    height: 1.3,
    borderRadius: 2,
    backgroundColor: colors.textMuted,
    transform: [{ rotate: '-35deg' }],
  },
  featureBookmarkGlyph: {
    ...typography.caption,
    color: colors.text,
    fontSize: 16,
    lineHeight: 18,
  },
  featureBody: {
    gap: 6,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md + 2,
  },
  featureBodyMobile: {
    gap: 4,
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: spacing.sm,
  },
  featureTitle: {
    ...typography.button,
    color: colors.text,
    fontSize: 16,
    lineHeight: 21,
  },
  featureTitleMobile: {
    fontSize: 11,
    lineHeight: 15,
  },
  featureSubtitle: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 17,
  },
  featureSubtitleMobile: {
    fontSize: 10,
    lineHeight: 13,
  },
  featureMetaRow: {
    alignItems: 'center',
    gap: spacing.xs + 2,
    marginTop: spacing.xs + 1,
  },
  featureMetaText: {
    ...typography.caption,
    color: colors.textSubtle,
    fontSize: 11,
    lineHeight: 15,
  },
  featureMetaTextMobile: {
    fontSize: 9,
    lineHeight: 12,
  },
  featureMetaDivider: {
    ...typography.caption,
    color: colors.textSubtle,
    fontSize: 10,
    lineHeight: 14,
  },
  featureMetaDividerMobile: {
    fontSize: 9,
    lineHeight: 12,
  },
  featureRailArrow: {
    position: 'absolute',
    right: -spacing.lg,
    top: 86,
    width: 38,
    height: 38,
    borderRadius: 38,
    borderWidth: 0.75,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureRailArrowText: {
    ...typography.title,
    color: colors.textMuted,
    fontSize: 24,
    lineHeight: 28,
    marginTop: -1,
  },
  lowerGrid: {
    gap: spacing.lg,
  },
  lowerGridWide: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  moduleSection: {
    flex: 1,
    minWidth: 0,
  },
  moduleList: {
    gap: spacing.sm,
  },
  compactFallbackCard: {
    paddingVertical: spacing.md,
  },
  trendingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: webDesktopSupportSurface.borderColor,
    backgroundColor: webDesktopControl.backgroundColor,
    padding: spacing.sm + 3,
  },
  trendingRowMobile: {
    borderRadius: 12,
    borderColor: '#E0E0E0',
    backgroundColor: '#FAFAFA',
    padding: spacing.sm,
    gap: spacing.sm,
  },
  trendingThumb: {
    width: 86,
    borderRadius: 16,
    flexShrink: 0,
  },
  trendingThumbMobile: {
    width: 60,
    borderRadius: 10,
  },
  trendingBody: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  trendingCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  trendingTitle: {
    ...typography.button,
    color: colors.text,
    fontSize: 14,
    lineHeight: 18,
  },
  trendingTitleMobile: {
    fontSize: 13,
    lineHeight: 17,
  },
  trendingSubtitle: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 11,
    lineHeight: 16,
  },
  trendingSubtitleMobile: {
    fontSize: 11,
    lineHeight: 14,
  },
  trendingMetaRow: {
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs - 1,
  },
  trendingStar: {
    ...typography.caption,
    color: colors.primary,
    fontSize: 12,
    lineHeight: 15,
  },
  trendingMetaText: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 11,
    lineHeight: 15,
  },
  trendingMetaTextMobile: {
    fontSize: 11,
    lineHeight: 14,
  },
  trendingMetaDivider: {
    ...typography.caption,
    color: colors.textSubtle,
    fontSize: 10,
    lineHeight: 14,
  },
  inlineBookmark: {
    width: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: webDesktopSupportSurface.borderColor,
    backgroundColor: webDesktopControl.backgroundColor,
    padding: spacing.sm + 3,
  },
  eventRowMobile: {
    borderRadius: 12,
    borderColor: '#E0E0E0',
    backgroundColor: '#FAFAFA',
    padding: spacing.sm,
    gap: spacing.sm,
  },
  eventDateTile: {
    width: 58,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E8DDD1',
    backgroundColor: colors.surfaceRaised,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1,
  },
  eventDateTileMobile: {
    width: 46,
    borderRadius: 11,
    borderColor: '#E4E4E4',
    paddingVertical: spacing.xs + 1,
  },
  eventDateMonth: {
    ...typography.label,
    color: colors.primary,
    fontSize: 10,
    lineHeight: 12,
  },
  eventDateMonthMobile: {
    fontSize: 8,
    lineHeight: 10,
  },
  eventDateDay: {
    ...typography.title,
    color: colors.text,
    fontSize: 22,
    lineHeight: 24,
  },
  eventDateDayMobile: {
    fontSize: 18,
    lineHeight: 20,
  },
  eventRowCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  eventRowTitle: {
    ...typography.button,
    color: colors.text,
    fontSize: 14,
    lineHeight: 19,
  },
  eventRowTitleMobile: {
    fontSize: 13,
    lineHeight: 17,
  },
  eventRowSubtitle: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 11,
    lineHeight: 15,
  },
  eventRowSubtitleMobile: {
    fontSize: 11,
    lineHeight: 14,
  },
  eventRowTime: {
    ...typography.caption,
    color: colors.text,
    fontSize: 12,
    lineHeight: 16,
  },
  eventRowTimeMobile: {
    fontSize: 11,
    lineHeight: 14,
  },
  eventThumb: {
    width: 74,
    borderRadius: 16,
    flexShrink: 0,
  },
  eventThumbMobile: {
    width: 50,
    borderRadius: 10,
  },
  savedUpdateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: webDesktopSupportSurface.borderColor,
    backgroundColor: webDesktopControl.backgroundColor,
    padding: spacing.sm + 3,
  },
  savedUpdateRowMobile: {
    borderRadius: 12,
    borderColor: '#E0E0E0',
    backgroundColor: '#FAFAFA',
    padding: spacing.sm,
    gap: spacing.sm,
  },
  savedUpdateThumb: {
    width: 74,
    borderRadius: 16,
    flexShrink: 0,
  },
  savedUpdateThumbMobile: {
    width: 50,
    borderRadius: 10,
  },
  savedUpdateBody: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  savedUpdateCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  savedUpdateTitle: {
    ...typography.button,
    color: colors.text,
    fontSize: 14,
    lineHeight: 18,
  },
  savedUpdateTitleMobile: {
    fontSize: 13,
    lineHeight: 17,
  },
  savedUpdateSummary: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 11,
    lineHeight: 15,
  },
  savedUpdateSummaryMobile: {
    fontSize: 11,
    lineHeight: 14,
  },
  savedUpdateTime: {
    ...typography.caption,
    color: colors.textSubtle,
    fontSize: 11,
    lineHeight: 15,
  },
  savedUpdateTimeMobile: {
    fontSize: 10,
    lineHeight: 13,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 8,
    backgroundColor: colors.primary,
  },
});
