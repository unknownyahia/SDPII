import React from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';

import { EmptyState } from '../../components/ui/EmptyState';
import { LoadingState } from '../../components/ui/LoadingState';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { StatusBanner } from '../../components/ui/StatusBanner';
import {
  HOME_CATEGORY_OPTIONS,
  getCategoryOptionLabel,
} from '../../constants/categories';
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
import { colors } from '../../theme/designSystem';
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

const HERO_IMAGE_URI =
  'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1600&q=80';

type HomeCopy = {
  heroTitleLine1: string;
  heroTitleLine2: string;
  heroSubtitle: string;
  whatLabel: string;
  whatValue: string;
  whereLabel: string;
  whereValue: string;
  forYou: string;
  trendingNearby: string;
  popularEvents: string;
  savedUpdates: string;
  viewAll: string;
  searchAction: string;
  noResultsTitle: string;
  noResultsBody: string;
  noSaved: string;
  retry: string;
};

function getCopy(language: 'en' | 'ar'): HomeCopy {
  if (language === 'ar') {
    return {
      heroTitleLine1: 'اكتشف قطر،',
      heroTitleLine2: 'مكان رائع في كل مرة',
      heroSubtitle:
        'مأكولات محلية، زوايا للدراسة، أماكن خارجية، وفعاليات مباشرة حولك.',
      whatLabel: 'ماذا تبحث عنه؟',
      whatValue: 'قهوة، أماكن دراسة، فعاليات...',
      whereLabel: 'أين في قطر؟',
      whereValue: 'مدينة، منطقة، أو معلم',
      forYou: 'مخصص لك',
      trendingNearby: 'رائج بالقرب منك',
      popularEvents: 'فعاليات شائعة',
      savedUpdates: 'تحديثات المحفوظات',
      viewAll: 'عرض الكل',
      searchAction: 'بحث',
      noResultsTitle: 'لا توجد نتائج',
      noResultsBody: 'جرّب مرة أخرى بعد تحميل البيانات أو غيّر الفئة.',
      noSaved: 'احفظ أماكن من الاستكشاف لتظهر هنا.',
      retry: 'إعادة المحاولة',
    };
  }

  return {
    heroTitleLine1: 'Discover Qatar,',
    heroTitleLine2: 'one great spot at a time',
    heroSubtitle:
      'Local eats, study corners, outdoor escapes, and live events around you.',
    whatLabel: 'What are you looking for?',
    whatValue: 'Coffee, study spots, events...',
    whereLabel: 'Where in Qatar?',
    whereValue: 'City, area, or landmark',
    forYou: 'For You',
    trendingNearby: 'Trending Nearby',
    popularEvents: 'Popular Events',
    savedUpdates: 'Saved Spots Updates',
    viewAll: 'View all',
    searchAction: 'Search',
    noResultsTitle: 'No results yet',
    noResultsBody: 'Try again after data loads or switch to another category.',
    noSaved: 'Save places from Explore to see them here.',
    retry: 'Retry',
  };
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

function BookmarkGlyph({ active = false }: { active?: boolean }) {
  return (
    <Text style={[styles.bookmarkGlyph, active && styles.bookmarkGlyphActive]}>
      {active ? '🔖' : '⌑'}
    </Text>
  );
}

function SectionHeader({
  title,
  actionLabel,
  onPress,
}: {
  title: string;
  actionLabel: string;
  onPress: () => void;
}) {
  const { getRowDirection, getTextAlign, isRTL } = useLocalization();

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

      <Pressable onPress={onPress} style={({ pressed }) => [pressed && styles.pressed]}>
        <Text style={styles.sectionLink}>{actionLabel}</Text>
      </Pressable>
    </View>
  );
}

function getEventCalendarParts(value: unknown, language: 'en' | 'ar') {
  const timestampMs = getTimestampMs(value);
  if (timestampMs === null) {
    return {
      month: language === 'ar' ? 'الآن' : 'NOW',
      day: '--',
      time: language === 'ar' ? 'لاحقًا' : 'Soon',
    };
  }

  const date = new Date(timestampMs);
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

function formatRelativeHomeTime(value: unknown, language: 'en' | 'ar') {
  const timestampMs = getTimestampMs(value);
  if (timestampMs === null) {
    return language === 'ar' ? 'محدث الآن' : 'Updated now';
  }

  const diffMinutes = Math.max(1, Math.round((Date.now() - timestampMs) / 60000));

  if (diffMinutes < 60) {
    return language === 'ar' ? `قبل ${diffMinutes} د` : `${diffMinutes}m ago`;
  }

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) {
    return language === 'ar' ? `قبل ${diffHours} س` : `${diffHours}h ago`;
  }

  const diffDays = Math.round(diffHours / 24);
  return language === 'ar' ? `قبل ${diffDays} يوم` : `${diffDays}d ago`;
}

function getSpotRating(spot: DiscoverySpot) {
  const engagementCount = Math.max(spot.likeCount + spot.commentCount, 1);
  const ratingValue = (4.2 + Math.min(0.7, engagementCount * 0.08)).toFixed(1);
  return `${ratingValue} (${engagementCount})`;
}

export function HomeScreen() {
  const { user } = useAuth();
  const {
    language,
    isRTL,
    getTextAlign,
    getRowDirection,
  } = useLocalization();
  const navigation = useNavigation<BottomTabNavigationProp<MainTabParamList>>();
  const copy = React.useMemo(() => getCopy(language), [language]);

  const [loading, setLoading] = React.useState(true);
  const [posts, setPosts] = React.useState<SpotPost[]>([]);
  const [events, setEvents] = React.useState<PromotedEvent[]>([]);
  const [favoritePostIds, setFavoritePostIds] = React.useState<string[]>([]);
  const [notifications, setNotifications] = React.useState<AppNotification[]>([]);
  const [commentCountsByPostId, setCommentCountsByPostId] = React.useState<Record<string, number>>({});
  const [likeCountsByPostId, setLikeCountsByPostId] = React.useState<Record<string, number>>({});
  const [browserLocation, setBrowserLocation] = React.useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [dataIssue, setDataIssue] = React.useState<string | null>(null);
  const [refreshToken, setRefreshToken] = React.useState(0);

  const identityInitial = (user?.displayInfo || user?.email || 'S').trim().charAt(0).toUpperCase();

  const handleDataIssue = React.useCallback(
    (error: unknown, fallbackMessage: string) => {
      setDataIssue(
        isDataAccessBlockedError(error)
          ? getBlockedDataMessage(language === 'ar' ? 'بيانات الصفحة الرئيسية' : 'Home data')
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
        handleDataIssue(error, 'Failed to load home posts.');
        setLoading(false);
      }
    );

    const unsubEvents = subscribeToEvents(
      nextEvents => {
        setEvents(nextEvents);
      },
      error => {
        handleDataIssue(error, 'Failed to load events.');
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
      error => handleDataIssue(error, 'Failed to load favorites.')
    );
  }, [handleDataIssue, refreshToken, user?.id]);

  React.useEffect(() => {
    return observeNotifications(
      user?.id,
      next => setNotifications(next),
      error => handleDataIssue(error, 'Failed to load notifications.')
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

  React.useEffect(() => {
    const syncLocation = async () => {
      try {
        const permission = await requestForegroundLocationPermission();
        if (permission.status !== 'granted') {
          return;
        }

        const coords = await getCurrentCoordinates();
        setBrowserLocation(coords);
      } catch {
        // Keep null and allow default ranking.
      }
    };

    void syncLocation();
  }, []);

  const discoverySpots = React.useMemo(
    () =>
      buildDiscoverySpotItems(posts, {
        favoritePostIds,
        browserLocation,
        commentCountsByPostId,
        likeCountsByPostId,
        searchQuery: '',
        language,
      }),
    [browserLocation, commentCountsByPostId, favoritePostIds, language, likeCountsByPostId, posts]
  );

  const discoveryEvents = React.useMemo(
    () =>
      buildDiscoveryEventItems(events, {
        posts,
        browserLocation,
        searchQuery: '',
        language,
      }),
    [browserLocation, events, language, posts]
  );

  const forYouSpots = React.useMemo(() => discoverySpots.slice(0, 5), [discoverySpots]);
  const trendingSpots = React.useMemo(() => discoverySpots.slice(5, 9), [discoverySpots]);
  const popularEvents = React.useMemo(() => discoveryEvents.slice(0, 4), [discoveryEvents]);

  const savedSpotUpdates = React.useMemo(() => {
    const favoriteSet = new Set(favoritePostIds);
    return discoverySpots.filter(item => favoriteSet.has(item.postId)).slice(0, 3);
  }, [discoverySpots, favoritePostIds]);

  const unreadCount = notifications.filter(item => !item.isRead).length;

  const handleRetry = React.useCallback(() => {
    setRefreshToken(value => value + 1);
    setDataIssue(null);
  }, []);

  const openExploreSearch = React.useCallback(
    (params?: MainTabParamList['Explore']) => {
      navigation.navigate('Explore', params);
    },
    [navigation]
  );

  if (loading) {
    return <LoadingState label={language === 'ar' ? 'الرئيسية' : 'Home'} />;
  }

  return (
    <ScreenContainer
      scroll
      padded={false}
      style={styles.screen}
      contentContainerStyle={styles.content}
    >
      <View style={styles.shell}>
        <View style={[styles.topBar, { flexDirection: getRowDirection() }]}>
          <Text style={styles.brandText}>Spots</Text>

          <View style={[styles.topActions, { flexDirection: getRowDirection() }]}>
            <Pressable
              accessibilityRole="button"
              onPress={() => navigation.navigate('Profile')}
              style={styles.topIconButton}
            >
              <BellGlyph />
              {unreadCount > 0 ? <View style={styles.unreadDot} /> : null}
            </Pressable>

            <Pressable
              accessibilityRole="button"
              onPress={() => navigation.navigate('Profile')}
              style={styles.topIconButton}
            >
              <Text style={styles.topIconGlyph}>♡</Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              onPress={() => navigation.navigate('Profile')}
              style={styles.avatarFrame}
            >
              <Image source={{ uri: MOBILE_AVATAR_FALLBACK_URI }} style={styles.avatarImage} />
              {!user ? <Text style={styles.avatarFallback}>{identityInitial}</Text> : null}
            </Pressable>
          </View>
        </View>

        <View style={[styles.heroSection, { flexDirection: getRowDirection() }]}>
          <View style={styles.heroCopy}>
            <Text
              style={[
                styles.heroTitlePrimary,
                { textAlign: getTextAlign(), writingDirection: isRTL ? 'rtl' : 'ltr' },
              ]}
            >
              {copy.heroTitleLine1}
            </Text>
            <Text
              style={[
                styles.heroTitleAccent,
                { textAlign: getTextAlign(), writingDirection: isRTL ? 'rtl' : 'ltr' },
              ]}
            >
              {copy.heroTitleLine2}
            </Text>
            <Text
              style={[
                styles.heroSubtitle,
                { textAlign: getTextAlign(), writingDirection: isRTL ? 'rtl' : 'ltr' },
              ]}
            >
              {copy.heroSubtitle}
            </Text>
          </View>

          <Image source={{ uri: HERO_IMAGE_URI }} style={styles.heroImage} />
        </View>

        <View style={styles.searchCard}>
          <Pressable
            accessibilityRole="button"
            onPress={() => openExploreSearch({ focusSearch: true })}
            style={({ pressed }) => [
              styles.searchRow,
              { flexDirection: getRowDirection() },
              pressed && styles.pressed,
            ]}
          >
            <View style={styles.searchIconWrap}>
              <Text style={styles.searchIcon}>⌕</Text>
            </View>
            <View style={styles.searchCopy}>
              <Text
                style={[
                  styles.searchLabel,
                  { textAlign: getTextAlign(), writingDirection: isRTL ? 'rtl' : 'ltr' },
                ]}
              >
                {copy.whatLabel}
              </Text>
              <Text
                style={[
                  styles.searchValue,
                  { textAlign: getTextAlign(), writingDirection: isRTL ? 'rtl' : 'ltr' },
                ]}
              >
                {copy.whatValue}
              </Text>
            </View>
          </Pressable>

          <View style={styles.searchDivider} />

          <View style={[styles.searchRow, { flexDirection: getRowDirection() }]}>
            <Pressable
              accessibilityRole="button"
              onPress={() => openExploreSearch({ focusSearch: true })}
              style={({ pressed }) => [
                styles.searchRowBody,
                { flexDirection: getRowDirection() },
                pressed && styles.pressed,
              ]}
            >
              <View style={styles.searchIconWrap}>
                <Text style={styles.searchIcon}>⌖</Text>
              </View>
              <View style={styles.searchCopy}>
                <Text
                  style={[
                    styles.searchLabel,
                    { textAlign: getTextAlign(), writingDirection: isRTL ? 'rtl' : 'ltr' },
                  ]}
                >
                  {copy.whereLabel}
                </Text>
                <Text
                  style={[
                    styles.searchValue,
                    { textAlign: getTextAlign(), writingDirection: isRTL ? 'rtl' : 'ltr' },
                  ]}
                >
                  {copy.whereValue}
                </Text>
              </View>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              onPress={() => openExploreSearch({ focusSearch: true })}
              style={({ pressed }) => [styles.searchActionButton, pressed && styles.pressed]}
            >
              <Text style={styles.searchActionButtonLabel}>{copy.searchAction}</Text>
            </Pressable>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[
            styles.categoryRow,
            { flexDirection: getRowDirection() },
          ]}
        >
          {HOME_CATEGORY_OPTIONS.map(item => (
            <Pressable
              key={item.id}
              accessibilityRole="button"
              onPress={() =>
                openExploreSearch({
                  chipId: item.id,
                  query: '',
                  focusSearch: false,
                })
              }
              style={styles.categoryChip}
            >
              <Text
                style={[
                  styles.categoryChipLabel,
                  { writingDirection: isRTL ? 'rtl' : 'ltr' },
                ]}
              >
                {getCategoryOptionLabel(item, language)}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {dataIssue ? (
          <StatusBanner
            compact
            tone="warning"
            title={language === 'ar' ? 'تعذر تحميل بعض البيانات' : 'Some data could not be loaded'}
            body={dataIssue}
            actions={[
              {
                label: copy.retry,
                onPress: handleRetry,
                tone: 'primary',
              },
            ]}
          />
        ) : null}

        {forYouSpots.length === 0 ? (
          <EmptyState title={copy.noResultsTitle} body={copy.noResultsBody} />
        ) : (
          <>
            <SectionHeader
              title={copy.forYou}
              actionLabel={copy.viewAll}
              onPress={() => navigation.navigate('Explore')}
            />

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.forYouRow}
            >
              {forYouSpots.map(spot => (
                <Pressable
                  key={spot.id}
                  onPress={() => navigation.navigate('Explore')}
                  style={styles.forYouCard}
                >
                  <Image
                    source={{
                      uri:
                        spot.hero.imageUrl ||
                        HERO_IMAGE_URI,
                    }}
                    style={styles.forYouImage}
                  />

                  <View style={styles.forYouBookmark}>
                    <BookmarkGlyph active={spot.saved} />
                  </View>

                  <View style={styles.forYouBody}>
                    <Text
                      numberOfLines={2}
                      style={[
                        styles.forYouTitle,
                        { writingDirection: isRTL ? 'rtl' : 'ltr' },
                      ]}
                    >
                      {spot.title}
                    </Text>

                    <Text
                      numberOfLines={1}
                      style={[
                        styles.forYouMeta,
                        { writingDirection: isRTL ? 'rtl' : 'ltr' },
                      ]}
                    >
                      {spot.locationLabel}
                    </Text>

                    <View style={[styles.forYouFooter, { flexDirection: getRowDirection() }]}>
                      <Text style={styles.forYouDistance}>{spot.distanceLabel}</Text>
                      <Text style={styles.forYouTime}>
                        {formatRelativeHomeTime(spot.rawPost.createdAt, language)}
                      </Text>
                    </View>
                  </View>
                </Pressable>
              ))}
            </ScrollView>

            <SectionHeader
              title={copy.trendingNearby}
              actionLabel={copy.viewAll}
              onPress={() => navigation.navigate('Explore')}
            />

            <View style={styles.listSection}>
              {trendingSpots.map(spot => (
                <Pressable
                  key={spot.id}
                  onPress={() => navigation.navigate('Explore')}
                  style={styles.listCard}
                >
                  <Image
                    source={{
                      uri:
                        spot.hero.imageUrl ||
                        HERO_IMAGE_URI,
                    }}
                    style={styles.listCardImage}
                  />

                  <View style={styles.listCardBody}>
                    <Text
                      numberOfLines={1}
                      style={[
                        styles.listCardTitle,
                        { writingDirection: isRTL ? 'rtl' : 'ltr' },
                      ]}
                    >
                      {spot.title}
                    </Text>

                    <Text
                      numberOfLines={1}
                      style={[
                        styles.listCardMeta,
                        { writingDirection: isRTL ? 'rtl' : 'ltr' },
                      ]}
                    >
                      {spot.areaLabel} • {spot.categoryLabel}
                    </Text>

                    <View style={[styles.listCardFooter, { flexDirection: getRowDirection() }]}>
                      <Text style={styles.listCardRating}>{getSpotRating(spot)}</Text>
                      <Text style={styles.listCardDistance}>{spot.distanceLabel}</Text>
                    </View>
                  </View>

                  <View style={styles.listCardAction}>
                    <BookmarkGlyph active={spot.saved} />
                  </View>
                </Pressable>
              ))}
            </View>

            <SectionHeader
              title={copy.popularEvents}
              actionLabel={copy.viewAll}
              onPress={() => navigation.navigate('Explore')}
            />

            <View style={styles.eventSection}>
              {popularEvents.map((event: DiscoveryEvent) => {
                const calendar = getEventCalendarParts(event.rawEvent.startTime, language);

                return (
                  <Pressable
                    key={event.id}
                    onPress={() => navigation.navigate('Explore')}
                    style={styles.eventCard}
                  >
                    <View style={styles.eventDateTile}>
                      <Text style={styles.eventMonth}>{calendar.month}</Text>
                      <Text style={styles.eventDay}>{calendar.day}</Text>
                    </View>

                    <View style={styles.eventBody}>
                      <Text
                        numberOfLines={1}
                        style={[
                          styles.eventTitle,
                          { writingDirection: isRTL ? 'rtl' : 'ltr' },
                        ]}
                      >
                        {event.title}
                      </Text>

                      <Text
                        numberOfLines={1}
                        style={[
                          styles.eventVenue,
                          { writingDirection: isRTL ? 'rtl' : 'ltr' },
                        ]}
                      >
                        {event.venueLabel}
                      </Text>

                      <Text style={styles.eventTime}>{calendar.time}</Text>
                    </View>

                    <Image
                      source={{
                        uri:
                          event.hero.imageUrl ||
                          HERO_IMAGE_URI,
                      }}
                      style={styles.eventImage}
                    />
                  </Pressable>
                );
              })}
            </View>

            <SectionHeader
              title={copy.savedUpdates}
              actionLabel={copy.viewAll}
              onPress={() => navigation.navigate('Profile')}
            />

            <View style={styles.savedUpdatesSection}>
              {savedSpotUpdates.length === 0 ? (
                <EmptyState title={copy.savedUpdates} body={copy.noSaved} />
              ) : (
                savedSpotUpdates.map((spot, index) => (
                  <Pressable
                    key={spot.id}
                    onPress={() => navigation.navigate('Profile')}
                    style={styles.savedUpdateRow}
                  >
                    <Image
                      source={{
                        uri:
                          spot.hero.imageUrl ||
                          HERO_IMAGE_URI,
                      }}
                      style={styles.savedUpdateImage}
                    />

                    <View style={styles.savedUpdateBody}>
                      <Text
                        numberOfLines={1}
                        style={[
                          styles.savedUpdateTitle,
                          { writingDirection: isRTL ? 'rtl' : 'ltr' },
                        ]}
                      >
                        {spot.title}
                      </Text>

                      <Text
                        numberOfLines={1}
                        style={[
                          styles.savedUpdateText,
                          { writingDirection: isRTL ? 'rtl' : 'ltr' },
                        ]}
                      >
                        {spot.summary || spot.description}
                      </Text>

                      <Text style={styles.savedUpdateTime}>
                        {formatRelativeHomeTime(spot.rawPost.createdAt, language)}
                      </Text>
                    </View>

                    {index === 0 ? <View style={styles.savedUpdateUnreadDot} /> : null}
                  </Pressable>
                ))
              )}
            </View>
          </>
        )}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 120,
  },
  shell: {
    gap: 14,
  },

  topBar: {
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 48,
    paddingTop: 4,
  },
  brandText: {
    fontSize: 28,
    lineHeight: 32,
    fontWeight: '800',
    color: colors.primary,
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
    position: 'relative',
  },
  topIconGlyph: {
    fontSize: 22,
    lineHeight: 24,
    color: '#433B36',
  },
  unreadDot: {
    position: 'absolute',
    top: -1,
    right: -1,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  avatarFrame: {
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
    backgroundColor: colors.primary,
  },

  heroSection: {
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 14,
  },
  heroCopy: {
    flex: 1,
    gap: 2,
    paddingTop: 4,
  },
  heroTitlePrimary: {
    fontSize: 29,
    lineHeight: 34,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.8,
  },
  heroTitleAccent: {
    fontSize: 29,
    lineHeight: 34,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: -0.8,
  },
  heroSubtitle: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textMuted,
    maxWidth: 220,
  },
  heroImage: {
    width: 146,
    height: 128,
    borderRadius: 24,
    backgroundColor: '#E6DED4',
  },

  searchCard: {
    backgroundColor: colors.surface,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
    shadowColor: '#20150E',
    shadowOpacity: 0.04,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  searchRow: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchRowBody: {
    flex: 1,
    alignItems: 'center',
  },
  searchIconWrap: {
    width: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchIcon: {
    fontSize: 22,
    lineHeight: 24,
    color: colors.primary,
  },
  searchCopy: {
    flex: 1,
    gap: 2,
  },
  searchLabel: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '700',
    color: '#2A211D',
  },
  searchValue: {
    fontSize: 15,
    lineHeight: 20,
    color: '#80756E',
  },
  searchDivider: {
    height: 1,
    backgroundColor: '#EEE7E0',
    marginHorizontal: 2,
  },
  searchActionButton: {
    minWidth: 76,
    height: 46,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  searchActionButtonLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    lineHeight: 17,
    fontWeight: '700',
  },

  categoryRow: {
    gap: 10,
    paddingVertical: 2,
  },
  categoryChip: {
    minHeight: 40,
    paddingHorizontal: 18,
    borderRadius: 999,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: '#E8E2DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryChipLabel: {
    fontSize: 14,
    lineHeight: 17,
    fontWeight: '600',
    color: '#564C47',
  },

  sectionHeader: {
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: 19,
    lineHeight: 24,
    fontWeight: '800',
    color: colors.text,
  },
  sectionLink: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '700',
    color: colors.primary,
  },

  forYouRow: {
    gap: 12,
    paddingBottom: 2,
  },
  forYouCard: {
    width: 228,
    backgroundColor: colors.surface,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    shadowColor: '#20150E',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },
  forYouImage: {
    width: '100%',
    height: 150,
    backgroundColor: '#E8E0D7',
  },
  forYouBookmark: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.94)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  forYouBody: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 4,
  },
  forYouTitle: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '800',
    color: colors.text,
  },
  forYouMeta: {
    fontSize: 14,
    lineHeight: 18,
    color: colors.textMuted,
  },
  forYouFooter: {
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  forYouDistance: {
    fontSize: 12,
    lineHeight: 15,
    color: '#8F847D',
    fontWeight: '600',
  },
  forYouTime: {
    fontSize: 12,
    lineHeight: 15,
    color: '#8F847D',
    fontWeight: '600',
  },

  listSection: {
    gap: 10,
  },
  listCard: {
    minHeight: 96,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  listCardImage: {
    width: 82,
    height: 82,
    borderRadius: 16,
    backgroundColor: '#E8E0D7',
  },
  listCardBody: {
    flex: 1,
    gap: 4,
  },
  listCardTitle: {
    fontSize: 15,
    lineHeight: 18,
    fontWeight: '800',
    color: colors.text,
  },
  listCardMeta: {
    fontSize: 13,
    lineHeight: 17,
    color: colors.textMuted,
  },
  listCardFooter: {
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  listCardRating: {
    fontSize: 12,
    lineHeight: 15,
    color: '#5F554F',
    fontWeight: '700',
  },
  listCardDistance: {
    fontSize: 12,
    lineHeight: 15,
    color: '#8E837C',
    fontWeight: '600',
  },
  listCardAction: {
    width: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },

  eventSection: {
    gap: 10,
  },
  eventCard: {
    minHeight: 96,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  eventDateTile: {
    width: 54,
    minHeight: 72,
    borderRadius: 16,
    backgroundColor: '#FFF2EF',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  eventMonth: {
    fontSize: 11,
    lineHeight: 13,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.5,
  },
  eventDay: {
    fontSize: 22,
    lineHeight: 24,
    fontWeight: '800',
    color: colors.text,
  },
  eventBody: {
    flex: 1,
    gap: 4,
  },
  eventTitle: {
    fontSize: 15,
    lineHeight: 18,
    fontWeight: '800',
    color: colors.text,
  },
  eventVenue: {
    fontSize: 13,
    lineHeight: 17,
    color: colors.textMuted,
  },
  eventTime: {
    fontSize: 12,
    lineHeight: 15,
    color: '#8E837C',
    fontWeight: '600',
  },
  eventImage: {
    width: 72,
    height: 72,
    borderRadius: 16,
    backgroundColor: '#E8E0D7',
  },

  savedUpdatesSection: {
    gap: 10,
    marginBottom: 6,
  },
  savedUpdateRow: {
    minHeight: 84,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    position: 'relative',
  },
  savedUpdateImage: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: '#E8E0D7',
  },
  savedUpdateBody: {
    flex: 1,
    gap: 4,
  },
  savedUpdateTitle: {
    fontSize: 15,
    lineHeight: 18,
    fontWeight: '800',
    color: colors.text,
  },
  savedUpdateText: {
    fontSize: 13,
    lineHeight: 17,
    color: colors.textMuted,
  },
  savedUpdateTime: {
    fontSize: 12,
    lineHeight: 15,
    color: '#8E837C',
    fontWeight: '600',
  },
  savedUpdateUnreadDot: {
    position: 'absolute',
    right: 14,
    top: 14,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },

  bookmarkGlyph: {
    fontSize: 19,
    lineHeight: 20,
    color: '#5B514B',
  },
  bookmarkGlyphActive: {
    color: colors.primary,
  },

  pressed: {
    opacity: 0.82,
  },
});
