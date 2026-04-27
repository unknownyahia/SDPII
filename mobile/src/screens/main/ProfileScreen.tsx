import React from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';

import { LoadingState } from '../../components/ui/LoadingState';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { AdminConsolePanel } from '../../components/profile/AdminConsolePanel';
import { LeaderboardPanel } from '../../components/profile/LeaderboardPanel';
import { useAuth } from '../../context/AuthContext';
import { useLocalization } from '../../context/LocalizationContext';
import { subscribeToPosts } from '../../repositories/postsRepository';
import { observeFavoritePostIds } from '../../services/favoriteService';
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
import { observeUserSubscription } from '../../services/subscriptionService';
import {
  buildDiscoverySpotItems,
  getTimestampMs,
} from '../../services/discoveryService';
import { colors, typography } from '../../theme/designSystem';
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
  statsSaves: string;
  statsUnread: string;
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
  privacyDescription: string;
  settingsHint: string;
  savedSectionHint: string;
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
      statsXp: 'XP',
      statsSaves: 'المحفوظات',
      statsUnread: 'غير المقروء',
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
      languageEnglish: 'الإنجليزية',
      languageArabic: 'العربية',
      privacyPublic: 'عام',
      privacyPrivate: 'خاص',
      saveSettings: 'حفظ الإعدادات',
      signOut: 'تسجيل الخروج',
      retry: 'إعادة المحاولة',
      signInRequired: 'سجّل الدخول لإدارة إعدادات الحساب.',
      defaultUsername: 'مستخدم Spots',
      fallbackSavedTitle: 'مأكولات بوليفارد لوسيل',
      fallbackSavedMeta: 'لوسيل • مأكولات ومشروبات',
      fallbackSavedDistance: '2.1 كم',
      activityFallbackOneTitle: 'تم حفظ قهوة ممشى الصحراء',
      activityFallbackOneSubtitle: 'قهوة • منطقة أسباير',
      activityFallbackTwoTitle: 'فعالية جديدة بالقرب منك',
      activityFallbackTwoSubtitle: 'جولة عائلية بعد العشاء في كتارا',
      privacyDescription: 'اجعل حسابك عامًا أو خاصًا حسب تفضيلك.',
      settingsHint: 'حدّث تفضيلاتك واحفظها هنا.',
      savedSectionHint: 'أماكنك المفضلة والموصى بها لك.',
      daysAgo: value => `قبل ${value} يوم`,
    };
  }

  return {
    title: 'Profile',
    viewAll: 'View all',
    roleLabel: 'Role',
    planLabel: 'Plan',
    statsXp: 'XP',
    statsSaves: 'Saves',
    statsUnread: 'Unread',
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
    retry: 'Retry',
    signInRequired: 'Sign in to manage your account settings.',
    defaultUsername: 'Spots QA User',
    fallbackSavedTitle: 'Lusail Boulevard Bites',
    fallbackSavedMeta: 'Lusail • Food & Drinks',
    fallbackSavedDistance: '2.1 km away',
    activityFallbackOneTitle: 'Saved Sahara Walk Coffee',
    activityFallbackOneSubtitle: 'Coffee • Aspire Zone',
    activityFallbackTwoTitle: 'New event nearby',
    activityFallbackTwoSubtitle: 'Katara Family Lawn After Dinner Loop',
    privacyDescription: 'Choose whether your profile is public or private.',
    settingsHint: 'Update your preferences and keep your account current.',
    savedSectionHint: 'Your favorite places and fresh updates.',
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
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  const { getTextAlign, isRTL } = useLocalization();

  return (
    <View style={styles.statCard}>
      <Text style={styles.statIcon}>{icon}</Text>
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
    </View>
  );
}

function ActivityIconBubble({ icon }: { icon: 'save' | 'bell' }) {
  if (icon === 'save') {
    return (
      <View style={[styles.activityIconBubble, styles.activityIconBubbleSave]}>
        <Text style={styles.activityIconGlyph}>⌑</Text>
      </View>
    );
  }

  return (
    <View style={[styles.activityIconBubble, styles.activityIconBubbleBell]}>
      <BellGlyph />
    </View>
  );
}

export function ProfileScreen() {
  const { user } = useAuth();
  const {
    language,
    isRTL,
    getTextAlign,
    getRowDirection,
    getRoleLabel,
    getPlanLevelLabel,
    setLanguagePreference,
  } = useLocalization();
  const navigation = useNavigation<BottomTabNavigationProp<MainTabParamList>>();
  const copy = React.useMemo(() => getCopy(language), [language]);

  const [loading, setLoading] = React.useState(true);
  const [setupIssue, setSetupIssue] = React.useState<string | null>(null);

  const [username, setUsername] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [bio, setBio] = React.useState('');
  const [privacyMode, setPrivacyMode] = React.useState<'public' | 'private'>('public');
  const [languageValue, setLanguageValue] = React.useState<AppLanguage>(language);
  const [role, setRole] = React.useState<'user' | 'admin' | 'organization'>('user');
  const [profileXp, setProfileXp] = React.useState(0);
  const [subscription, setSubscription] = React.useState<UserSubscription | null>(null);
  const [favoritePostIds, setFavoritePostIds] = React.useState<string[]>([]);
  const [posts, setPosts] = React.useState<SpotPost[]>([]);
  const [notifications, setNotifications] = React.useState<AppNotification[]>([]);
  const [savingSettings, setSavingSettings] = React.useState(false);
  const [signingOut, setSigningOut] = React.useState(false);

  const handleSetupIssue = React.useCallback((error: unknown, fallbackMessage: string) => {
    const nextMessage = isDataAccessBlockedError(error)
      ? getBlockedDataMessage(language === 'ar' ? 'بيانات الملف الشخصي' : 'profile data')
      : getErrorMessage(error, fallbackMessage);

    setSetupIssue(current => current ?? nextMessage);
  }, [language]);

  React.useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const unsubscribeProfile = observeCurrentUserProfile(
      { user },
      profile => {
        setUsername(profile.username || copy.defaultUsername);
        setEmail(profile.email || user.email || 'qa.user@spots.demo');
        setBio(profile.bio || '');
        setPrivacyMode(profile.privacyMode ? 'private' : 'public');
        setRole(profile.role);
        setProfileXp(profile.xp ?? 0);
        setLoading(false);
      },
      error => {
        handleSetupIssue(error, 'Failed to load your profile.');
        setLoading(false);
      }
    );

    const unsubscribeSubscription = observeUserSubscription(
      user.id,
      nextSubscription => {
        setSubscription(nextSubscription.userId ? nextSubscription : null);
      },
      error => {
        handleSetupIssue(error, 'Failed to load your subscription.');
      }
    );

    const unsubscribeFavorites = observeFavoritePostIds(
      user.id,
      ids => {
        setFavoritePostIds(ids);
      },
      error => {
        handleSetupIssue(error, 'Failed to load your saved spots.');
      }
    );

    const unsubscribePosts = subscribeToPosts(
      nextPosts => {
        setPosts(nextPosts);
      },
      error => {
        handleSetupIssue(error, 'Failed to load recent spots.');
      }
    );

    const unsubscribeNotifications = observeNotifications(
      user.id,
      nextNotifications => {
        setNotifications(nextNotifications);
      },
      error => {
        handleSetupIssue(error, 'Failed to load your notifications.');
      }
    );

    return () => {
      unsubscribeProfile();
      unsubscribeSubscription();
      unsubscribeFavorites();
      unsubscribePosts();
      unsubscribeNotifications();
    };
  }, [copy.defaultUsername, handleSetupIssue, user]);

  React.useEffect(() => {
    setLanguageValue(language);
  }, [language]);

  const savedSpots = React.useMemo<SavedSpotPreview[]>(() => {
    const favoriteSet = new Set(favoritePostIds);

    const discoverySpots = buildDiscoverySpotItems(posts, {
      favoritePostIds,
      searchQuery: '',
      language,
    });

    return uniqueSpotItemsByPlace(
      discoverySpots.filter(spot => favoriteSet.has(spot.postId))
    )
      .slice(0, 3)
      .map(spot => ({
        id: spot.postId,
        title: spot.title,
        meta: `${spot.locationLabel} • ${spot.categoryLabel}`,
        distance: spot.distanceLabel,
        imageUrl: spot.hero.imageUrl || SAVED_SPOT_FALLBACK_IMAGE,
      }));
  }, [favoritePostIds, language, posts]);

  const unreadCount = React.useMemo(
    () => notifications.filter(item => !item.isRead).length,
    [notifications]
  );

  const activityItems = React.useMemo<ActivityPreview[]>(() => {
    if (notifications.length > 0) {
      return notifications.slice(0, 2).map((item, index) => ({
        id: item.id,
        title: item.message || copy.activityFallbackOneTitle,
        subtitle:
          item.actorLabel ||
          (index % 2 === 0 ? copy.activityFallbackOneSubtitle : copy.activityFallbackTwoSubtitle),
        recency: formatRecencyLabel(item.createdAt, copy),
        imageUrl: ACTIVITY_IMAGES[index % ACTIVITY_IMAGES.length],
        icon: item.type === 'like_on_post' ? 'bell' : 'save',
        notificationId: item.id,
        unread: !item.isRead,
      }));
    }

    return [];
  }, [copy, notifications]);

  const xpValue = React.useMemo(() => {
    return String(profileXp);
  }, [profileXp]);

  const roleLabel = getRoleLabel(role);
  const planLabel = getPlanLevelLabel(subscription?.planLevel ?? 'free');
  const displayName = username || copy.defaultUsername;
  const displayEmail = email || user?.email || 'qa.user@spots.demo';

  const handleViewAllSaved = React.useCallback(() => {
    navigation.navigate('Explore');
  }, [navigation]);

  const handleViewAllActivity = React.useCallback(() => {
    navigation.navigate('Home');
  }, [navigation]);

  const handleMarkActivityRead = React.useCallback(
    async (activity: ActivityPreview) => {
      if (!user?.id || !activity.notificationId || !activity.unread) {
        return;
      }

      try {
        await markUserNotificationRead(user.id, activity.notificationId);
      } catch (error) {
        if (error instanceof NotificationValidationError) {
          showAlert(
            language === 'ar' ? 'تعذر تحديث الإشعار' : 'Could not update notification',
            error.message
          );
          return;
        }

        showAlert(
          language === 'ar' ? 'تعذر تحديث الإشعار' : 'Could not update notification',
          isDataAccessBlockedError(error)
            ? getBlockedDataMessage(language === 'ar' ? 'الإشعارات' : 'notifications')
            : getErrorMessage(error, 'Unable to update notification right now.')
        );
      }
    },
    [language, user?.id]
  );

  const handleToggleLanguage = React.useCallback(() => {
    const nextLanguage = languageValue === 'en' ? 'ar' : 'en';
    setLanguageValue(nextLanguage);
    void setLanguagePreference(nextLanguage);
  }, [languageValue, setLanguagePreference]);

  const handleSaveSettings = React.useCallback(async () => {
    if (!user) {
      showAlert(
        language === 'ar' ? 'تسجيل الدخول مطلوب' : 'Sign-in required',
        copy.signInRequired
      );
      return;
    }

    setSavingSettings(true);

    try {
      await saveCurrentUserProfile({
        userId: user.id,
        username: username.trim() || copy.defaultUsername,
        bio: bio.trim(),
        language: languageValue,
        privacyMode: privacyMode === 'private',
      });
      await setLanguagePreference(languageValue);

      showAlert(
        languageValue === 'ar' ? 'تم الحفظ' : 'Saved',
        languageValue === 'ar'
          ? 'تم حفظ إعدادات الحساب.'
          : 'Your account settings were saved.'
      );
    } catch (error) {
      if (error instanceof ProfileValidationError) {
        showAlert(
          language === 'ar' ? 'تعذر حفظ الإعدادات' : 'Could not save settings',
          error.message
        );
      } else {
        showAlert(
          language === 'ar' ? 'تعذر حفظ الإعدادات' : 'Could not save settings',
          isDataAccessBlockedError(error)
            ? getBlockedDataMessage(language === 'ar' ? 'إعدادات الحساب' : 'account settings')
            : getErrorMessage(error, 'Unable to save settings right now.')
        );
      }
    } finally {
      setSavingSettings(false);
    }
  }, [bio, copy.defaultUsername, copy.signInRequired, language, languageValue, privacyMode, setLanguagePreference, user, username]);

  const handleSignOut = React.useCallback(async () => {
    setSigningOut(true);

    try {
      await logoutUser();
    } catch (error) {
      showAlert(
        language === 'ar' ? 'تعذر تسجيل الخروج' : 'Could not sign out',
        getErrorMessage(error, language === 'ar' ? 'حاول مجددًا.' : 'Please try again.')
      );
    } finally {
      setSigningOut(false);
    }
  }, [language]);

  if (loading) {
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
        <View style={[styles.topBar, { flexDirection: getRowDirection() }]}>
          <Text style={styles.brandText}>Spots</Text>

          <View style={[styles.topActions, { flexDirection: getRowDirection() }]}>
            <Pressable
              accessibilityRole="button"
              onPress={() => navigation.navigate('Home')}
              style={({ pressed }) => [styles.topIconButton, pressed && styles.buttonPressed]}
            >
              <BellGlyph />
            </Pressable>

            <Pressable
              accessibilityRole="button"
              onPress={() => navigation.navigate('Explore')}
              style={({ pressed }) => [styles.topIconButton, pressed && styles.buttonPressed]}
            >
              <Text style={styles.topIconGlyph}>♡</Text>
            </Pressable>

            <View style={styles.avatarFrame}>
              <Image source={{ uri: MOBILE_AVATAR_FALLBACK_URI }} style={styles.avatarImage} />
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
          </View>
        ) : null}

        <View style={styles.heroCard}>
          <View style={[styles.heroTopRow, { flexDirection: getRowDirection() }]}>
            <View style={styles.heroAvatarWrap}>
              <Image source={{ uri: MOBILE_AVATAR_FALLBACK_URI }} style={styles.heroAvatarImage} />
            </View>

            <View style={styles.heroIdentity}>
              <Text
                style={[
                  styles.heroName,
                  { textAlign: getTextAlign(), writingDirection: isRTL ? 'rtl' : 'ltr' },
                ]}
              >
                {displayName}
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
                  <Text style={styles.heroBadgeText}>
                    {copy.roleLabel}: {roleLabel}
                  </Text>
                </View>
                <View style={[styles.heroBadge, styles.heroBadgeSecondary]}>
                  <Text style={[styles.heroBadgeText, styles.heroBadgeTextSecondary]}>
                    {copy.planLabel}: {planLabel}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          <View style={[styles.statsRow, { flexDirection: getRowDirection() }]}>
            <StatCard icon="✦" label={copy.statsXp} value={xpValue} />
            <StatCard icon="⌑" label={copy.statsSaves} value={String(favoritePostIds.length)} />
            <StatCard icon="•" label={copy.statsUnread} value={String(unreadCount)} />
          </View>
        </View>

        <LeaderboardPanel />

        <AdminConsolePanel role={role} />

        <View style={styles.sectionCard}>
          <SectionHeader
            title={copy.savedTitle}
            actionLabel={copy.viewAll}
            onActionPress={handleViewAllSaved}
          />

          <Text
            style={[
              styles.sectionHint,
              { textAlign: getTextAlign(), writingDirection: isRTL ? 'rtl' : 'ltr' },
            ]}
          >
            {copy.savedSectionHint}
          </Text>

          {savedSpots.length === 0 ? (
            <View style={styles.emptySavedNotice}>
              <Text
                style={[
                  styles.emptySavedTitle,
                  { textAlign: getTextAlign(), writingDirection: isRTL ? 'rtl' : 'ltr' },
                ]}
              >
                {copy.noMoreSavedTitle}
              </Text>
              <Text
                style={[
                  styles.emptySavedBody,
                  { textAlign: getTextAlign(), writingDirection: isRTL ? 'rtl' : 'ltr' },
                ]}
              >
                {copy.noMoreSavedBody}
              </Text>
            </View>
          ) : (
            savedSpots.map(spot => (
              <Pressable
                key={spot.id}
                onPress={() => navigation.navigate('Explore', { query: spot.title })}
                style={[styles.savedCard, { flexDirection: getRowDirection() }]}
              >
                <Image source={{ uri: spot.imageUrl }} style={styles.savedCardImage} />

                <View style={styles.savedCardBody}>
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.savedCardTitle,
                      { textAlign: getTextAlign(), writingDirection: isRTL ? 'rtl' : 'ltr' },
                    ]}
                  >
                    {spot.title}
                  </Text>

                  <Text
                    numberOfLines={1}
                    style={[
                      styles.savedCardMeta,
                      { textAlign: getTextAlign(), writingDirection: isRTL ? 'rtl' : 'ltr' },
                    ]}
                  >
                    {spot.meta}
                  </Text>

                  <Text
                    style={[
                      styles.savedCardDistance,
                      { textAlign: getTextAlign(), writingDirection: isRTL ? 'rtl' : 'ltr' },
                    ]}
                  >
                    {spot.distance}
                  </Text>
                </View>

                <View style={styles.savedCardAction}>
                  <BookmarkGlyph active />
                </View>
              </Pressable>
            ))
          )}
        </View>

        <View style={styles.sectionCard}>
          <SectionHeader
            title={copy.activityTitle}
            actionLabel={copy.viewAll}
            onActionPress={handleViewAllActivity}
          />

          <View style={styles.activityList}>
            {activityItems.length === 0 ? (
              <View style={styles.emptySavedNotice}>
                <Text
                  style={[
                    styles.emptySavedTitle,
                    { textAlign: getTextAlign(), writingDirection: isRTL ? 'rtl' : 'ltr' },
                  ]}
                >
                  {language === 'ar' ? 'لا توجد إشعارات بعد' : 'No notifications yet'}
                </Text>
                <Text
                  style={[
                    styles.emptySavedBody,
                    { textAlign: getTextAlign(), writingDirection: isRTL ? 'rtl' : 'ltr' },
                  ]}
                >
                  {language === 'ar'
                    ? 'ستظهر التعليقات والإعجابات هنا.'
                    : 'Comments and likes on your posts will appear here.'}
                </Text>
              </View>
            ) : activityItems.map(item => (
              <Pressable
                key={item.id}
                onPress={() => void handleMarkActivityRead(item)}
                style={[styles.activityRow, { flexDirection: getRowDirection() }]}
              >
                <ActivityIconBubble icon={item.icon} />

                <Image source={{ uri: item.imageUrl }} style={styles.activityImage} />

                <View style={styles.activityBody}>
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.activityTitle,
                      { textAlign: getTextAlign(), writingDirection: isRTL ? 'rtl' : 'ltr' },
                    ]}
                  >
                    {item.title}
                  </Text>

                  <Text
                    numberOfLines={1}
                    style={[
                      styles.activitySubtitle,
                      { textAlign: getTextAlign(), writingDirection: isRTL ? 'rtl' : 'ltr' },
                    ]}
                  >
                    {item.subtitle}
                  </Text>

                  <Text
                    style={[
                      styles.activityRecency,
                      { textAlign: getTextAlign(), writingDirection: isRTL ? 'rtl' : 'ltr' },
                    ]}
                  >
                    {item.recency}
                  </Text>
                </View>

                <View style={styles.activityTail}>
                  {item.unread ? <View style={styles.unreadDot} /> : null}
                  <Text style={styles.activityChevron}>{isRTL ? '‹' : '›'}</Text>
                </View>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text
            style={[
              styles.settingsTitle,
              { textAlign: getTextAlign(), writingDirection: isRTL ? 'rtl' : 'ltr' },
            ]}
          >
            {copy.settingsTitle}
          </Text>

          <Text
            style={[
              styles.settingsHint,
              { textAlign: getTextAlign(), writingDirection: isRTL ? 'rtl' : 'ltr' },
            ]}
          >
            {copy.settingsHint}
          </Text>

          <View style={styles.settingsGroup}>
            <View style={styles.settingRow}>
              <Text
                style={[
                  styles.settingLabel,
                  { textAlign: getTextAlign(), writingDirection: isRTL ? 'rtl' : 'ltr' },
                ]}
              >
                {copy.usernameLabel}
              </Text>
              <TextInput
                value={username}
                onChangeText={setUsername}
                style={[
                  styles.settingInput,
                  { textAlign: getTextAlign(), writingDirection: isRTL ? 'rtl' : 'ltr' },
                ]}
                placeholder={copy.defaultUsername}
                placeholderTextColor={colors.textSubtle}
              />
            </View>

            <View style={styles.settingRow}>
              <Text
                style={[
                  styles.settingLabel,
                  { textAlign: getTextAlign(), writingDirection: isRTL ? 'rtl' : 'ltr' },
                ]}
              >
                {copy.emailLabel}
              </Text>
              <Text
                style={[
                  styles.settingStaticValue,
                  { textAlign: getTextAlign(), writingDirection: isRTL ? 'rtl' : 'ltr' },
                ]}
              >
                {displayEmail}
              </Text>
            </View>

            <View style={styles.settingRow}>
              <Text
                style={[
                  styles.settingLabel,
                  { textAlign: getTextAlign(), writingDirection: isRTL ? 'rtl' : 'ltr' },
                ]}
              >
                {copy.planSettingLabel}
              </Text>
              <Text
                style={[
                  styles.settingStaticValue,
                  { textAlign: getTextAlign(), writingDirection: isRTL ? 'rtl' : 'ltr' },
                ]}
              >
                {planLabel}
              </Text>
            </View>

            <View style={styles.settingRow}>
              <Text
                style={[
                  styles.settingLabel,
                  { textAlign: getTextAlign(), writingDirection: isRTL ? 'rtl' : 'ltr' },
                ]}
              >
                {copy.languageLabel}
              </Text>
              <Pressable
                onPress={handleToggleLanguage}
                style={[
                  styles.choicePill,
                  { alignSelf: isRTL ? 'flex-end' : 'flex-start' },
                ]}
              >
                <Text
                  style={[
                    styles.choicePillText,
                    { writingDirection: isRTL ? 'rtl' : 'ltr' },
                  ]}
                >
                  {languageValue === 'ar' ? copy.languageArabic : copy.languageEnglish}
                </Text>
              </Pressable>
            </View>

            <View style={styles.settingRow}>
              <Text
                style={[
                  styles.settingLabel,
                  { textAlign: getTextAlign(), writingDirection: isRTL ? 'rtl' : 'ltr' },
                ]}
              >
                {copy.privacyLabel}
              </Text>
              <Pressable
                onPress={() => setPrivacyMode(current => (current === 'public' ? 'private' : 'public'))}
                style={[
                  styles.choicePill,
                  { alignSelf: isRTL ? 'flex-end' : 'flex-start' },
                ]}
              >
                <Text
                  style={[
                    styles.choicePillText,
                    { writingDirection: isRTL ? 'rtl' : 'ltr' },
                  ]}
                >
                  {privacyMode === 'private' ? copy.privacyPrivate : copy.privacyPublic}
                </Text>
              </Pressable>
            </View>
          </View>

          <Text
            style={[
              styles.privacyNote,
              { textAlign: getTextAlign(), writingDirection: isRTL ? 'rtl' : 'ltr' },
            ]}
          >
            {copy.privacyDescription}
          </Text>

          <Pressable
            onPress={() => void handleSaveSettings()}
            disabled={savingSettings || !user}
            style={({ pressed }) => [
              styles.primaryButton,
              (savingSettings || !user) && styles.primaryButtonDisabled,
              pressed && !savingSettings && user && styles.buttonPressed,
            ]}
          >
            {savingSettings ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.primaryButtonLabel}>{copy.saveSettings}</Text>
            )}
          </Pressable>

          <Pressable
            onPress={() => void handleSignOut()}
            disabled={signingOut}
            style={({ pressed }) => [
              styles.secondaryButton,
              signingOut && styles.secondaryButtonDisabled,
              pressed && !signingOut && styles.buttonPressed,
            ]}
          >
            {signingOut ? (
              <ActivityIndicator color={colors.text} />
            ) : (
              <Text style={styles.secondaryButtonLabel}>{copy.signOut}</Text>
            )}
          </Pressable>
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FAF7F2',
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
    color: '#F45A4E',
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
  },
  topIconGlyph: {
    fontSize: 22,
    lineHeight: 24,
    color: '#433B36',
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
    backgroundColor: '#F45A4E',
  },

  slimBanner: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F2D7D1',
    backgroundColor: '#FFF5F2',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  slimBannerText: {
    ...typography.caption,
    color: '#925F57',
    fontSize: 13,
    lineHeight: 18,
  },

  heroCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#ECE6DE',
    borderRadius: 24,
    padding: 16,
    shadowColor: '#20150E',
    shadowOpacity: 0.04,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
    gap: 14,
  },
  heroTopRow: {
    alignItems: 'center',
    gap: 14,
  },
  heroAvatarWrap: {
    width: 76,
    height: 76,
    borderRadius: 38,
    overflow: 'hidden',
    backgroundColor: '#EFE8E0',
  },
  heroAvatarImage: {
    width: '100%',
    height: '100%',
  },
  heroIdentity: {
    flex: 1,
    gap: 4,
  },
  heroName: {
    fontSize: 20,
    lineHeight: 24,
    fontWeight: '800',
    color: '#241B17',
  },
  heroEmail: {
    fontSize: 14,
    lineHeight: 18,
    color: '#7B6F68',
  },
  heroBadgeRow: {
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 6,
  },
  heroBadge: {
    minHeight: 30,
    borderRadius: 999,
    backgroundColor: '#FFF2EF',
    borderWidth: 1,
    borderColor: '#F3CDC6',
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroBadgeSecondary: {
    backgroundColor: '#F7F4F1',
    borderColor: '#E8E1DA',
  },
  heroBadgeText: {
    fontSize: 12,
    lineHeight: 14,
    fontWeight: '700',
    color: '#F45A4E',
  },
  heroBadgeTextSecondary: {
    color: '#6B625C',
  },

  statsRow: {
    gap: 10,
  },
  statCard: {
    flex: 1,
    minHeight: 88,
    borderRadius: 18,
    backgroundColor: '#FAF7F3',
    borderWidth: 1,
    borderColor: '#EEE7E0',
    paddingHorizontal: 12,
    paddingVertical: 12,
    alignItems: 'flex-start',
    justifyContent: 'center',
    gap: 4,
  },
  statIcon: {
    fontSize: 16,
    lineHeight: 18,
    color: '#F45A4E',
  },
  statValue: {
    fontSize: 20,
    lineHeight: 24,
    fontWeight: '800',
    color: '#231A16',
  },
  statLabel: {
    fontSize: 12,
    lineHeight: 15,
    color: '#7B6F68',
    fontWeight: '600',
  },

  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#ECE6DE',
    borderRadius: 22,
    padding: 16,
    gap: 12,
    shadowColor: '#20150E',
    shadowOpacity: 0.03,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },
  sectionHeader: {
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '800',
    color: '#241B17',
  },
  sectionLink: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '700',
    color: '#F45A4E',
  },
  actionPressed: {
    opacity: 0.82,
  },
  sectionHint: {
    fontSize: 13,
    lineHeight: 18,
    color: '#7B6F68',
  },

  savedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    backgroundColor: '#FAF7F3',
    borderWidth: 1,
    borderColor: '#EEE7E0',
    overflow: 'hidden',
    minHeight: 98,
  },
  savedCardImage: {
    width: 92,
    height: 98,
  },
  savedCardBody: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 4,
  },
  savedCardTitle: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '800',
    color: '#241B17',
  },
  savedCardMeta: {
    fontSize: 14,
    lineHeight: 18,
    color: '#7B6F68',
  },
  savedCardDistance: {
    fontSize: 13,
    lineHeight: 16,
    color: '#9B8F87',
    fontWeight: '600',
  },
  savedCardAction: {
    width: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },

  emptySavedNotice: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 4,
  },
  emptySavedTitle: {
    fontSize: 15,
    lineHeight: 19,
    fontWeight: '700',
    color: '#423935',
  },
  emptySavedBody: {
    fontSize: 13,
    lineHeight: 18,
    color: '#8A7F78',
  },

  bookmarkIcon: {
    width: 18,
    height: 22,
    position: 'relative',
  },
  bookmarkIconActive: {
    transform: [{ scale: 1.03 }],
  },
  bookmarkBody: {
    position: 'absolute',
    top: 0,
    left: 2,
    width: 14,
    height: 18,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    borderWidth: 1.8,
    borderBottomWidth: 0,
    borderColor: '#F45A4E',
    backgroundColor: 'transparent',
  },
  bookmarkFoldLeft: {
    position: 'absolute',
    bottom: 1,
    left: 2,
    width: 0,
    height: 0,
    borderTopWidth: 7,
    borderRightWidth: 7,
    borderTopColor: '#F45A4E',
    borderRightColor: 'transparent',
  },
  bookmarkFoldRight: {
    position: 'absolute',
    bottom: 1,
    right: 2,
    width: 0,
    height: 0,
    borderTopWidth: 7,
    borderLeftWidth: 7,
    borderTopColor: '#F45A4E',
    borderLeftColor: 'transparent',
  },

  activityList: {
    gap: 10,
  },
  activityRow: {
    minHeight: 82,
    borderRadius: 18,
    backgroundColor: '#FAF7F3',
    borderWidth: 1,
    borderColor: '#EEE7E0',
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  activityIconBubble: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityIconBubbleSave: {
    backgroundColor: '#FFF2EF',
  },
  activityIconBubbleBell: {
    backgroundColor: '#F7F4F1',
  },
  activityIconGlyph: {
    fontSize: 18,
    lineHeight: 18,
    color: '#F45A4E',
  },
  activityImage: {
    width: 52,
    height: 52,
    borderRadius: 14,
  },
  activityBody: {
    flex: 1,
    gap: 2,
  },
  activityTitle: {
    fontSize: 15,
    lineHeight: 18,
    fontWeight: '700',
    color: '#241B17',
  },
  activitySubtitle: {
    fontSize: 13,
    lineHeight: 17,
    color: '#7B6F68',
  },
  activityRecency: {
    fontSize: 12,
    lineHeight: 15,
    color: '#9B8F87',
    fontWeight: '600',
  },
  activityTail: {
    minWidth: 22,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F45A4E',
  },
  activityChevron: {
    fontSize: 20,
    lineHeight: 20,
    color: '#B1A59E',
  },

  settingsTitle: {
    fontSize: 20,
    lineHeight: 24,
    fontWeight: '800',
    color: '#241B17',
  },
  settingsHint: {
    fontSize: 13,
    lineHeight: 18,
    color: '#7B6F68',
  },
  settingsGroup: {
    gap: 10,
  },
  settingRow: {
    minHeight: 56,
    borderRadius: 16,
    backgroundColor: '#FAF7F3',
    borderWidth: 1,
    borderColor: '#EEE7E0',
    paddingHorizontal: 12,
    paddingVertical: 10,
    justifyContent: 'center',
    gap: 6,
  },
  settingLabel: {
    fontSize: 12,
    lineHeight: 14,
    color: '#9B8F87',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  settingInput: {
    fontSize: 15,
    lineHeight: 20,
    color: '#241B17',
    padding: 0,
    margin: 0,
    fontWeight: '600',
  },
  settingStaticValue: {
    fontSize: 15,
    lineHeight: 20,
    color: '#241B17',
    fontWeight: '600',
  },
  choicePill: {
    alignSelf: 'flex-start',
    minHeight: 34,
    borderRadius: 999,
    backgroundColor: '#FFF2EF',
    borderWidth: 1,
    borderColor: '#F3CDC6',
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  choicePillText: {
    fontSize: 13,
    lineHeight: 16,
    fontWeight: '700',
    color: '#F45A4E',
  },
  privacyNote: {
    fontSize: 13,
    lineHeight: 18,
    color: '#8A7F78',
  },

  primaryButton: {
    minHeight: 54,
    borderRadius: 16,
    backgroundColor: '#F45A4E',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  primaryButtonDisabled: {
    opacity: 0.6,
  },
  primaryButtonLabel: {
    fontSize: 17,
    lineHeight: 20,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  secondaryButton: {
    minHeight: 52,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DDD4CC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonDisabled: {
    opacity: 0.7,
  },
  secondaryButtonLabel: {
    fontSize: 16,
    lineHeight: 19,
    fontWeight: '700',
    color: '#241B17',
  },

  buttonPressed: {
    opacity: 0.86,
  },
});
