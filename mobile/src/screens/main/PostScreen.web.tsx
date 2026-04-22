import React from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';

import { PrimaryButton, SecondaryButton } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { StatusBanner } from '../../components/ui/StatusBanner';
import { TextField } from '../../components/ui/TextField';
import { useAuth } from '../../context/AuthContext';
import { useLocalization } from '../../context/LocalizationContext';
import { subscribeToActivePromotedEventsCountByCreator } from '../../repositories/eventRepository';
import {
  createPromotedEvent,
  EventPermissionError,
  EventValidationError,
} from '../../services/eventService';
import {
  getCurrentCoordinates,
  getLocationDisplayName,
  requestForegroundLocationPermission,
} from '../../services/locationService';
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
import { colors, radius, spacing, typography } from '../../theme/designSystem';
import {
  webDesktopChip,
  webDesktopControl,
  webDesktopLayout,
  webDesktopSectionTitle,
  webDesktopSupportSurface,
  webDesktopSurface,
} from '../../theme/webDesktopSystem';
import {
  getBlockedDataMessage,
  getErrorMessage,
  isDataAccessBlockedError,
} from '../../utils/dataAccessError';
import { showAlert } from '../../utils/showAlert';
import type { AppLanguage } from '../../types/profile';
import type { SpotCategory } from '../../types/post';
import type { UserSubscription } from '../../types/subscription';

type DesktopCategoryId =
  | 'all'
  | 'food'
  | 'coffee'
  | 'study'
  | 'outdoors'
  | 'events'
  | 'more';

type MediaPreview = {
  id: string;
  uri: string;
  kind: 'image' | 'video';
  isObjectUrl?: boolean;
};

const TWO_COLUMN_BREAKPOINT = 1180;
const STICKY_RAIL_BREAKPOINT = 1280;
const CHARACTER_LIMIT = 280;
const BACKEND_CATEGORY_OPTIONS: readonly SpotCategory[] = [
  'fishing',
  'event',
  'sighting',
  'weather',
];

const SAMPLE_MEDIA_LIBRARY: readonly MediaPreview[] = [
  {
    id: 'sample-park',
    uri: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80',
    kind: 'image',
  },
  {
    id: 'sample-skyline',
    uri: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1200&q=80',
    kind: 'image',
  },
  {
    id: 'sample-courtyard',
    uri: 'https://images.unsplash.com/photo-1467269204594-9661b134dd2b?auto=format&fit=crop&w=1200&q=80',
    kind: 'image',
  },
  {
    id: 'sample-coffee',
    uri: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=1200&q=80',
    kind: 'image',
  },
] as const;

const PREVIEW_FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=1200&q=80';

function getDesktopCopy(language: AppLanguage) {
  if (language === 'ar') {
    return {
      title: 'أنشئ تحديثا محليا',
      subtitle: 'شارك ما يحدث في مجتمعك. المحلي أولا دائما.',
      sectionOne: '1. ما الذي يحدث؟',
      sectionTwo: '2. أين يحدث هذا؟',
      sectionThree: '3. أضف صورة أو فيديو (اختياري)',
      categories: [
        { id: 'all' as const, label: 'الكل' },
        { id: 'food' as const, label: 'مأكولات ومشروبات' },
        { id: 'coffee' as const, label: 'قهوة' },
        { id: 'study' as const, label: 'دراسة وعمل' },
        { id: 'outdoors' as const, label: 'خارجي' },
        { id: 'events' as const, label: 'فعاليات' },
        { id: 'more' as const, label: 'المزيد' },
      ],
      textPlaceholder: 'صف المشهد أو الازدحام أو الطقس أو ما وجدته...',
      locationPlaceholder: 'ابحث عن مكان أو حي أو منطقة',
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
      uploadTitle: 'اسحب الملف هنا أو اضغط للرفع',
      uploadSubtitle: 'JPG, PNG, MP4 حتى 15MB',
      tip: 'نصيحة: الصور الواضحة تحصل على تفاعل أكبر.',
      publish: 'نشر التحديث المحلي',
      moderationNote: 'سيتم مراجعة منشورك للحفاظ على فائدة Spots وسلامته.',
      postingAccess: 'صلاحية النشر',
      accessSubtitle: 'يبقى النشر المحلي أولا. نشر الفعاليات متاح لكنه أهدأ.',
      promoteEvents: 'روّج للفعاليات (لحسابات الجهات)',
      promoteSubtitle: 'افتح طرقا أكثر للوصول إلى مجتمعك.',
      promoteButton: 'اعرف المزيد عن صلاحيات الجهات',
      livePreview: 'معاينة مباشرة',
      livePreviewSubtitle: 'هكذا قد يظهر تحديثك في Explore.',
      previewTitle: 'لقيمات وقهوة بوليفارد لوسيل',
      previewDescription: 'زحمة غداء لطيفة وتنوع جميل وسرعة في الخدمة.',
      previewArea: 'لوسيل',
      previewTime: 'اليوم 11:30 ص',
      previewMood: 'مزدحم',
      previewTipsTitle: 'نصائح لتحديثات رائعة',
      previewTips: [
        'كن محددا ومفيدا.',
        'أضف صورة واضحة.',
        'حافظ على الاحترام والموضوعية.',
      ],
      featureRows: [
        {
          title: 'أنشئ فعاليات مروجة',
          body: 'عزّز الظهور داخل Explore وعلى الخريطة.',
        },
        {
          title: 'تابع الأداء',
          body: 'شاهد المشاهدات والاهتمام والتفاعل.',
        },
        {
          title: 'ادعُ الفريق وأدِر العمل',
          body: 'تعاون بسهولة مع أعضاء فريقك.',
        },
      ],
      currentLocationLoading: 'جارٍ تحديد موقعك...',
      currentLocationHint: 'سيتم التقاط موقع المتصفح عند النشر.',
      setupRetry: 'إعادة المحاولة',
      eventStudioTitle: 'استوديو فعاليات الجهات',
      eventStudioSubtitle: 'للحسابات المؤهلة فقط. يظل موقع الفعالية ووقتها واضحين أثناء الإنشاء.',
      advancedCategories: 'خيارات إضافية',
      uploadEmptyState: 'أرفق لقطة أو فيديو قصيرا ليبدو التحديث أغنى بصريا.',
      signInNote: 'سجّل الدخول أولا قبل نشر تحديث محلي.',
    };
  }

  return {
    title: 'Create a local update',
    subtitle: 'Share what’s happening in your community. Local first, always.',
    sectionOne: "1. What's happening?",
    sectionTwo: '2. Where is this happening?',
    sectionThree: '3. Add a photo or video (optional)',
    categories: [
      { id: 'all' as const, label: 'All' },
      { id: 'food' as const, label: 'Food & Drinks' },
      { id: 'coffee' as const, label: 'Coffee' },
      { id: 'study' as const, label: 'Study & Work' },
      { id: 'outdoors' as const, label: 'Outdoors' },
      { id: 'events' as const, label: 'Events' },
      { id: 'more' as const, label: 'More' },
    ],
    textPlaceholder: 'Describe the scene, crowd, weather, or what you found...',
    locationPlaceholder: 'Search for a place, neighborhood, or area',
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
    uploadTitle: 'Drag and drop or click to upload',
    uploadSubtitle: 'JPG, PNG, MP4 up to 15MB',
    tip: 'Tip: Clear photos get more engagement.',
    publish: 'Publish Local Update',
    moderationNote: 'Your post will be reviewed to keep Spots helpful and safe.',
    postingAccess: 'Posting access',
    accessSubtitle: 'Local posting stays first. Event publishing is available, but quieter.',
    promoteEvents: 'Promote events (organization accounts)',
    promoteSubtitle: 'Unlock more ways to reach your community.',
    promoteButton: 'Learn more about organization access',
    livePreview: 'Live preview',
    livePreviewSubtitle: 'This is how your update may appear in Explore.',
    previewTitle: 'Lusail Boulevard bites and coffee',
    previewDescription: 'Busy lunch crowd, variety of cuisines & quick service.',
    previewArea: 'Lusail',
    previewTime: 'Today 11:30 AM',
    previewMood: 'Crowded',
    previewTipsTitle: 'Tips for great updates',
    previewTips: [
      'Be specific and helpful.',
      'Add a clear photo.',
      'Keep it respectful and on-topic.',
    ],
    featureRows: [
      {
        title: 'Create promoted events',
        body: 'Boost visibility in Explore and on the map.',
      },
      {
        title: 'Track performance',
        body: 'See views, interest, and engagement.',
      },
      {
        title: 'Invite and manage',
        body: 'Collaborate with your team.',
      },
    ],
    currentLocationLoading: 'Fetching your current area...',
    currentLocationHint: 'Browser location is still captured when you publish.',
    setupRetry: 'Retry',
    eventStudioTitle: 'Organization event studio',
    eventStudioSubtitle:
      'Only eligible organization accounts can publish promoted events from here.',
    advancedCategories: 'More category options',
    uploadEmptyState: 'Attach a photo or short clip to make the update feel more immediate.',
    signInNote: 'Sign in before publishing a local update.',
  };
}

function mapDesktopCategoryToSpotCategory(categoryId: DesktopCategoryId): SpotCategory {
  switch (categoryId) {
    case 'events':
      return 'event';
    case 'outdoors':
      return 'weather';
    case 'more':
      return 'sighting';
    case 'all':
    case 'food':
    case 'coffee':
    case 'study':
    default:
      return 'sighting';
  }
}

function buildPreviewTitle(source: string, fallback: string) {
  const trimmed = source.trim();
  if (!trimmed) {
    return fallback;
  }

  const firstSentence = trimmed.split(/[.!?]/)[0].trim();
  if (!firstSentence) {
    return fallback;
  }

  const normalized = `${firstSentence.charAt(0).toUpperCase()}${firstSentence.slice(1)}`.replace(
    /\s+/g,
    ' '
  );

  return normalized.length > 38 ? `${normalized.slice(0, 35).trim()}...` : normalized;
}

function buildPreviewMood(
  input: string,
  categoryId: DesktopCategoryId,
  fallback: string,
  language: AppLanguage
) {
  const normalized = input.trim().toLowerCase();

  if (normalized.includes('quiet') || normalized.includes('study')) {
    return language === 'ar' ? 'هادئ' : 'Quiet';
  }

  if (normalized.includes('busy') || normalized.includes('crowd') || normalized.includes('full')) {
    return language === 'ar' ? 'مزدحم' : 'Crowded';
  }

  if (categoryId === 'events') {
    return language === 'ar' ? 'مباشر' : 'Live';
  }

  if (categoryId === 'outdoors') {
    return language === 'ar' ? 'خارجي' : 'Open air';
  }

  if (categoryId === 'coffee') {
    return language === 'ar' ? 'قهوة' : 'Coffee';
  }

  return fallback;
}

function HeadingSpark() {
  return (
    <View style={styles.headingSpark}>
      <View style={styles.headingSparkDiamond} />
      <View style={styles.headingSparkDotLarge} />
      <View style={styles.headingSparkDotSmall} />
    </View>
  );
}

function StatBox({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View style={styles.statBox}>
      <View style={styles.statIconWrap}>
        <View style={styles.statIconDot} />
      </View>
      <View style={styles.statCopy}>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
      </View>
    </View>
  );
}

function FeatureRow({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  return (
    <View style={styles.featureRow}>
      <View style={styles.featureOrb}>
        <View style={styles.featureOrbInner} />
      </View>
      <View style={styles.featureCopy}>
        <Text style={styles.featureTitle}>{title}</Text>
        <Text style={styles.featureBody}>{body}</Text>
      </View>
    </View>
  );
}

function TipCheckRow({ label }: { label: string }) {
  return (
    <View style={styles.tipCheckRow}>
      <View style={styles.tipCheckWrap}>
        <View style={styles.tipCheckDot} />
      </View>
      <Text style={styles.tipCheckLabel}>{label}</Text>
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
  const { width } = useWindowDimensions();
  const isTwoColumnLayout = width >= TWO_COLUMN_BREAKPOINT;
  const isStickySidebar = width >= STICKY_RAIL_BREAKPOINT;
  const copy = React.useMemo(() => getDesktopCopy(language), [language]);
  const objectUrlRegistry = React.useRef<Set<string>>(new Set());
  const [userRole, setUserRole] = React.useState<string>('user');
  const [subscription, setSubscription] = React.useState<UserSubscription | null>(null);
  const [activePromotedEventsCount, setActivePromotedEventsCount] = React.useState(0);
  const [postText, setPostText] = React.useState('');
  const [category, setCategory] = React.useState<SpotCategory>('sighting');
  const [desktopCategory, setDesktopCategory] =
    React.useState<DesktopCategoryId>('all');
  const [showAdvancedCategories, setShowAdvancedCategories] = React.useState(false);
  const [postLoading, setPostLoading] = React.useState(false);
  const [locationName, setLocationName] = React.useState('');
  const [locationQuery, setLocationQuery] = React.useState('');
  const [selectedArea, setSelectedArea] = React.useState<string | null>(null);
  const [capturePointPreview, setCapturePointPreview] = React.useState('');
  const [locationPreviewLoading, setLocationPreviewLoading] = React.useState(false);
  const [lastPostSuccess, setLastPostSuccess] = React.useState(false);
  const [eventTitle, setEventTitle] = React.useState('');
  const [eventDescription, setEventDescription] = React.useState('');
  const [eventCategory, setEventCategory] = React.useState<SpotCategory>('event');
  const [eventStartTime, setEventStartTime] = React.useState('');
  const [eventEndTime, setEventEndTime] = React.useState('');
  const [eventLoading, setEventLoading] = React.useState(false);
  const [eventLocationName, setEventLocationName] = React.useState('');
  const [lastEventSuccess, setLastEventSuccess] = React.useState(false);
  const [eventStudioExpanded, setEventStudioExpanded] = React.useState(false);
  const [setupIssue, setSetupIssue] = React.useState<string | null>(null);
  const [refreshToken, setRefreshToken] = React.useState(0);
  const [mediaItems, setMediaItems] = React.useState<MediaPreview[]>(
    [...SAMPLE_MEDIA_LIBRARY]
  );

  const handleSetupIssue = React.useCallback(
    (error: unknown, fallbackMessage: string) => {
      const nextMessage = isDataAccessBlockedError(error)
        ? getBlockedDataMessage('publishing access data')
        : getErrorMessage(error, fallbackMessage);

      setSetupIssue(current => current ?? nextMessage);
    },
    []
  );

  React.useEffect(() => {
    return () => {
      objectUrlRegistry.current.forEach(uri => {
        if (typeof URL !== 'undefined') {
          URL.revokeObjectURL(uri);
        }
      });
      objectUrlRegistry.current.clear();
    };
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
    if (postText.trim().length > 0) {
      setLastPostSuccess(false);
    }
  }, [postText]);

  React.useEffect(() => {
    if (eventTitle.trim() || eventDescription.trim() || eventStartTime || eventEndTime) {
      setLastEventSuccess(false);
    }
  }, [eventDescription, eventEndTime, eventStartTime, eventTitle]);

  const promotedEventAccess = getPromotedEventAccessState({
    userRole,
    subscription,
    activePromotedEventsCount,
  });

  const accessRoleValue =
    user && userRole ? getRoleLabel(userRole) : language === 'ar' ? 'ضيف' : 'Guest';
  const accessPlanValue = getPlanLevelLabel(subscription?.planLevel ?? 'free');
  const quotaValue = `${activePromotedEventsCount} / ${promotedEventAccess.maxActivePromotedEvents}`;
  const resolvedPreviewArea = React.useMemo(() => {
    if (selectedArea === copy.nearMe) {
      return capturePointPreview || copy.nearMe;
    }

    if (selectedArea) {
      return selectedArea;
    }

    if (locationQuery.trim()) {
      return locationQuery.trim();
    }

    if (capturePointPreview) {
      return capturePointPreview;
    }

    if (locationName) {
      return locationName;
    }

    return copy.previewArea;
  }, [
    capturePointPreview,
    copy.nearMe,
    copy.previewArea,
    locationName,
    locationQuery,
    selectedArea,
  ]);
  const previewTitle = React.useMemo(
    () => buildPreviewTitle(postText, copy.previewTitle),
    [copy.previewTitle, postText]
  );
  const previewDescription = React.useMemo(() => {
    const trimmed = postText.trim();
    if (!trimmed) {
      return copy.previewDescription;
    }

    return trimmed.length > 86 ? `${trimmed.slice(0, 83).trim()}...` : trimmed;
  }, [copy.previewDescription, postText]);
  const previewMood = React.useMemo(
    () => buildPreviewMood(postText, desktopCategory, copy.previewMood, language),
    [copy.previewMood, desktopCategory, language, postText]
  );
  const previewImageUri = React.useMemo(
    () => mediaItems.find(item => item.kind === 'image')?.uri ?? PREVIEW_FALLBACK_IMAGE,
    [mediaItems]
  );

  const handleRetrySetup = React.useCallback(() => {
    setSetupIssue(null);
    setRefreshToken(current => current + 1);
  }, []);

  const handleDesktopCategorySelect = React.useCallback((nextCategory: DesktopCategoryId) => {
    if (nextCategory === 'more') {
      setDesktopCategory('more');
      setShowAdvancedCategories(current => !current);
      return;
    }

    setDesktopCategory(nextCategory);
    setShowAdvancedCategories(false);
    setCategory(mapDesktopCategoryToSpotCategory(nextCategory));
  }, []);

  const handleBackendCategorySelect = React.useCallback((nextCategory: SpotCategory) => {
    setCategory(nextCategory);
    setDesktopCategory('more');
    setShowAdvancedCategories(true);
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
        } catch (error: any) {
          showAlert(
            t('post.locationPermissionTitle'),
            error?.message ?? copy.currentLocationHint
          );
        } finally {
          setLocationPreviewLoading(false);
        }

        return;
      }

      setSelectedArea(areaLabel);
      setLocationQuery(areaLabel);
      setCapturePointPreview('');
    },
    [copy.currentLocationHint, copy.nearMe, language, t]
  );

  const handlePickMedia = React.useCallback(() => {
    if (typeof document === 'undefined') {
      return;
    }

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*,video/mp4';
    input.multiple = true;

    input.onchange = () => {
      const files = Array.from(input.files ?? []).slice(0, 4);
      if (files.length === 0) {
        return;
      }

      const nextItems = files.map((file, index) => {
        const uri = URL.createObjectURL(file);
        objectUrlRegistry.current.add(uri);

        return {
          id: `upload-${Date.now()}-${index}`,
          uri,
          kind: file.type.startsWith('video/') ? ('video' as const) : ('image' as const),
          isObjectUrl: true,
        };
      });

      setMediaItems(nextItems);
    };

    input.click();
  }, []);

  const handleRemoveMedia = React.useCallback((mediaId: string) => {
    setMediaItems(current => {
      const target = current.find(item => item.id === mediaId);

      if (target?.isObjectUrl && objectUrlRegistry.current.has(target.uri)) {
        URL.revokeObjectURL(target.uri);
        objectUrlRegistry.current.delete(target.uri);
      }

      return current.filter(item => item.id !== mediaId);
    });
  }, []);

  const handleCreatePost = async () => {
    setPostLoading(true);
    setLastPostSuccess(false);
    try {
      const result = await publishCurrentLocationPost({
        userId: user?.id,
        text: postText,
        category,
      });

      setLocationName(result.locationName);
      setCapturePointPreview(result.locationName);
      if (!locationQuery.trim()) {
        setLocationQuery(result.locationName);
      }
      setPostText('');
      setLastPostSuccess(true);
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

  const handleCreateEvent = async () => {
    setEventLoading(true);
    setLastEventSuccess(false);
    try {
      const result = await createPromotedEvent({
        userId: user?.id,
        userRole,
        subscription,
        title: eventTitle,
        description: eventDescription,
        category: eventCategory,
        startTime: eventStartTime,
        endTime: eventEndTime,
      });

      setEventLocationName(result.locationName);
      setEventTitle('');
      setEventDescription('');
      setEventStartTime('');
      setEventEndTime('');
      setLastEventSuccess(true);
      showAlert(t('post.eventCreatedAlertTitle'), t('post.eventCreatedAlertBody'));
    } catch (error: any) {
      if (error instanceof EventValidationError) {
        showAlert(t('post.eventValidationTitle'), error.message);
      } else if (error instanceof EventPermissionError) {
        showAlert(t('post.locationPermissionTitle'), error.message);
      } else {
        showAlert(t('post.createEventErrorTitle'), error?.message ?? 'Something went wrong');
      }
    } finally {
      setEventLoading(false);
    }
  };

  const handlePromoteButtonPress = React.useCallback(() => {
    if (setupIssue) {
      handleRetrySetup();
      return;
    }

    if (userRole !== 'organization') {
      showAlert(t('post.eventAccessBlockedTitle'), promotedEventAccess.message);
      return;
    }

    setEventStudioExpanded(current => !current);
  }, [
    handleRetrySetup,
    promotedEventAccess.message,
    setupIssue,
    t,
    userRole,
  ]);

  return (
    <ScreenContainer
      scroll
      padded={false}
      contentContainerStyle={styles.page}
    >
      <View style={styles.pageShell}>
        <View style={styles.headingRow}>
          <HeadingSpark />
          <View style={styles.headingCopy}>
            <Text
              style={[
                styles.pageTitle,
                { textAlign: getTextAlign(), writingDirection: isRTL ? 'rtl' : 'ltr' },
              ]}
            >
              {copy.title}
            </Text>
            <Text
              style={[
                styles.pageSubtitle,
                { textAlign: getTextAlign(), writingDirection: isRTL ? 'rtl' : 'ltr' },
              ]}
            >
              {copy.subtitle}
            </Text>
          </View>
        </View>

        <View style={[styles.columns, isTwoColumnLayout && styles.columnsWide]}>
          <View style={styles.primaryColumn}>
            <Card style={styles.composeCard}>
              <View style={styles.sectionBlock}>
                <Text
                  style={[
                    styles.sectionTitle,
                    { textAlign: getTextAlign(), writingDirection: isRTL ? 'rtl' : 'ltr' },
                  ]}
                >
                  {copy.sectionOne}
                </Text>

                <View style={[styles.categoryRow, { flexDirection: getRowDirection() }]}>
                  {copy.categories.map(item => {
                    const isActive =
                      item.id === 'more'
                        ? desktopCategory === 'more'
                        : desktopCategory === item.id;

                    return (
                      <Pressable
                        key={item.id}
                        accessibilityRole="button"
                        onPress={() => handleDesktopCategorySelect(item.id)}
                        style={({ pressed }) => [
                          styles.categoryChip,
                          isActive && styles.categoryChipActive,
                          pressed && styles.categoryChipPressed,
                        ]}
                      >
                        <Text
                          style={[
                            styles.categoryChipText,
                            isActive && styles.categoryChipTextActive,
                            { writingDirection: isRTL ? 'rtl' : 'ltr' },
                          ]}
                        >
                          {item.label}
                        </Text>
                        {item.id === 'more' ? (
                          <Text style={[styles.categoryChipCaret, isActive && styles.categoryChipTextActive]}>
                            v
                          </Text>
                        ) : null}
                      </Pressable>
                    );
                  })}
                </View>

                {showAdvancedCategories ? (
                  <View style={styles.advancedWrap}>
                    <Text
                      style={[
                        styles.advancedLabel,
                        { textAlign: getTextAlign(), writingDirection: isRTL ? 'rtl' : 'ltr' },
                      ]}
                    >
                      {copy.advancedCategories}
                    </Text>
                    <View style={[styles.backendChipRow, { flexDirection: getRowDirection() }]}>
                      {BACKEND_CATEGORY_OPTIONS.map(option => (
                        <Pressable
                          key={option}
                          accessibilityRole="button"
                          onPress={() => handleBackendCategorySelect(option)}
                          style={({ pressed }) => [
                            styles.backendChip,
                            category === option && styles.backendChipActive,
                            pressed && styles.categoryChipPressed,
                          ]}
                        >
                          <Text
                            style={[
                              styles.backendChipText,
                              category === option && styles.backendChipTextActive,
                              { writingDirection: isRTL ? 'rtl' : 'ltr' },
                            ]}
                          >
                            {t(`category.${option}`)}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>
                ) : null}

                <View style={styles.textareaShell}>
                  <TextInput
                    placeholder={copy.textPlaceholder}
                    placeholderTextColor={colors.textSubtle}
                    multiline
                    maxLength={CHARACTER_LIMIT}
                    value={postText}
                    onChangeText={setPostText}
                    style={[
                      styles.composeTextarea,
                      { textAlign: getTextAlign(), writingDirection: isRTL ? 'rtl' : 'ltr' },
                    ]}
                  />
                  <Text style={styles.characterCount}>
                    {`${postText.length} / ${CHARACTER_LIMIT}`}
                  </Text>
                </View>
              </View>

              <View style={styles.sectionBlock}>
                <Text
                  style={[
                    styles.sectionTitle,
                    { textAlign: getTextAlign(), writingDirection: isRTL ? 'rtl' : 'ltr' },
                  ]}
                >
                  {copy.sectionTwo}
                </Text>

                <View style={styles.locationFieldShell}>
                  <View style={styles.locationGlyphWrap}>
                    <View style={styles.locationGlyphRing} />
                    <View style={styles.locationGlyphDot} />
                  </View>
                  <TextInput
                    placeholder={copy.locationPlaceholder}
                    placeholderTextColor={colors.textSubtle}
                    value={locationQuery}
                    onChangeText={value => {
                      setLocationQuery(value);
                      setSelectedArea(null);
                    }}
                    style={[
                      styles.locationFieldInput,
                      { textAlign: getTextAlign(), writingDirection: isRTL ? 'rtl' : 'ltr' },
                    ]}
                  />
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => {
                      void handleQuickAreaSelect(copy.nearMe);
                    }}
                    style={({ pressed }) => [
                      styles.locationTargetButton,
                      pressed && styles.categoryChipPressed,
                    ]}
                  >
                    {locationPreviewLoading ? (
                      <ActivityIndicator color={colors.primaryPressed} size="small" />
                    ) : (
                      <Text style={styles.locationTargetLabel}>+</Text>
                    )}
                  </Pressable>
                </View>

                <View style={[styles.quickAreaRow, { flexDirection: getRowDirection() }]}>
                  {copy.quickAreas.map(areaLabel => {
                    const isActive = selectedArea === areaLabel;

                    return (
                      <Pressable
                        key={areaLabel}
                        accessibilityRole="button"
                        onPress={() => {
                          void handleQuickAreaSelect(areaLabel);
                        }}
                        style={({ pressed }) => [
                          styles.quickAreaChip,
                          isActive && styles.quickAreaChipActive,
                          pressed && styles.categoryChipPressed,
                        ]}
                      >
                        <Text
                          style={[
                            styles.quickAreaChipText,
                            isActive && styles.quickAreaChipTextActive,
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
                    styles.captureHint,
                    { textAlign: getTextAlign(), writingDirection: isRTL ? 'rtl' : 'ltr' },
                  ]}
                >
                  {locationPreviewLoading
                    ? copy.currentLocationLoading
                    : capturePointPreview || locationName || copy.currentLocationHint}
                </Text>
              </View>

              <View style={styles.sectionBlock}>
                <Text
                  style={[
                    styles.sectionTitle,
                    { textAlign: getTextAlign(), writingDirection: isRTL ? 'rtl' : 'ltr' },
                  ]}
                >
                  {copy.sectionThree}
                </Text>

                <View style={styles.uploadCard}>
                  <Pressable
                    accessibilityRole="button"
                    onPress={handlePickMedia}
                    style={({ pressed }) => [
                      styles.uploadDropzone,
                      pressed && styles.categoryChipPressed,
                    ]}
                  >
                    <View style={styles.uploadGlyph}>
                      <View style={styles.uploadGlyphStem} />
                      <View style={styles.uploadGlyphHead} />
                    </View>
                    <Text style={styles.uploadTitle}>{copy.uploadTitle}</Text>
                    <Text style={styles.uploadSubtitle}>{copy.uploadSubtitle}</Text>
                  </Pressable>

                  <View style={styles.mediaRail}>
                    {mediaItems.slice(0, 4).map(item => (
                      <View key={item.id} style={styles.mediaThumbWrap}>
                        {item.kind === 'image' ? (
                          <Image source={{ uri: item.uri }} style={styles.mediaThumbImage} />
                        ) : (
                          <View style={styles.mediaThumbVideo}>
                            <Text style={styles.mediaThumbVideoLabel}>MP4</Text>
                          </View>
                        )}
                        <Pressable
                          accessibilityRole="button"
                          onPress={() => handleRemoveMedia(item.id)}
                          style={({ pressed }) => [
                            styles.mediaRemoveButton,
                            pressed && styles.categoryChipPressed,
                          ]}
                        >
                          <Text style={styles.mediaRemoveButtonLabel}>x</Text>
                        </Pressable>
                      </View>
                    ))}
                    {mediaItems.length === 0 ? (
                      <Text
                        style={[
                          styles.uploadEmptyState,
                          { textAlign: getTextAlign(), writingDirection: isRTL ? 'rtl' : 'ltr' },
                        ]}
                      >
                        {copy.uploadEmptyState}
                      </Text>
                    ) : null}
                  </View>
                </View>

                <View style={[styles.tipRow, { flexDirection: getRowDirection() }]}>
                  <View style={styles.tipIconWrap}>
                    <Text style={styles.tipIconLabel}>i</Text>
                  </View>
                  <Text
                    style={[
                      styles.tipRowText,
                      { writingDirection: isRTL ? 'rtl' : 'ltr' },
                    ]}
                  >
                    {copy.tip}
                  </Text>
                </View>
              </View>

              {lastPostSuccess ? (
                <StatusBanner
                  compact
                  tone="success"
                  title={t('post.successTitle')}
                  body={t('post.successBody')}
                />
              ) : null}

              {!user ? (
                <StatusBanner
                  compact
                  tone="warning"
                  title={t('post.signInRequiredTitle')}
                  body={copy.signInNote}
                />
              ) : null}

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
                  <>
                    <Text
                      style={[
                        styles.publishButtonLabel,
                        { writingDirection: isRTL ? 'rtl' : 'ltr' },
                      ]}
                    >
                      {copy.publish}
                    </Text>
                    <View style={styles.publishButtonIconWrap}>
                      <Text style={styles.publishButtonIconLabel}>&gt;</Text>
                    </View>
                  </>
                )}
              </Pressable>

              <View style={[styles.moderationRow, { flexDirection: getRowDirection() }]}>
                <View style={styles.moderationLock} />
                <Text
                  style={[
                    styles.moderationText,
                    { writingDirection: isRTL ? 'rtl' : 'ltr' },
                  ]}
                >
                  {copy.moderationNote}
                </Text>
              </View>
            </Card>
          </View>

          <View
            style={[
              styles.sidebarColumn,
              isTwoColumnLayout && styles.sidebarColumnWide,
              isTwoColumnLayout && isStickySidebar
                ? ({ position: 'sticky', top: 96, alignSelf: 'flex-start' } as unknown as object)
                : null,
            ]}
          >
            <Card style={styles.sidebarCard}>
              <Text
                style={[
                  styles.sidebarCardTitle,
                  { textAlign: getTextAlign(), writingDirection: isRTL ? 'rtl' : 'ltr' },
                ]}
              >
                {copy.postingAccess}
              </Text>
              <Text
                style={[
                  styles.sidebarCardSubtitle,
                  { textAlign: getTextAlign(), writingDirection: isRTL ? 'rtl' : 'ltr' },
                ]}
              >
                {copy.accessSubtitle}
              </Text>

              <View style={[styles.statsRow, { flexDirection: getRowDirection() }]}>
                <StatBox label={t('post.roleMetric')} value={accessRoleValue} />
                <StatBox label={t('post.planMetric')} value={accessPlanValue} />
                <StatBox label={t('post.eventQuotaMetric')} value={quotaValue} />
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
                <Text
                  style={[
                    styles.accessNoticeBody,
                    { textAlign: getTextAlign(), writingDirection: isRTL ? 'rtl' : 'ltr' },
                  ]}
                >
                  {promotedEventAccess.message}
                </Text>
              </View>

              {setupIssue ? (
                <View style={styles.issueRow}>
                  <Text
                    style={[
                      styles.issueText,
                      { textAlign: getTextAlign(), writingDirection: isRTL ? 'rtl' : 'ltr' },
                    ]}
                  >
                    {setupIssue}
                  </Text>
                  <Pressable
                    accessibilityRole="button"
                    onPress={handleRetrySetup}
                    style={({ pressed }) => [
                      styles.retryLink,
                      pressed && styles.categoryChipPressed,
                    ]}
                  >
                    <Text style={styles.retryLinkLabel}>{copy.setupRetry}</Text>
                  </Pressable>
                </View>
              ) : null}
            </Card>

            <Card style={styles.sidebarCard}>
              <Text
                style={[
                  styles.sidebarCardTitle,
                  { textAlign: getTextAlign(), writingDirection: isRTL ? 'rtl' : 'ltr' },
                ]}
              >
                {copy.promoteEvents}
              </Text>
              <Text
                style={[
                  styles.sidebarCardSubtitle,
                  { textAlign: getTextAlign(), writingDirection: isRTL ? 'rtl' : 'ltr' },
                ]}
              >
                {copy.promoteSubtitle}
              </Text>

              <View style={styles.featureStack}>
                {copy.featureRows.map(feature => (
                  <FeatureRow
                    key={feature.title}
                    title={feature.title}
                    body={feature.body}
                  />
                ))}
              </View>

              <SecondaryButton
                label={copy.promoteButton}
                onPress={handlePromoteButtonPress}
                style={styles.learnMoreButton}
              />

              {eventStudioExpanded ? (
                <View style={styles.eventStudioReveal}>
                  <Text
                    style={[
                      styles.eventStudioTitle,
                      { textAlign: getTextAlign(), writingDirection: isRTL ? 'rtl' : 'ltr' },
                    ]}
                  >
                    {copy.eventStudioTitle}
                  </Text>
                  <Text
                    style={[
                      styles.eventStudioSubtitle,
                      { textAlign: getTextAlign(), writingDirection: isRTL ? 'rtl' : 'ltr' },
                    ]}
                  >
                    {copy.eventStudioSubtitle}
                  </Text>

                  {!promotedEventAccess.allowed ? (
                    <StatusBanner
                      compact
                      tone="warning"
                      title={t('post.eventAccessBlockedTitle')}
                      body={promotedEventAccess.message}
                    />
                  ) : null}

                  {lastEventSuccess ? (
                    <StatusBanner
                      compact
                      tone="success"
                      title={t('post.eventSuccessTitle')}
                      body={t('post.eventSuccessBody')}
                    />
                  ) : null}

                  <TextField
                    label={t('post.eventTitleLabel')}
                    placeholder={t('post.eventTitlePlaceholder')}
                    value={eventTitle}
                    onChangeText={setEventTitle}
                  />

                  <TextField
                    label={t('post.eventDescriptionLabel')}
                    placeholder={t('post.eventDescriptionPlaceholder')}
                    value={eventDescription}
                    onChangeText={setEventDescription}
                    multiline
                    style={styles.eventDescriptionInput}
                  />

                  <View style={styles.eventCategoryWrap}>
                    <Text
                      style={[
                        styles.eventInlineLabel,
                        { textAlign: getTextAlign(), writingDirection: isRTL ? 'rtl' : 'ltr' },
                      ]}
                    >
                      {t('post.eventCategoryLabel')}
                    </Text>
                    <View style={[styles.eventCategoryRow, { flexDirection: getRowDirection() }]}>
                      {BACKEND_CATEGORY_OPTIONS.map(option => (
                        <Pressable
                          key={`event-${option}`}
                          accessibilityRole="button"
                          onPress={() => setEventCategory(option)}
                          style={({ pressed }) => [
                            styles.backendChip,
                            eventCategory === option && styles.backendChipActive,
                            pressed && styles.categoryChipPressed,
                          ]}
                        >
                          <Text
                            style={[
                              styles.backendChipText,
                              eventCategory === option && styles.backendChipTextActive,
                              { writingDirection: isRTL ? 'rtl' : 'ltr' },
                            ]}
                          >
                            {t(`category.${option}`)}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>

                  <View style={styles.eventTimeGrid}>
                    <View style={styles.eventTimeField}>
                      <TextField
                        label={t('post.startTimeLabel')}
                        placeholder={t('post.startTimePlaceholderWeb')}
                        value={eventStartTime}
                        onChangeText={setEventStartTime}
                        helperText={t('post.timeHelperStart')}
                        webType="datetime-local"
                      />
                    </View>
                    <View style={styles.eventTimeField}>
                      <TextField
                        label={t('post.endTimeLabel')}
                        placeholder={t('post.endTimePlaceholderWeb')}
                        value={eventEndTime}
                        onChangeText={setEventEndTime}
                        helperText={t('post.timeHelperEnd')}
                        webType="datetime-local"
                      />
                    </View>
                  </View>

                  <View style={styles.eventLocationPreview}>
                    <Text style={styles.eventLocationPreviewLabel}>
                      {t('post.eventLocationLabel')}
                    </Text>
                    <Text style={styles.eventLocationPreviewValue}>
                      {eventLocationName || t('post.eventLocationPendingWeb')}
                    </Text>
                  </View>

                  <PrimaryButton
                    label={t('post.publishEventButton')}
                    loading={eventLoading}
                    disabled={!promotedEventAccess.allowed}
                    onPress={handleCreateEvent}
                    style={styles.eventPublishButton}
                  />
                </View>
              ) : null}
            </Card>

            <Card style={styles.sidebarCard}>
              <Text
                style={[
                  styles.sidebarCardTitle,
                  { textAlign: getTextAlign(), writingDirection: isRTL ? 'rtl' : 'ltr' },
                ]}
              >
                {copy.livePreview}
              </Text>
              <Text
                style={[
                  styles.sidebarCardSubtitle,
                  { textAlign: getTextAlign(), writingDirection: isRTL ? 'rtl' : 'ltr' },
                ]}
              >
                {copy.livePreviewSubtitle}
              </Text>

              <View style={styles.previewShell}>
                <Image source={{ uri: previewImageUri }} style={styles.previewImage} />
                <View style={styles.previewCopy}>
                  <Text
                    style={[
                      styles.previewTitle,
                      { textAlign: getTextAlign(), writingDirection: isRTL ? 'rtl' : 'ltr' },
                    ]}
                    numberOfLines={1}
                  >
                    {previewTitle}
                  </Text>
                  <Text
                    style={[
                      styles.previewDescription,
                      { textAlign: getTextAlign(), writingDirection: isRTL ? 'rtl' : 'ltr' },
                    ]}
                    numberOfLines={2}
                  >
                    {previewDescription}
                  </Text>
                  <View style={[styles.previewMetaRow, { flexDirection: getRowDirection() }]}>
                    <Text style={styles.previewMetaText}>{resolvedPreviewArea}</Text>
                    <Text style={styles.previewMetaText}>{copy.previewTime}</Text>
                    <Text style={styles.previewMetaText}>{previewMood}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.previewTipsBlock}>
                <Text
                  style={[
                    styles.previewTipsTitle,
                    { textAlign: getTextAlign(), writingDirection: isRTL ? 'rtl' : 'ltr' },
                  ]}
                >
                  {copy.previewTipsTitle}
                </Text>
                <View style={styles.previewTipsStack}>
                  {copy.previewTips.map(item => (
                    <TipCheckRow key={item} label={item} />
                  ))}
                </View>
              </View>
            </Card>
          </View>
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  page: {
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: webDesktopLayout.horizontalPadding,
    paddingTop: webDesktopLayout.topPadding,
    paddingBottom: webDesktopLayout.bottomPadding,
  },
  pageShell: {
    width: '100%',
    maxWidth: webDesktopLayout.maxWidth,
    alignSelf: 'center',
    gap: webDesktopLayout.sectionGap,
  },
  headingRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  headingSpark: {
    width: 28,
    height: 28,
    marginTop: 4,
    position: 'relative',
  },
  headingSparkDiamond: {
    position: 'absolute',
    top: 7,
    left: 2,
    width: 14,
    height: 14,
    borderRadius: 4,
    backgroundColor: colors.primary,
    transform: [{ rotate: '45deg' }],
  },
  headingSparkDotLarge: {
    position: 'absolute',
    top: 5,
    right: 1,
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: '#FF8A78',
  },
  headingSparkDotSmall: {
    position: 'absolute',
    bottom: 2,
    right: 5,
    width: 5,
    height: 5,
    borderRadius: 999,
    backgroundColor: '#F7B7AD',
  },
  headingCopy: {
    flex: 1,
    gap: 6,
  },
  pageTitle: {
    ...typography.hero,
    color: colors.text,
    fontSize: 30,
    lineHeight: 36,
    letterSpacing: -1,
  },
  pageSubtitle: {
    ...typography.bodyMuted,
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 21,
  },
  columns: {
    gap: spacing.lg,
  },
  columnsWide: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  primaryColumn: {
    flex: 1.15,
    minWidth: 0,
  },
  sidebarColumn: {
    minWidth: 0,
    gap: spacing.md,
  },
  sidebarColumnWide: {
    flex: 0.62,
  },
  composeCard: {
    ...webDesktopSurface,
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.xxl,
    gap: spacing.xl,
  },
  sectionBlock: {
    gap: spacing.md,
  },
  sectionTitle: {
    ...typography.sectionTitle,
    ...webDesktopSectionTitle,
    color: colors.text,
  },
  categoryRow: {
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  categoryChip: {
    ...webDesktopChip,
    minHeight: 36,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: spacing.md + 4,
    paddingVertical: spacing.sm,
  },
  categoryChipActive: {
    borderColor: colors.primary,
    backgroundColor: '#FFF4F0',
  },
  categoryChipPressed: {
    opacity: 0.88,
  },
  categoryChipText: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: '600',
  },
  categoryChipTextActive: {
    color: colors.primaryPressed,
  },
  categoryChipCaret: {
    ...typography.caption,
    color: colors.textSubtle,
    fontWeight: '700',
    fontSize: 11,
    lineHeight: 12,
  },
  advancedWrap: {
    gap: spacing.sm,
  },
  advancedLabel: {
    ...typography.caption,
    color: colors.textSubtle,
    fontWeight: '600',
    fontSize: 12,
    lineHeight: 16,
  },
  backendChipRow: {
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  backendChip: {
    minHeight: 30,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceRaised,
  },
  backendChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  backendChipText: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: '600',
    fontSize: 12,
    lineHeight: 16,
  },
  backendChipTextActive: {
    color: colors.primaryPressed,
  },
  textareaShell: {
    minHeight: 150,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: webDesktopControl.borderColor,
    backgroundColor: webDesktopControl.backgroundColor,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md + 2,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },
  composeTextarea: {
    flex: 1,
    minHeight: 96,
    color: colors.text,
    fontSize: 15,
    lineHeight: 22,
    paddingHorizontal: 0,
    paddingVertical: 0,
    textAlignVertical: 'top',
    backgroundColor: 'transparent',
  },
  characterCount: {
    ...typography.caption,
    color: colors.textSubtle,
    alignSelf: 'flex-end',
    fontWeight: '600',
    fontSize: 12,
    lineHeight: 16,
  },
  locationFieldShell: {
    ...webDesktopControl,
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  locationGlyphWrap: {
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  locationGlyphRing: {
    width: 12,
    height: 12,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: colors.textSubtle,
  },
  locationGlyphDot: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 999,
    backgroundColor: colors.textSubtle,
  },
  locationFieldInput: {
    flex: 1,
    color: colors.text,
    fontSize: 15,
    lineHeight: 20,
    paddingHorizontal: 0,
    paddingVertical: 0,
    backgroundColor: 'transparent',
  },
  locationTargetButton: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceRaised,
  },
  locationTargetLabel: {
    color: colors.primaryPressed,
    fontSize: 16,
    lineHeight: 16,
    fontWeight: '700',
  },
  quickAreaRow: {
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  quickAreaChip: {
    ...webDesktopChip,
    minHeight: 30,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  quickAreaChipActive: {
    borderColor: colors.primary,
    backgroundColor: '#FFF4F0',
  },
  quickAreaChipText: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: '600',
    fontSize: 12,
    lineHeight: 16,
  },
  quickAreaChipTextActive: {
    color: colors.primaryPressed,
  },
  captureHint: {
    ...typography.caption,
    color: colors.textSubtle,
    fontSize: 12,
    lineHeight: 16,
  },
  uploadCard: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: spacing.sm,
    minHeight: 122,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: webDesktopControl.borderColor,
    backgroundColor: '#FFFCF9',
    padding: spacing.md,
  },
  uploadDropzone: {
    width: 220,
    borderRadius: radius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: webDesktopControl.borderColor,
    backgroundColor: webDesktopControl.backgroundColor,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: 8,
  },
  uploadGlyph: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: colors.textSubtle,
  },
  uploadGlyphStem: {
    width: 2,
    height: 10,
    backgroundColor: colors.textSubtle,
    borderRadius: 999,
  },
  uploadGlyphHead: {
    position: 'absolute',
    top: 6,
    width: 8,
    height: 8,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderColor: colors.textSubtle,
    transform: [{ rotate: '45deg' }],
  },
  uploadTitle: {
    ...typography.body,
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 18,
    textAlign: 'center',
  },
  uploadSubtitle: {
    ...typography.caption,
    color: colors.textSubtle,
    fontSize: 12,
    lineHeight: 16,
    textAlign: 'center',
  },
  mediaRail: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
    minWidth: 0,
  },
  mediaThumbWrap: {
    width: 108,
    height: 82,
    borderRadius: radius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E6DCD1',
    position: 'relative',
    backgroundColor: colors.surfaceMuted,
  },
  mediaThumbImage: {
    width: '100%',
    height: '100%',
  },
  mediaThumbVideo: {
    flex: 1,
    backgroundColor: '#2A2119',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mediaThumbVideoLabel: {
    color: colors.surface,
    fontWeight: '700',
    fontSize: 13,
    lineHeight: 16,
  },
  mediaRemoveButton: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 18,
    height: 18,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 252, 248, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mediaRemoveButtonLabel: {
    color: colors.text,
    fontSize: 11,
    lineHeight: 11,
    fontWeight: '700',
  },
  uploadEmptyState: {
    ...typography.caption,
    flex: 1,
    color: colors.textSubtle,
    fontSize: 12,
    lineHeight: 17,
  },
  tipRow: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  tipIconWrap: {
    width: 18,
    height: 18,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceRaised,
  },
  tipIconLabel: {
    color: colors.textSubtle,
    fontSize: 10,
    lineHeight: 10,
    fontWeight: '700',
  },
  tipRowText: {
    ...typography.caption,
    color: colors.textSubtle,
    fontSize: 13,
    lineHeight: 18,
  },
  publishButton: {
    minHeight: 46,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    shadowColor: colors.primaryPressed,
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
  },
  publishButtonPressed: {
    backgroundColor: colors.primaryPressed,
  },
  publishButtonDisabled: {
    opacity: 0.65,
  },
  publishButtonLabel: {
    ...typography.button,
    color: colors.surface,
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '700',
  },
  publishButtonIconWrap: {
    width: 24,
    height: 24,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  publishButtonIconLabel: {
    color: colors.surface,
    fontSize: 13,
    lineHeight: 13,
    fontWeight: '700',
  },
  moderationRow: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  moderationLock: {
    width: 10,
    height: 10,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: colors.textSubtle,
  },
  moderationText: {
    ...typography.caption,
    color: colors.textSubtle,
    fontSize: 13,
    lineHeight: 18,
  },
  sidebarCard: {
    ...webDesktopSupportSurface,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
    gap: spacing.md,
  },
  sidebarCardTitle: {
    ...typography.sectionTitle,
    ...webDesktopSectionTitle,
    color: colors.text,
  },
  sidebarCardSubtitle: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  statsRow: {
    gap: spacing.sm,
  },
  statBox: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#ECE3D9',
    backgroundColor: colors.surface,
  },
  statIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 999,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statIconDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    backgroundColor: colors.primary,
  },
  statCopy: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  statValue: {
    ...typography.button,
    color: colors.text,
    fontSize: 18,
    lineHeight: 20,
    fontWeight: '700',
  },
  statLabel: {
    ...typography.caption,
    color: colors.textSubtle,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
  },
  accessNotice: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#EBCF9D',
    backgroundColor: '#FFF6E9',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: 4,
  },
  accessNoticePositive: {
    borderColor: '#BFE0CD',
    backgroundColor: '#EEF8F2',
  },
  accessNoticeTitle: {
    ...typography.button,
    color: '#7C5922',
    fontSize: 14,
    lineHeight: 18,
  },
  accessNoticeTitlePositive: {
    color: colors.success,
  },
  accessNoticeBody: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 17,
  },
  issueRow: {
    gap: spacing.sm,
  },
  issueText: {
    ...typography.caption,
    color: colors.warning,
    fontSize: 12,
    lineHeight: 17,
  },
  retryLink: {
    alignSelf: 'flex-start',
  },
  retryLinkLabel: {
    ...typography.caption,
    color: colors.primaryPressed,
    fontWeight: '700',
  },
  featureStack: {
    gap: spacing.md,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  featureOrb: {
    width: 38,
    height: 38,
    borderRadius: 999,
    backgroundColor: '#FFF4F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureOrbInner: {
    width: 12,
    height: 12,
    borderRadius: 999,
    backgroundColor: colors.primary,
  },
  featureCopy: {
    flex: 1,
    gap: 3,
  },
  featureTitle: {
    ...typography.button,
    color: colors.text,
    fontSize: 15,
    lineHeight: 19,
  },
  featureBody: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 17,
  },
  learnMoreButton: {
    minHeight: 38,
    borderRadius: radius.pill,
  },
  eventStudioReveal: {
    marginTop: spacing.xs,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#EEE3D7',
    gap: spacing.md,
  },
  eventStudioTitle: {
    ...typography.sectionTitle,
    color: colors.text,
    fontSize: 16,
    lineHeight: 20,
  },
  eventStudioSubtitle: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 17,
  },
  eventDescriptionInput: {
    minHeight: 90,
    textAlignVertical: 'top',
  },
  eventCategoryWrap: {
    gap: spacing.sm,
  },
  eventInlineLabel: {
    ...typography.label,
    color: colors.textSubtle,
  },
  eventCategoryRow: {
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  eventTimeGrid: {
    gap: spacing.sm,
  },
  eventTimeField: {
    flex: 1,
  },
  eventLocationPreview: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#ECE3D9',
    backgroundColor: colors.surfaceRaised,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    gap: 2,
  },
  eventLocationPreviewLabel: {
    ...typography.label,
    color: colors.textSubtle,
    fontSize: 11,
    lineHeight: 14,
  },
  eventLocationPreviewValue: {
    ...typography.caption,
    color: colors.text,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '600',
  },
  eventPublishButton: {
    minHeight: 40,
  },
  previewShell: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#ECE3D9',
    backgroundColor: colors.surface,
  },
  previewImage: {
    width: 108,
    height: 78,
    borderRadius: radius.md,
  },
  previewCopy: {
    flex: 1,
    minWidth: 0,
    gap: 6,
  },
  previewTitle: {
    ...typography.button,
    color: colors.text,
    fontSize: 17,
    lineHeight: 21,
  },
  previewDescription: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  previewMetaRow: {
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  previewMetaText: {
    ...typography.caption,
    color: colors.textSubtle,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
  },
  previewTipsBlock: {
    gap: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#EEE3D7',
  },
  previewTipsTitle: {
    ...typography.button,
    color: colors.text,
    fontSize: 14,
    lineHeight: 18,
  },
  previewTipsStack: {
    gap: spacing.sm,
  },
  tipCheckRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  tipCheckWrap: {
    width: 18,
    height: 18,
    borderRadius: 999,
    backgroundColor: '#EEF8F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipCheckDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: colors.success,
  },
  tipCheckLabel: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
});
