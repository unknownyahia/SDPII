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
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';

import { ScreenContainer } from '../../components/ui/ScreenContainer';
import {
  POST_CATEGORY_OPTIONS,
  getCategoryOptionLabel,
  getPostCategoryOption,
  type DisplayCategoryId,
  type PostCategoryOption,
} from '../../constants/categories';
import { useAuth } from '../../context/AuthContext';
import { useLocalization } from '../../context/LocalizationContext';
import { subscribeToActivePromotedEventsCountByCreator } from '../../repositories/eventRepository';
import {
  getCurrentCoordinates,
  getLocationDisplayName,
  requestForegroundLocationPermission,
} from '../../services/locationService';
import {
  findLocationPreset,
  getLocationPresetLabel,
  type LocationOverride,
} from '../../services/locationPresets';
import { observeCurrentUserProfile } from '../../services/profileService';
import {
  createPromotedEvent,
  EventPermissionError,
  EventValidationError,
} from '../../services/eventService';
import {
  PostLocationPermissionError,
  PostValidationError,
  publishCurrentLocationPost,
} from '../../services/postService';
import {
  getPromotedEventAccessState,
  observeUserSubscription,
} from '../../services/subscriptionService';
import { colors, radius, spacing, typography } from '../../theme/designSystem';
import {
  getBlockedDataMessage,
  getErrorMessage,
  isDataAccessBlockedError,
} from '../../utils/dataAccessError';
import { showAlert } from '../../utils/showAlert';
import type { MainTabParamList } from '../../navigation/types';
import type { AppLanguage } from '../../types/profile';
import type { SpotCategory } from '../../types/post';
import type { UserSubscription } from '../../types/subscription';

type MediaPreview = {
  id: string;
  uri: string;
  kind: 'image' | 'video';
};

type MobileCopy = {
  title: string;
  subtitle: string;
  sectionOne: string;
  sectionTwo: string;
  sectionThree: string;
  sectionThreeSubtitle: string;
  titleLabel: string;
  titlePlaceholder: string;
  textPlaceholder: string;
  locationPlaceholder: string;
  nearMe: string;
  quickAreas: string[];
  locationLoading: string;
  locationHint: string;
  publish: string;
  postingAccessTitle: string;
  postingAccessSubtitle: string;
  promoTitle: string;
  promoBody: string;
  learnMore: string;
  addMore: string;
  eventFormTitle: string;
  eventTitlePlaceholder: string;
  eventDescriptionPlaceholder: string;
  eventStartPlaceholder: string;
  eventEndPlaceholder: string;
  createEvent: string;
  creatingEvent: string;
  guestLabel: string;
  retry: string;
};

const TITLE_LIMIT = 80;
const CHARACTER_LIMIT = 280;

const MOBILE_AVATAR_FALLBACK_URI =
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80';

const DEFAULT_COMPOSE_CATEGORY = getPostCategoryOption('sights');

const SAMPLE_MEDIA_LIBRARY: readonly MediaPreview[] = [
  {
    id: 'sample-waterfront',
    uri: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1200&q=80',
    kind: 'image',
  },
  {
    id: 'sample-coffee',
    uri: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1200&q=80',
    kind: 'image',
  },
  {
    id: 'sample-lawn',
    uri: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80',
    kind: 'image',
  },
  {
    id: 'sample-boulevard',
    uri: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=1200&q=80',
    kind: 'image',
  },
  {
    id: 'sample-lounge',
    uri: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=1200&q=80',
    kind: 'image',
  },
] as const;

function getPersistableHeroImageUrl(mediaItems: readonly MediaPreview[]) {
  return mediaItems.find(
    item => item.kind === 'image' && /^https?:\/\//i.test(item.uri)
  )?.uri ?? null;
}

function getDefaultEventDateTime(hoursFromNow: number) {
  return new Date(Date.now() + hoursFromNow * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 16);
}

function getMobileCopy(language: AppLanguage): MobileCopy {
  if (language === 'ar') {
    return {
      title: 'أنشئ تحديثا محليا',
      subtitle: 'شارك ما يحدث في مجتمعك وساعد الآخرين على اكتشافه.',
      sectionOne: 'ما الذي يحدث؟',
      sectionTwo: 'أين يحدث هذا؟',
      sectionThree: 'أضف صورة أو فيديو (اختياري)',
      sectionThreeSubtitle: 'اعرضه بشكل أفضل. الصور والفيديوهات تعزز التفاعل.',
      titleLabel: 'عنوان المنشور',
      titlePlaceholder: 'أضف عنوانا قصيرا',
      textPlaceholder: 'اكتب ما يحدث الآن...',
      locationPlaceholder: 'ابحث عن مكان أو منطقة أو معلم',
      nearMe: 'بالقرب مني',
      quickAreas: [
        'بالقرب مني',
        'لوسيل',
        'اللؤلؤة',
        'ويست باي',
        'مشيرب',
        'المدينة التعليمية',
        'أسباير زون',
      ],
      locationLoading: 'جار تحديد منطقتك الحالية...',
      locationHint: 'يمكنك اختيار منطقة سريعة أو البحث يدويا.',
      publish: 'نشر التحديث المحلي',
      postingAccessTitle: 'صلاحية النشر',
      postingAccessSubtitle: 'المنشورات المحلية متاحة حسب دورك وخطتك الحالية.',
      promoTitle: 'شارك مع المزيد من السكان',
      promoBody: 'هل تريد الوصول لعدد أكبر؟ روّج تحديثك ليصل لآلاف المستخدمين في قطر.',
      learnMore: 'اعرف المزيد',
      addMore: 'إضافة',
      eventFormTitle: 'إنشاء فعالية مروجة',
      eventTitlePlaceholder: 'اسم الفعالية',
      eventDescriptionPlaceholder: 'وصف قصير للفعالية',
      eventStartPlaceholder: 'وقت البداية مثل 2026-05-01T18:00',
      eventEndPlaceholder: 'وقت النهاية مثل 2026-05-01T21:00',
      createEvent: 'نشر الفعالية',
      creatingEvent: 'جار النشر...',
      guestLabel: 'ضيف',
      retry: 'إعادة المحاولة',
    };
  }

  return {
    title: 'Create a local update',
    subtitle: "Share what's happening in your community and help others discover it.",
    sectionOne: "What's happening?",
    sectionTwo: 'Where is this happening?',
    sectionThree: 'Add a photo or video (optional)',
    sectionThreeSubtitle: 'Show it off! Photos and videos make updates stand out.',
    titleLabel: 'Post title',
    titlePlaceholder: 'Add a short title',
    textPlaceholder: "Describe what's happening...",
    locationPlaceholder: 'Search for a place, area, or landmark',
    nearMe: 'Near Me',
    quickAreas: [
      'Near Me',
      'Lusail',
      'The Pearl',
      'West Bay',
      'Msheireb',
      'Education City',
      'Aspire Zone',
    ],
    locationLoading: 'Fetching your current area...',
    locationHint: 'Pick a quick area chip or type a custom location.',
    publish: 'Publish Local Update',
    postingAccessTitle: 'Posting access',
    postingAccessSubtitle: 'Local posting is available based on your role and plan.',
    promoTitle: 'Share with more locals',
    promoBody:
      'Want to reach more people? Promote your event or update to get discovered by thousands in Qatar.',
    learnMore: 'Learn more',
    addMore: 'Add more',
    eventFormTitle: 'Create promoted event',
    eventTitlePlaceholder: 'Event title',
    eventDescriptionPlaceholder: 'Short event description',
    eventStartPlaceholder: 'Start time, e.g. 2026-05-01T18:00',
    eventEndPlaceholder: 'End time, e.g. 2026-05-01T21:00',
    createEvent: 'Publish Event',
    creatingEvent: 'Publishing...',
    guestLabel: 'Guest',
    retry: 'Retry',
  };
}

function getQuickAreaGlyph(label: string, copy: MobileCopy) {
  if (label === copy.nearMe) {
    return '◎';
  }

  if (label.includes('Lusail') || label.includes('لوسيل')) {
    return '⌂';
  }

  if (label.includes('Pearl') || label.includes('اللؤلؤة')) {
    return '≈';
  }

  if (label.includes('West Bay') || label.includes('ويست باي')) {
    return '▤';
  }

  if (label.includes('Education') || label.includes('التعليمية')) {
    return '⌘';
  }

  return '⌁';
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

export function PostScreen() {
  const { user } = useAuth();
  const {
    getPlanLevelLabel,
    getRoleLabel,
    getRowDirection,
    getTextAlign,
    isRTL,
    language,
    t,
  } = useLocalization();
  const navigation = useNavigation<BottomTabNavigationProp<MainTabParamList>>();

  const copy = React.useMemo(() => getMobileCopy(language), [language]);
  const avatarInitial = (user?.displayInfo || user?.email || 'S').trim().charAt(0).toUpperCase();
  const defaultLocationQuery = language === 'ar' ? 'قطر' : 'Qatar';

  const [userRole, setUserRole] = React.useState<string>('user');
  const [subscription, setSubscription] = React.useState<UserSubscription | null>(null);
  const [activePromotedEventsCount, setActivePromotedEventsCount] = React.useState(0);
  const [setupIssue, setSetupIssue] = React.useState<string | null>(null);
  const [refreshToken, setRefreshToken] = React.useState(0);

  const [composeCategory, setComposeCategory] =
    React.useState<DisplayCategoryId>(DEFAULT_COMPOSE_CATEGORY.id);
  const [backendCategory, setBackendCategory] =
    React.useState<SpotCategory>(DEFAULT_COMPOSE_CATEGORY.backendCategory);
  const [postTitle, setPostTitle] = React.useState('');
  const [postText, setPostText] = React.useState('');
  const [postLoading, setPostLoading] = React.useState(false);
  const [lastPostSuccess, setLastPostSuccess] = React.useState(false);
  const [eventTitle, setEventTitle] = React.useState('');
  const [eventDescription, setEventDescription] = React.useState('');
  const [eventStart, setEventStart] = React.useState(() => getDefaultEventDateTime(24));
  const [eventEnd, setEventEnd] = React.useState(() => getDefaultEventDateTime(27));
  const [eventLoading, setEventLoading] = React.useState(false);

  const [locationName, setLocationName] = React.useState('');
  const [locationQuery, setLocationQuery] = React.useState(defaultLocationQuery);
  const [selectedArea, setSelectedArea] = React.useState<string | null>(null);
  const [selectedLocationOverride, setSelectedLocationOverride] =
    React.useState<LocationOverride | null>(null);
  const [capturePointPreview, setCapturePointPreview] = React.useState('');
  const [locationPreviewLoading, setLocationPreviewLoading] = React.useState(false);

  const [mediaItems, setMediaItems] = React.useState<MediaPreview[]>([]);

  React.useEffect(() => {
    setLocationQuery(current => {
      const trimmed = current.trim();
      const normalized = trimmed.toLowerCase();

      if (!trimmed || normalized === 'qatar' || trimmed === 'قطر') {
        return defaultLocationQuery;
      }

      return current;
    });
  }, [defaultLocationQuery]);

  const handleSetupIssue = React.useCallback((error: unknown, fallbackMessage: string) => {
    const nextMessage = isDataAccessBlockedError(error)
      ? getBlockedDataMessage('publishing access data')
      : getErrorMessage(error, fallbackMessage);

    setSetupIssue(current => current ?? nextMessage);
  }, []);

  React.useEffect(() => {
    if (!user) {
      setUserRole('user');
      setSubscription(null);
      setActivePromotedEventsCount(0);
      setSetupIssue(null);
      return;
    }

    const unsubscribe = observeCurrentUserProfile(
      { user },
      profile => {
        setUserRole(profile.role);
      },
      error => {
        handleSetupIssue(error, 'Failed to load your account role.');
      }
    );

    return unsubscribe;
  }, [handleSetupIssue, refreshToken, user]);

  React.useEffect(() => {
    const unsubscribe = observeUserSubscription(
      user?.id,
      nextSubscription => {
        setSubscription(nextSubscription.userId ? nextSubscription : null);
      },
      error => {
        handleSetupIssue(error, 'Failed to load your plan details.');
      }
    );

    return unsubscribe;
  }, [handleSetupIssue, refreshToken, user?.id]);

  React.useEffect(() => {
    if (!user?.id) {
      setActivePromotedEventsCount(0);
      return;
    }

    const unsubscribe = subscribeToActivePromotedEventsCountByCreator(
      user.id,
      count => {
        setActivePromotedEventsCount(count);
      },
      error => {
        handleSetupIssue(error, 'Failed to load your active promoted event count.');
      }
    );

    return unsubscribe;
  }, [handleSetupIssue, refreshToken, user?.id]);

  React.useEffect(() => {
    if (postTitle.trim() || postText.trim()) {
      setLastPostSuccess(false);
    }
  }, [postText, postTitle]);

  const promotedEventAccess = getPromotedEventAccessState({
    userRole,
    subscription,
    activePromotedEventsCount,
  });

  const accessRoleValue = user ? getRoleLabel(userRole) : copy.guestLabel;
  const accessPlanValue = getPlanLevelLabel(subscription?.planLevel ?? 'free');
  const quotaValue = `${activePromotedEventsCount}/${promotedEventAccess.maxActivePromotedEvents}`;

  const locationPreviewLabel = React.useMemo(() => {
    if (locationPreviewLoading) {
      return copy.locationLoading;
    }

    if (capturePointPreview) {
      return capturePointPreview;
    }

    if (locationName) {
      return locationName;
    }

    return copy.locationHint;
  }, [capturePointPreview, copy.locationHint, copy.locationLoading, locationName, locationPreviewLoading]);

  const remainingTitleLabel = `${postTitle.length}/${TITLE_LIMIT}`;
  const remainingCharacterLabel = `${postText.length}/${CHARACTER_LIMIT}`;

  const handleRetrySetup = React.useCallback(() => {
    setSetupIssue(null);
    setRefreshToken(current => current + 1);
  }, []);

  const handleSelectCategory = React.useCallback((nextCategory: PostCategoryOption) => {
    setComposeCategory(nextCategory.id);
    setBackendCategory(nextCategory.backendCategory);
  }, []);

  const handleQuickAreaSelect = React.useCallback(
    async (areaLabel: string) => {
      setLastPostSuccess(false);

      if (areaLabel === copy.nearMe) {
        setLocationPreviewLoading(true);

        try {
          const { status } = await requestForegroundLocationPermission();

          if (status !== 'granted') {
            throw new PostLocationPermissionError(
              language === 'ar'
                ? 'نحتاج صلاحية الموقع لالتقاط موقعك الحالي.'
                : 'We need location permission to use your current area.'
            );
          }

          const coords = await getCurrentCoordinates();
          const nextLabel = await getLocationDisplayName(coords.latitude, coords.longitude);

          setCapturePointPreview(nextLabel);
          setLocationQuery(nextLabel);
          setSelectedArea(copy.nearMe);
          setSelectedLocationOverride({
            latitude: coords.latitude,
            longitude: coords.longitude,
            locationName: nextLabel,
          });
        } catch (error: any) {
          showAlert(
            t('post.locationPermissionTitle'),
            error?.message ?? copy.locationHint
          );
        } finally {
          setLocationPreviewLoading(false);
        }

        return;
      }

      const presetLocation = findLocationPreset(areaLabel);
      const presetLabel = presetLocation
        ? getLocationPresetLabel(presetLocation, language)
        : areaLabel;

      setSelectedArea(areaLabel);
      setLocationQuery(presetLabel);
      setSelectedLocationOverride(presetLocation);
      setCapturePointPreview(presetLocation ? presetLabel : '');
    },
    [copy.locationHint, copy.nearMe, language, t]
  );

  const handleAddMedia = React.useCallback(() => {
    setMediaItems(current => {
      if (current.length >= 6) {
        return current;
      }

      const nextSample = SAMPLE_MEDIA_LIBRARY[current.length % SAMPLE_MEDIA_LIBRARY.length];

      return [
        ...current,
        {
          ...nextSample,
          id: `${nextSample.id}-${Date.now()}`,
        },
      ];
    });
  }, []);

  const handleRemoveMedia = React.useCallback((mediaId: string) => {
    setMediaItems(current => current.filter(item => item.id !== mediaId));
  }, []);

  const handleCreatePost = async () => {
    setPostLoading(true);
    setLastPostSuccess(false);

    try {
      const locationOverride =
        selectedLocationOverride ?? findLocationPreset(locationQuery);
      const result = await publishCurrentLocationPost({
        userId: user?.id,
        title: postTitle,
        text: postText,
        category: backendCategory,
        displayCategory: composeCategory,
        locationOverride,
        heroImageUrl: getPersistableHeroImageUrl(mediaItems),
      });

      setLocationName(result.locationName);
      setCapturePointPreview(result.locationName);
      if (!locationQuery.trim()) {
        setLocationQuery(result.locationName);
      }
      setPostTitle('');
      setPostText('');
      setMediaItems([]);
      setLastPostSuccess(true);
      navigation.navigate('Explore', {
        query: '',
        where: language === 'ar' ? 'قطر' : 'Qatar',
        chipId: 'all',
        focusPostId: result.postId,
        focusLatitude: result.latitude,
        focusLongitude: result.longitude,
        focusPostTitle: result.title,
        focusPostText: result.text,
        focusLocationName: result.locationName || null,
      });
      showAlert(t('post.createdAlertTitle'), t('post.createdAlertBody'));
    } catch (error: any) {
      if (error instanceof PostValidationError) {
        const title = user ? t('post.emptyPost') : t('post.notLoggedIn');
        showAlert(title, error.message);
      } else if (error instanceof PostLocationPermissionError) {
        showAlert(t('post.locationPermissionTitle'), error.message);
      } else {
        showAlert(t('post.createErrorTitle'), error?.message ?? 'Something went wrong');
      }
    } finally {
      setPostLoading(false);
    }
  };

  const handleCreatePromotedEvent = async () => {
    setEventLoading(true);

    try {
      const locationOverride =
        selectedLocationOverride ?? findLocationPreset(locationQuery);
      const result = await createPromotedEvent({
        userId: user?.id,
        userRole,
        subscription,
        title: eventTitle,
        description: eventDescription,
        category: 'event',
        startTime: eventStart,
        endTime: eventEnd,
        activePromotedEventsCount,
        locationOverride,
      });

      setLocationName(result.locationName);
      setCapturePointPreview(result.locationName);
      setEventTitle('');
      setEventDescription('');
      setEventStart(getDefaultEventDateTime(24));
      setEventEnd(getDefaultEventDateTime(27));
      showAlert(t('post.eventCreatedAlertTitle'), t('post.eventCreatedAlertBody'));
    } catch (error) {
      if (error instanceof EventValidationError || error instanceof EventPermissionError) {
        showAlert(t('post.createErrorTitle'), error.message);
      } else {
        showAlert(t('post.createErrorTitle'), getErrorMessage(error, 'Unable to create event.'));
      }
    } finally {
      setEventLoading(false);
    }
  };

  return (
    <ScreenContainer
      scroll
      padded={false}
      style={styles.screen}
      contentContainerStyle={styles.content}
    >
      <View style={styles.shell}>
        <View style={[styles.headerRow, { flexDirection: getRowDirection() }]}>
          <Text
            style={[styles.wordmark, { writingDirection: isRTL ? 'rtl' : 'ltr' }]}
          >
            Spots
          </Text>

          <View style={[styles.headerActions, { flexDirection: getRowDirection() }]}>
            <Pressable
              accessibilityRole="button"
              onPress={() => navigation.navigate('Profile')}
              style={({ pressed }) => [styles.headerActionButton, pressed && styles.headerActionPressed]}
            >
              <BellGlyph />
            </Pressable>

            <Pressable
              accessibilityRole="button"
              onPress={() => navigation.navigate('Explore')}
              style={({ pressed }) => [styles.headerActionButton, pressed && styles.headerActionPressed]}
            >
              <Text style={styles.heartGlyph}>♡</Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              onPress={() => navigation.navigate('Profile')}
              style={({ pressed }) => [pressed && styles.headerActionPressed]}
            >
              <View style={styles.avatarFrame}>
                <Image source={{ uri: MOBILE_AVATAR_FALLBACK_URI }} style={styles.avatarImage} />
                {!user ? <Text style={styles.avatarFallback}>{avatarInitial || 'S'}</Text> : null}
              </View>
            </Pressable>
          </View>
        </View>

        <View style={[styles.introRow, { flexDirection: getRowDirection() }]}>
          <View style={styles.introCopy}>
            <Text
              style={[
                styles.introTitle,
                { textAlign: getTextAlign(), writingDirection: isRTL ? 'rtl' : 'ltr' },
              ]}
            >
              {copy.title}
            </Text>
            <Text
              style={[
                styles.introSubtitle,
                { textAlign: getTextAlign(), writingDirection: isRTL ? 'rtl' : 'ltr' },
              ]}
            >
              {copy.subtitle}
            </Text>
          </View>

          <View style={styles.introArtWrap}>
            <View style={styles.introArtBackdrop} />
            <View style={styles.introArtCamera}>
              <View style={styles.introArtLensOuter}>
                <View style={styles.introArtLensInner} />
              </View>
            </View>
            <View style={styles.introArtPin}>
              <View style={styles.introArtPinCore} />
            </View>
          </View>
        </View>

        {setupIssue ? (
          <View style={styles.slimBanner}>
            <Text
              style={[
                styles.slimBannerText,
                { textAlign: getTextAlign(), writingDirection: isRTL ? 'rtl' : 'ltr' },
              ]}
            >
              {setupIssue}
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={handleRetrySetup}
              style={({ pressed }) => [styles.slimBannerAction, pressed && styles.headerActionPressed]}
            >
              <Text style={styles.slimBannerActionLabel}>{copy.retry}</Text>
            </Pressable>
          </View>
        ) : null}

        <View style={styles.sectionCard}>
          <View style={[styles.sectionHeader, { flexDirection: getRowDirection() }]}>
            <View style={styles.sectionBadge}>
              <Text style={styles.sectionBadgeLabel}>1</Text>
            </View>
            <Text
              style={[
                styles.sectionTitle,
                { textAlign: getTextAlign(), writingDirection: isRTL ? 'rtl' : 'ltr' },
              ]}
            >
              {copy.sectionOne}
            </Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoryRail}
            contentContainerStyle={[styles.categoryRailContent, { flexDirection: getRowDirection() }]}
          >
            {POST_CATEGORY_OPTIONS.map(item => {
              const active = composeCategory === item.id;

              return (
                <Pressable
                  key={item.id}
                  accessibilityRole="button"
                  onPress={() => handleSelectCategory(item)}
                  style={({ pressed }) => [
                    styles.categoryChip,
                    active && styles.categoryChipActive,
                    pressed && styles.categoryChipPressed,
                  ]}
                >
                  {item.glyph ? (
                    <Text style={[styles.categoryChipGlyph, active && styles.categoryChipGlyphActive]}>
                      {item.glyph}
                    </Text>
                  ) : null}
                  <Text
                    style={[
                      styles.categoryChipLabel,
                      active && styles.categoryChipLabelActive,
                      { writingDirection: isRTL ? 'rtl' : 'ltr' },
                    ]}
                  >
                    {getCategoryOptionLabel(item, language)}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <View style={styles.titleInputWrap}>
            <Text
              style={[
                styles.fieldLabel,
                { textAlign: getTextAlign(), writingDirection: isRTL ? 'rtl' : 'ltr' },
              ]}
            >
              {copy.titleLabel}
            </Text>
            <TextInput
              value={postTitle}
              onChangeText={value => setPostTitle(value.slice(0, TITLE_LIMIT))}
              placeholder={copy.titlePlaceholder}
              placeholderTextColor={colors.textSubtle}
              maxLength={TITLE_LIMIT}
              returnKeyType="next"
              style={[
                styles.titleInput,
                { textAlign: getTextAlign(), writingDirection: isRTL ? 'rtl' : 'ltr' },
              ]}
            />
            <Text style={styles.titleInputCount}>{remainingTitleLabel}</Text>
          </View>

          <View style={styles.textAreaWrap}>
            <TextInput
              value={postText}
              onChangeText={setPostText}
              placeholder={copy.textPlaceholder}
              placeholderTextColor={colors.textSubtle}
              multiline
              maxLength={CHARACTER_LIMIT}
              style={[
                styles.textArea,
                { textAlign: getTextAlign(), writingDirection: isRTL ? 'rtl' : 'ltr' },
              ]}
            />
            <Text style={styles.textAreaCount}>{remainingCharacterLabel}</Text>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <View style={[styles.sectionHeader, { flexDirection: getRowDirection() }]}>
            <View style={styles.sectionBadge}>
              <Text style={styles.sectionBadgeLabel}>2</Text>
            </View>
            <Text
              style={[
                styles.sectionTitle,
                { textAlign: getTextAlign(), writingDirection: isRTL ? 'rtl' : 'ltr' },
              ]}
            >
              {copy.sectionTwo}
            </Text>
          </View>

          <View style={styles.locationSearchRow}>
            <PinGlyph />
            <TextInput
              value={locationQuery}
              onChangeText={value => {
                const presetLocation = findLocationPreset(value);
                setLocationQuery(value);
                setSelectedArea(null);
                setSelectedLocationOverride(presetLocation);
                setCapturePointPreview(
                  presetLocation ? getLocationPresetLabel(presetLocation, language) : ''
                );
              }}
              placeholder={copy.locationPlaceholder}
              placeholderTextColor={colors.textSubtle}
              style={[
                styles.locationInput,
                { textAlign: getTextAlign(), writingDirection: isRTL ? 'rtl' : 'ltr' },
              ]}
            />
            <Text style={styles.locationChevron}>{isRTL ? '‹' : '›'}</Text>
          </View>

          <View style={[styles.quickAreaWrap, { flexDirection: getRowDirection() }]}>
            {copy.quickAreas.map(areaLabel => {
              const active = selectedArea === areaLabel;
              const glyph = getQuickAreaGlyph(areaLabel, copy);

              return (
                <Pressable
                  key={areaLabel}
                  accessibilityRole="button"
                  onPress={() => {
                    void handleQuickAreaSelect(areaLabel);
                  }}
                  style={({ pressed }) => [
                    styles.quickAreaChip,
                    active && styles.quickAreaChipActive,
                    pressed && styles.categoryChipPressed,
                  ]}
                >
                  <Text style={[styles.quickAreaGlyph, active && styles.quickAreaGlyphActive]}>{glyph}</Text>
                  <Text
                    style={[
                      styles.quickAreaLabel,
                      active && styles.quickAreaLabelActive,
                      { writingDirection: isRTL ? 'rtl' : 'ltr' },
                    ]}
                  >
                    {areaLabel}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text
            style={[
              styles.locationHint,
              { textAlign: getTextAlign(), writingDirection: isRTL ? 'rtl' : 'ltr' },
            ]}
          >
            {locationPreviewLabel}
          </Text>
        </View>

        <View style={styles.sectionCard}>
          <View style={[styles.sectionHeader, { flexDirection: getRowDirection() }]}>
            <View style={styles.sectionBadge}>
              <Text style={styles.sectionBadgeLabel}>3</Text>
            </View>
            <Text
              style={[
                styles.sectionTitle,
                { textAlign: getTextAlign(), writingDirection: isRTL ? 'rtl' : 'ltr' },
              ]}
            >
              {copy.sectionThree}
            </Text>
          </View>

          <Text
            style={[
              styles.sectionSubtitle,
              { textAlign: getTextAlign(), writingDirection: isRTL ? 'rtl' : 'ltr' },
            ]}
          >
            {copy.sectionThreeSubtitle}
          </Text>

          <View style={[styles.mediaRow, { flexDirection: getRowDirection() }]}>
            {mediaItems.slice(0, 4).map(item => (
              <View key={item.id} style={styles.mediaThumbWrap}>
                <Image source={{ uri: item.uri }} style={styles.mediaThumb} />
                <Pressable
                  accessibilityRole="button"
                  onPress={() => handleRemoveMedia(item.id)}
                  style={({ pressed }) => [
                    styles.mediaRemoveButton,
                    pressed && styles.categoryChipPressed,
                  ]}
                >
                  <Text style={styles.mediaRemoveLabel}>x</Text>
                </Pressable>
                {item.kind === 'video' ? (
                  <View style={styles.mediaTypeBadge}>
                    <Text style={styles.mediaTypeBadgeText}>MP4</Text>
                  </View>
                ) : null}
              </View>
            ))}

            <Pressable
              accessibilityRole="button"
              onPress={handleAddMedia}
              style={({ pressed }) => [styles.addMoreTile, pressed && styles.categoryChipPressed]}
            >
              <Text style={styles.addMorePlus}>+</Text>
              <Text style={styles.addMoreLabel}>{copy.addMore}</Text>
            </Pressable>
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          disabled={!user || postLoading}
          onPress={handleCreatePost}
          style={({ pressed }) => [
            styles.publishButton,
            (!user || postLoading) && styles.publishButtonDisabled,
            pressed && user && !postLoading && styles.publishButtonPressed,
          ]}
        >
          {postLoading ? (
            <ActivityIndicator color={colors.surface} />
          ) : (
            <Text style={[styles.publishButtonLabel, { writingDirection: isRTL ? 'rtl' : 'ltr' }]}>
              {copy.publish}
            </Text>
          )}
        </Pressable>

        {lastPostSuccess ? (
          <View style={[styles.slimBanner, styles.slimBannerSuccess]}>
            <Text
              style={[
                styles.slimBannerText,
                styles.slimBannerTextSuccess,
                { textAlign: getTextAlign(), writingDirection: isRTL ? 'rtl' : 'ltr' },
              ]}
            >
              {t('post.successBody')}
            </Text>
          </View>
        ) : null}

        {!user ? (
          <View style={styles.signInHintWrap}>
            <Text
              style={[
                styles.signInHint,
                { textAlign: getTextAlign(), writingDirection: isRTL ? 'rtl' : 'ltr' },
              ]}
            >
              {t('post.signInRequiredBody')}
            </Text>
          </View>
        ) : null}

        <View style={styles.supportCard}>
          <Text
            style={[
              styles.supportCardTitle,
              { textAlign: getTextAlign(), writingDirection: isRTL ? 'rtl' : 'ltr' },
            ]}
          >
            {copy.postingAccessTitle}
          </Text>
          <Text
            style={[
              styles.supportCardSubtitle,
              { textAlign: getTextAlign(), writingDirection: isRTL ? 'rtl' : 'ltr' },
            ]}
          >
            {copy.postingAccessSubtitle}
          </Text>

          <View style={[styles.metricsRow, { flexDirection: getRowDirection() }]}>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>{t('post.roleMetric')}</Text>
              <Text style={styles.metricValue}>{accessRoleValue}</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>{t('post.planMetric')}</Text>
              <Text style={styles.metricValue}>{accessPlanValue}</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>{t('post.eventQuotaMetric')}</Text>
              <Text style={styles.metricValue}>{quotaValue}</Text>
            </View>
          </View>

          <View
            style={[
              styles.accessNotice,
              promotedEventAccess.allowed && styles.accessNoticePositive,
            ]}
          >
            <Text
              style={[
                styles.accessNoticeTitle,
                promotedEventAccess.allowed && styles.accessNoticeTitlePositive,
                { textAlign: getTextAlign(), writingDirection: isRTL ? 'rtl' : 'ltr' },
              ]}
            >
              {promotedEventAccess.allowed
                ? t('post.eventAccessReadyTitle')
                : t('post.eventAccessBlockedTitle')}
            </Text>
          </View>

          {promotedEventAccess.allowed ? (
            <View style={styles.eventForm}>
              <Text
                style={[
                  styles.eventFormTitle,
                  { textAlign: getTextAlign(), writingDirection: isRTL ? 'rtl' : 'ltr' },
                ]}
              >
                {copy.eventFormTitle}
              </Text>

              <TextInput
                value={eventTitle}
                onChangeText={setEventTitle}
                placeholder={copy.eventTitlePlaceholder}
                placeholderTextColor={colors.textSubtle}
                style={[
                  styles.eventInput,
                  { textAlign: getTextAlign(), writingDirection: isRTL ? 'rtl' : 'ltr' },
                ]}
              />

              <TextInput
                value={eventDescription}
                onChangeText={setEventDescription}
                placeholder={copy.eventDescriptionPlaceholder}
                placeholderTextColor={colors.textSubtle}
                multiline
                style={[
                  styles.eventInput,
                  styles.eventDescriptionInput,
                  { textAlign: getTextAlign(), writingDirection: isRTL ? 'rtl' : 'ltr' },
                ]}
              />

              <View style={[styles.eventTimeRow, { flexDirection: getRowDirection() }]}>
                <TextInput
                  value={eventStart}
                  onChangeText={setEventStart}
                  placeholder={copy.eventStartPlaceholder}
                  placeholderTextColor={colors.textSubtle}
                  style={[
                    styles.eventInput,
                    styles.eventTimeInput,
                    { textAlign: getTextAlign(), writingDirection: isRTL ? 'rtl' : 'ltr' },
                  ]}
                />
                <TextInput
                  value={eventEnd}
                  onChangeText={setEventEnd}
                  placeholder={copy.eventEndPlaceholder}
                  placeholderTextColor={colors.textSubtle}
                  style={[
                    styles.eventInput,
                    styles.eventTimeInput,
                    { textAlign: getTextAlign(), writingDirection: isRTL ? 'rtl' : 'ltr' },
                  ]}
                />
              </View>

              <Pressable
                accessibilityRole="button"
                disabled={eventLoading}
                onPress={handleCreatePromotedEvent}
                style={({ pressed }) => [
                  styles.eventButton,
                  eventLoading && styles.publishButtonDisabled,
                  pressed && !eventLoading && styles.publishButtonPressed,
                ]}
              >
                {eventLoading ? (
                  <ActivityIndicator color={colors.surface} />
                ) : (
                  <Text style={styles.eventButtonLabel}>{copy.createEvent}</Text>
                )}
              </Pressable>
            </View>
          ) : null}
        </View>

        <View style={styles.promoCard}>
          <View style={[styles.promoRow, { flexDirection: getRowDirection() }]}>
            <View style={styles.promoIconWrap}>
              <Text style={styles.promoIconGlyph}>⌁</Text>
            </View>

            <View style={styles.promoCopy}>
              <Text
                style={[
                  styles.promoTitle,
                  { textAlign: getTextAlign(), writingDirection: isRTL ? 'rtl' : 'ltr' },
                ]}
              >
                {copy.promoTitle}
              </Text>
              <Text
                style={[
                  styles.promoBody,
                  { textAlign: getTextAlign(), writingDirection: isRTL ? 'rtl' : 'ltr' },
                ]}
              >
                {copy.promoBody}
              </Text>
            </View>

            <Pressable
              accessibilityRole="button"
              onPress={() => navigation.navigate('Explore')}
              style={({ pressed }) => [styles.promoLinkButton, pressed && styles.headerActionPressed]}
            >
              <Text style={styles.promoLinkLabel}>{copy.learnMore}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F4F4F4',
  },
  content: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md + 2,
    paddingBottom: spacing.xxxl + 18,
  },
  shell: {
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
    right: 0,
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
  introRow: {
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.md,
  },
  introCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  introTitle: {
    ...typography.title,
    fontSize: 22,
    lineHeight: 30,
    letterSpacing: -0.7,
    color: colors.text,
  },
  introSubtitle: {
    ...typography.bodyMuted,
    fontSize: 13,
    lineHeight: 20,
    color: colors.textMuted,
    maxWidth: 220,
  },
  introArtWrap: {
    width: 140,
    height: 112,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  introArtBackdrop: {
    position: 'absolute',
    inset: 0,
    borderRadius: 22,
    backgroundColor: '#FCEAE7',
  },
  introArtCamera: {
    width: 70,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#F05747',
    borderWidth: 1,
    borderColor: '#E44739',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    right: 12,
    bottom: 8,
    transform: [{ rotate: '-9deg' }],
  },
  introArtLensOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FFEFED',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#231B18',
  },
  introArtLensInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  introArtPin: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FF755F',
    position: 'absolute',
    left: 14,
    top: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  introArtPinCore: {
    width: 11,
    height: 11,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#FFEFED',
  },
  slimBanner: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#F2D7D1',
    backgroundColor: '#FFF5F2',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  slimBannerSuccess: {
    borderColor: '#D2EADF',
    backgroundColor: '#F3FAF6',
  },
  slimBannerText: {
    ...typography.caption,
    color: '#925F57',
    flex: 1,
  },
  slimBannerTextSuccess: {
    color: '#2E7B57',
  },
  slimBannerAction: {
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: '#EBC4BB',
    paddingHorizontal: spacing.sm + 3,
    paddingVertical: spacing.xs + 1,
  },
  slimBannerActionLabel: {
    ...typography.button,
    fontSize: 12,
    lineHeight: 15,
    color: colors.primary,
  },
  sectionCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: '#E7E2DC',
    backgroundColor: '#F9F9F9',
    padding: spacing.md + 2,
    gap: spacing.sm + 3,
    shadowColor: '#291B14',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
  },
  sectionHeader: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  sectionBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionBadgeLabel: {
    ...typography.button,
    color: colors.surface,
    fontSize: 17,
    lineHeight: 20,
    fontWeight: '700',
  },
  sectionTitle: {
    ...typography.sectionTitle,
    color: colors.text,
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: -0.35,
    flex: 1,
  },
  sectionSubtitle: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  categoryRail: {
    marginHorizontal: -2,
  },
  categoryRailContent: {
    gap: spacing.sm,
    paddingHorizontal: 2,
  },
  categoryChip: {
    minHeight: 38,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: '#D9D9D9',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  categoryChipActive: {
    borderColor: '#F27B69',
    backgroundColor: '#FFF2EF',
  },
  categoryChipPressed: {
    opacity: 0.78,
  },
  categoryChipGlyph: {
    ...typography.caption,
    fontSize: 13,
    lineHeight: 16,
    color: colors.textMuted,
  },
  categoryChipGlyphActive: {
    color: colors.primary,
  },
  categoryChipLabel: {
    ...typography.caption,
    fontSize: 14,
    lineHeight: 17,
    color: '#4D4D4D',
    fontWeight: '500',
  },
  categoryChipLabelActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  titleInputWrap: {
    minHeight: 84,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#DEDEDE',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: 4,
  },
  fieldLabel: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
  },
  titleInput: {
    ...typography.body,
    color: colors.text,
    minHeight: 28,
    padding: 0,
    margin: 0,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '600',
  },
  titleInputCount: {
    ...typography.caption,
    color: colors.textSubtle,
    fontSize: 12,
    lineHeight: 16,
    alignSelf: 'flex-end',
  },
  textAreaWrap: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#DEDEDE',
    backgroundColor: '#FBFBFB',
    minHeight: 190,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  textArea: {
    ...typography.body,
    color: colors.text,
    minHeight: 148,
    textAlignVertical: 'top',
    padding: 0,
    margin: 0,
    fontSize: 14,
    lineHeight: 20,
  },
  textAreaCount: {
    ...typography.caption,
    color: colors.textSubtle,
    fontSize: 12,
    lineHeight: 16,
    alignSelf: 'flex-end',
  },
  locationSearchRow: {
    minHeight: 58,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#DEDEDE',
    backgroundColor: '#FBFBFB',
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  pinGlyph: {
    width: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinGlyphHead: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.8,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF3F1',
  },
  pinGlyphCore: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.primary,
  },
  pinGlyphTip: {
    width: 2,
    height: 5,
    borderRadius: 2,
    backgroundColor: colors.primary,
    marginTop: 1,
  },
  locationInput: {
    ...typography.body,
    color: colors.text,
    flex: 1,
    fontSize: 15,
    lineHeight: 20,
    padding: 0,
    margin: 0,
  },
  locationChevron: {
    ...typography.title,
    color: colors.textSubtle,
    fontSize: 18,
    lineHeight: 20,
  },
  quickAreaWrap: {
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  quickAreaChip: {
    minHeight: 38,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: '#D9D9D9',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  quickAreaChipActive: {
    borderColor: '#E9A292',
    backgroundColor: '#FFF4F1',
  },
  quickAreaGlyph: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 16,
  },
  quickAreaGlyphActive: {
    color: colors.primary,
  },
  quickAreaLabel: {
    ...typography.caption,
    color: '#4D4D4D',
    fontSize: 14,
    lineHeight: 17,
    fontWeight: '500',
  },
  quickAreaLabelActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  locationHint: {
    ...typography.caption,
    color: colors.textSubtle,
    fontSize: 13,
    lineHeight: 17,
  },
  mediaRow: {
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  mediaThumbWrap: {
    width: 90,
    height: 90,
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: '#EFEFEF',
    position: 'relative',
  },
  mediaThumb: {
    width: '100%',
    height: '100%',
  },
  mediaRemoveButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    top: 6,
    right: 6,
    borderWidth: 1,
    borderColor: '#D7D7D7',
  },
  mediaRemoveLabel: {
    ...typography.button,
    color: '#4A4A4A',
    fontSize: 16,
    lineHeight: 18,
  },
  mediaTypeBadge: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(32, 27, 22, 0.72)',
    paddingHorizontal: spacing.xs + 3,
    paddingVertical: 2,
  },
  mediaTypeBadgeText: {
    ...typography.caption,
    color: '#FFFFFF',
    fontSize: 10,
    lineHeight: 12,
    fontWeight: '600',
  },
  addMoreTile: {
    width: 90,
    height: 90,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#D3D3D3',
    borderStyle: 'dashed',
    backgroundColor: '#FBFBFB',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  addMorePlus: {
    ...typography.title,
    color: '#6F6F6F',
    fontSize: 25,
    lineHeight: 28,
  },
  addMoreLabel: {
    ...typography.caption,
    color: '#6B6B6B',
    fontSize: 14,
    lineHeight: 16,
  },
  publishButton: {
    minHeight: 60,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primaryPressed,
    shadowOpacity: 0.16,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  publishButtonPressed: {
    backgroundColor: colors.primaryPressed,
  },
  publishButtonDisabled: {
    opacity: 0.6,
  },
  publishButtonLabel: {
    ...typography.button,
    color: colors.surface,
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '700',
  },
  signInHintWrap: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#EBDACB',
    backgroundColor: '#FFF8EF',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 1,
  },
  signInHint: {
    ...typography.caption,
    color: '#856142',
    fontSize: 13,
    lineHeight: 18,
  },
  supportCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: '#E6E1DB',
    backgroundColor: '#F9F9F9',
    padding: spacing.md + 2,
    gap: spacing.sm,
  },
  supportCardTitle: {
    ...typography.sectionTitle,
    color: colors.text,
    fontSize: 20,
    lineHeight: 25,
  },
  supportCardSubtitle: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 17,
  },
  metricsRow: {
    gap: spacing.sm,
  },
  metricCard: {
    flex: 1,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#E5DED6',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.sm,
    gap: 2,
  },
  metricLabel: {
    ...typography.caption,
    color: colors.textSubtle,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '600',
  },
  metricValue: {
    ...typography.button,
    color: colors.text,
    fontSize: 14,
    lineHeight: 18,
  },
  accessNotice: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#ECD6CF',
    backgroundColor: '#FFF4F0',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  accessNoticePositive: {
    borderColor: '#CDE6D9',
    backgroundColor: '#F1FAF5',
  },
  accessNoticeTitle: {
    ...typography.caption,
    color: '#915B52',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
  },
  accessNoticeTitlePositive: {
    color: '#2E7B57',
  },
  eventForm: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#E3DDD6',
    backgroundColor: '#FFFFFF',
    padding: spacing.md,
    gap: spacing.sm,
  },
  eventFormTitle: {
    ...typography.button,
    color: colors.text,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '700',
  },
  eventInput: {
    ...typography.body,
    minHeight: 46,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: '#DED8D1',
    backgroundColor: '#FBFBFB',
    color: colors.text,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.sm,
    fontSize: 13,
    lineHeight: 18,
  },
  eventDescriptionInput: {
    minHeight: 78,
    textAlignVertical: 'top',
  },
  eventTimeRow: {
    gap: spacing.sm,
  },
  eventTimeInput: {
    flex: 1,
  },
  eventButton: {
    minHeight: 48,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventButtonLabel: {
    ...typography.button,
    color: colors.surface,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '700',
  },
  promoCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: '#E8E1DA',
    backgroundColor: '#FBF9F7',
    paddingHorizontal: spacing.md + 2,
    paddingVertical: spacing.md,
    marginBottom: spacing.md,
  },
  promoRow: {
    alignItems: 'center',
    gap: spacing.sm + 2,
  },
  promoIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FCEBE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  promoIconGlyph: {
    ...typography.title,
    color: colors.primary,
    fontSize: 20,
    lineHeight: 22,
  },
  promoCopy: {
    flex: 1,
    gap: 2,
  },
  promoTitle: {
    ...typography.button,
    color: colors.text,
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '700',
  },
  promoBody: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 19,
  },
  promoLinkButton: {
    borderRadius: radius.pill,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs,
  },
  promoLinkLabel: {
    ...typography.button,
    color: colors.primary,
    fontSize: 15,
    lineHeight: 19,
  },
});
