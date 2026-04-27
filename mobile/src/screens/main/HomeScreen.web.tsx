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
import Ionicons from '@expo/vector-icons/Ionicons';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';

import { EmptyState } from '../../components/ui/EmptyState';
import { LoadingState } from '../../components/ui/LoadingState';
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
import { webDesktopColors, webDesktopLayout } from '../../theme/webDesktopSystem';
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

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1658863714664-bced34d5606f?auto=format&fit=crop&w=1600&q=80';

function getHomeCopy(language: 'en' | 'ar') {
  if (language === 'ar') {
    return {
      titleLineOne: 'اكتشف قطر،',
      titleLineTwo: 'مكان رائع في كل مرة',
      subtitle:
        'مأكولات محلية، زوايا للدراسة، أماكن خارجية، وفعاليات مباشرة حولك.',
      what: 'ماذا تبحث عنه؟',
      whatPlaceholder: 'قهوة، أماكن دراسة، فعاليات...',
      where: 'أين في قطر؟',
      wherePlaceholder: 'مدينة، منطقة، أو معلم',
      openExplore: 'افتح الاستكشاف',
      forYou: 'مخصص لك',
      trending: 'رائج بالقرب منك',
      events: 'فعاليات شائعة',
      saved: 'تحديثات المحفوظات',
      viewAll: 'عرض الكل',
      noResultsTitle: 'لا توجد نتائج بعد',
      noResultsBody: 'انشر تحديثا جديدا أو جرّب الاستكشاف بعد تحميل البيانات.',
      dataIssueTitle: 'تعذر تحميل بعض بيانات الرئيسية',
      retry: 'إعادة المحاولة',
      noEvents: 'لا توجد فعاليات شائعة بعد.',
      noSaved: 'احفظ أماكن من الاستكشاف لتظهر هنا.',
    };
  }

  return {
    titleLineOne: 'Discover Qatar,',
    titleLineTwo: 'one great spot at a time',
    subtitle:
      'Local eats, study corners, outdoor escapes and live events. Find what matters near you.',
    what: 'What are you looking for?',
    whatPlaceholder: 'Coffee, study spots, events...',
    where: 'Where in Qatar?',
    wherePlaceholder: 'City, area, or landmark',
    openExplore: 'Open Explore',
    forYou: 'For You',
    trending: 'Trending Nearby',
    events: 'Popular Events',
    saved: 'Saved Spots Updates',
    viewAll: 'View all',
    noResultsTitle: 'No results yet',
    noResultsBody: 'Publish a local update or try Explore again after data loads.',
    dataIssueTitle: 'Some Home data could not be loaded',
    retry: 'Retry',
    noEvents: 'No popular events yet.',
    noSaved: 'Save places from Explore to see them here.',
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

function getEventCalendarParts(value: unknown, language: 'en' | 'ar') {
  const timestampMs = getTimestampMs(value);
  if (timestampMs === null) {
    return {
      month: language === 'ar' ? 'الآن' : 'NOW',
      day: '--',
      time: language === 'ar' ? 'لاحقا' : 'Soon',
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

function getSpotRating(spot: DiscoverySpot) {
  const engagementCount = Math.max(spot.likeCount + spot.commentCount, 1);
  const ratingValue = (4.2 + Math.min(0.7, engagementCount * 0.08)).toFixed(1);
  return `${ratingValue} (${engagementCount})`;
}

function getHeroImage(imageUrl?: string | null) {
  return imageUrl && imageUrl.trim().length > 0 ? imageUrl : HERO_IMAGE;
}

export function HomeScreen() {
  const navigation = useNavigation<BottomTabNavigationProp<MainTabParamList>>();
  const { user } = useAuth();
  const {
    language,
    isRTL,
    getTextAlign,
  } = useLocalization();
  const copy = React.useMemo(() => getHomeCopy(language), [language]);
  const textAlign = getTextAlign();

  const [searchQuery, setSearchQuery] = React.useState('');
  const [whereQuery, setWhereQuery] = React.useState('');
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

  const handleDataIssue = React.useCallback(
    (error: unknown, fallbackMessage: string) => {
      setDataIssue(
        isDataAccessBlockedError(error)
          ? getBlockedDataMessage(language === 'ar' ? 'بيانات الرئيسية' : 'Home data')
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
        handleDataIssue(error, 'Failed to load home posts.');
        setLoading(false);
      }
    );

    const unsubscribeEvents = subscribeToEvents(
      nextEvents => {
        setEvents(nextEvents);
      },
      error => {
        handleDataIssue(error, 'Failed to load events.');
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
        setBrowserLocation(null);
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
  const trendingSpots = React.useMemo(() => {
    const source = discoverySpots.length > 5 ? discoverySpots.slice(5) : discoverySpots;
    return source.slice(0, 2);
  }, [discoverySpots]);
  const popularEvents = React.useMemo(() => discoveryEvents.slice(0, 2), [discoveryEvents]);
  const savedSpotUpdates = React.useMemo(() => {
    const favoriteSet = new Set(favoritePostIds);
    return discoverySpots.filter(item => favoriteSet.has(item.postId)).slice(0, 2);
  }, [discoverySpots, favoritePostIds]);

  const openExplore = React.useCallback(
    (params?: MainTabParamList['Explore']) => {
      navigation.navigate('Explore', params);
    },
    [navigation]
  );

  const handleSubmitSearch = React.useCallback(() => {
    openExplore({
      query: searchQuery.trim(),
      where: whereQuery.trim(),
      focusSearch: true,
    });
  }, [openExplore, searchQuery, whereQuery]);

  const handleRetry = React.useCallback(() => {
    setDataIssue(null);
    setRefreshToken(value => value + 1);
  }, []);

  if (loading) {
    return <LoadingState label={language === 'ar' ? 'الرئيسية' : 'Home'} />;
  }

  return (
    <ScrollView
      style={styles.page}
      contentContainerStyle={styles.pageContent}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <View style={[styles.container, { direction: isRTL ? 'rtl' : 'ltr' }]}>
        <View style={[styles.heroShell, isRTL && styles.heroShellRtl]}>
          <View style={styles.heroCopy}>
            <Text
              style={[
                styles.heroTitleBlack,
                { textAlign, writingDirection: isRTL ? 'rtl' : 'ltr' },
              ]}
            >
              {copy.titleLineOne}
            </Text>
            <Text
              style={[
                styles.heroTitleRed,
                { textAlign, writingDirection: isRTL ? 'rtl' : 'ltr' },
              ]}
            >
              {copy.titleLineTwo}
            </Text>
            <Text
              style={[
                styles.heroSubtitle,
                { textAlign, writingDirection: isRTL ? 'rtl' : 'ltr' },
              ]}
            >
              {copy.subtitle}
            </Text>
          </View>

          <Image source={{ uri: HERO_IMAGE }} style={styles.heroImage} />
        </View>

        <View style={styles.searchBar}>
          <View style={styles.searchSegment}>
            <Ionicons name="search-outline" size={22} color={webDesktopColors.primary} />
            <View style={styles.searchInputBlock}>
              <Text
                style={[
                  styles.searchLabel,
                  { textAlign, writingDirection: isRTL ? 'rtl' : 'ltr' },
                ]}
              >
                {copy.what}
              </Text>
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={handleSubmitSearch}
                returnKeyType="search"
                clearButtonMode="while-editing"
                placeholder={copy.whatPlaceholder}
                placeholderTextColor={webDesktopColors.textSoft}
                style={[
                  styles.searchInput,
                  { textAlign, writingDirection: isRTL ? 'rtl' : 'ltr' },
                ]}
              />
            </View>
          </View>

          <View style={styles.searchDivider} />

          <View style={styles.searchSegment}>
            <Ionicons name="location-outline" size={22} color={webDesktopColors.primary} />
            <View style={styles.searchInputBlock}>
              <Text
                style={[
                  styles.searchLabel,
                  { textAlign, writingDirection: isRTL ? 'rtl' : 'ltr' },
                ]}
              >
                {copy.where}
              </Text>
              <TextInput
                value={whereQuery}
                onChangeText={setWhereQuery}
                onSubmitEditing={handleSubmitSearch}
                returnKeyType="search"
                clearButtonMode="while-editing"
                placeholder={copy.wherePlaceholder}
                placeholderTextColor={webDesktopColors.textSoft}
                style={[
                  styles.searchInput,
                  { textAlign, writingDirection: isRTL ? 'rtl' : 'ltr' },
                ]}
              />
            </View>
          </View>

          <Pressable
            accessibilityRole="button"
            style={({ pressed }) => [styles.searchButton, pressed && styles.pressed]}
            onPress={handleSubmitSearch}
          >
            <Ionicons name="search-outline" size={24} color="#FFFFFF" />
          </Pressable>

          <Pressable
            accessibilityRole="button"
            style={({ pressed }) => [styles.openExploreButton, pressed && styles.pressed]}
            onPress={() => openExplore()}
          >
            <Ionicons name="paper-plane-outline" size={18} color={webDesktopColors.primary} />
            <Text style={styles.openExploreButtonText}>{copy.openExplore}</Text>
          </Pressable>
        </View>

        <View style={styles.categoryRow}>
          {HOME_CATEGORY_OPTIONS.map(item => (
            <Pressable
              key={item.id}
              accessibilityRole="button"
              style={({ pressed }) => [styles.categoryChip, pressed && styles.pressed]}
              onPress={() => openExplore({ chipId: item.id })}
            >
              <Ionicons
                name={item.icon as keyof typeof Ionicons.glyphMap}
                size={18}
                color="#5F5650"
              />
              <Text
                style={[
                  styles.categoryChipText,
                  { writingDirection: isRTL ? 'rtl' : 'ltr' },
                ]}
              >
                {getCategoryOptionLabel(item, language)}
              </Text>
            </Pressable>
          ))}
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

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{copy.forYou}</Text>
          <Pressable onPress={() => openExplore()}>
            <Text style={styles.viewAll}>{copy.viewAll}</Text>
          </Pressable>
        </View>

        {forYouSpots.length === 0 ? (
          <EmptyState title={copy.noResultsTitle} body={copy.noResultsBody} />
        ) : (
          <View style={styles.featureRow}>
            {forYouSpots.map(spot => (
              <Pressable
                key={spot.id}
                style={({ pressed }) => [styles.featureCard, pressed && styles.pressed]}
                onPress={() => openExplore({ query: spot.title })}
              >
                <Image source={{ uri: getHeroImage(spot.hero.imageUrl) }} style={styles.featureImage} />
                <View style={styles.featureBookmark}>
                  <Ionicons
                    name={spot.saved ? 'bookmark' : 'bookmark-outline'}
                    size={18}
                    color="#4F4640"
                  />
                </View>
                <View style={styles.featureBody}>
                  <Text
                    style={[
                      styles.featureTitle,
                      { writingDirection: isRTL ? 'rtl' : 'ltr' },
                    ]}
                    numberOfLines={2}
                  >
                    {spot.title}
                  </Text>
                  <Text
                    style={[
                      styles.featureMeta,
                      { writingDirection: isRTL ? 'rtl' : 'ltr' },
                    ]}
                    numberOfLines={1}
                  >
                    {spot.locationLabel} - {spot.categoryLabel}
                  </Text>
                  <View style={styles.featureFooter}>
                    <Text style={styles.featureFooterText}>{spot.distanceLabel}</Text>
                    <Text style={styles.featureFooterText}>
                      {formatRelativeHomeTime(spot.rawPost.createdAt, language)}
                    </Text>
                  </View>
                </View>
              </Pressable>
            ))}
          </View>
        )}

        <View style={styles.threeColRow}>
          <View style={styles.columnCard}>
            <View style={styles.sectionHeaderSmall}>
              <Text style={styles.columnTitle}>{copy.trending}</Text>
              <Pressable onPress={() => openExplore()}>
                <Text style={styles.viewAll}>{copy.viewAll}</Text>
              </Pressable>
            </View>

            {trendingSpots.length === 0 ? (
              <Text style={styles.emptyColumnText}>{copy.noResultsBody}</Text>
            ) : (
              trendingSpots.map(spot => (
                <Pressable
                  key={spot.id}
                  style={({ pressed }) => [styles.compactRow, pressed && styles.pressed]}
                  onPress={() => openExplore({ query: spot.title })}
                >
                  <Image source={{ uri: getHeroImage(spot.hero.imageUrl) }} style={styles.compactThumb} />
                  <View style={styles.compactBody}>
                    <Text style={styles.compactTitle} numberOfLines={1}>
                      {spot.title}
                    </Text>
                    <Text style={styles.compactMeta} numberOfLines={1}>
                      {spot.areaLabel} - {spot.categoryLabel}
                    </Text>
                    <Text style={styles.compactSubMeta}>
                      {getSpotRating(spot)} - {spot.distanceLabel}
                    </Text>
                  </View>
                  <Ionicons
                    name={spot.saved ? 'bookmark' : 'bookmark-outline'}
                    size={18}
                    color="#6E655F"
                  />
                </Pressable>
              ))
            )}
          </View>

          <View style={styles.columnCard}>
            <View style={styles.sectionHeaderSmall}>
              <Text style={styles.columnTitle}>{copy.events}</Text>
              <Pressable onPress={() => openExplore({ chipId: 'events' })}>
                <Text style={styles.viewAll}>{copy.viewAll}</Text>
              </Pressable>
            </View>

            {popularEvents.length === 0 ? (
              <Text style={styles.emptyColumnText}>{copy.noEvents}</Text>
            ) : (
              popularEvents.map((event: DiscoveryEvent) => {
                const calendar = getEventCalendarParts(event.rawEvent.startTime, language);

                return (
                  <Pressable
                    key={event.id}
                    style={({ pressed }) => [styles.eventRow, pressed && styles.pressed]}
                    onPress={() => openExplore({ chipId: 'events', query: event.title })}
                  >
                    <View style={styles.dateTile}>
                      <Text style={styles.dateTileText}>
                        {calendar.month}
                        {'\n'}
                        {calendar.day}
                      </Text>
                    </View>
                    <View style={styles.compactBody}>
                      <Text style={styles.compactTitle} numberOfLines={1}>
                        {event.title}
                      </Text>
                      <Text style={styles.compactMeta} numberOfLines={1}>
                        {event.venueLabel}
                      </Text>
                      <Text style={styles.compactSubMeta}>{calendar.time}</Text>
                    </View>
                    <Image source={{ uri: getHeroImage(event.hero.imageUrl) }} style={styles.eventThumb} />
                  </Pressable>
                );
              })
            )}
          </View>

          <View style={styles.columnCard}>
            <View style={styles.sectionHeaderSmall}>
              <Text style={styles.columnTitle}>{copy.saved}</Text>
              <Pressable onPress={() => navigation.navigate('Profile')}>
                <Text style={styles.viewAll}>{copy.viewAll}</Text>
              </Pressable>
            </View>

            {savedSpotUpdates.length === 0 ? (
              <Text style={styles.emptyColumnText}>{copy.noSaved}</Text>
            ) : (
              savedSpotUpdates.map((spot, index) => (
                <Pressable
                  key={spot.id}
                  style={({ pressed }) => [styles.savedRow, pressed && styles.pressed]}
                  onPress={() => navigation.navigate('Profile')}
                >
                  <Image source={{ uri: getHeroImage(spot.hero.imageUrl) }} style={styles.savedThumb} />
                  <View style={styles.compactBody}>
                    <Text style={styles.compactTitle} numberOfLines={1}>
                      {spot.title}
                    </Text>
                    <Text style={styles.compactMeta} numberOfLines={1}>
                      {spot.summary || spot.description}
                    </Text>
                    <Text style={styles.compactSubMeta}>
                      {formatRelativeHomeTime(spot.rawPost.createdAt, language)}
                    </Text>
                  </View>
                  {index === 0 && notifications.some(item => !item.isRead) ? (
                    <View style={styles.redDot} />
                  ) : null}
                </Pressable>
              ))
            )}
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
    gap: 22,
  },

  heroShell: {
    flexDirection: 'row',
    borderRadius: 30,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: webDesktopColors.border,
    minHeight: 190,
  },
  heroShellRtl: {
    flexDirection: 'row-reverse',
  },
  heroCopy: {
    flex: 1,
    paddingHorizontal: 34,
    paddingVertical: 30,
    justifyContent: 'center',
  },
  heroTitleBlack: {
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '800',
    color: webDesktopColors.text,
  },
  heroTitleRed: {
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '800',
    color: webDesktopColors.primary,
  },
  heroSubtitle: {
    marginTop: 14,
    fontSize: 16,
    lineHeight: 24,
    color: webDesktopColors.textMuted,
  },
  heroImage: {
    width: 520,
    minHeight: 190,
    backgroundColor: '#E9E2DA',
  },

  searchBar: {
    minHeight: 62,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: webDesktopColors.border,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  searchSegment: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
  },
  searchInputBlock: {
    flex: 1,
    minWidth: 0,
  },
  searchDivider: {
    width: 1,
    alignSelf: 'stretch',
    backgroundColor: webDesktopColors.border,
  },
  searchLabel: {
    fontSize: 15,
    lineHeight: 18,
    fontWeight: '600',
    color: webDesktopColors.text,
  },
  searchInput: {
    marginTop: 2,
    fontSize: 14,
    lineHeight: 18,
    color: webDesktopColors.textMuted,
    padding: 0,
    minHeight: 22,
  },
  searchButton: {
    width: 100,
    alignSelf: 'stretch',
    backgroundColor: webDesktopColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  openExploreButton: {
    minHeight: 46,
    marginHorizontal: 14,
    paddingHorizontal: 20,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#F2C8BF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  openExploreButtonText: {
    fontSize: 16,
    lineHeight: 18,
    fontWeight: '700',
    color: webDesktopColors.primary,
  },

  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryChip: {
    minHeight: 40,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: webDesktopColors.border,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  categoryChipText: {
    fontSize: 15,
    lineHeight: 18,
    color: '#554C46',
    fontWeight: '500',
  },

  sectionHeader: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '800',
    color: webDesktopColors.text,
  },
  viewAll: {
    fontSize: 14,
    lineHeight: 18,
    color: webDesktopColors.primary,
    fontWeight: '600',
  },

  featureRow: {
    flexDirection: 'row',
    gap: 12,
  },
  featureCard: {
    flex: 1,
    minWidth: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: webDesktopColors.border,
    overflow: 'hidden',
  },
  featureImage: {
    width: '100%',
    height: 118,
    backgroundColor: '#ECE5DE',
  },
  featureBookmark: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.94)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureBody: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  featureTitle: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '700',
    color: webDesktopColors.text,
  },
  featureMeta: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 17,
    color: webDesktopColors.textMuted,
  },
  featureFooter: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  featureFooterText: {
    fontSize: 12,
    lineHeight: 15,
    color: webDesktopColors.textSoft,
  },

  threeColRow: {
    flexDirection: 'row',
    gap: 18,
  },
  columnCard: {
    flex: 1,
    minWidth: 0,
    minHeight: 218,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: webDesktopColors.border,
    padding: 14,
  },
  sectionHeaderSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    gap: 12,
  },
  columnTitle: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '800',
    color: webDesktopColors.text,
    flexShrink: 1,
  },

  compactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0EBE5',
    paddingVertical: 10,
  },
  compactThumb: {
    width: 94,
    height: 72,
    borderRadius: 12,
    backgroundColor: '#ECE5DE',
  },
  compactBody: {
    flex: 1,
    minWidth: 0,
  },
  compactTitle: {
    fontSize: 15,
    lineHeight: 19,
    fontWeight: '700',
    color: webDesktopColors.text,
  },
  compactMeta: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 17,
    color: webDesktopColors.textMuted,
  },
  compactSubMeta: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 17,
    color: webDesktopColors.textSoft,
  },

  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0EBE5',
    paddingVertical: 10,
  },
  dateTile: {
    width: 54,
    height: 72,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: webDesktopColors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  dateTileText: {
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '800',
    color: webDesktopColors.primary,
  },
  eventThumb: {
    width: 92,
    height: 72,
    borderRadius: 12,
    backgroundColor: '#ECE5DE',
  },

  savedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0EBE5',
    paddingVertical: 10,
  },
  savedThumb: {
    width: 72,
    height: 72,
    borderRadius: 12,
    backgroundColor: '#ECE5DE',
  },
  redDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: webDesktopColors.primary,
  },
  emptyColumnText: {
    borderTopWidth: 1,
    borderTopColor: '#F0EBE5',
    paddingTop: 14,
    fontSize: 14,
    lineHeight: 20,
    color: webDesktopColors.textMuted,
  },
  pressed: {
    opacity: 0.82,
  },
});
