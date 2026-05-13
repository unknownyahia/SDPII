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
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';

import { StatusBanner } from '../../components/ui/StatusBanner';
import {
  POST_CATEGORY_OPTIONS,
  getCategoryOptionLabel,
  getPostCategoryOption,
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
  createPromotedEvent,
  EventPermissionError,
  EventValidationError,
} from '../../services/eventService';
import {
  findLocationPreset,
  getLocationPresetLabel,
  type LocationOverride,
} from '../../services/locationPresets';
import { observeCurrentUserProfile } from '../../services/profileService';
import {
  PostLocationPermissionError,
  PostValidationError,
  publishCurrentLocationPost,
} from '../../services/postService';
import {
  getPromotedEventAccessState,
  observeUserSubscription,
} from '../../services/subscriptionService';
import { webDesktopColors, webDesktopLayout } from '../../theme/webDesktopSystem';
import {
  getBlockedDataMessage,
  getErrorMessage,
  isDataAccessBlockedError,
} from '../../utils/dataAccessError';
import { showAlert } from '../../utils/showAlert';
import type { MainTabParamList } from '../../navigation/types';
import type { AppLanguage } from '../../types/profile';
import type { UserSubscription } from '../../types/subscription';

type MediaPreview = {
  id: string;
  uri: string;
  kind: 'image' | 'video';
  name: string;
  objectUrl?: boolean;
};

const TITLE_LIMIT = 80;
const CHARACTER_LIMIT = 280;

const PREVIEW_IMAGE =
  'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80';

const DEFAULT_COMPOSE_CATEGORY = getPostCategoryOption('sights');

const QUICK_AREAS = [
  { icon: 'paper-plane-outline', labelEn: 'Near Me', labelAr: 'بالقرب مني' },
  { icon: 'business-outline', labelEn: 'Lusail', labelAr: 'لوسيل' },
  { icon: 'fish-outline', labelEn: 'The Pearl', labelAr: 'اللؤلؤة' },
  { icon: 'business-outline', labelEn: 'West Bay', labelAr: 'ويست باي' },
  { icon: 'home-outline', labelEn: 'Msheireb', labelAr: 'مشيرب' },
  { icon: 'school-outline', labelEn: 'Education City', labelAr: 'المدينة التعليمية' },
  { icon: 'basketball-outline', labelEn: 'Aspire Zone', labelAr: 'أسباير زون' },
] as const;

function getCopy(language: AppLanguage) {
  if (language === 'ar') {
    return {
      title: 'أنشئ تحديثا محليا',
      subtitle: 'شارك ما يحدث في مجتمعك. النشر المحلي أولا دائما.',
      sectionOne: '1. ما الذي يحدث؟',
      sectionTwo: '2. أين يحدث هذا؟',
      sectionThree: '3. أضف صورة أو فيديو (اختياري)',
      titleLabel: 'عنوان المنشور',
      titlePlaceholder: 'أضف عنوانا قصيرا',
      textPlaceholder: 'صف المشهد أو الازدحام أو الطقس أو ما وجدته...',
      locationPlaceholder: 'ابحث عن مكان أو حي أو منطقة',
      browserHint: 'يتم استخدام المنطقة المختارة عند النشر. اختر بالقرب مني لاستخدام موقع المتصفح.',
      uploadTitle: 'اضغط لاختيار ملفات',
      uploadSub: 'JPG أو PNG أو MP4 حتى 15MB',
      noMedia: 'لم يتم اختيار وسائط بعد',
      tip: 'نصيحة: الصور الواضحة تحصل على تفاعل أكثر.',
      publish: 'نشر التحديث المحلي',
      publishing: 'جار النشر...',
      reviewNote: 'سيتم مراجعة منشورك للحفاظ على فائدة Spots وسلامته.',
      postingAccess: 'صلاحية النشر',
      postingAccessBody: 'يبقى النشر المحلي أساسيا، وتظهر بيانات الخطة هنا.',
      role: 'الدور',
      plan: 'الخطة',
      quota: 'حصة الفعاليات',
      eventRestricted: 'استوديو الفعاليات مقيّد',
      eventReady: 'استوديو الفعاليات متاح',
      organizationTitle: 'الترويج للفعاليات (حسابات الجهات)',
      organizationBody: 'افتح طرقا إضافية للوصول إلى مجتمعك.',
      previewTitle: 'معاينة مباشرة',
      previewBody: 'هكذا قد يظهر تحديثك في الاستكشاف.',
      guest: 'ضيف',
      free: 'مجاني',
      signInRequired: 'يجب تسجيل الدخول قبل النشر.',
      uploadUnavailableTitle: 'الرفع غير متاح',
      locationPermissionTitle: 'تعذر قراءة الموقع',
      locationSelectedTitle: 'تم اختيار الموقع',
      setupIssueTitle: 'تعذر تحميل بعض بيانات النشر',
      retry: 'إعادة المحاولة',
      learnMore: 'عرض إعدادات الحساب',
      emptyTitle: 'أضف عنوانا قبل النشر.',
      emptyPost: 'اكتب تحديثا قبل النشر.',
      eventFormTitle: 'إنشاء فعالية مروجة',
      eventTitlePlaceholder: 'اسم الفعالية',
      eventDescriptionPlaceholder: 'وصف قصير للفعالية',
      eventStartPlaceholder: 'وقت البداية مثل 2026-05-01T18:00',
      eventEndPlaceholder: 'وقت النهاية مثل 2026-05-01T21:00',
      createEvent: 'نشر الفعالية',
      creatingEvent: 'جار النشر...',
    };
  }

  return {
    title: 'Create a local update',
    subtitle: "Share what's happening in your community. Local first, always.",
    sectionOne: "1. What's happening?",
    sectionTwo: '2. Where is this happening?',
    sectionThree: '3. Add a photo or video (optional)',
    titleLabel: 'Post title',
    titlePlaceholder: 'Add a short title',
    textPlaceholder: 'Describe the scene, crowd, weather, or what you found...',
    locationPlaceholder: 'Search for a place, neighborhood, or area',
    browserHint:
      'The selected area is used when you publish. Choose Near Me to use browser location.',
    uploadTitle: 'Click to choose files',
    uploadSub: 'JPG, PNG, MP4 up to 15MB',
    noMedia: 'No media selected yet',
    tip: 'Tip: Clear photos get more engagement.',
    publish: 'Publish Local Update',
    publishing: 'Publishing...',
    reviewNote: 'Your post will be reviewed to keep Spots helpful and safe.',
    postingAccess: 'Posting access',
    postingAccessBody: 'Local posting stays first. Plan details remain visible here.',
    role: 'Role',
    plan: 'Plan',
    quota: 'Event quota',
    eventRestricted: 'Event studio is restricted',
    eventReady: 'Event studio is available',
    organizationTitle: 'Promote events (organization accounts)',
    organizationBody: 'Unlock more ways to reach your community.',
    previewTitle: 'Live preview',
    previewBody: 'This is how your update may appear in Explore.',
    guest: 'Guest',
    free: 'Free',
    signInRequired: 'You need to be signed in before publishing.',
    uploadUnavailableTitle: 'Upload unavailable',
    locationPermissionTitle: 'Location unavailable',
    locationSelectedTitle: 'Location selected',
    setupIssueTitle: 'Publishing access data could not be fully loaded',
    retry: 'Retry',
    learnMore: 'View account settings',
    emptyTitle: 'Enter a title before publishing.',
    emptyPost: 'Enter an update before publishing.',
    eventFormTitle: 'Create promoted event',
    eventTitlePlaceholder: 'Event title',
    eventDescriptionPlaceholder: 'Short event description',
    eventStartPlaceholder: 'Start time, e.g. 2026-05-01T18:00',
    eventEndPlaceholder: 'End time, e.g. 2026-05-01T21:00',
    createEvent: 'Publish Event',
    creatingEvent: 'Publishing...',
  };
}

function getQuickAreaLabel(
  area: (typeof QUICK_AREAS)[number],
  language: AppLanguage
) {
  return language === 'ar' ? area.labelAr : area.labelEn;
}

function getPreviewImage(mediaItems: MediaPreview[]) {
  const firstImage = mediaItems.find(item => item.kind === 'image');
  return firstImage?.uri ?? PREVIEW_IMAGE;
}

function getPersistableHeroImageUrl(mediaItems: readonly MediaPreview[]) {
  return mediaItems.find(
    item => item.kind === 'image' && !item.objectUrl && /^https?:\/\//i.test(item.uri)
  )?.uri ?? null;
}

function getDefaultEventDateTime(hoursFromNow: number) {
  return new Date(Date.now() + hoursFromNow * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 16);
}

export function PostScreen() {
  const { user } = useAuth();
  const navigation = useNavigation<BottomTabNavigationProp<MainTabParamList>>();
  const {
    getPlanLevelLabel,
    getRoleLabel,
    getTextAlign,
    isRTL,
    language,
    t,
  } = useLocalization();
  const copy = React.useMemo(() => getCopy(language), [language]);
  const textAlign = getTextAlign();
  const objectUrlsRef = React.useRef<Set<string>>(new Set());

  const [userRole, setUserRole] = React.useState<string>('user');
  const [subscription, setSubscription] = React.useState<UserSubscription | null>(null);
  const [activePromotedEventsCount, setActivePromotedEventsCount] = React.useState(0);
  const [setupIssue, setSetupIssue] = React.useState<string | null>(null);
  const [refreshToken, setRefreshToken] = React.useState(0);

  const [composeCategory, setComposeCategory] =
    React.useState<PostCategoryOption>(DEFAULT_COMPOSE_CATEGORY);
  const [postTitle, setPostTitle] = React.useState('');
  const [text, setText] = React.useState('');
  const [locationQuery, setLocationQuery] = React.useState(language === 'ar' ? 'قطر' : 'Qatar');
  const [selectedArea, setSelectedArea] = React.useState<string | null>(null);
  const [selectedLocationOverride, setSelectedLocationOverride] =
    React.useState<LocationOverride | null>(null);
  const [locationPreview, setLocationPreview] = React.useState('');
  const [locationLoading, setLocationLoading] = React.useState(false);
  const [mediaItems, setMediaItems] = React.useState<MediaPreview[]>([]);
  const [postLoading, setPostLoading] = React.useState(false);
  const [lastPostSuccess, setLastPostSuccess] = React.useState(false);
  const [eventTitle, setEventTitle] = React.useState('');
  const [eventDescription, setEventDescription] = React.useState('');
  const [eventStart, setEventStart] = React.useState(() => getDefaultEventDateTime(24));
  const [eventEnd, setEventEnd] = React.useState(() => getDefaultEventDateTime(27));
  const [eventLoading, setEventLoading] = React.useState(false);

  React.useEffect(() => {
    return () => {
      objectUrlsRef.current.forEach(uri => {
        URL.revokeObjectURL(uri);
      });
      objectUrlsRef.current.clear();
    };
  }, []);

  React.useEffect(() => {
    setLocationQuery(current => {
      const trimmed = current.trim();
      const normalized = trimmed.toLowerCase();
      if (!trimmed || normalized === 'qatar' || trimmed === 'قطر') {
        return language === 'ar' ? 'قطر' : 'Qatar';
      }

      return current;
    });
  }, [language]);

  const handleSetupIssue = React.useCallback(
    (error: unknown, fallbackMessage: string) => {
      const nextMessage = isDataAccessBlockedError(error)
        ? getBlockedDataMessage(language === 'ar' ? 'بيانات النشر' : 'publishing access data')
        : getErrorMessage(error, fallbackMessage);

      setSetupIssue(current => current ?? nextMessage);
    },
    [language]
  );

  React.useEffect(() => {
    if (!user) {
      setUserRole('user');
      setSubscription(null);
      setActivePromotedEventsCount(0);
      setSetupIssue(null);
      return undefined;
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
    return observeUserSubscription(
      user?.id,
      nextSubscription => {
        setSubscription(nextSubscription.userId ? nextSubscription : null);
      },
      error => {
        handleSetupIssue(error, 'Failed to load your plan details.');
      }
    );
  }, [handleSetupIssue, refreshToken, user?.id]);

  React.useEffect(() => {
    if (!user?.id) {
      setActivePromotedEventsCount(0);
      return undefined;
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
    if (postTitle.trim() || text.trim()) {
      setLastPostSuccess(false);
    }
  }, [postTitle, text]);

  const promotedEventAccess = getPromotedEventAccessState({
    userRole,
    subscription,
    activePromotedEventsCount,
  });

  const accessRoleValue = user ? getRoleLabel(userRole) : copy.guest;
  const accessPlanValue = user
    ? getPlanLevelLabel(subscription?.planLevel ?? 'free')
    : copy.free;
  const quotaValue = `${activePromotedEventsCount}/${promotedEventAccess.maxActivePromotedEvents}`;
  const locationPreviewLabel = locationLoading
    ? language === 'ar'
      ? 'جار تحديد منطقتك الحالية...'
      : 'Fetching your current area...'
    : locationPreview || copy.browserHint;
  const previewLocation = locationPreview || locationQuery || (language === 'ar' ? 'قطر' : 'Qatar');
  const selectedCategoryLabel = getCategoryOptionLabel(composeCategory, language);
  const previewPostTitle =
    postTitle.trim() ||
    `${selectedCategoryLabel} ${language === 'ar' ? 'تحديث محلي' : 'local update'}`;

  const handleRetrySetup = React.useCallback(() => {
    setSetupIssue(null);
    setRefreshToken(value => value + 1);
  }, []);

  const handleSelectCategory = React.useCallback((category: PostCategoryOption) => {
    setComposeCategory(category);
  }, []);

  const handleQuickAreaSelect = React.useCallback(
    async (areaLabel: string) => {
      const nearMeLabel = language === 'ar' ? 'بالقرب مني' : 'Near Me';
      setLastPostSuccess(false);

      if (areaLabel === nearMeLabel) {
        setLocationLoading(true);

        try {
          const { status } = await requestForegroundLocationPermission();

          if (status !== 'granted') {
            throw new PostLocationPermissionError(
              language === 'ar'
                ? 'نحتاج صلاحية الموقع لاستخدام منطقتك الحالية.'
                : 'We need location permission to use your current area.'
            );
          }

          const coords = await getCurrentCoordinates();
          const nextLabel = await getLocationDisplayName(coords.latitude, coords.longitude);

          setSelectedArea(areaLabel);
          setSelectedLocationOverride({
            latitude: coords.latitude,
            longitude: coords.longitude,
            locationName: nextLabel,
          });
          setLocationQuery(nextLabel);
          setLocationPreview(nextLabel);
          showAlert(copy.locationSelectedTitle, nextLabel);
        } catch (error) {
          showAlert(copy.locationPermissionTitle, getErrorMessage(error, copy.browserHint));
        } finally {
          setLocationLoading(false);
        }

        return;
      }

      const presetLocation = findLocationPreset(areaLabel);
      const presetLabel = presetLocation
        ? getLocationPresetLabel(presetLocation, language)
        : areaLabel;

      setSelectedArea(areaLabel);
      setSelectedLocationOverride(presetLocation);
      setLocationQuery(presetLabel);
      setLocationPreview(presetLabel);
    },
    [copy.browserHint, copy.locationPermissionTitle, copy.locationSelectedTitle, language]
  );

  const handlePickMedia = React.useCallback(() => {
    if (typeof document === 'undefined') {
      showAlert(copy.uploadUnavailableTitle, copy.uploadSub);
      return;
    }

    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = 'image/*,video/*';

    input.onchange = () => {
      const files = Array.from(input.files ?? []);

      if (files.length === 0) {
        return;
      }

      setMediaItems(current => {
        const remainingSlots = Math.max(0, 6 - current.length);
        const nextItems = files.slice(0, remainingSlots).map(file => {
          const uri = URL.createObjectURL(file);
          objectUrlsRef.current.add(uri);

          return {
            id: `${file.name}-${file.lastModified}-${Math.random().toString(36).slice(2)}`,
            uri,
            kind: file.type.startsWith('video/') ? 'video' as const : 'image' as const,
            name: file.name,
            objectUrl: true,
          };
        });

        return [...current, ...nextItems];
      });
    };

    input.click();
  }, [copy.uploadSub, copy.uploadUnavailableTitle]);

  const handleRemoveMedia = React.useCallback((mediaId: string) => {
    setMediaItems(current => {
      const removed = current.find(item => item.id === mediaId);
      if (removed?.objectUrl) {
        URL.revokeObjectURL(removed.uri);
        objectUrlsRef.current.delete(removed.uri);
      }

      return current.filter(item => item.id !== mediaId);
    });
  }, []);

  const handleCreatePost = React.useCallback(async () => {
    if (!postTitle.trim()) {
      showAlert(t('post.emptyPost'), copy.emptyTitle);
      return;
    }

    if (!text.trim()) {
      showAlert(t('post.emptyPost'), copy.emptyPost);
      return;
    }

    setPostLoading(true);
    setLastPostSuccess(false);

    try {
      const locationOverride =
        selectedLocationOverride ?? findLocationPreset(locationQuery);
      const result = await publishCurrentLocationPost({
        userId: user?.id,
        title: postTitle,
        text,
        category: composeCategory.backendCategory,
        displayCategory: composeCategory.id,
        locationOverride,
        heroImageUrl: getPersistableHeroImageUrl(mediaItems),
      });

      setLocationPreview(result.locationName);
      if (!locationQuery.trim()) {
        setLocationQuery(result.locationName);
      }
      setPostTitle('');
      setText('');
      objectUrlsRef.current.forEach(uri => {
        URL.revokeObjectURL(uri);
      });
      objectUrlsRef.current.clear();
      setMediaItems([]);
      setLastPostSuccess(true);
      showAlert(t('post.createdAlertTitle'), t('post.createdAlertBody'));
    } catch (error) {
      if (error instanceof PostValidationError) {
        showAlert(user ? t('post.emptyPost') : t('post.notLoggedIn'), error.message);
      } else if (error instanceof PostLocationPermissionError) {
        showAlert(t('post.locationPermissionTitle'), error.message);
      } else {
        showAlert(
          t('post.createErrorTitle'),
          isDataAccessBlockedError(error)
            ? getBlockedDataMessage(language === 'ar' ? 'إنشاء المنشور' : 'post creation')
            : getErrorMessage(error, 'Something went wrong.')
        );
      }
    } finally {
      setPostLoading(false);
    }
  }, [
    composeCategory.backendCategory,
    composeCategory.id,
    copy.emptyTitle,
    copy.emptyPost,
    language,
    locationQuery,
    mediaItems,
    postTitle,
    selectedLocationOverride,
    t,
    text,
    user,
  ]);

  const handleCreatePromotedEvent = React.useCallback(async () => {
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

      setLocationPreview(result.locationName);
      if (!locationQuery.trim()) {
        setLocationQuery(result.locationName);
      }
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
  }, [
    activePromotedEventsCount,
    eventDescription,
    eventEnd,
    eventStart,
    eventTitle,
    locationQuery,
    selectedLocationOverride,
    subscription,
    t,
    user?.id,
    userRole,
  ]);

  return (
    <ScrollView
      style={styles.page}
      contentContainerStyle={styles.pageContent}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <View style={[styles.container, { direction: isRTL ? 'rtl' : 'ltr' }]}>
        <View style={styles.headerBlock}>
          <View style={styles.headerIconWrap}>
            <Ionicons name="sparkles" size={22} color={webDesktopColors.primary} />
          </View>

          <View>
            <Text
              style={[
                styles.pageTitle,
                { textAlign, writingDirection: isRTL ? 'rtl' : 'ltr' },
              ]}
            >
              {copy.title}
            </Text>
            <Text
              style={[
                styles.pageSubtitle,
                { textAlign, writingDirection: isRTL ? 'rtl' : 'ltr' },
              ]}
            >
              {copy.subtitle}
            </Text>
          </View>
        </View>

        {setupIssue ? (
          <StatusBanner
            compact
            tone="warning"
            title={copy.setupIssueTitle}
            body={setupIssue}
            actions={[
              {
                label: copy.retry,
                tone: 'primary',
                onPress: handleRetrySetup,
              },
            ]}
          />
        ) : null}

        <View style={styles.mainGrid}>
          <View style={styles.leftColumn}>
            <View style={styles.composeCard}>
              <Text style={styles.stepTitle}>{copy.sectionOne}</Text>

              <View style={styles.categoryRow}>
                {POST_CATEGORY_OPTIONS.map(category => {
                  const active = composeCategory.id === category.id;

                  return (
                    <Pressable
                      key={category.id}
                      accessibilityRole="button"
                      onPress={() => handleSelectCategory(category)}
                      style={({ pressed }) => [
                        styles.categoryChip,
                        active && styles.categoryChipActive,
                        pressed && styles.pressed,
                      ]}
                    >
                      <Ionicons
                        name={category.icon as keyof typeof Ionicons.glyphMap}
                        size={16}
                        color={active ? webDesktopColors.primary : '#685F58'}
                      />
                      <Text
                        style={[
                          styles.categoryChipText,
                          active && styles.categoryChipTextActive,
                          { writingDirection: isRTL ? 'rtl' : 'ltr' },
                        ]}
                      >
                        {getCategoryOptionLabel(category, language)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <View style={styles.titleInputWrap}>
                <Text
                  style={[
                    styles.fieldLabel,
                    { textAlign, writingDirection: isRTL ? 'rtl' : 'ltr' },
                  ]}
                >
                  {copy.titleLabel}
                </Text>
                <TextInput
                  value={postTitle}
                  onChangeText={value => setPostTitle(value.slice(0, TITLE_LIMIT))}
                  maxLength={TITLE_LIMIT}
                  placeholder={copy.titlePlaceholder}
                  placeholderTextColor={webDesktopColors.textSoft}
                  style={[
                    styles.titleInput,
                    { textAlign, writingDirection: isRTL ? 'rtl' : 'ltr' },
                  ]}
                />
                <Text style={styles.titleCount}>{postTitle.length} / {TITLE_LIMIT}</Text>
              </View>

              <View style={styles.textAreaWrap}>
                <TextInput
                  value={text}
                  onChangeText={value => setText(value.slice(0, CHARACTER_LIMIT))}
                  multiline
                  maxLength={CHARACTER_LIMIT}
                  placeholder={copy.textPlaceholder}
                  placeholderTextColor={webDesktopColors.textSoft}
                  style={[
                    styles.textArea,
                    { textAlign, writingDirection: isRTL ? 'rtl' : 'ltr' },
                  ]}
                />
                <Text style={styles.charCount}>{text.length} / {CHARACTER_LIMIT}</Text>
              </View>

              <Text style={[styles.stepTitle, styles.sectionSpacing]}>
                {copy.sectionTwo}
              </Text>

              <View style={styles.locationSearchWrap}>
                <Ionicons name="location-outline" size={18} color="#81766F" />
                <TextInput
                  value={locationQuery}
                  onChangeText={value => {
                    const preset = findLocationPreset(value);
                    setLocationQuery(value);
                    setSelectedArea(null);
                    setSelectedLocationOverride(preset);
                    setLocationPreview(preset ? getLocationPresetLabel(preset, language) : '');
                  }}
                  placeholder={copy.locationPlaceholder}
                  placeholderTextColor={webDesktopColors.textSoft}
                  style={[
                    styles.locationSearchInput,
                    { textAlign, writingDirection: isRTL ? 'rtl' : 'ltr' },
                  ]}
                />
                <Pressable
                  accessibilityRole="button"
                  style={({ pressed }) => [styles.locationCrosshair, pressed && styles.pressed]}
                  onPress={() => void handleQuickAreaSelect(language === 'ar' ? 'بالقرب مني' : 'Near Me')}
                >
                  {locationLoading ? (
                    <ActivityIndicator color={webDesktopColors.primary} />
                  ) : (
                    <Ionicons name="locate-outline" size={18} color="#756B65" />
                  )}
                </Pressable>
              </View>

              <View style={styles.quickPlacesRow}>
                {QUICK_AREAS.map(area => {
                  const label = getQuickAreaLabel(area, language);
                  const active = selectedArea === label;

                  return (
                    <Pressable
                      key={area.labelEn}
                      accessibilityRole="button"
                      onPress={() => void handleQuickAreaSelect(label)}
                      style={({ pressed }) => [
                        styles.quickPlaceChip,
                        active && styles.quickPlaceChipActive,
                        pressed && styles.pressed,
                      ]}
                    >
                      <Ionicons
                        name={area.icon as keyof typeof Ionicons.glyphMap}
                        size={15}
                        color={active ? webDesktopColors.primary : '#6C625C'}
                      />
                      <Text
                        style={[
                          styles.quickPlaceChipText,
                          active && styles.quickPlaceChipTextActive,
                        ]}
                      >
                        {label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text style={styles.browserHint}>{locationPreviewLabel}</Text>

              <Text style={[styles.stepTitle, styles.sectionSpacing]}>
                {copy.sectionThree}
              </Text>

              <View style={styles.uploadPanel}>
                <Pressable
                  accessibilityRole="button"
                  onPress={handlePickMedia}
                  style={({ pressed }) => [styles.uploadDropzone, pressed && styles.pressed]}
                >
                  <Ionicons name="cloud-upload-outline" size={34} color="#756B65" />
                  <Text style={styles.uploadDropzoneTitle}>{copy.uploadTitle}</Text>
                  <Text style={styles.uploadDropzoneSub}>{copy.uploadSub}</Text>
                </Pressable>

                <View style={styles.uploadThumbRow}>
                  {mediaItems.length === 0 ? (
                    <Text style={styles.noMediaText}>{copy.noMedia}</Text>
                  ) : (
                    mediaItems.map(item => (
                      <View key={item.id} style={styles.uploadThumbWrap}>
                        {item.kind === 'image' ? (
                          <Image source={{ uri: item.uri }} style={styles.uploadThumb} />
                        ) : (
                          <View style={styles.videoThumb}>
                            <Ionicons name="videocam-outline" size={28} color="#756B65" />
                            <Text style={styles.videoThumbText}>MP4</Text>
                          </View>
                        )}
                        <Pressable
                          accessibilityRole="button"
                          style={({ pressed }) => [styles.uploadRemove, pressed && styles.pressed]}
                          onPress={() => handleRemoveMedia(item.id)}
                        >
                          <Ionicons name="close" size={14} color="#3E3530" />
                        </Pressable>
                      </View>
                    ))
                  )}
                </View>
              </View>

              <View style={styles.tipRow}>
                <Ionicons name="bulb-outline" size={16} color="#8A7E77" />
                <Text style={styles.tipText}>{copy.tip}</Text>
              </View>

              <Pressable
                accessibilityRole="button"
                disabled={!user || postLoading}
                style={({ pressed }) => [
                  styles.publishButton,
                  (!user || postLoading) && styles.publishButtonDisabled,
                  pressed && user && !postLoading && styles.pressed,
                ]}
                onPress={() => void handleCreatePost()}
              >
                {postLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Text style={styles.publishButtonText}>{copy.publish}</Text>
                    <Ionicons name="paper-plane-outline" size={18} color="#FFFFFF" />
                  </>
                )}
              </Pressable>

              {!user ? (
                <Text style={styles.signInHint}>{copy.signInRequired}</Text>
              ) : null}

              {lastPostSuccess ? (
                <Text style={styles.successHint}>{t('post.successBody')}</Text>
              ) : null}

              <View style={styles.reviewNoteRow}>
                <Ionicons name="lock-closed-outline" size={14} color="#8A7E77" />
                <Text style={styles.reviewNoteText}>{copy.reviewNote}</Text>
              </View>
            </View>
          </View>

          <View style={styles.rightColumn}>
            <View style={styles.sideCard}>
              <Text style={styles.sideCardTitle}>{copy.postingAccess}</Text>
              <Text style={styles.sideCardSubtitle}>{copy.postingAccessBody}</Text>

              <View style={styles.accessStatRow}>
                <View style={styles.accessStat}>
                  <View style={styles.accessStatIconSoft}>
                    <Ionicons name="person-outline" size={18} color={webDesktopColors.primary} />
                  </View>
                  <View>
                    <Text style={styles.accessStatTitle}>{accessRoleValue}</Text>
                    <Text style={styles.accessStatMeta}>{copy.role}</Text>
                  </View>
                </View>

                <View style={styles.accessStat}>
                  <View style={styles.accessStatIconSoft}>
                    <Ionicons name="flame-outline" size={18} color="#E58E2B" />
                  </View>
                  <View>
                    <Text style={styles.accessStatTitle}>{accessPlanValue}</Text>
                    <Text style={styles.accessStatMeta}>{copy.plan}</Text>
                  </View>
                </View>

                <View style={styles.accessStat}>
                  <View style={styles.accessStatIconSoft}>
                    <Ionicons name="calendar-outline" size={18} color="#615751" />
                  </View>
                  <View>
                    <Text style={styles.accessStatTitle}>{quotaValue}</Text>
                    <Text style={styles.accessStatMeta}>{copy.quota}</Text>
                  </View>
                </View>
              </View>

              <View
                style={[
                  styles.warningStrip,
                  promotedEventAccess.allowed && styles.successStrip,
                ]}
              >
                <Text
                  style={[
                    styles.warningStripTitle,
                    promotedEventAccess.allowed && styles.successStripTitle,
                  ]}
                >
                  {promotedEventAccess.allowed ? copy.eventReady : copy.eventRestricted}
                </Text>
                <Text
                  style={[
                    styles.warningStripBody,
                    promotedEventAccess.allowed && styles.successStripBody,
                  ]}
                >
                  {promotedEventAccess.message}
                </Text>
              </View>
            </View>

            <View style={styles.sideCard}>
              <Text style={styles.sideCardTitle}>{copy.organizationTitle}</Text>
              <Text style={styles.sideCardSubtitle}>{copy.organizationBody}</Text>

              <View style={styles.featureBullet}>
                <View style={styles.featureBulletIcon}>
                  <Ionicons name="calendar-outline" size={18} color={webDesktopColors.primary} />
                </View>
                <View style={styles.featureBulletCopy}>
                  <Text style={styles.featureBulletTitle}>{t('post.orgTitle')}</Text>
                  <Text style={styles.featureBulletBody}>{t('post.orgSubtitle')}</Text>
                </View>
              </View>

              <View style={styles.featureBullet}>
                <View style={styles.featureBulletIcon}>
                  <Ionicons name="stats-chart-outline" size={18} color="#E58E2B" />
                </View>
                <View style={styles.featureBulletCopy}>
                  <Text style={styles.featureBulletTitle}>{t('post.analyticsAccess')}</Text>
                  <Text style={styles.featureBulletBody}>
                    {promotedEventAccess.analyticsEnabled
                      ? t('post.analyticsAvailable')
                      : t('post.analyticsUpgrade')}
                  </Text>
                </View>
              </View>

              {promotedEventAccess.allowed ? (
                <View style={styles.eventForm}>
                  <Text style={styles.eventFormTitle}>{copy.eventFormTitle}</Text>

                  <TextInput
                    value={eventTitle}
                    onChangeText={setEventTitle}
                    placeholder={copy.eventTitlePlaceholder}
                    placeholderTextColor="#A89D96"
                    style={[
                      styles.eventInput,
                      { textAlign, writingDirection: isRTL ? 'rtl' : 'ltr' },
                    ]}
                  />

                  <TextInput
                    value={eventDescription}
                    onChangeText={setEventDescription}
                    placeholder={copy.eventDescriptionPlaceholder}
                    placeholderTextColor="#A89D96"
                    multiline
                    style={[
                      styles.eventInput,
                      styles.eventDescriptionInput,
                      { textAlign, writingDirection: isRTL ? 'rtl' : 'ltr' },
                    ]}
                  />

                  <View style={styles.eventTimeRow}>
                    <TextInput
                      value={eventStart}
                      onChangeText={setEventStart}
                      placeholder={copy.eventStartPlaceholder}
                      placeholderTextColor="#A89D96"
                      style={[
                        styles.eventInput,
                        styles.eventTimeInput,
                        { textAlign, writingDirection: isRTL ? 'rtl' : 'ltr' },
                      ]}
                    />
                    <TextInput
                      value={eventEnd}
                      onChangeText={setEventEnd}
                      placeholder={copy.eventEndPlaceholder}
                      placeholderTextColor="#A89D96"
                      style={[
                        styles.eventInput,
                        styles.eventTimeInput,
                        { textAlign, writingDirection: isRTL ? 'rtl' : 'ltr' },
                      ]}
                    />
                  </View>

                  <Pressable
                    accessibilityRole="button"
                    disabled={eventLoading}
                    style={({ pressed }) => [
                      styles.eventButton,
                      eventLoading && styles.disabledButton,
                      pressed && !eventLoading && styles.pressed,
                    ]}
                    onPress={handleCreatePromotedEvent}
                  >
                    {eventLoading ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <Text style={styles.eventButtonText}>{copy.createEvent}</Text>
                    )}
                  </Pressable>
                </View>
              ) : null}

              <Pressable
                accessibilityRole="button"
                style={({ pressed }) => [styles.learnMoreButton, pressed && styles.pressed]}
                onPress={() => navigation.navigate('Profile')}
              >
                <Text style={styles.learnMoreButtonText}>{copy.learnMore}</Text>
                <Ionicons name="open-outline" size={15} color="#7D736D" />
              </Pressable>
            </View>

            <View style={styles.sideCard}>
              <Text style={styles.sideCardTitle}>{copy.previewTitle}</Text>
              <Text style={styles.sideCardSubtitle}>{copy.previewBody}</Text>

              <View style={styles.previewCard}>
                <Image source={{ uri: getPreviewImage(mediaItems) }} style={styles.previewImage} />
                <View style={styles.previewBody}>
                  <Text style={styles.previewTitle} numberOfLines={2}>
                    {previewPostTitle}
                  </Text>
                  <Text style={styles.previewDescription} numberOfLines={3}>
                    {text.trim() || copy.textPlaceholder}
                  </Text>

                  <View style={styles.previewMetaRow}>
                    <View style={styles.previewMetaItem}>
                      <Ionicons name="location-outline" size={13} color="#7A706A" />
                      <Text style={styles.previewMetaText} numberOfLines={1}>
                        {previewLocation}
                      </Text>
                    </View>

                    <View style={styles.previewMetaItem}>
                      <Ionicons name="image-outline" size={13} color="#7A706A" />
                      <Text style={styles.previewMetaText}>
                        {mediaItems.length}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              <View style={styles.tipsList}>
                {[
                  t('post.browserLocationTitle'),
                  t('post.browserLocationBody'),
                  copy.reviewNote,
                ].map(tip => (
                  <View key={tip} style={styles.tipBulletRow}>
                    <Ionicons name="checkmark-circle" size={16} color="#7BBE76" />
                    <Text style={styles.tipBulletText}>{tip}</Text>
                  </View>
                ))}
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

  headerBlock: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginTop: 6,
  },
  headerIconWrap: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  pageTitle: {
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '800',
    color: webDesktopColors.text,
  },
  pageSubtitle: {
    marginTop: 6,
    fontSize: 16,
    lineHeight: 22,
    color: webDesktopColors.textMuted,
  },

  mainGrid: {
    flexDirection: 'row',
    gap: 28,
    alignItems: 'flex-start',
  },
  leftColumn: {
    flex: 1,
    minWidth: 0,
  },
  rightColumn: {
    width: 510,
    gap: 16,
  },

  composeCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: webDesktopColors.border,
    borderRadius: 24,
    padding: 22,
  },

  stepTitle: {
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '800',
    color: webDesktopColors.text,
    marginBottom: 14,
  },
  sectionSpacing: {
    marginTop: 18,
  },

  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  categoryChip: {
    minHeight: 38,
    paddingHorizontal: 16,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: webDesktopColors.border,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryChipActive: {
    borderColor: '#F0B1A8',
    backgroundColor: '#FFF8F6',
  },
  categoryChipText: {
    fontSize: 14,
    lineHeight: 17,
    fontWeight: '600',
    color: '#5A514B',
  },
  categoryChipTextActive: {
    color: webDesktopColors.primary,
  },

  titleInputWrap: {
    marginTop: 18,
    minHeight: 90,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: webDesktopColors.border,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 5,
  },
  fieldLabel: {
    fontSize: 12,
    lineHeight: 15,
    fontWeight: '800',
    color: webDesktopColors.textSoft,
  },
  titleInput: {
    minHeight: 28,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '700',
    color: webDesktopColors.text,
    padding: 0,
  },
  titleCount: {
    alignSelf: 'flex-end',
    marginTop: 4,
    fontSize: 12,
    lineHeight: 15,
    color: webDesktopColors.textSoft,
  },
  textAreaWrap: {
    marginTop: 12,
    minHeight: 150,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: webDesktopColors.border,
    backgroundColor: '#FFFFFF',
    padding: 14,
  },
  textArea: {
    flex: 1,
    minHeight: 104,
    fontSize: 16,
    lineHeight: 22,
    color: webDesktopColors.text,
    textAlignVertical: 'top',
    padding: 0,
  },
  charCount: {
    alignSelf: 'flex-end',
    marginTop: 8,
    fontSize: 13,
    lineHeight: 16,
    color: webDesktopColors.textSoft,
  },

  locationSearchWrap: {
    minHeight: 52,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: webDesktopColors.border,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  locationSearchInput: {
    flex: 1,
    fontSize: 16,
    lineHeight: 20,
    color: webDesktopColors.text,
    padding: 0,
  },
  locationCrosshair: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },

  quickPlacesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 12,
  },
  quickPlaceChip: {
    minHeight: 34,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: webDesktopColors.border,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  quickPlaceChipActive: {
    borderColor: '#F0B1A8',
    backgroundColor: '#FFF8F6',
  },
  quickPlaceChipText: {
    fontSize: 14,
    lineHeight: 17,
    color: '#5C524C',
    fontWeight: '500',
  },
  quickPlaceChipTextActive: {
    color: webDesktopColors.primary,
  },
  browserHint: {
    marginTop: 12,
    fontSize: 14,
    lineHeight: 18,
    color: webDesktopColors.textMuted,
  },

  uploadPanel: {
    marginTop: 12,
    minHeight: 118,
    borderRadius: 18,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#D9D1C8',
    backgroundColor: '#FFFEFD',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  uploadDropzone: {
    width: 280,
    minHeight: 86,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  uploadDropzoneTitle: {
    fontSize: 15,
    lineHeight: 18,
    fontWeight: '600',
    color: '#5A514B',
    textAlign: 'center',
  },
  uploadDropzoneSub: {
    fontSize: 13,
    lineHeight: 16,
    color: webDesktopColors.textSoft,
    textAlign: 'center',
  },
  uploadThumbRow: {
    flexDirection: 'row',
    gap: 10,
    flex: 1,
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  uploadThumbWrap: {
    position: 'relative',
  },
  uploadThumb: {
    width: 102,
    height: 78,
    borderRadius: 12,
    backgroundColor: '#E9E2DA',
  },
  videoThumb: {
    width: 102,
    height: 78,
    borderRadius: 12,
    backgroundColor: '#F2ECE5',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  videoThumbText: {
    fontSize: 12,
    lineHeight: 15,
    fontWeight: '800',
    color: '#756B65',
  },
  uploadRemove: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  noMediaText: {
    fontSize: 14,
    lineHeight: 18,
    color: webDesktopColors.textSoft,
  },

  tipRow: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tipText: {
    fontSize: 14,
    lineHeight: 17,
    color: '#7E736C',
  },

  publishButton: {
    marginTop: 20,
    minHeight: 52,
    borderRadius: 16,
    backgroundColor: webDesktopColors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  publishButtonDisabled: {
    opacity: 0.55,
  },
  publishButtonText: {
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  signInHint: {
    marginTop: 10,
    fontSize: 14,
    lineHeight: 18,
    color: webDesktopColors.warning,
  },
  successHint: {
    marginTop: 10,
    fontSize: 14,
    lineHeight: 18,
    color: webDesktopColors.success,
  },

  reviewNoteRow: {
    marginTop: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  reviewNoteText: {
    fontSize: 13,
    lineHeight: 16,
    color: '#837872',
  },

  sideCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: webDesktopColors.border,
    borderRadius: 22,
    padding: 18,
  },
  sideCardTitle: {
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '800',
    color: webDesktopColors.text,
  },
  sideCardSubtitle: {
    marginTop: 6,
    fontSize: 15,
    lineHeight: 20,
    color: webDesktopColors.textMuted,
  },

  accessStatRow: {
    marginTop: 16,
    flexDirection: 'row',
    gap: 10,
  },
  accessStat: {
    flex: 1,
    minHeight: 64,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: webDesktopColors.border,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
  },
  accessStatIconSoft: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFF2EE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  accessStatTitle: {
    fontSize: 16,
    lineHeight: 19,
    fontWeight: '800',
    color: webDesktopColors.text,
  },
  accessStatMeta: {
    marginTop: 2,
    fontSize: 13,
    lineHeight: 16,
    color: webDesktopColors.textSoft,
  },

  warningStrip: {
    marginTop: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EAC98F',
    backgroundColor: '#FBF3E3',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  warningStripTitle: {
    fontSize: 15,
    lineHeight: 18,
    fontWeight: '700',
    color: '#93631F',
  },
  warningStripBody: {
    marginTop: 4,
    fontSize: 14,
    lineHeight: 18,
    color: '#9A7237',
  },
  successStrip: {
    borderColor: '#A7D8B5',
    backgroundColor: '#ECF8F0',
  },
  successStripTitle: {
    color: webDesktopColors.success,
  },
  successStripBody: {
    color: '#4B805E',
  },

  featureBullet: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  featureBulletIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFF2EE',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  featureBulletCopy: {
    flex: 1,
  },
  featureBulletTitle: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '700',
    color: webDesktopColors.text,
  },
  featureBulletBody: {
    marginTop: 3,
    fontSize: 14,
    lineHeight: 18,
    color: webDesktopColors.textMuted,
  },

  eventForm: {
    marginTop: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: webDesktopColors.border,
    backgroundColor: '#FFFEFD',
    padding: 14,
    gap: 10,
  },
  eventFormTitle: {
    fontSize: 15,
    lineHeight: 18,
    fontWeight: '800',
    color: webDesktopColors.text,
  },
  eventInput: {
    minHeight: 42,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: webDesktopColors.border,
    backgroundColor: '#FFFFFF',
    color: webDesktopColors.text,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 14,
    lineHeight: 18,
  },
  eventDescriptionInput: {
    minHeight: 76,
    textAlignVertical: 'top',
  },
  eventTimeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  eventTimeInput: {
    flex: 1,
  },
  eventButton: {
    minHeight: 42,
    borderRadius: 12,
    backgroundColor: webDesktopColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventButtonText: {
    fontSize: 14,
    lineHeight: 17,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  disabledButton: {
    opacity: 0.55,
  },

  learnMoreButton: {
    marginTop: 16,
    minHeight: 42,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: webDesktopColors.border,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  learnMoreButtonText: {
    fontSize: 14,
    lineHeight: 17,
    fontWeight: '600',
    color: '#6C625C',
  },

  previewCard: {
    marginTop: 14,
    minHeight: 96,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: webDesktopColors.border,
    backgroundColor: '#FFFFFF',
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  previewImage: {
    width: 110,
    height: 74,
    borderRadius: 12,
    backgroundColor: '#E9E2DA',
  },
  previewBody: {
    flex: 1,
    minWidth: 0,
  },
  previewTitle: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '700',
    color: webDesktopColors.text,
  },
  previewDescription: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 17,
    color: webDesktopColors.textMuted,
  },
  previewMetaRow: {
    marginTop: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  previewMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    maxWidth: '100%',
  },
  previewMetaText: {
    fontSize: 12,
    lineHeight: 15,
    color: '#776C66',
  },

  tipsList: {
    marginTop: 16,
    gap: 8,
  },
  tipBulletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tipBulletText: {
    fontSize: 14,
    lineHeight: 17,
    color: '#6F655F',
    flex: 1,
  },
  pressed: {
    opacity: 0.82,
  },
});
