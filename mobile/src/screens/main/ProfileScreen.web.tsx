import React from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';

import { FilterChip } from '../../components/ui/Chip';
import { PrimaryButton, SecondaryButton } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { LoadingState } from '../../components/ui/LoadingState';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { StatusBanner } from '../../components/ui/StatusBanner';
import { TextField } from '../../components/ui/TextField';
import { useAuth } from '../../context/AuthContext';
import { useLocalization } from '../../context/LocalizationContext';
import { subscribeToPosts } from '../../repositories/postsRepository';
import {
  AnalyticsValidationError,
  getAdminAnalytics,
} from '../../services/analyticsService';
import { logoutUser } from '../../services/authService';
import { observeCommentCountsByPost } from '../../services/commentService';
import {
  buildDiscoverySpotItems,
  formatRelativeTime,
  getTimestampMs,
} from '../../services/discoveryService';
import { observeFavoritePostIds } from '../../services/favoriteService';
import {
  hideReportedTarget,
  ModerationValidationError,
  observeReports,
  reviewReportStatus,
} from '../../services/moderationService';
import {
  markUserNotificationRead,
  NotificationValidationError,
  observeNotifications,
} from '../../services/notificationService';
import {
  markUserAsOrganization,
  OrganizationValidationError,
} from '../../services/organizationService';
import {
  observeCurrentUserProfile,
  ProfileValidationError,
  saveCurrentUserProfile,
} from '../../services/profileService';
import { observeLikeCountsByPost } from '../../services/reactionService';
import {
  SubscriptionValidationError,
  observeUserSubscription,
  updateUserPlan,
} from '../../services/subscriptionService';
import { colors, radius, spacing, typography } from '../../theme/designSystem';
import {
  webDesktopControl,
  webDesktopLayout,
  webDesktopSectionTitle,
  webDesktopSupportSurface,
  webDesktopSurface,
} from '../../theme/webDesktopSystem';
import { getReportReasonLabel, getReportStatusLabel } from '../../i18n';
import {
  getBlockedDataMessage,
  getErrorMessage,
  isDataAccessBlockedError,
} from '../../utils/dataAccessError';
import { showAlert } from '../../utils/showAlert';
import type { AdminAnalyticsSnapshot } from '../../types/analytics';
import type { DiscoverySpot } from '../../types/discovery';
import type { MainTabParamList } from '../../navigation/types';
import type { AppNotification } from '../../types/notification';
import type { AppLanguage } from '../../types/profile';
import type { SpotPost } from '../../types/post';
import type { ModerationReport, ReportStatus } from '../../types/report';
import type {
  PlanLevel,
  PlanStatus,
  UserSubscription,
} from '../../types/subscription';

type ActivityEntry = {
  id: string;
  kind: 'like' | 'comment' | 'save';
  title: string;
  subtitle: string;
  timestampLabel: string;
  unread?: boolean;
  onPress?: () => void;
};

const WIDE_LAYOUT_BREAKPOINT = 1120;
const STICKY_RAIL_BREAKPOINT = 1280;
const FALLBACK_AVATAR_URI =
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=240&q=80';
const FALLBACK_SPOT_IMAGE =
  'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1200&q=80';

function getDesktopCopy(language: AppLanguage) {
  if (language === 'ar') {
    return {
      toolbarAreaSummary: 'ملخص المنطقة',
      toolbarNearMe: 'بالقرب مني',
      fallbackName: 'مستخدم Spots',
      fallbackEmail: 'qa.user@spots.demo',
      roleBadge: 'الدور',
      planBadge: 'الخطة',
      xpLabel: 'XP',
      xpHint: 'واصل الاستكشاف',
      savesLabel: 'المحفوظات',
      savesHint: 'أماكن محفوظة',
      unreadLabel: 'غير المقروء',
      unreadHint: 'إشعارات جديدة',
      savedSpotsTitle: 'الأماكن المحفوظة',
      savedSpotsAction: 'عرض الكل',
      savedEmptyTitle: 'لا توجد أماكن محفوظة بعد.',
      savedEmptySubtitle: 'احفظ مكانا من Explore ليظهر هنا بشكل سريع.',
      recentActivityTitle: 'النشاط الأخير',
      recentActivityAction: 'عرض النشاط',
      activityEmptyTitle: 'لا يوجد نشاط جديد.',
      activityEmptySubtitle: 'سيظهر الإعجاب والتعليقات والحفظ هنا.',
      settingsTitle: 'إعدادات الحساب',
      settingsSubtitle: 'حدّث تفاصيل الحساب وتفضيلاتك الأساسية.',
      usernameLabel: 'اسم المستخدم',
      emailLabel: 'البريد الإلكتروني',
      planLabel: 'الخطة',
      languageLabel: 'اللغة',
      privacyLabel: 'وضع الخصوصية',
      privacyHint: 'قلّل ظهور الملف الشخصي في الميزات الاجتماعية القادمة.',
      bioLabel: 'النبذة',
      preferencesTitle: 'التفضيلات',
      emailNotifications: 'إشعارات البريد',
      emailNotificationsHint: 'تحديثات عن النشاط والحفظ وغير ذلك.',
      marketingEmails: 'رسائل تسويقية',
      marketingEmailsHint: 'نصائح وعروض وتحديثات ميزات.',
      unreadNotifications: 'الإشعارات غير المقروءة',
      unreadNotificationsHint: 'افتح نشاطك أو علّم الكل كمقروء.',
      markAllRead: 'تعليم الكل كمقروء',
      signInRequiredTitle: 'مطلوب تسجيل الدخول',
      signInRequiredBody: 'سجّل الدخول لإدارة إعدادات الحساب والنشاط المحفوظ.',
      saveSettings: 'حفظ الإعدادات',
      signOut: 'تسجيل الخروج',
      signingOut: 'جارٍ تسجيل الخروج...',
      readAllDone: 'تم تحديث الإشعارات غير المقروءة.',
      savedBadge: 'محفوظ',
      savedActivityPrefix: 'حفظت',
      likeSubtitle: 'إعجاب',
      commentSubtitle: 'تعليق',
      saveSubtitle: 'تم الحفظ',
      adminTitle: 'أدوات المشرف',
      adminSubtitle: 'أبقيناها متاحة هنا بدون أن تطغى على صفحة الحساب الرئيسية.',
      adminAccountsTitle: 'صلاحيات الحسابات',
      adminAccountsSubtitle: 'حوّل مستخدما إلى جهة تنظيمية.',
      adminPlansTitle: 'الخطط',
      adminPlansSubtitle: 'حدّث خطة أي مستخدم وحالتها.',
      adminAnalyticsTitle: 'التحليلات',
      adminAnalyticsSubtitle: 'نظرة سريعة على حالة النظام.',
      adminModerationTitle: 'الإشراف',
      adminModerationSubtitle: 'راجع البلاغات واتخذ الإجراء المناسب.',
      adminReportsEmpty: 'لا توجد بلاغات مفتوحة حاليا.',
      targetUserId: 'معرف المستخدم المستهدف',
      roleUpdateAction: 'تحديث الدور',
      planUpdateAction: 'تحديث الخطة',
      refreshAnalytics: 'تحديث التحليلات',
      hideReportedContent: 'إخفاء المحتوى المبلغ عنه',
      analyticsUsers: 'مستخدمون',
      analyticsPosts: 'منشورات',
      analyticsEvents: 'فعاليات',
      analyticsReports: 'بلاغات',
    };
  }

  return {
    toolbarAreaSummary: 'Area Summary',
    toolbarNearMe: 'Near Me',
    fallbackName: 'Spots QA User',
    fallbackEmail: 'qa.user@spots.demo',
    roleBadge: 'Role',
    planBadge: 'Plan',
    xpLabel: 'XP',
    xpHint: 'Keep exploring!',
    savesLabel: 'Saves',
    savesHint: 'Saved places',
    unreadLabel: 'Unread',
    unreadHint: 'New notifications',
    savedSpotsTitle: 'Saved Spots',
    savedSpotsAction: 'View all saves',
    savedEmptyTitle: 'No saved spots yet.',
    savedEmptySubtitle: 'Save a place from Explore and it will stay handy here.',
    recentActivityTitle: 'Recent Activity',
    recentActivityAction: 'View all activity',
    activityEmptyTitle: 'No recent activity yet.',
    activityEmptySubtitle: 'Likes, comments, and saves will appear here.',
    settingsTitle: 'Account Settings',
    settingsSubtitle: 'Update the account details and preferences you use most.',
    usernameLabel: 'Username',
    emailLabel: 'Email',
    planLabel: 'Plan',
    languageLabel: 'Language',
    privacyLabel: 'Privacy mode',
    privacyHint: 'Reduce profile visibility for future social features.',
    bioLabel: 'Bio',
    preferencesTitle: 'Preferences',
    emailNotifications: 'Email notifications',
    emailNotificationsHint: 'Get updates about activity, saves and more.',
    marketingEmails: 'Marketing emails',
    marketingEmailsHint: 'Receive tips, new features and offers.',
    unreadNotifications: 'Unread notifications',
    unreadNotificationsHint: 'Open your activity or mark everything as read.',
    markAllRead: 'Mark all read',
    signInRequiredTitle: 'Sign-in required',
    signInRequiredBody: 'Sign in to manage account settings and saved activity.',
    saveSettings: 'Save Settings',
    signOut: 'Sign Out',
    signingOut: 'Signing Out...',
    readAllDone: 'Unread notifications were updated.',
    savedBadge: 'Saved',
    savedActivityPrefix: 'You saved',
    likeSubtitle: 'Liked update',
    commentSubtitle: 'Commented',
    saveSubtitle: 'Saved spot',
    adminTitle: 'Admin Tools',
    adminSubtitle: 'Kept available below the main account center so desktop stays presentation-ready.',
    adminAccountsTitle: 'Account role access',
    adminAccountsSubtitle: 'Convert a user into an organization account.',
    adminPlansTitle: 'Plan controls',
    adminPlansSubtitle: 'Adjust any user plan and status.',
    adminAnalyticsTitle: 'Analytics',
    adminAnalyticsSubtitle: 'Quick read on product activity.',
    adminModerationTitle: 'Moderation',
    adminModerationSubtitle: 'Review reports and take follow-up action.',
    adminReportsEmpty: 'No reports are waiting right now.',
    targetUserId: 'Target user id',
    roleUpdateAction: 'Update role',
    planUpdateAction: 'Update plan',
    refreshAnalytics: 'Refresh analytics',
    hideReportedContent: 'Hide reported content',
    analyticsUsers: 'Users',
    analyticsPosts: 'Posts',
    analyticsEvents: 'Events',
    analyticsReports: 'Reports',
  };
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

function SectionIcon({ tone }: { tone: 'saved' | 'activity' | 'settings' }) {
  return (
    <View
      style={[
        styles.sectionIcon,
        tone === 'saved' && styles.sectionIconSaved,
        tone === 'activity' && styles.sectionIconActivity,
        tone === 'settings' && styles.sectionIconSettings,
      ]}
    >
      <View style={styles.sectionIconInner} />
    </View>
  );
}

function HeroStat({
  accent,
  label,
  value,
  subtitle,
}: {
  accent: 'xp' | 'saves' | 'unread';
  label: string;
  value: string;
  subtitle: string;
}) {
  return (
    <View style={styles.heroStat}>
      <View
        style={[
          styles.heroStatIcon,
          accent === 'xp' && styles.heroStatIconXp,
          accent === 'saves' && styles.heroStatIconSaves,
          accent === 'unread' && styles.heroStatIconUnread,
        ]}
      >
        <View style={styles.heroStatGlyph} />
      </View>
      <View style={styles.heroStatCopy}>
        <Text style={styles.heroStatValue}>{value}</Text>
        <Text style={styles.heroStatLabel}>{label}</Text>
        <Text style={styles.heroStatSubtitle}>{subtitle}</Text>
      </View>
    </View>
  );
}

function SectionHeader({
  title,
  actionLabel,
  iconTone,
  onActionPress,
}: {
  title: string;
  actionLabel?: string;
  iconTone: 'saved' | 'activity' | 'settings';
  onActionPress?: () => void;
}) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionHeading}>
        <SectionIcon tone={iconTone} />
        <Text style={styles.sectionHeadingTitle}>{title}</Text>
      </View>
      {actionLabel && onActionPress ? (
        <Pressable
          accessibilityRole="button"
          onPress={onActionPress}
          style={({ pressed }) => [styles.sectionAction, pressed && styles.pressedState]}
        >
          <Text style={styles.sectionActionLabel}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function SavedSpotRow({
  copy,
  spot,
  onPress,
}: {
  copy: ReturnType<typeof getDesktopCopy>;
  spot: DiscoverySpot;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.savedRow, pressed && styles.pressedState]}
    >
      <Image
        source={{ uri: spot.hero.imageUrl || FALLBACK_SPOT_IMAGE }}
        style={styles.savedRowImage}
      />
      <View style={styles.savedRowBody}>
        <View style={styles.savedRowCopy}>
          <Text style={styles.savedRowTitle} numberOfLines={1}>
            {spot.title}
          </Text>
          <Text style={styles.savedRowMeta} numberOfLines={1}>
            {`${spot.categoryLabel}  •  ${spot.areaLabel}`}
          </Text>
          <Text style={styles.savedRowDescription} numberOfLines={2}>
            {spot.description}
          </Text>
        </View>
        <View style={styles.savedRowAside}>
          <Text style={styles.savedRowAsideLabel}>{copy.savedBadge}</Text>
          <Text style={styles.savedRowAsideValue}>{spot.updatedLabel}</Text>
          <View style={styles.savedRowBookmark}>
            <View style={styles.savedRowBookmarkInner} />
          </View>
        </View>
      </View>
    </Pressable>
  );
}

function ActivityRow({ entry }: { entry: ActivityEntry }) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={!entry.onPress}
      onPress={entry.onPress}
      style={({ pressed }) => [
        styles.activityRow,
        entry.unread && styles.activityRowUnread,
        pressed && entry.onPress ? styles.pressedState : null,
      ]}
    >
      <View
        style={[
          styles.activityIcon,
          entry.kind === 'like' && styles.activityIconLike,
          entry.kind === 'comment' && styles.activityIconComment,
          entry.kind === 'save' && styles.activityIconSave,
        ]}
      >
        <View style={styles.activityIconGlyph} />
      </View>
      <View style={styles.activityCopy}>
        <Text style={styles.activityTitle} numberOfLines={1}>
          {entry.title}
        </Text>
        <Text style={styles.activitySubtitle} numberOfLines={1}>
          {entry.subtitle}
        </Text>
      </View>
      <View style={styles.activityAside}>
        <Text style={styles.activityTimestamp}>{entry.timestampLabel}</Text>
        {entry.unread ? <View style={styles.activityUnreadDot} /> : null}
      </View>
    </Pressable>
  );
}

function InlinePreferenceRow({
  title,
  subtitle,
  right,
  noBorder = false,
}: {
  title: string;
  subtitle?: string;
  right: React.ReactNode;
  noBorder?: boolean;
}) {
  return (
    <View style={[styles.preferenceRow, noBorder && styles.preferenceRowLast]}>
      <View style={styles.preferenceCopy}>
        <Text style={styles.preferenceTitle}>{title}</Text>
        {subtitle ? <Text style={styles.preferenceSubtitle}>{subtitle}</Text> : null}
      </View>
      <View style={styles.preferenceControl}>{right}</View>
    </View>
  );
}

function SettingValuePill({ label, tone = 'neutral' }: { label: string; tone?: 'neutral' | 'success' }) {
  return (
    <View
      style={[
        styles.settingValuePill,
        tone === 'success' && styles.settingValuePillSuccess,
      ]}
    >
      <Text
        style={[
          styles.settingValuePillLabel,
          tone === 'success' && styles.settingValuePillLabelSuccess,
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

function ToolbarButton({
  label,
  filled = false,
  onPress,
}: {
  label?: string;
  filled?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.toolbarButton,
        filled && styles.toolbarButtonFilled,
        pressed && styles.pressedState,
      ]}
    >
      {filled ? (
        <View style={styles.searchGlyph}>
          <View style={styles.searchGlyphCircle} />
          <View style={styles.searchGlyphHandle} />
        </View>
      ) : null}
      {label ? (
        <Text style={[styles.toolbarButtonLabel, filled && styles.toolbarButtonLabelFilled]}>
          {label}
        </Text>
      ) : null}
    </Pressable>
  );
}

export function ProfileScreen() {
  const { user } = useAuth();
  const {
    getPlanLevelLabel,
    getPlanStatusLabel,
    getRoleLabel,
    getRowDirection,
    getTextAlign,
    isRTL,
    language,
    setLanguagePreference,
    t,
  } = useLocalization();
  const navigation =
    useNavigation<BottomTabNavigationProp<MainTabParamList>>();
  const { width } = useWindowDimensions();
  const copy = React.useMemo(() => getDesktopCopy(language), [language]);
  const isWideLayout = width >= WIDE_LAYOUT_BREAKPOINT;
  const isStickyRail = width >= STICKY_RAIL_BREAKPOINT;
  const [logoutLoading, setLogoutLoading] = React.useState(false);
  const [loadingProfile, setLoadingProfile] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [markingAllRead, setMarkingAllRead] = React.useState(false);
  const [role, setRole] = React.useState('user');
  const [email, setEmail] = React.useState<string | null>(user?.email ?? null);
  const [xp, setXp] = React.useState(0);
  const [subscription, setSubscription] = React.useState<UserSubscription | null>(null);
  const [username, setUsername] = React.useState('');
  const [bio, setBio] = React.useState('');
  const [draftLanguage, setDraftLanguage] = React.useState<AppLanguage>('en');
  const [privacyMode, setPrivacyMode] = React.useState(false);
  const [emailNotificationsEnabled, setEmailNotificationsEnabled] = React.useState(true);
  const [marketingEmailsEnabled, setMarketingEmailsEnabled] = React.useState(false);
  const [posts, setPosts] = React.useState<SpotPost[]>([]);
  const [favoritePostIds, setFavoritePostIds] = React.useState<string[]>([]);
  const [commentCountsByPostId, setCommentCountsByPostId] = React.useState<Record<string, number>>({});
  const [likeCountsByPostId, setLikeCountsByPostId] = React.useState<Record<string, number>>({});
  const [notifications, setNotifications] = React.useState<AppNotification[]>([]);
  const [readingNotificationId, setReadingNotificationId] = React.useState<string | null>(null);
  const [reports, setReports] = React.useState<ModerationReport[]>([]);
  const [reviewingReportId, setReviewingReportId] = React.useState<string | null>(null);
  const [organizationUserId, setOrganizationUserId] = React.useState('');
  const [organizationLoading, setOrganizationLoading] = React.useState(false);
  const [planTargetUserId, setPlanTargetUserId] = React.useState('');
  const [planLevel, setPlanLevel] = React.useState<PlanLevel>('free');
  const [planStatus, setPlanStatus] = React.useState<PlanStatus>('active');
  const [planLoading, setPlanLoading] = React.useState(false);
  const [analytics, setAnalytics] = React.useState<AdminAnalyticsSnapshot | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = React.useState(false);
  const [accountDataIssue, setAccountDataIssue] = React.useState<string | null>(null);
  const [refreshToken, setRefreshToken] = React.useState(0);

  const handleAccountDataIssue = React.useCallback(
    (error: unknown, fallbackMessage: string) => {
      const nextMessage = isDataAccessBlockedError(error)
        ? getBlockedDataMessage('one or more Profile data feeds')
        : getErrorMessage(error, fallbackMessage);

      setAccountDataIssue(current => current ?? nextMessage);
    },
    []
  );

  React.useEffect(() => {
    const unsubscribe = observeFavoritePostIds(
      user?.id,
      setFavoritePostIds,
      error => {
        handleAccountDataIssue(error, 'Failed to load favorites.');
      }
    );
    return unsubscribe;
  }, [handleAccountDataIssue, refreshToken, user?.id]);

  React.useEffect(() => {
    const unsubscribe = observeCommentCountsByPost(
      setCommentCountsByPostId,
      error => {
        handleAccountDataIssue(error, 'Failed to load comment counts.');
      }
    );
    return unsubscribe;
  }, [handleAccountDataIssue, refreshToken]);

  React.useEffect(() => {
    const unsubscribe = observeLikeCountsByPost(
      setLikeCountsByPostId,
      error => {
        handleAccountDataIssue(error, 'Failed to load like counts.');
      }
    );
    return unsubscribe;
  }, [handleAccountDataIssue, refreshToken]);

  React.useEffect(() => {
    const unsubscribe = observeNotifications(
      user?.id,
      setNotifications,
      error => {
        handleAccountDataIssue(error, 'Failed to load notifications.');
      }
    );
    return unsubscribe;
  }, [handleAccountDataIssue, refreshToken, user?.id]);

  React.useEffect(() => {
    const unsubscribe = observeUserSubscription(
      user?.id,
      nextSubscription => {
        setSubscription(nextSubscription.userId ? nextSubscription : null);
      },
      error => {
        handleAccountDataIssue(error, 'Failed to load subscription details.');
      }
    );
    return unsubscribe;
  }, [handleAccountDataIssue, refreshToken, user?.id]);

  React.useEffect(() => {
    const unsubscribe = observeReports(
      role,
      setReports,
      error => {
        handleAccountDataIssue(error, 'Failed to load reports.');
      }
    );
    return unsubscribe;
  }, [handleAccountDataIssue, refreshToken, role]);

  React.useEffect(() => {
    const unsubscribe = subscribeToPosts(setPosts, error => {
      handleAccountDataIssue(error, 'Failed to load saved posts.');
    });
    return unsubscribe;
  }, [handleAccountDataIssue, refreshToken]);

  React.useEffect(() => {
    if (!user) {
      setLoadingProfile(false);
      setUsername(copy.fallbackName);
      setEmail(copy.fallbackEmail);
      setDraftLanguage(language);
      return;
    }

    setLoadingProfile(true);
    let unsubscribe: () => void = () => {};

    try {
      unsubscribe = observeCurrentUserProfile(
        { user },
        profile => {
          setEmail(profile.email);
          setRole(profile.role);
          setXp(profile.xp);
          setUsername(profile.username);
          setBio(profile.bio);
          setDraftLanguage(profile.language);
          setPrivacyMode(profile.privacyMode);
          setLoadingProfile(false);
        },
        error => {
          handleAccountDataIssue(error, 'Failed to load profile details.');
          setLoadingProfile(false);
        }
      );
    } catch (error: any) {
      handleAccountDataIssue(error, 'Failed to load profile details.');
      setLoadingProfile(false);
    }

    return unsubscribe;
  }, [copy.fallbackEmail, copy.fallbackName, handleAccountDataIssue, language, refreshToken, user]);

  const favoritePosts = React.useMemo(() => {
    const favoriteSet = new Set(favoritePostIds);
    return posts.filter(post => favoriteSet.has(post.id));
  }, [favoritePostIds, posts]);

  const savedSpotItems = React.useMemo(
    () =>
      uniqueSpotItemsByPlace(
        buildDiscoverySpotItems(favoritePosts, {
          commentCountsByPostId,
          likeCountsByPostId,
          favoritePostIds,
        })
      ),
    [commentCountsByPostId, favoritePostIds, favoritePosts, likeCountsByPostId]
  );

  const unreadNotificationsCount = React.useMemo(
    () => notifications.filter(notification => !notification.isRead).length,
    [notifications]
  );

  const handleRetryAccountData = React.useCallback(() => {
    setAccountDataIssue(null);
    setLoadingProfile(true);
    setRefreshToken(current => current + 1);
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveCurrentUserProfile({
        userId: user?.id,
        username,
        bio,
        language: draftLanguage,
        privacyMode,
      });
      await setLanguagePreference(draftLanguage);
      showAlert(t('profile.savedAlertTitle'), t('profile.savedAlertBody'));
    } catch (error: any) {
      if (error instanceof ProfileValidationError) {
        showAlert(t('profile.profileValidationTitle'), error.message);
      } else {
        showAlert(t('profile.saveErrorTitle'), error?.message ?? 'Failed to update profile');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    setLogoutLoading(true);
    try {
      await logoutUser();
    } catch (error: any) {
      showAlert(t('profile.logoutErrorTitle'), error?.message ?? 'Something went wrong');
    } finally {
      setLogoutLoading(false);
    }
  };

  const handleMarkNotificationRead = async (notificationId: string) => {
    setReadingNotificationId(notificationId);
    try {
      await markUserNotificationRead(user?.id, notificationId);
    } catch (error: any) {
      if (error instanceof NotificationValidationError) {
        showAlert(t('profile.notificationErrorTitle'), error.message);
      } else {
        showAlert(t('profile.notificationErrorTitle'), error?.message ?? 'Failed to update notification');
      }
    } finally {
      setReadingNotificationId(null);
    }
  };

  const handleMarkAllRead = async () => {
    const unreadIds = notifications.filter(item => !item.isRead).map(item => item.id);
    if (unreadIds.length === 0) {
      return;
    }

    setMarkingAllRead(true);
    try {
      await Promise.all(unreadIds.map(id => markUserNotificationRead(user?.id, id)));
      showAlert(t('common.updated'), copy.readAllDone);
    } catch (error: any) {
      if (error instanceof NotificationValidationError) {
        showAlert(t('profile.notificationErrorTitle'), error.message);
      } else {
        showAlert(t('profile.notificationErrorTitle'), error?.message ?? 'Failed to update notifications');
      }
    } finally {
      setMarkingAllRead(false);
    }
  };

  const activityEntries = React.useMemo<ActivityEntry[]>(() => {
    const notificationEntries = notifications.slice(0, 4).map(notification => ({
      id: `notification-${notification.id}`,
      kind:
        notification.type === 'comment_on_post'
          ? ('comment' as const)
          : ('like' as const),
      title: notification.message,
      subtitle:
        notification.type === 'comment_on_post'
          ? `${notification.actorLabel}  •  ${copy.commentSubtitle}`
          : `${notification.actorLabel}  •  ${copy.likeSubtitle}`,
      timestampLabel:
        formatRelativeTime(getTimestampMs(notification.createdAt)) ||
        t('common.pendingTimestamp'),
      unread: !notification.isRead,
      onPress: notification.isRead
        ? undefined
        : () => {
            void handleMarkNotificationRead(notification.id);
          },
    }));

    if (notificationEntries.length >= 3) {
      return notificationEntries.slice(0, 3);
    }

    const saveEntries = savedSpotItems
      .slice(0, Math.max(0, 3 - notificationEntries.length))
      .map(spot => ({
        id: `save-${spot.id}`,
        kind: 'save' as const,
        title: `${copy.savedActivityPrefix} ${spot.title}`,
        subtitle: `${spot.categoryLabel}  •  ${spot.areaLabel}`,
        timestampLabel: spot.updatedLabel,
      }));

    return [...notificationEntries, ...saveEntries].slice(0, 3);
  }, [
    copy.commentSubtitle,
    copy.likeSubtitle,
    copy.savedActivityPrefix,
    notifications,
    savedSpotItems,
    t,
  ]);

  const handleReportStatusChange = async (reportId: string, status: ReportStatus) => {
    setReviewingReportId(reportId);
    try {
      await reviewReportStatus({ role, reportId, status });
    } catch (error: any) {
      if (error instanceof ModerationValidationError) {
        showAlert(t('profile.moderationErrorTitle'), error.message);
      } else {
        showAlert(t('profile.moderationErrorTitle'), error?.message ?? 'Failed to update report');
      }
    } finally {
      setReviewingReportId(null);
    }
  };

  const handleHideReportedTarget = async (report: ModerationReport) => {
    setReviewingReportId(report.id);
    try {
      await hideReportedTarget({ role, report });
    } catch (error: any) {
      if (error instanceof ModerationValidationError) {
        showAlert(t('profile.moderationErrorTitle'), error.message);
      } else {
        showAlert(t('profile.moderationErrorTitle'), error?.message ?? 'Failed to hide content');
      }
    } finally {
      setReviewingReportId(null);
    }
  };

  const handleMarkOrganization = async () => {
    setOrganizationLoading(true);
    try {
      await markUserAsOrganization({
        adminRole: role,
        targetUserId: organizationUserId,
      });
      setOrganizationUserId('');
      showAlert(t('profile.organizationUpdatedTitle'), t('profile.organizationUpdatedBody'));
    } catch (error: any) {
      if (error instanceof OrganizationValidationError) {
        showAlert(t('profile.organizationErrorTitle'), error.message);
      } else {
        showAlert(t('profile.organizationErrorTitle'), error?.message ?? 'Failed to update account role');
      }
    } finally {
      setOrganizationLoading(false);
    }
  };

  const handleUpdatePlan = async () => {
    setPlanLoading(true);
    try {
      await updateUserPlan({
        adminRole: role,
        targetUserId: planTargetUserId,
        planLevel,
        status: planStatus,
      });
      setPlanTargetUserId('');
      showAlert(t('common.updated'), t('profile.planUpdatedBody'));
    } catch (error: any) {
      if (error instanceof SubscriptionValidationError) {
        showAlert(t('profile.planErrorTitle'), error.message);
      } else {
        showAlert(t('profile.planErrorTitle'), error?.message ?? 'Failed to update plan');
      }
    } finally {
      setPlanLoading(false);
    }
  };

  const handleLoadAnalytics = React.useCallback(async () => {
    setAnalyticsLoading(true);
    try {
      const nextAnalytics = await getAdminAnalytics(role);
      setAnalytics(nextAnalytics);
    } catch (error: any) {
      if (error instanceof AnalyticsValidationError) {
        showAlert(t('profile.analyticsErrorTitle'), error.message);
      } else {
        showAlert(t('profile.analyticsErrorTitle'), error?.message ?? 'Failed to load analytics');
      }
    } finally {
      setAnalyticsLoading(false);
    }
  }, [role, t]);

  React.useEffect(() => {
    if (role !== 'admin') {
      setAnalytics(null);
      return;
    }

    void handleLoadAnalytics();
  }, [handleLoadAnalytics, role]);

  const openExplore = React.useCallback(() => {
    navigation.navigate('Explore');
  }, [navigation]);

  const avatarLabel = (username || user?.displayInfo || copy.fallbackName).trim();
  const displayEmail = email || user?.email || copy.fallbackEmail;
  const profileName = avatarLabel || copy.fallbackName;
  const planLabel = getPlanLevelLabel(subscription?.planLevel ?? 'free');
  const planStatusLabel = getPlanStatusLabel(subscription?.status ?? 'inactive');
  const stickyRailStyle =
    isWideLayout && isStickyRail
      ? ({ position: 'sticky', top: 96, alignSelf: 'flex-start' } as unknown as object)
      : null;

  if (loadingProfile) {
    return <LoadingState label={t('profile.title')} />;
  }

  return (
    <ScreenContainer scroll padded={false} contentContainerStyle={styles.page}>
      <View style={styles.pageShell}>
        <View style={styles.toolbarRow}>
          <View style={styles.toolbarSpacer} />
          <View style={styles.toolbarActions}>
            <ToolbarButton onPress={openExplore} filled />
            <ToolbarButton label={copy.toolbarAreaSummary} onPress={openExplore} />
            <ToolbarButton label={copy.toolbarNearMe} onPress={openExplore} />
          </View>
        </View>

        {accountDataIssue ? (
          <StatusBanner
            compact
            tone="warning"
            title={t('profile.issueTitle')}
            body={t('profile.issueBody')}
            actions={[
              {
                label: t('common.retry'),
                onPress: handleRetryAccountData,
                tone: 'primary',
              },
            ]}
          />
        ) : null}

        <Card style={styles.heroCard}>
          <View style={[styles.heroRow, !isWideLayout && styles.heroRowStack]}>
            <View style={styles.heroIdentity}>
              <View style={styles.avatarFrame}>
                <Image source={{ uri: FALLBACK_AVATAR_URI }} style={styles.avatarImage} />
              </View>
              <View style={styles.heroCopy}>
                <Text
                  style={[
                    styles.heroName,
                    { textAlign: getTextAlign(), writingDirection: isRTL ? 'rtl' : 'ltr' },
                  ]}
                >
                  {profileName}
                </Text>
                <Text
                  style={[
                    styles.heroEmail,
                    { textAlign: getTextAlign(), writingDirection: isRTL ? 'rtl' : 'ltr' },
                  ]}
                >
                  {displayEmail}
                </Text>
                <View style={[styles.heroBadgeRow, { flexDirection: getRowDirection() }]}>
                  <View style={styles.heroBadge}>
                    <Text style={styles.heroBadgeLabel}>{`${copy.roleBadge}: ${getRoleLabel(role)}`}</Text>
                  </View>
                  <View style={[styles.heroBadge, styles.heroBadgePlan]}>
                    <Text style={[styles.heroBadgeLabel, styles.heroBadgeLabelPlan]}>
                      {`${copy.planBadge}: ${planLabel}`}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            <View style={[styles.heroStatsRow, !isWideLayout && styles.heroStatsRowStack]}>
              <HeroStat
                accent="xp"
                label={copy.xpLabel}
                value={String(xp)}
                subtitle={copy.xpHint}
              />
              <View style={styles.heroStatDivider} />
              <HeroStat
                accent="saves"
                label={copy.savesLabel}
                value={String(savedSpotItems.length)}
                subtitle={copy.savesHint}
              />
              <View style={styles.heroStatDivider} />
              <HeroStat
                accent="unread"
                label={copy.unreadLabel}
                value={String(unreadNotificationsCount)}
                subtitle={copy.unreadHint}
              />
            </View>
          </View>
        </Card>

        <View style={[styles.mainGrid, isWideLayout && styles.mainGridWide]}>
          <View style={styles.leftColumn}>
            <Card style={styles.moduleCard}>
              <SectionHeader
                title={copy.savedSpotsTitle}
                actionLabel={copy.savedSpotsAction}
                iconTone="saved"
                onActionPress={openExplore}
              />

              {savedSpotItems.length === 0 ? (
                <View style={styles.compactEmptyState}>
                  <Text style={styles.compactEmptyTitle}>{copy.savedEmptyTitle}</Text>
                  <Text style={styles.compactEmptySubtitle}>{copy.savedEmptySubtitle}</Text>
                </View>
              ) : (
                <View style={styles.savedList}>
                  {savedSpotItems.slice(0, 3).map(spot => (
                    <SavedSpotRow
                      key={spot.id}
                      copy={copy}
                      spot={spot}
                      onPress={openExplore}
                    />
                  ))}
                </View>
              )}
            </Card>

            <Card style={styles.moduleCard}>
              <SectionHeader
                title={copy.recentActivityTitle}
                actionLabel={copy.recentActivityAction}
                iconTone="activity"
                onActionPress={openExplore}
              />

              {activityEntries.length === 0 ? (
                <View style={styles.compactEmptyState}>
                  <Text style={styles.compactEmptyTitle}>{copy.activityEmptyTitle}</Text>
                  <Text style={styles.compactEmptySubtitle}>{copy.activityEmptySubtitle}</Text>
                </View>
              ) : (
                <View style={styles.activityList}>
                  {activityEntries.map(entry => (
                    <ActivityRow key={entry.id} entry={entry} />
                  ))}
                  {readingNotificationId ? (
                    <Text style={styles.inlineStatusText}>{t('profile.updating')}</Text>
                  ) : null}
                </View>
              )}
            </Card>
          </View>

          <View style={[styles.rightColumn, stickyRailStyle]}>
            <Card style={styles.settingsCard}>
              <SectionHeader
                title={copy.settingsTitle}
                iconTone="settings"
              />
              <Text style={styles.settingsSubtitle}>{copy.settingsSubtitle}</Text>

              {!user ? (
                <StatusBanner
                  compact
                  tone="warning"
                  title={copy.signInRequiredTitle}
                  body={copy.signInRequiredBody}
                />
              ) : null}

              <View style={styles.settingRow}>
                <Text style={styles.settingRowLabel}>{copy.usernameLabel}</Text>
                <View style={styles.settingRowField}>
                  <TextInput
                    value={username}
                    onChangeText={setUsername}
                    placeholder={copy.usernameLabel}
                    placeholderTextColor={colors.textSubtle}
                    style={styles.settingInput}
                  />
                </View>
              </View>

              <View style={styles.settingRow}>
                <Text style={styles.settingRowLabel}>{copy.emailLabel}</Text>
                <View style={styles.settingRowField}>
                  <Text style={styles.settingValueText}>{displayEmail}</Text>
                </View>
              </View>

              <View style={styles.settingRow}>
                <Text style={styles.settingRowLabel}>{copy.planLabel}</Text>
                <View style={[styles.settingRowField, styles.settingRowFieldInline]}>
                  <SettingValuePill label={planLabel} tone="success" />
                  <Text style={styles.settingSupportText}>{planStatusLabel}</Text>
                </View>
              </View>

              <View style={styles.settingRow}>
                <Text style={styles.settingRowLabel}>{copy.languageLabel}</Text>
                <View style={[styles.settingRowField, styles.languageToggleRow]}>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => setDraftLanguage('en')}
                    style={({ pressed }) => [
                      styles.languageOption,
                      draftLanguage === 'en' && styles.languageOptionActive,
                      pressed && styles.pressedState,
                    ]}
                  >
                    <Text
                      style={[
                        styles.languageOptionLabel,
                        draftLanguage === 'en' && styles.languageOptionLabelActive,
                      ]}
                    >
                      English
                    </Text>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => setDraftLanguage('ar')}
                    style={({ pressed }) => [
                      styles.languageOption,
                      draftLanguage === 'ar' && styles.languageOptionActive,
                      pressed && styles.pressedState,
                    ]}
                  >
                    <Text
                      style={[
                        styles.languageOptionLabel,
                        draftLanguage === 'ar' && styles.languageOptionLabelActive,
                      ]}
                    >
                      العربية
                    </Text>
                  </Pressable>
                </View>
              </View>

              <View style={styles.settingRow}>
                <Text style={styles.settingRowLabel}>{copy.privacyLabel}</Text>
                <View style={[styles.settingRowField, styles.settingRowFieldSwitch]}>
                  <View style={styles.settingRowFieldCopy}>
                    <Text style={styles.settingSupportText}>{copy.privacyHint}</Text>
                  </View>
                  <Switch value={privacyMode} onValueChange={setPrivacyMode} />
                </View>
              </View>

              <View style={[styles.settingRow, styles.settingRowBio]}>
                <Text style={styles.settingRowLabel}>{copy.bioLabel}</Text>
                <View style={styles.settingRowField}>
                  <TextInput
                    value={bio}
                    onChangeText={setBio}
                    placeholder={copy.bioLabel}
                    placeholderTextColor={colors.textSubtle}
                    multiline
                    style={[styles.settingInput, styles.settingTextarea]}
                  />
                </View>
              </View>

              <View style={styles.preferenceCard}>
                <Text style={styles.preferenceCardTitle}>{copy.preferencesTitle}</Text>
                <InlinePreferenceRow
                  title={copy.emailNotifications}
                  subtitle={copy.emailNotificationsHint}
                  right={
                    <Switch
                      value={emailNotificationsEnabled}
                      onValueChange={setEmailNotificationsEnabled}
                    />
                  }
                />
                <InlinePreferenceRow
                  title={copy.marketingEmails}
                  subtitle={copy.marketingEmailsHint}
                  right={
                    <Switch
                      value={marketingEmailsEnabled}
                      onValueChange={setMarketingEmailsEnabled}
                    />
                  }
                />
                <InlinePreferenceRow
                  title={copy.unreadNotifications}
                  subtitle={copy.unreadNotificationsHint}
                  noBorder
                  right={
                    <View style={styles.preferenceUnreadWrap}>
                      <View style={styles.preferenceUnreadBadge}>
                        <Text style={styles.preferenceUnreadBadgeLabel}>
                          {String(unreadNotificationsCount)}
                        </Text>
                      </View>
                      {unreadNotificationsCount > 0 ? (
                        <Pressable
                          accessibilityRole="button"
                          onPress={handleMarkAllRead}
                          style={({ pressed }) => [
                            styles.preferenceInlineAction,
                            pressed && styles.pressedState,
                          ]}
                        >
                          {markingAllRead ? (
                            <ActivityIndicator color={colors.primaryPressed} size="small" />
                          ) : (
                            <Text style={styles.preferenceInlineActionLabel}>
                              {copy.markAllRead}
                            </Text>
                          )}
                        </Pressable>
                      ) : null}
                    </View>
                  }
                />
              </View>

              <View style={styles.settingsButtonRow}>
                <PrimaryButton
                  label={copy.saveSettings}
                  loading={saving}
                  disabled={!user}
                  onPress={handleSave}
                  style={styles.primaryActionButton}
                />
                <SecondaryButton
                  label={logoutLoading ? copy.signingOut : copy.signOut}
                  disabled={!user || logoutLoading}
                  onPress={handleLogout}
                  style={styles.secondaryActionButton}
                />
              </View>
            </Card>
          </View>
        </View>

        {role === 'admin' ? (
          <Card style={styles.adminCard}>
            <View style={styles.adminHeader}>
              <Text style={styles.adminTitle}>{copy.adminTitle}</Text>
              <Text style={styles.adminSubtitle}>{copy.adminSubtitle}</Text>
            </View>

            <View style={[styles.adminGrid, isWideLayout && styles.adminGridWide]}>
              <View style={styles.adminPanel}>
                <Text style={styles.adminPanelTitle}>{copy.adminAccountsTitle}</Text>
                <Text style={styles.adminPanelSubtitle}>{copy.adminAccountsSubtitle}</Text>
                <TextField
                  label={copy.targetUserId}
                  placeholder={copy.targetUserId}
                  value={organizationUserId}
                  onChangeText={setOrganizationUserId}
                />
                <SecondaryButton
                  label={organizationLoading ? t('profile.updating') : copy.roleUpdateAction}
                  disabled={organizationLoading}
                  onPress={handleMarkOrganization}
                />
              </View>

              <View style={styles.adminPanel}>
                <Text style={styles.adminPanelTitle}>{copy.adminPlansTitle}</Text>
                <Text style={styles.adminPanelSubtitle}>{copy.adminPlansSubtitle}</Text>
                <TextField
                  label={copy.targetUserId}
                  placeholder={copy.targetUserId}
                  value={planTargetUserId}
                  onChangeText={setPlanTargetUserId}
                />
                <View style={styles.adminChipGroup}>
                  {(['free', 'organization_basic', 'organization_premium'] as PlanLevel[]).map(item => (
                    <FilterChip
                      key={item}
                      label={getPlanLevelLabel(item)}
                      compact
                      active={planLevel === item}
                      onPress={() => setPlanLevel(item)}
                    />
                  ))}
                </View>
                <View style={styles.adminChipGroup}>
                  {(['active', 'inactive', 'trial'] as PlanStatus[]).map(item => (
                    <FilterChip
                      key={item}
                      label={getPlanStatusLabel(item)}
                      compact
                      active={planStatus === item}
                      onPress={() => setPlanStatus(item)}
                    />
                  ))}
                </View>
                <SecondaryButton
                  label={planLoading ? t('profile.updating') : copy.planUpdateAction}
                  disabled={planLoading}
                  onPress={handleUpdatePlan}
                />
              </View>

              <View style={styles.adminPanel}>
                <Text style={styles.adminPanelTitle}>{copy.adminAnalyticsTitle}</Text>
                <Text style={styles.adminPanelSubtitle}>{copy.adminAnalyticsSubtitle}</Text>
                <SecondaryButton
                  label={analyticsLoading ? t('profile.refreshingAnalytics') : copy.refreshAnalytics}
                  disabled={analyticsLoading}
                  onPress={handleLoadAnalytics}
                />
                {analytics ? (
                  <View style={styles.analyticsMiniGrid}>
                    <View style={styles.analyticsMiniTile}>
                      <Text style={styles.analyticsMiniValue}>{analytics.totalUsers}</Text>
                      <Text style={styles.analyticsMiniLabel}>{copy.analyticsUsers}</Text>
                    </View>
                    <View style={styles.analyticsMiniTile}>
                      <Text style={styles.analyticsMiniValue}>{analytics.totalPosts}</Text>
                      <Text style={styles.analyticsMiniLabel}>{copy.analyticsPosts}</Text>
                    </View>
                    <View style={styles.analyticsMiniTile}>
                      <Text style={styles.analyticsMiniValue}>{analytics.totalPromotedEvents}</Text>
                      <Text style={styles.analyticsMiniLabel}>{copy.analyticsEvents}</Text>
                    </View>
                    <View style={styles.analyticsMiniTile}>
                      <Text style={styles.analyticsMiniValue}>{analytics.totalReports}</Text>
                      <Text style={styles.analyticsMiniLabel}>{copy.analyticsReports}</Text>
                    </View>
                  </View>
                ) : null}
              </View>

              <View style={[styles.adminPanel, styles.adminPanelWide]}>
                <Text style={styles.adminPanelTitle}>{copy.adminModerationTitle}</Text>
                <Text style={styles.adminPanelSubtitle}>{copy.adminModerationSubtitle}</Text>
                {reports.length === 0 ? (
                  <View style={styles.compactEmptyState}>
                    <Text style={styles.compactEmptyTitle}>{copy.adminReportsEmpty}</Text>
                  </View>
                ) : (
                  <View style={styles.reportList}>
                    {reports.slice(0, 4).map(report => (
                      <View key={report.id} style={styles.reportCard}>
                        <Text style={styles.reportTitle}>
                          {t('profile.reporter', { reporter: report.reporterUserId })}
                        </Text>
                        <Text style={styles.reportSubtitle}>
                          {t('profile.target', {
                            target: report.targetId,
                            reason: getReportReasonLabel(report.reason),
                          })}
                        </Text>
                        <Text style={styles.reportMeta}>
                          {getReportStatusLabel(report.status)}
                        </Text>
                        <View style={styles.adminChipGroup}>
                          {(['open', 'reviewed', 'dismissed', 'action_taken'] as ReportStatus[]).map(status => (
                            <FilterChip
                              key={`${report.id}-${status}`}
                              label={getReportStatusLabel(status)}
                              compact
                              active={report.status === status}
                              disabled={reviewingReportId === report.id}
                              onPress={() => handleReportStatusChange(report.id, status)}
                            />
                          ))}
                        </View>
                        <SecondaryButton
                          label={
                            reviewingReportId === report.id
                              ? t('profile.updating')
                              : copy.hideReportedContent
                          }
                          disabled={reviewingReportId === report.id}
                          onPress={() => handleHideReportedTarget(report)}
                        />
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </View>
          </Card>
        ) : null}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  page: {
    width: '100%',
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
  toolbarRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 42,
  },
  toolbarSpacer: {
    flex: 1,
  },
  toolbarActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  toolbarButton: {
    ...webDesktopControl,
    minHeight: 42,
    minWidth: 42,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  toolbarButtonFilled: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    paddingHorizontal: spacing.md,
  },
  toolbarButtonLabel: {
    ...typography.caption,
    color: colors.text,
    fontWeight: '600',
    fontSize: 13,
    lineHeight: 18,
  },
  toolbarButtonLabelFilled: {
    color: colors.surface,
  },
  searchGlyph: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  searchGlyphCircle: {
    width: 13,
    height: 13,
    borderRadius: 999,
    borderWidth: 1.8,
    borderColor: colors.surface,
    position: 'absolute',
    top: 2,
    left: 2,
  },
  searchGlyphHandle: {
    width: 8,
    height: 2,
    borderRadius: 999,
    backgroundColor: colors.surface,
    position: 'absolute',
    right: 1,
    bottom: 4,
    transform: [{ rotate: '45deg' }],
  },
  heroCard: {
    ...webDesktopSupportSurface,
    paddingHorizontal: spacing.xxl + 8,
    paddingVertical: spacing.xxl,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.xl,
  },
  heroRowStack: {
    flexDirection: 'column',
    alignItems: 'stretch',
  },
  heroIdentity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    flex: 1,
    minWidth: 0,
  },
  avatarFrame: {
    width: 108,
    height: 108,
    borderRadius: 999,
    backgroundColor: '#E5EEF5',
    borderWidth: 1,
    borderColor: '#E1D8CD',
    padding: 6,
    overflow: 'hidden',
    flexShrink: 0,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 999,
  },
  heroCopy: {
    flex: 1,
    minWidth: 0,
    gap: 5,
  },
  heroName: {
    ...typography.title,
    fontSize: 24,
    lineHeight: 30,
    color: colors.text,
  },
  heroEmail: {
    ...typography.bodyMuted,
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 20,
  },
  heroBadgeRow: {
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  heroBadge: {
    minHeight: 30,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: '#DED2C6',
    backgroundColor: '#F9F3EC',
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroBadgePlan: {
    backgroundColor: '#E8F3E8',
    borderColor: '#CFE3CF',
  },
  heroBadgeLabel: {
    ...typography.caption,
    color: colors.text,
    fontWeight: '600',
  },
  heroBadgeLabelPlan: {
    color: colors.success,
  },
  heroStatsRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    borderLeftWidth: 1,
    borderLeftColor: '#EFE5DA',
    paddingLeft: spacing.xxl,
    gap: spacing.xl,
  },
  heroStatsRowStack: {
    borderLeftWidth: 0,
    borderTopWidth: 1,
    borderTopColor: '#EFE5DA',
    paddingLeft: 0,
    paddingTop: spacing.xl,
  },
  heroStat: {
    minWidth: 170,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  heroStatIcon: {
    width: 50,
    height: 50,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroStatIconXp: {
    backgroundColor: '#FCE8E4',
  },
  heroStatIconSaves: {
    backgroundColor: '#EDF4DF',
  },
  heroStatIconUnread: {
    backgroundColor: '#EAF1FF',
  },
  heroStatGlyph: {
    width: 16,
    height: 16,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  heroStatCopy: {
    gap: 2,
  },
  heroStatValue: {
    ...typography.title,
    fontSize: 22,
    lineHeight: 26,
  },
  heroStatLabel: {
    ...typography.body,
    fontWeight: '600',
    fontSize: 14,
    lineHeight: 18,
  },
  heroStatSubtitle: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  heroStatDivider: {
    width: 1,
    backgroundColor: '#EEE3D8',
  },
  mainGrid: {
    gap: spacing.lg,
  },
  mainGridWide: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  leftColumn: {
    flex: 1.02,
    minWidth: 0,
    gap: spacing.md,
  },
  rightColumn: {
    minWidth: 0,
  },
  moduleCard: {
    ...webDesktopSurface,
    padding: spacing.lg,
    gap: spacing.md,
  },
  settingsCard: {
    flex: 0.98,
    minWidth: 0,
    width: '100%',
    ...webDesktopSurface,
    padding: spacing.lg,
    gap: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 2,
  },
  sectionIcon: {
    width: 22,
    height: 22,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionIconSaved: {
    backgroundColor: '#F0F2F8',
  },
  sectionIconActivity: {
    backgroundColor: '#FBECE8',
  },
  sectionIconSettings: {
    backgroundColor: '#F2F3F5',
  },
  sectionIconInner: {
    width: 9,
    height: 9,
    borderRadius: 2,
    borderWidth: 1.5,
    borderColor: colors.textMuted,
  },
  sectionHeadingTitle: {
    ...typography.sectionTitle,
    ...webDesktopSectionTitle,
    color: colors.text,
  },
  sectionAction: {
    minHeight: 24,
    justifyContent: 'center',
  },
  sectionActionLabel: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
    fontSize: 13,
    lineHeight: 18,
  },
  compactEmptyState: {
    gap: 4,
    paddingVertical: spacing.sm,
  },
  compactEmptyTitle: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
    fontSize: 14,
    lineHeight: 19,
  },
  compactEmptySubtitle: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  savedList: {
    gap: spacing.sm,
  },
  savedRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: '#EEE5DB',
    backgroundColor: '#FFFEFC',
    borderRadius: radius.lg,
    padding: spacing.sm,
  },
  savedRowImage: {
    width: 168,
    height: 88,
    borderRadius: radius.md,
    backgroundColor: '#E9E1D6',
  },
  savedRowBody: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  savedRowCopy: {
    flex: 1,
    minWidth: 0,
    gap: 4,
    justifyContent: 'center',
  },
  savedRowTitle: {
    ...typography.body,
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '700',
    color: colors.text,
  },
  savedRowMeta: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  savedRowDescription: {
    ...typography.caption,
    color: colors.text,
    fontSize: 13,
    lineHeight: 18,
  },
  savedRowAside: {
    width: 76,
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: spacing.xs,
  },
  savedRowAsideLabel: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 16,
  },
  savedRowAsideValue: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 16,
  },
  savedRowBookmark: {
    width: 36,
    height: 36,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E7DDD2',
    backgroundColor: '#FFFDFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  savedRowBookmarkInner: {
    width: 10,
    height: 13,
    borderWidth: 1.8,
    borderColor: colors.textMuted,
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
  },
  activityList: {
    gap: 0,
  },
  activityRow: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#EEE5DB',
    paddingVertical: spacing.md,
  },
  activityRowUnread: {
    backgroundColor: '#FFF9F7',
  },
  activityIcon: {
    width: 38,
    height: 38,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  activityIconLike: {
    backgroundColor: '#FDEBE7',
  },
  activityIconComment: {
    backgroundColor: '#EAF2FF',
  },
  activityIconSave: {
    backgroundColor: '#EAF6EA',
  },
  activityIconGlyph: {
    width: 10,
    height: 10,
    borderRadius: 2,
    borderWidth: 1.6,
    borderColor: colors.primary,
  },
  activityCopy: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  activityTitle: {
    ...typography.body,
    fontSize: 15,
    lineHeight: 20,
    color: colors.text,
    fontWeight: '600',
  },
  activitySubtitle: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  activityAside: {
    alignItems: 'flex-end',
    gap: spacing.xs,
    minWidth: 70,
  },
  activityTimestamp: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 16,
  },
  activityUnreadDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: colors.primary,
  },
  inlineStatusText: {
    ...typography.caption,
    color: colors.textSubtle,
    marginTop: spacing.sm,
  },
  settingsSubtitle: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
    marginTop: -4,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: '#EEE5DB',
    paddingTop: spacing.md,
  },
  settingRowBio: {
    alignItems: 'stretch',
  },
  settingRowLabel: {
    ...typography.body,
    width: 100,
    color: colors.text,
    fontWeight: '600',
    fontSize: 15,
    lineHeight: 20,
    paddingTop: 8,
  },
  settingRowField: {
    flex: 1,
    minWidth: 0,
  },
  settingRowFieldInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 40,
  },
  settingRowFieldSwitch: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    minHeight: 40,
  },
  settingRowFieldCopy: {
    flex: 1,
    minWidth: 0,
  },
  settingInput: {
    ...webDesktopControl,
    minHeight: 44,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    color: colors.text,
    fontSize: 14,
    lineHeight: 18,
  },
  settingTextarea: {
    minHeight: 88,
    textAlignVertical: 'top',
  },
  settingValueText: {
    ...typography.body,
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
    paddingVertical: spacing.sm,
  },
  settingSupportText: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  settingValuePill: {
    minHeight: 28,
    borderRadius: radius.pill,
    backgroundColor: '#F2F1EE',
    paddingHorizontal: spacing.sm + 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingValuePillSuccess: {
    backgroundColor: '#EAF5EA',
  },
  settingValuePillLabel: {
    ...typography.caption,
    color: colors.text,
    fontWeight: '600',
  },
  settingValuePillLabelSuccess: {
    color: colors.success,
  },
  languageToggleRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  languageOption: {
    minHeight: 38,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#E8DDD2',
    backgroundColor: '#FFFEFC',
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  languageOptionActive: {
    borderColor: colors.primary,
    backgroundColor: '#FFF1ED',
  },
  languageOptionLabel: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: '600',
  },
  languageOptionLabelActive: {
    color: colors.primaryPressed,
  },
  preferenceCard: {
    borderWidth: 1,
    borderColor: '#ECE2D7',
    backgroundColor: '#FFFDF9',
    borderRadius: radius.lg,
    marginTop: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: spacing.xs,
  },
  preferenceCardTitle: {
    ...typography.body,
    color: colors.text,
    fontWeight: '700',
    fontSize: 15,
    lineHeight: 20,
    marginBottom: 2,
  },
  preferenceRow: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#EFE5DA',
    paddingVertical: spacing.sm,
  },
  preferenceRowLast: {
    borderBottomWidth: 0,
    paddingBottom: 0,
  },
  preferenceCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  preferenceTitle: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
    fontSize: 14,
    lineHeight: 18,
  },
  preferenceSubtitle: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 16,
  },
  preferenceControl: {
    alignItems: 'flex-end',
  },
  preferenceUnreadWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  preferenceUnreadBadge: {
    minWidth: 28,
    height: 28,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5DBD0',
    backgroundColor: '#FFFCF8',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xs + 2,
  },
  preferenceUnreadBadgeLabel: {
    ...typography.caption,
    color: colors.text,
    fontWeight: '600',
  },
  preferenceInlineAction: {
    minHeight: 28,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: '#E6DACE',
    backgroundColor: '#FFF7F3',
    paddingHorizontal: spacing.sm + 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  preferenceInlineActionLabel: {
    ...typography.caption,
    color: colors.primaryPressed,
    fontWeight: '600',
  },
  settingsButtonRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  primaryActionButton: {
    flex: 1,
  },
  secondaryActionButton: {
    minWidth: 120,
  },
  adminCard: {
    ...webDesktopSurface,
    padding: spacing.lg,
    gap: spacing.lg,
  },
  adminHeader: {
    gap: 4,
  },
  adminTitle: {
    ...typography.sectionTitle,
    fontSize: 18,
    lineHeight: 23,
    color: colors.text,
  },
  adminSubtitle: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  adminGrid: {
    gap: spacing.md,
  },
  adminGridWide: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  adminPanel: {
    flex: 1,
    minWidth: 280,
    borderWidth: 1,
    borderColor: '#ECE2D7',
    backgroundColor: '#FFFDF9',
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.sm,
  },
  adminPanelWide: {
    minWidth: 420,
    flexBasis: '48%',
  },
  adminPanelTitle: {
    ...typography.body,
    color: colors.text,
    fontWeight: '700',
    fontSize: 15,
    lineHeight: 20,
  },
  adminPanelSubtitle: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 17,
  },
  adminChipGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  analyticsMiniGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  analyticsMiniTile: {
    minWidth: 96,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#E7DDD2',
    backgroundColor: '#FFFEFC',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: 2,
  },
  analyticsMiniValue: {
    ...typography.title,
    fontSize: 20,
    lineHeight: 24,
    color: colors.text,
  },
  analyticsMiniLabel: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 16,
  },
  reportList: {
    gap: spacing.sm,
  },
  reportCard: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#ECE2D7',
    backgroundColor: '#FFFEFC',
    padding: spacing.md,
    gap: spacing.sm,
  },
  reportTitle: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
    fontSize: 14,
    lineHeight: 18,
  },
  reportSubtitle: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 16,
  },
  reportMeta: {
    ...typography.caption,
    color: colors.textSubtle,
    fontSize: 12,
    lineHeight: 16,
  },
  pressedState: {
    opacity: 0.9,
  },
});
