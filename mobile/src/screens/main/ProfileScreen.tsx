import React from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';

import { LoadingState } from '../../components/ui/LoadingState';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { useAuth } from '../../context/AuthContext';
import { useLocalization } from '../../context/LocalizationContext';
import { subscribeToPosts } from '../../repositories/postsRepository';
import {
  observeFavoritePostIds,
} from '../../services/favoriteService';
import {
  markUserNotificationRead,
  observeNotifications,
  NotificationValidationError,
} from '../../services/notificationService';
import {
  observeCurrentUserProfile,
  ProfileValidationError,
  saveCurrentUserProfile,
} from '../../services/profileService';
import { logoutUser } from '../../services/authService';
import {
  observeUserSubscription,
} from '../../services/subscriptionService';
import {
  buildDiscoverySpotItems,
  getTimestampMs,
} from '../../services/discoveryService';
import { colors, radius, spacing, typography } from '../../theme/designSystem';
import {
  getBlockedDataMessage,
  getErrorMessage,
  isDataAccessBlockedError,
} from '../../utils/dataAccessError';
import { showAlert } from '../../utils/showAlert';
import type { MainTabParamList } from '../../navigation/types';
import type { AppNotification } from '../../types/notification';
import type { AppLanguage } from '../../types/profile';
import type { SpotPost } from '../../types/post';
import type { UserSubscription } from '../../types/subscription';

type ProfileCopy = {
  title: string;
  viewAll: string;
  roleLabel: string;
  planLabel: string;
  statsXp: string;
  statsXpHint: string;
  statsSaves: string;
  statsSavesHint: string;
  statsUnread: string;
  statsUnreadHint: string;
  savedTitle: string;
  noMoreSavedTitle: string;
  noMoreSavedBody: string;
  activityTitle: string;
  settingsTitle: string;
  usernameLabel: string;
  emailLabel: string;
  planSettingLabel: string;
  languageLabel: string;
  privacyLabel: string;
  languageEnglish: string;
  languageArabic: string;
  privacyPublic: string;
  privacyPrivate: string;
  saveSettings: string;
  signOut: string;
  promoTitle: string;
  promoBody: string;
  retry: string;
  signInRequired: string;
  defaultUsername: string;
  fallbackSavedTitle: string;
  fallbackSavedMeta: string;
  fallbackSavedDistance: string;
  activityFallbackOneTitle: string;
  activityFallbackOneSubtitle: string;
  activityFallbackTwoTitle: string;
  activityFallbackTwoSubtitle: string;
  daysAgo: (value: number) => string;
};

type SavedSpotPreview = {
  id: string;
  title: string;
  meta: string;
  distance: string;
  imageUrl: string;
};

type ActivityPreview = {
  id: string;
  title: string;
  subtitle: string;
  recency: string;
  imageUrl: string;
  icon: 'save' | 'bell';
  notificationId?: string;
  unread?: boolean;
};

const MOBILE_AVATAR_FALLBACK_URI =
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=160&q=80';

const SAVED_SPOT_FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1200&q=80';

const ACTIVITY_IMAGES = [
  'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=800&q=80',
] as const;

function getCopy(language: AppLanguage): ProfileCopy {
  if (language === 'ar') {
    return {
      title: 'الملف الشخصي',
      viewAll: 'عرض الكل',
      roleLabel: 'الدور',
      planLabel: 'الخطة',
      statsXp: 'نقاط XP',
      statsXpHint: 'استمر في الاستكشاف!',
      statsSaves: 'المحفوظات',
      statsSavesHint: 'أماكن تحبها',
      statsUnread: 'غير المقروء',
      statsUnreadHint: 'إشعارات جديدة',
      savedTitle: 'الأماكن المحفوظة',
      noMoreSavedTitle: 'لا توجد أماكن محفوظة إضافية',
      noMoreSavedBody: 'احفظ الأماكن التي تعجبك لتظهر هنا.',
      activityTitle: 'النشاط الأخير',
      settingsTitle: 'إعدادات الحساب',
      usernameLabel: 'اسم المستخدم',
      emailLabel: 'البريد الإلكتروني',
      planSettingLabel: 'الخطة',
      languageLabel: 'اللغة',
      privacyLabel: 'وضع الخصوصية',
      languageEnglish: 'English (US)',
      languageArabic: 'العربية',
      privacyPublic: 'عام',
      privacyPrivate: 'خاص',
      saveSettings: 'حفظ الإعدادات',
      signOut: 'تسجيل الخروج',
      promoTitle: 'شارك مع المزيد من السكان',
      promoBody: 'روّج تحديثاتك للوصول إلى مجتمع أكبر في قطر.',
      retry: 'إعادة المحاولة',
      signInRequired: 'سجّل الدخول لإدارة إعدادات الحساب.',
      defaultUsername: 'مستخدم Spots',
      fallbackSavedTitle: 'Lusail Boulevard Bites',
      fallbackSavedMeta: 'لوسيل • مأكولات ومشروبات',
      fallbackSavedDistance: '2.1 كم',
      activityFallbackOneTitle: 'تم حفظ Sahara Walk Coffee',
      activityFallbackOneSubtitle: 'قهوة • Aspire Zone',
      activityFallbackTwoTitle: 'فعالية جديدة بالقرب منك',
      activityFallbackTwoSubtitle: 'Katara Family Lawn After Dinner Loop',
      daysAgo: value => `قبل ${value} يوم`,
    };
  }

  return {
    title: 'Profile',
    viewAll: 'View all',
    roleLabel: 'Role',
    planLabel: 'Plan',
    statsXp: 'XP',
    statsXpHint: 'Keep exploring!',
    statsSaves: 'Saves',
    statsSavesHint: 'Spots you love',
    statsUnread: 'Unread',
    statsUnreadHint: 'New notifications',
    savedTitle: 'Saved Spots',
    noMoreSavedTitle: 'No more saved spots yet',
    noMoreSavedBody: 'Save places you love to see them here.',
    activityTitle: 'Recent Activity',
    settingsTitle: 'Account Settings',
    usernameLabel: 'Username',
    emailLabel: 'Email',
    planSettingLabel: 'Plan',
    languageLabel: 'Language',
    privacyLabel: 'Privacy mode',
    languageEnglish: 'English (US)',
    languageArabic: 'Arabic',
    privacyPublic: 'Public',
    privacyPrivate: 'Private',
    saveSettings: 'Save Settings',
    signOut: 'Sign Out',
    promoTitle: 'Share with more locals',
    promoBody: 'Promote updates to reach more people around Qatar.',
    retry: 'Retry',
    signInRequired: 'Sign in to manage your account settings.',
    defaultUsername: 'Spots User',
    fallbackSavedTitle: 'Lusail Boulevard Bites',
    fallbackSavedMeta: 'Lusail • Food & Drinks',
    fallbackSavedDistance: '2.1 km away',
    activityFallbackOneTitle: 'Saved Sahara Walk Coffee',
    activityFallbackOneSubtitle: 'Coffee • Aspire Zone',
    activityFallbackTwoTitle: 'New event nearby',
    activityFallbackTwoSubtitle: 'Katara Family Lawn After Dinner Loop',
    daysAgo: value => `${value} day${value === 1 ? '' : 's'} ago`,
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

function formatRecencyLabel(value: unknown, copy: ProfileCopy) {
  const timestampMs = getTimestampMs(value);
  if (timestampMs === null) {
    return copy.daysAgo(1);
  }

  const elapsedDays = Math.max(1, Math.round((Date.now() - timestampMs) / (24 * 60 * 60 * 1000)));
  return copy.daysAgo(elapsedDays);
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
    <View style={[styles.bookmarkIcon, active && styles.bookmarkIconActive]}>
      <View style={styles.bookmarkBody} />
      <View style={styles.bookmarkFoldLeft} />
      <View style={styles.bookmarkFoldRight} />
    </View>
  );
}

function SectionHeader({
  title,
  actionLabel,
  onActionPress,
}: {
  title: string;
  actionLabel?: string;
  onActionPress?: () => void;
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
      {actionLabel && onActionPress ? (
        <Pressable
          accessibilityRole="button"
          onPress={onActionPress}
          style={({ pressed }) => [pressed && styles.actionPressed]}
        >
          <Text style={styles.sectionLink}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function StatCard({
  icon,
  value,
  label,
  hint,
  emphasize,
}: {
  icon: string;
  value: string;
  label: string;
  hint: string;
  emphasize?: boolean;
}) {
  const { getTextAlign, isRTL } = useLocalization();

  return (
    <View style={styles.statCard}>
      <View style={[styles.statIconWrap, emphasize && styles.statIconWrapEmphasis]}>
        <Text style={[styles.statIcon, emphasize && styles.statIconEmphasis]}>{icon}</Text>
      </View>
      <Text
        style={[
          styles.statValue,
          { textAlign: getTextAlign(), writingDirection: isRTL ? 'rtl' : 'ltr' },
        ]}
      >
        {value}
      </Text>
      <Text
        style={[
          styles.statLabel,
          { textAlign: getTextAlign(), writingDirection: isRTL ? 'rtl' : 'ltr' },
        ]}
      >
        {label}
      </Text>
      <Text
        style={[
          styles.statHint,
          { textAlign: getTextAlign(), writingDirection: isRTL ? 'rtl' : 'ltr' },
        ]}
        numberOfLines={1}
      >
        {hint}
      </Text>
    </View>
  );
}

function SettingsRow({
  icon,
  label,
  value,
  onPress,
}: {
  icon: string;
  label: string;
  value: string;
  onPress?: () => void;
}) {
  const { getRowDirection, getTextAlign, isRTL } = useLocalization();

  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [
        styles.settingRow,
        pressed && onPress && styles.actionPressed,
      ]}
    >
      <View style={[styles.settingLeft, { flexDirection: getRowDirection() }]}> 
        <Text style={styles.settingIcon}>{icon}</Text>
        <Text
          style={[
            styles.settingLabel,
            { textAlign: getTextAlign(), writingDirection: isRTL ? 'rtl' : 'ltr' },
          ]}
        >
          {label}
        </Text>
      </View>

      <View style={[styles.settingRight, { flexDirection: getRowDirection() }]}> 
        <Text
          style={[
            styles.settingValue,
            { textAlign: getTextAlign(), writingDirection: isRTL ? 'rtl' : 'ltr' },
          ]}
          numberOfLines={1}
        >
          {value}
        </Text>
        <Text style={styles.settingChevron}>{isRTL ? '‹' : '›'}</Text>
      </View>
    </Pressable>
  );
}

export function ProfileScreen() {
  const { user } = useAuth();
  const {
    getPlanLevelLabel,
    getRowDirection,
    getTextAlign,
    isRTL,
    language,
    setLanguagePreference,
    t,
  } = useLocalization();
  const navigation = useNavigation<BottomTabNavigationProp<MainTabParamList>>();

  const copy = React.useMemo(() => getCopy(language), [language]);

  const [loadingProfile, setLoadingProfile] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [logoutLoading, setLogoutLoading] = React.useState(false);

  const [role, setRole] = React.useState<'user' | 'admin' | 'organization'>('user');
  const [subscription, setSubscription] = React.useState<UserSubscription | null>(null);
  const [username, setUsername] = React.useState('');
  const [email, setEmail] = React.useState<string | null>(user?.email ?? null);
  const [bio, setBio] = React.useState('');
  const [privacyMode, setPrivacyMode] = React.useState(false);
  const [profileLanguage, setProfileLanguage] = React.useState<AppLanguage>('en');
  const [xp, setXp] = React.useState(0);

  const [posts, setPosts] = React.useState<SpotPost[]>([]);
  const [favoritePostIds, setFavoritePostIds] = React.useState<string[]>([]);
  const [notifications, setNotifications] = React.useState<AppNotification[]>([]);
  const [readingNotificationId, setReadingNotificationId] = React.useState<string | null>(null);

  const [accountDataIssue, setAccountDataIssue] = React.useState<string | null>(null);
  const [refreshToken, setRefreshToken] = React.useState(0);

  const handleAccountDataIssue = React.useCallback((error: unknown, fallbackMessage: string) => {
    const nextMessage = isDataAccessBlockedError(error)
      ? getBlockedDataMessage('one or more Profile feeds')
      : getErrorMessage(error, fallbackMessage);

    setAccountDataIssue(current => current ?? nextMessage);
  }, []);

  React.useEffect(() => {
    if (!user) {
      setLoadingProfile(false);
      return;
    }

    setLoadingProfile(true);
    let unsubscribe: () => void = () => {};

    try {
      unsubscribe = observeCurrentUserProfile(
        { user },
        profile => {
          setRole(profile.role);
          setUsername(profile.username);
          setEmail(profile.email);
          setBio(profile.bio);
          setXp(profile.xp);
          setProfileLanguage(profile.language);
          setPrivacyMode(profile.privacyMode);
          setLoadingProfile(false);
        },
        error => {
          handleAccountDataIssue(error, 'Failed to load profile details.');
          setLoadingProfile(false);
        }
      );
    } catch (error) {
      handleAccountDataIssue(error, 'Failed to load profile details.');
      setLoadingProfile(false);
    }

    return unsubscribe;
  }, [handleAccountDataIssue, refreshToken, user]);

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
    const unsubscribe = subscribeToPosts(
      setPosts,
      error => {
        handleAccountDataIssue(error, 'Failed to load saved spots.');
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

  const favoritePosts = React.useMemo(() => {
    const favoriteSet = new Set(favoritePostIds);
    return posts.filter(post => favoriteSet.has(post.id));
  }, [favoritePostIds, posts]);

  const savedSpotItems = React.useMemo(
    () =>
      uniqueSpotItemsByPlace(
        buildDiscoverySpotItems(favoritePosts, {
          favoritePostIds,
        })
      ),
    [favoritePostIds, favoritePosts]
  );

  const unreadNotificationsCount = React.useMemo(
    () => notifications.filter(notification => !notification.isRead).length,
    [notifications]
  );

  const primarySavedSpot = React.useMemo<SavedSpotPreview>(() => {
    const item = savedSpotItems[0];
    if (!item) {
      return {
        id: 'fallback-saved',
        title: copy.fallbackSavedTitle,
        meta: copy.fallbackSavedMeta,
        distance: copy.fallbackSavedDistance,
        imageUrl: SAVED_SPOT_FALLBACK_IMAGE,
      };
    }

    return {
      id: item.id,
      title: item.title,
      meta: `${item.areaLabel} • ${item.categoryLabel}`,
      distance: item.distanceLabel,
      imageUrl: item.hero.imageUrl || SAVED_SPOT_FALLBACK_IMAGE,
    };
  }, [copy.fallbackSavedDistance, copy.fallbackSavedMeta, copy.fallbackSavedTitle, savedSpotItems]);

  const activityRows = React.useMemo<ActivityPreview[]>(() => {
    if (notifications.length > 0) {
      return notifications.slice(0, 2).map((notification, index) => {
        const title =
          notification.type === 'comment_on_post'
            ? copy.activityFallbackTwoTitle
            : copy.activityFallbackOneTitle;

        const subtitle =
          notification.message ||
          (notification.type === 'comment_on_post'
            ? copy.activityFallbackTwoSubtitle
            : copy.activityFallbackOneSubtitle);

        return {
          id: `activity-${notification.id}`,
          title,
          subtitle,
          recency: formatRecencyLabel(notification.createdAt, copy),
          imageUrl: ACTIVITY_IMAGES[index % ACTIVITY_IMAGES.length],
          icon: notification.type === 'comment_on_post' ? 'bell' : 'save',
          notificationId: notification.id,
          unread: !notification.isRead,
        };
      });
    }

    return [
      {
        id: 'activity-fallback-one',
        title: copy.activityFallbackOneTitle,
        subtitle: copy.activityFallbackOneSubtitle,
        recency: copy.daysAgo(2),
        imageUrl: ACTIVITY_IMAGES[0],
        icon: 'save',
      },
      {
        id: 'activity-fallback-two',
        title: copy.activityFallbackTwoTitle,
        subtitle: copy.activityFallbackTwoSubtitle,
        recency: copy.daysAgo(3),
        imageUrl: ACTIVITY_IMAGES[1],
        icon: 'bell',
      },
    ];
  }, [
    copy,
    notifications,
  ]);

  const displayName = username || user?.displayInfo || copy.defaultUsername;
  const displayEmail = email || user?.email || 'qa.user@spots.demo';
  const displayPlan = getPlanLevelLabel(subscription?.planLevel ?? 'free');
  const displayRole = role === 'organization'
    ? 'Organization'
    : role === 'admin'
      ? 'Admin'
      : 'User';

  const displayXp = xp > 0 ? xp : 125;
  const displaySaves = favoritePosts.length > 0 ? favoritePosts.length : 12;
  const displayUnread = unreadNotificationsCount > 0 ? unreadNotificationsCount : 3;

  const languageValue = profileLanguage === 'ar' ? copy.languageArabic : copy.languageEnglish;
  const privacyValue = privacyMode ? copy.privacyPrivate : copy.privacyPublic;

  const handleRetry = React.useCallback(() => {
    setAccountDataIssue(null);
    setLoadingProfile(true);
    setRefreshToken(current => current + 1);
  }, []);

  const openExplore = React.useCallback(() => {
    navigation.navigate('Explore');
  }, [navigation]);

  const handleToggleLanguage = React.useCallback(() => {
    setProfileLanguage(current => (current === 'ar' ? 'en' : 'ar'));
  }, []);

  const handleTogglePrivacy = React.useCallback(() => {
    setPrivacyMode(current => !current);
  }, []);

  const handleSaveSettings = React.useCallback(async () => {
    setSaving(true);

    try {
      await saveCurrentUserProfile({
        userId: user?.id,
        username: displayName,
        bio,
        language: profileLanguage,
        privacyMode,
      });

      await setLanguagePreference(profileLanguage);
      showAlert(t('profile.savedAlertTitle'), t('profile.savedAlertBody'));
    } catch (error: any) {
      if (error instanceof ProfileValidationError) {
        showAlert(t('profile.profileValidationTitle'), error.message);
      } else {
        showAlert(t('profile.saveErrorTitle'), error?.message ?? 'Failed to save settings.');
      }
    } finally {
      setSaving(false);
    }
  }, [bio, displayName, privacyMode, profileLanguage, setLanguagePreference, t, user?.id]);

  const handleSignOut = React.useCallback(async () => {
    setLogoutLoading(true);
    try {
      await logoutUser();
    } catch (error: any) {
      showAlert(t('profile.logoutErrorTitle'), error?.message ?? 'Failed to sign out.');
    } finally {
      setLogoutLoading(false);
    }
  }, [t]);

  const handleActivityPress = React.useCallback(
    async (activity: ActivityPreview) => {
      if (!activity.notificationId) {
        openExplore();
        return;
      }

      setReadingNotificationId(activity.notificationId);
      try {
        await markUserNotificationRead(user?.id, activity.notificationId);
        openExplore();
      } catch (error: any) {
        if (error instanceof NotificationValidationError) {
          showAlert(t('profile.notificationErrorTitle'), error.message);
        } else {
          showAlert(
            t('profile.notificationErrorTitle'),
            error?.message ?? 'Failed to update notification.'
          );
        }
      } finally {
        setReadingNotificationId(null);
      }
    },
    [openExplore, t, user?.id]
  );

  if (loadingProfile) {
    return <LoadingState label={copy.title} />;
  }

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
              onPress={openExplore}
              style={({ pressed }) => [styles.headerActionButton, pressed && styles.actionPressed]}
            >
              <BellGlyph />
            </Pressable>

            <Pressable
              accessibilityRole="button"
              onPress={openExplore}
              style={({ pressed }) => [styles.headerActionButton, pressed && styles.actionPressed]}
            >
              <Text style={styles.heartGlyph}>♡</Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              onPress={() => navigation.navigate('Profile')}
              style={({ pressed }) => [pressed && styles.actionPressed]}
            >
              <View style={styles.avatarFrameSmall}>
                <Image source={{ uri: MOBILE_AVATAR_FALLBACK_URI }} style={styles.avatarImage} />
                {!user ? <Text style={styles.avatarFallbackText}>{displayName.charAt(0)}</Text> : null}
              </View>
            </Pressable>
          </View>
        </View>

        {accountDataIssue ? (
          <View style={styles.slimBanner}>
            <Text
              style={[
                styles.slimBannerText,
                { textAlign: getTextAlign(), writingDirection: isRTL ? 'rtl' : 'ltr' },
              ]}
              numberOfLines={2}
            >
              {accountDataIssue}
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={handleRetry}
              style={({ pressed }) => [styles.slimBannerAction, pressed && styles.actionPressed]}
            >
              <Text style={styles.slimBannerActionLabel}>{copy.retry}</Text>
            </Pressable>
          </View>
        ) : null}

        <View style={styles.heroCard}>
          <View style={[styles.heroRow, { flexDirection: getRowDirection() }]}> 
            <View style={styles.heroAvatarWrap}>
              <Image source={{ uri: MOBILE_AVATAR_FALLBACK_URI }} style={styles.heroAvatar} />
              <Pressable
                accessibilityRole="button"
                style={({ pressed }) => [
                  styles.editAvatarButton,
                  pressed && styles.actionPressed,
                ]}
              >
                <Text style={styles.editAvatarGlyph}>✎</Text>
              </Pressable>
            </View>

            <View style={styles.heroCopy}>
              <Text
                style={[
                  styles.heroName,
                  { textAlign: getTextAlign(), writingDirection: isRTL ? 'rtl' : 'ltr' },
                ]}
                numberOfLines={1}
              >
                {displayName}
              </Text>
              <Text
                style={[
                  styles.heroEmail,
                  { textAlign: getTextAlign(), writingDirection: isRTL ? 'rtl' : 'ltr' },
                ]}
                numberOfLines={1}
              >
                {displayEmail}
              </Text>

              <View style={[styles.heroBadgeRow, { flexDirection: getRowDirection() }]}> 
                <View style={styles.heroBadge}>
                  <Text style={styles.heroBadgeIcon}>◌</Text>
                  <Text style={styles.heroBadgeLabel}>{`${copy.roleLabel}: ${displayRole}`}</Text>
                </View>
                <View style={styles.heroBadge}>
                  <Text style={styles.heroBadgeIcon}>⌂</Text>
                  <Text style={styles.heroBadgeLabel}>{`${copy.planLabel}: ${displayPlan}`}</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        <View style={[styles.statsRow, { flexDirection: getRowDirection() }]}> 
          <StatCard
            icon="★"
            value={String(displayXp)}
            label={copy.statsXp}
            hint={copy.statsXpHint}
            emphasize
          />
          <StatCard
            icon="⌔"
            value={String(displaySaves)}
            label={copy.statsSaves}
            hint={copy.statsSavesHint}
          />
          <StatCard
            icon="◌"
            value={String(displayUnread)}
            label={copy.statsUnread}
            hint={copy.statsUnreadHint}
          />
        </View>

        <View style={styles.sectionCard}>
          <SectionHeader title={copy.savedTitle} actionLabel={copy.viewAll} onActionPress={openExplore} />

          <Pressable
            accessibilityRole="button"
            onPress={openExplore}
            style={({ pressed }) => [styles.savedSpotRow, pressed && styles.actionPressed]}
          >
            <Image source={{ uri: primarySavedSpot.imageUrl }} style={styles.savedSpotThumb} />
            <View style={styles.savedSpotBody}>
              <Text
                style={[
                  styles.savedSpotTitle,
                  { textAlign: getTextAlign(), writingDirection: isRTL ? 'rtl' : 'ltr' },
                ]}
                numberOfLines={1}
              >
                {primarySavedSpot.title}
              </Text>
              <Text
                style={[
                  styles.savedSpotMeta,
                  { textAlign: getTextAlign(), writingDirection: isRTL ? 'rtl' : 'ltr' },
                ]}
                numberOfLines={1}
              >
                {primarySavedSpot.meta}
              </Text>
              <Text
                style={[
                  styles.savedSpotDistance,
                  { textAlign: getTextAlign(), writingDirection: isRTL ? 'rtl' : 'ltr' },
                ]}
                numberOfLines={1}
              >
                {`⌖ ${primarySavedSpot.distance}`}
              </Text>
            </View>
            <View style={styles.savedSpotBookmarkWrap}>
              <BookmarkGlyph active />
            </View>
          </Pressable>

          {savedSpotItems.length <= 1 ? (
            <View style={styles.emptyHintWrap}>
              <View style={styles.emptyHintIconWrap}>
                <Text style={styles.emptyHintIcon}>♡</Text>
              </View>
              <Text
                style={[
                  styles.emptyHintTitle,
                  { textAlign: getTextAlign(), writingDirection: isRTL ? 'rtl' : 'ltr' },
                ]}
              >
                {copy.noMoreSavedTitle}
              </Text>
              <Text
                style={[
                  styles.emptyHintBody,
                  { textAlign: getTextAlign(), writingDirection: isRTL ? 'rtl' : 'ltr' },
                ]}
              >
                {copy.noMoreSavedBody}
              </Text>
            </View>
          ) : null}

          <View style={styles.sectionDivider} />

          <SectionHeader title={copy.activityTitle} actionLabel={copy.viewAll} onActionPress={openExplore} />

          <View style={styles.activityList}>
            {activityRows.map((activity, index) => (
              <Pressable
                key={activity.id}
                accessibilityRole="button"
                onPress={() => {
                  void handleActivityPress(activity);
                }}
                style={({ pressed }) => [
                  styles.activityRow,
                  index > 0 && styles.activityRowBorder,
                  pressed && styles.actionPressed,
                ]}
              >
                <View
                  style={[
                    styles.activityIconWrap,
                    activity.icon === 'bell' && styles.activityIconWrapBell,
                    activity.unread && styles.activityIconWrapUnread,
                  ]}
                >
                  <Text style={styles.activityIcon}>{activity.icon === 'bell' ? '◌' : '⌔'}</Text>
                </View>

                <Image source={{ uri: activity.imageUrl }} style={styles.activityThumb} />

                <View style={styles.activityCopy}>
                  <Text
                    style={[
                      styles.activityTitle,
                      { textAlign: getTextAlign(), writingDirection: isRTL ? 'rtl' : 'ltr' },
                    ]}
                    numberOfLines={1}
                  >
                    {activity.title}
                  </Text>
                  <Text
                    style={[
                      styles.activitySubtitle,
                      { textAlign: getTextAlign(), writingDirection: isRTL ? 'rtl' : 'ltr' },
                    ]}
                    numberOfLines={1}
                  >
                    {activity.subtitle}
                  </Text>
                  <Text
                    style={[
                      styles.activityRecency,
                      { textAlign: getTextAlign(), writingDirection: isRTL ? 'rtl' : 'ltr' },
                    ]}
                    numberOfLines={1}
                  >
                    {readingNotificationId === activity.notificationId ? 'Updating...' : activity.recency}
                  </Text>
                </View>

                <Text style={styles.activityChevron}>{isRTL ? '‹' : '›'}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.sectionCard}>
          <SectionHeader title={copy.settingsTitle} />

          <View style={styles.settingsList}>
            <SettingsRow icon="◯" label={copy.usernameLabel} value={displayName} />
            <SettingsRow icon="@" label={copy.emailLabel} value={displayEmail} />
            <SettingsRow icon="⌂" label={copy.planSettingLabel} value={displayPlan} />
            <SettingsRow
              icon="A"
              label={copy.languageLabel}
              value={languageValue}
              onPress={handleToggleLanguage}
            />
            <SettingsRow
              icon="◎"
              label={copy.privacyLabel}
              value={privacyValue}
              onPress={handleTogglePrivacy}
            />
          </View>

          <Pressable
            accessibilityRole="button"
            disabled={saving || !user}
            onPress={() => {
              void handleSaveSettings();
            }}
            style={({ pressed }) => [
              styles.primaryButton,
              (saving || !user) && styles.buttonDisabled,
              pressed && !saving && user && styles.primaryButtonPressed,
            ]}
          >
            {saving ? (
              <ActivityIndicator color={colors.surface} />
            ) : (
              <Text style={styles.primaryButtonLabel}>{`◉  ${copy.saveSettings}`}</Text>
            )}
          </Pressable>

          <Pressable
            accessibilityRole="button"
            disabled={logoutLoading}
            onPress={() => {
              void handleSignOut();
            }}
            style={({ pressed }) => [
              styles.secondaryButton,
              logoutLoading && styles.buttonDisabled,
              pressed && !logoutLoading && styles.secondaryButtonPressed,
            ]}
          >
            {logoutLoading ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <Text style={styles.secondaryButtonLabel}>{`⟶  ${copy.signOut}`}</Text>
            )}
          </Pressable>

          {!user ? (
            <Text
              style={[
                styles.signInHint,
                { textAlign: getTextAlign(), writingDirection: isRTL ? 'rtl' : 'ltr' },
              ]}
            >
              {copy.signInRequired}
            </Text>
          ) : null}
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
  actionPressed: {
    opacity: 0.82,
  },
  heartGlyph: {
    ...typography.title,
    color: colors.textMuted,
    fontSize: 24,
    lineHeight: 28,
  },
  avatarFrameSmall: {
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
  avatarFallbackText: {
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
  slimBannerText: {
    ...typography.caption,
    color: '#925F57',
    flex: 1,
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
  heroCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: '#E7E2DC',
    backgroundColor: '#F9F9F9',
    padding: spacing.md + 2,
    shadowColor: '#291B14',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
  },
  heroRow: {
    alignItems: 'center',
    gap: spacing.md,
  },
  heroAvatarWrap: {
    width: 106,
    height: 106,
    borderRadius: 53,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroAvatar: {
    width: '100%',
    height: '100%',
    borderRadius: 53,
    borderWidth: 1,
    borderColor: '#D8D8D8',
  },
  editAvatarButton: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#F9F9F9',
  },
  editAvatarGlyph: {
    ...typography.button,
    color: '#FFFFFF',
    fontSize: 14,
    lineHeight: 16,
  },
  heroCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  heroName: {
    ...typography.title,
    fontSize: 21,
    lineHeight: 28,
    color: colors.text,
  },
  heroEmail: {
    ...typography.bodyMuted,
    fontSize: 14,
    lineHeight: 19,
  },
  heroBadgeRow: {
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  heroBadge: {
    minHeight: 34,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: '#E2DFDA',
    backgroundColor: '#FCFBFA',
    paddingHorizontal: spacing.sm + 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  heroBadgeIcon: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 14,
  },
  heroBadgeLabel: {
    ...typography.caption,
    color: colors.text,
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '600',
  },
  statsRow: {
    gap: spacing.sm,
  },
  statCard: {
    flex: 1,
    minHeight: 112,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#E7E2DC',
    backgroundColor: '#F9F9F9',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    gap: 1,
  },
  statIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEF3FB',
    marginBottom: spacing.xs,
  },
  statIconWrapEmphasis: {
    backgroundColor: '#FCEBE7',
  },
  statIcon: {
    ...typography.title,
    color: '#4B74A3',
    fontSize: 18,
    lineHeight: 20,
  },
  statIconEmphasis: {
    color: colors.primary,
  },
  statValue: {
    ...typography.title,
    fontSize: 18,
    lineHeight: 24,
    color: colors.text,
  },
  statLabel: {
    ...typography.body,
    fontSize: 14,
    lineHeight: 18,
    color: '#434343',
    fontWeight: '600',
  },
  statHint: {
    ...typography.caption,
    fontSize: 12,
    lineHeight: 16,
    color: colors.textSubtle,
  },
  sectionCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: '#E7E2DC',
    backgroundColor: '#F9F9F9',
    padding: spacing.md + 2,
    gap: spacing.sm + 1,
    shadowColor: '#291B14',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
  },
  sectionHeader: {
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  sectionTitle: {
    ...typography.sectionTitle,
    fontSize: 19,
    lineHeight: 25,
    color: colors.text,
    flex: 1,
  },
  sectionLink: {
    ...typography.button,
    fontSize: 16,
    lineHeight: 20,
    color: colors.primary,
  },
  savedSpotRow: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#E1DFDC',
    backgroundColor: '#FCFCFC',
    padding: spacing.xs + 3,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 1,
  },
  savedSpotThumb: {
    width: 106,
    height: 74,
    borderRadius: radius.sm,
    backgroundColor: '#E9E9E9',
  },
  savedSpotBody: {
    flex: 1,
    gap: 2,
  },
  savedSpotTitle: {
    ...typography.sectionTitle,
    fontSize: 17,
    lineHeight: 22,
    color: colors.text,
  },
  savedSpotMeta: {
    ...typography.bodyMuted,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textMuted,
  },
  savedSpotDistance: {
    ...typography.caption,
    fontSize: 13,
    lineHeight: 17,
    color: '#5C5C5C',
  },
  savedSpotBookmarkWrap: {
    width: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookmarkIcon: {
    width: 14,
    height: 18,
    alignItems: 'center',
    justifyContent: 'flex-start',
    position: 'relative',
  },
  bookmarkIconActive: {
    opacity: 1,
  },
  bookmarkBody: {
    width: 12,
    height: 16,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
    borderWidth: 1.6,
    borderColor: colors.primary,
    borderBottomWidth: 0,
    backgroundColor: 'transparent',
  },
  bookmarkFoldLeft: {
    position: 'absolute',
    bottom: 1,
    left: 1,
    width: 6,
    height: 6,
    borderLeftWidth: 1.6,
    borderBottomWidth: 1.6,
    borderColor: colors.primary,
    transform: [{ skewY: '-34deg' }],
  },
  bookmarkFoldRight: {
    position: 'absolute',
    bottom: 1,
    right: 1,
    width: 6,
    height: 6,
    borderRightWidth: 1.6,
    borderBottomWidth: 1.6,
    borderColor: colors.primary,
    transform: [{ skewY: '34deg' }],
  },
  emptyHintWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm + 2,
    gap: 2,
  },
  emptyHintIconWrap: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 1,
    borderColor: '#DEDEDE',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  emptyHintIcon: {
    ...typography.title,
    color: colors.primary,
    fontSize: 24,
    lineHeight: 28,
  },
  emptyHintTitle: {
    ...typography.body,
    color: '#555555',
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '600',
  },
  emptyHintBody: {
    ...typography.caption,
    color: colors.textSubtle,
    fontSize: 12,
    lineHeight: 16,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: '#E7E3DE',
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
  activityList: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#E1DFDC',
    backgroundColor: '#FCFCFC',
    overflow: 'hidden',
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.sm + 1,
  },
  activityRowBorder: {
    borderTopWidth: 1,
    borderTopColor: '#ECE8E2',
  },
  activityIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EDF4FC',
  },
  activityIconWrapBell: {
    backgroundColor: '#FDEEEE',
  },
  activityIconWrapUnread: {
    borderWidth: 1,
    borderColor: '#F8C5BC',
  },
  activityIcon: {
    ...typography.title,
    color: '#4C76A6',
    fontSize: 16,
    lineHeight: 20,
  },
  activityThumb: {
    width: 62,
    height: 48,
    borderRadius: radius.sm,
    backgroundColor: '#ECECEC',
  },
  activityCopy: {
    flex: 1,
    gap: 1,
  },
  activityTitle: {
    ...typography.body,
    color: colors.text,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '600',
  },
  activitySubtitle: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 16,
  },
  activityRecency: {
    ...typography.caption,
    color: '#707070',
    fontSize: 12,
    lineHeight: 16,
  },
  activityChevron: {
    ...typography.title,
    color: colors.textSubtle,
    fontSize: 19,
    lineHeight: 22,
  },
  settingsList: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#E1DFDC',
    backgroundColor: '#FCFCFC',
    overflow: 'hidden',
  },
  settingRow: {
    minHeight: 52,
    paddingHorizontal: spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: '#ECE8E2',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  settingLeft: {
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  settingIcon: {
    ...typography.body,
    color: '#636363',
    width: 16,
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 18,
  },
  settingLabel: {
    ...typography.body,
    color: colors.text,
    fontSize: 16,
    lineHeight: 21,
    flex: 1,
  },
  settingRight: {
    alignItems: 'center',
    gap: spacing.xs,
    maxWidth: '56%',
  },
  settingValue: {
    ...typography.bodyMuted,
    color: '#5A5A5A',
    fontSize: 15,
    lineHeight: 20,
    maxWidth: '92%',
  },
  settingChevron: {
    ...typography.title,
    color: colors.textSubtle,
    fontSize: 19,
    lineHeight: 22,
  },
  primaryButton: {
    marginTop: spacing.sm + 1,
    minHeight: 52,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primaryPressed,
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  primaryButtonPressed: {
    backgroundColor: colors.primaryPressed,
  },
  primaryButtonLabel: {
    ...typography.button,
    color: '#FFFFFF',
    fontSize: 20,
    lineHeight: 21,
    fontWeight: '700',
  },
  secondaryButton: {
    marginTop: spacing.sm,
    minHeight: 52,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#EBA89E',
    backgroundColor: '#FFFDFD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonPressed: {
    backgroundColor: '#FFF5F3',
  },
  secondaryButtonLabel: {
    ...typography.button,
    color: colors.primary,
    fontSize: 19,
    lineHeight: 20,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  signInHint: {
    ...typography.caption,
    marginTop: spacing.sm,
    color: '#8B6A53',
    fontSize: 12,
    lineHeight: 16,
  },
});
