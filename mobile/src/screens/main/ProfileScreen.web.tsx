import React from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';

import { AdminConsolePanel } from '../../components/profile/AdminConsolePanel';
import { LeaderboardPanel } from '../../components/profile/LeaderboardPanel';
import { LoadingState } from '../../components/ui/LoadingState';
import { StatusBanner } from '../../components/ui/StatusBanner';
import { useAuth } from '../../context/AuthContext';
import { useLocalization } from '../../context/LocalizationContext';
import { subscribeToPosts } from '../../repositories/postsRepository';
import { logoutUser } from '../../services/authService';
import {
  buildDiscoverySpotItems,
  getTimestampMs,
} from '../../services/discoveryService';
import { observeFavoritePostIds } from '../../services/favoriteService';
import {
  markUserNotificationRead,
  NotificationValidationError,
  observeNotifications,
} from '../../services/notificationService';
import {
  observeCurrentUserProfile,
  ProfileValidationError,
  saveCurrentUserProfile,
} from '../../services/profileService';
import { observeUserSubscription } from '../../services/subscriptionService';
import { webDesktopColors, webDesktopLayout } from '../../theme/webDesktopSystem';
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
import type { UserRole } from '../../types/user';

const AVATAR =
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80';

const SAVED_SPOT_FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1728488447537-d0ef1b9018e3?auto=format&fit=crop&w=1200&q=80';

const ACTIVITY_IMAGES = [
  'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1658863714664-bced34d5606f?auto=format&fit=crop&w=800&q=80',
] as const;

type SavedSpotPreview = {
  id: string;
  title: string;
  image: string;
  meta: string;
  description: string;
  savedAgo: string;
};

type ActivityPreview = {
  id: string;
  type: 'heart' | 'bookmark' | 'chatbox';
  title: string;
  meta: string;
  time: string;
  imageUrl: string;
  notificationId?: string;
  unread?: boolean;
};

function getCopy(language: AppLanguage) {
  if (language === 'ar') {
    return {
      areaSummary: 'ملخص المنطقة',
      nearMe: 'بالقرب مني',
      role: 'الدور',
      plan: 'الخطة',
      xp: 'XP',
      saves: 'المحفوظات',
      unread: 'غير المقروء',
      keepExploring: 'استمر في الاستكشاف',
      savedPlaces: 'الأماكن المحفوظة',
      newNotifications: 'إشعارات جديدة',
      savedSpots: 'الأماكن المحفوظة',
      viewAllSaves: 'عرض كل المحفوظات',
      recentActivity: 'النشاط الأخير',
      viewAllActivity: 'عرض كل النشاط',
      settings: 'إعدادات الحساب',
      settingsBody: 'حدّث تفاصيل الحساب والتفضيلات الأساسية.',
      username: 'اسم المستخدم',
      email: 'البريد الإلكتروني',
      bio: 'النبذة',
      planLabel: 'الخطة',
      language: 'اللغة',
      privacy: 'وضع الخصوصية',
      privacyBody: 'قلل ظهور ملفك الشخصي للميزات الاجتماعية القادمة.',
      preferences: 'التفضيلات',
      emailNotifications: 'إشعارات البريد',
      emailNotificationsBody: 'استلم تحديثات حول النشاط والمحفوظات.',
      marketingEmails: 'رسائل التسويق',
      marketingEmailsBody: 'استلم نصائح وميزات جديدة وعروضا.',
      saveSettings: 'حفظ الإعدادات',
      savingSettings: 'جار الحفظ...',
      signOut: 'تسجيل الخروج',
      signingOut: 'جار تسجيل الخروج...',
      noSavedTitle: 'لا توجد أماكن محفوظة بعد',
      noSavedBody: 'احفظ أماكن من الاستكشاف لبناء قائمتك هنا.',
      noActivityTitle: 'لا توجد إشعارات بعد',
      noActivityBody: 'سيظهر نشاط الإعجابات والتعليقات هنا.',
      defaultUsername: 'مستخدم Spots',
      profileIssueTitle: 'تعذر تحميل بعض بيانات الحساب',
      retry: 'إعادة المحاولة',
      savedAlert: 'تم الحفظ',
      savedAlertBody: 'تم تحديث إعدادات ملفك الشخصي.',
      planDetails: 'تفاصيل الخطة',
      languageEnglish: 'English',
      languageArabic: 'العربية',
      daysAgo: (value: number) => `قبل ${value} يوم`,
      activityComment: 'نشاط تعليق',
      activityLike: 'نشاط إعجاب',
    };
  }

  return {
    areaSummary: 'Area Summary',
    nearMe: 'Near Me',
    role: 'Role',
    plan: 'Plan',
    xp: 'XP',
    saves: 'Saves',
    unread: 'Unread',
    keepExploring: 'Keep exploring!',
    savedPlaces: 'Saved places',
    newNotifications: 'New notifications',
    savedSpots: 'Saved Spots',
    viewAllSaves: 'View all saves',
    recentActivity: 'Recent Activity',
    viewAllActivity: 'View all activity',
    settings: 'Account Settings',
    settingsBody: 'Update the account details and preferences you use most.',
    username: 'Username',
    email: 'Email',
    bio: 'Bio',
    planLabel: 'Plan',
    language: 'Language',
    privacy: 'Privacy mode',
    privacyBody: 'Reduce profile visibility for future social features.',
    preferences: 'Preferences',
    emailNotifications: 'Email notifications',
    emailNotificationsBody: 'Get updates about activity, saves and more.',
    marketingEmails: 'Marketing emails',
    marketingEmailsBody: 'Receive tips, new features and offers.',
    saveSettings: 'Save Settings',
    savingSettings: 'Saving...',
    signOut: 'Sign Out',
    signingOut: 'Signing Out...',
    noSavedTitle: 'No saved spots yet',
    noSavedBody: 'Save places from Explore to build your shortlist here.',
    noActivityTitle: 'No notifications yet',
    noActivityBody: 'Likes and comments activity will appear here.',
    defaultUsername: 'Spots User',
    profileIssueTitle: 'Some account data could not be loaded',
    retry: 'Retry',
    savedAlert: 'Saved',
    savedAlertBody: 'Your profile settings were updated.',
    planDetails: 'Plan details',
    languageEnglish: 'English',
    languageArabic: 'Arabic',
    daysAgo: (value: number) => `${value} day${value === 1 ? '' : 's'} ago`,
    activityComment: 'Comment activity',
    activityLike: 'Like activity',
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

function formatRecencyLabel(value: unknown, copy: ReturnType<typeof getCopy>) {
  const timestampMs = getTimestampMs(value);
  if (timestampMs === null) {
    return copy.daysAgo(1);
  }

  const elapsedDays = Math.max(1, Math.round((Date.now() - timestampMs) / (24 * 60 * 60 * 1000)));
  return copy.daysAgo(elapsedDays);
}

export function ProfileScreen() {
  const { user } = useAuth();
  const navigation = useNavigation<BottomTabNavigationProp<MainTabParamList>>();
  const {
    language,
    setLanguagePreference,
    getRoleLabel,
    getPlanLevelLabel,
    getPlanStatusLabel,
    getTextAlign,
    isRTL,
  } = useLocalization();
  const copy = React.useMemo(() => getCopy(language), [language]);
  const textAlign = getTextAlign();

  const [loading, setLoading] = React.useState(true);
  const [setupIssue, setSetupIssue] = React.useState<string | null>(null);
  const [refreshToken, setRefreshToken] = React.useState(0);

  const [username, setUsername] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [bio, setBio] = React.useState('');
  const [privacyMode, setPrivacyMode] = React.useState(false);
  const [emailNotifications, setEmailNotifications] = React.useState(true);
  const [marketingEmails, setMarketingEmails] = React.useState(false);
  const [languageValue, setLanguageValue] = React.useState<AppLanguage>(language);
  const [role, setRole] = React.useState<UserRole>('user');
  const [profileXp, setProfileXp] = React.useState(0);
  const [subscription, setSubscription] = React.useState<UserSubscription | null>(null);
  const [favoritePostIds, setFavoritePostIds] = React.useState<string[]>([]);
  const [posts, setPosts] = React.useState<SpotPost[]>([]);
  const [notifications, setNotifications] = React.useState<AppNotification[]>([]);
  const [savingSettings, setSavingSettings] = React.useState(false);
  const [signingOut, setSigningOut] = React.useState(false);

  React.useEffect(() => {
    setLanguageValue(language);
  }, [language]);

  const handleSetupIssue = React.useCallback(
    (error: unknown, fallbackMessage: string) => {
      const nextMessage = isDataAccessBlockedError(error)
        ? getBlockedDataMessage(language === 'ar' ? 'بيانات الحساب' : 'profile data')
        : getErrorMessage(error, fallbackMessage);

      setSetupIssue(current => current ?? nextMessage);
    },
    [language]
  );

  React.useEffect(() => {
    setLoading(true);
    setSetupIssue(null);

    if (!user) {
      setUsername(copy.defaultUsername);
      setEmail('');
      setBio('');
      setRole('user');
      setProfileXp(0);
      setLoading(false);
      return undefined;
    }

    const unsubscribeProfile = observeCurrentUserProfile(
      { user },
      profile => {
        setUsername(profile.username || copy.defaultUsername);
        setEmail(profile.email || user.email || '');
        setBio(profile.bio || '');
        setPrivacyMode(profile.privacyMode);
        setLanguageValue(profile.language);
        setRole(profile.role);
        setProfileXp(profile.xp ?? 0);
        setEmailNotifications(profile.emailNotifications);
        setMarketingEmails(profile.marketingEmails);
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
        handleSetupIssue(error, 'Failed to load notifications.');
      }
    );

    return () => {
      unsubscribeProfile();
      unsubscribeSubscription();
      unsubscribeFavorites();
      unsubscribePosts();
      unsubscribeNotifications();
    };
  }, [copy.defaultUsername, handleSetupIssue, refreshToken, user]);

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
        image: spot.hero.imageUrl || SAVED_SPOT_FALLBACK_IMAGE,
        meta: `${spot.locationLabel} - ${spot.categoryLabel}`,
        description: spot.summary || spot.description,
        savedAgo: formatRecencyLabel(spot.rawPost.createdAt, copy),
      }));
  }, [copy, favoritePostIds, language, posts]);

  const unreadCount = React.useMemo(
    () => notifications.filter(item => !item.isRead).length,
    [notifications]
  );

  const activityItems = React.useMemo<ActivityPreview[]>(() => {
    return notifications.slice(0, 5).map((item, index) => ({
      id: item.id,
      type: item.type === 'like_on_post' ? 'heart' : 'chatbox',
      title: item.message || (item.type === 'like_on_post' ? copy.activityLike : copy.activityComment),
      meta: item.actorLabel || item.postId,
      time: formatRecencyLabel(item.createdAt, copy),
      imageUrl: ACTIVITY_IMAGES[index % ACTIVITY_IMAGES.length],
      notificationId: item.id,
      unread: !item.isRead,
    }));
  }, [copy, notifications]);

  const displayName = username || copy.defaultUsername;
  const displayEmail = email || user?.email || '';
  const roleLabel = getRoleLabel(role);
  const planLabel = getPlanLevelLabel(subscription?.planLevel ?? 'free');
  const planStatusLabel = getPlanStatusLabel(subscription?.status ?? 'inactive');
  const languageLabel = languageValue === 'ar' ? copy.languageArabic : copy.languageEnglish;

  const handleRetry = React.useCallback(() => {
    setSetupIssue(null);
    setRefreshToken(value => value + 1);
  }, []);

  const handleAreaSummary = React.useCallback(() => {
    const summary =
      language === 'ar'
        ? `لديك ${favoritePostIds.length} أماكن محفوظة و ${unreadCount} إشعارات غير مقروءة.`
        : `You have ${favoritePostIds.length} saved spots and ${unreadCount} unread notifications.`;
    showAlert(copy.areaSummary, summary);
  }, [copy.areaSummary, favoritePostIds.length, language, unreadCount]);

  const handleToggleLanguage = React.useCallback(() => {
    const nextLanguage = languageValue === 'en' ? 'ar' : 'en';
    setLanguageValue(nextLanguage);
  }, [languageValue]);

  const handleSaveSettings = React.useCallback(async () => {
    if (!user) {
      showAlert(language === 'ar' ? 'تسجيل الدخول مطلوب' : 'Sign-in required');
      return;
    }

    setSavingSettings(true);

    try {
      await saveCurrentUserProfile({
        userId: user.id,
        username: username.trim() || copy.defaultUsername,
        bio: bio.trim(),
        language: languageValue,
        privacyMode,
        emailNotifications,
        marketingEmails,
      });
      await setLanguagePreference(languageValue);

      showAlert(copy.savedAlert, copy.savedAlertBody);
    } catch (error) {
      if (error instanceof ProfileValidationError) {
        showAlert(language === 'ar' ? 'تعذر الحفظ' : 'Could not save settings', error.message);
      } else {
        showAlert(
          language === 'ar' ? 'تعذر الحفظ' : 'Could not save settings',
          isDataAccessBlockedError(error)
            ? getBlockedDataMessage(language === 'ar' ? 'إعدادات الحساب' : 'account settings')
            : getErrorMessage(error, 'Unable to save settings right now.')
        );
      }
    } finally {
      setSavingSettings(false);
    }
  }, [
    bio,
    copy.defaultUsername,
    copy.savedAlert,
    copy.savedAlertBody,
    emailNotifications,
    language,
    languageValue,
    marketingEmails,
    privacyMode,
    setLanguagePreference,
    user,
    username,
  ]);

  const handleSignOut = React.useCallback(async () => {
    setSigningOut(true);

    try {
      await logoutUser();
    } catch (error) {
      showAlert(
        language === 'ar' ? 'تعذر تسجيل الخروج' : 'Could not sign out',
        getErrorMessage(error, language === 'ar' ? 'حاول مجددا.' : 'Please try again.')
      );
    } finally {
      setSigningOut(false);
    }
  }, [language]);

  const handleMarkActivityRead = React.useCallback(
    async (activity: ActivityPreview) => {
      if (!user?.id || !activity.notificationId || !activity.unread) {
        return;
      }

      try {
        await markUserNotificationRead(user.id, activity.notificationId);
      } catch (error) {
        const message =
          error instanceof NotificationValidationError
            ? error.message
            : isDataAccessBlockedError(error)
              ? getBlockedDataMessage(language === 'ar' ? 'الإشعارات' : 'notifications')
              : getErrorMessage(error, 'Unable to update notification right now.');
        showAlert(language === 'ar' ? 'تعذر تحديث الإشعار' : 'Could not update notification', message);
      }
    },
    [language, user?.id]
  );

  if (loading) {
    return <LoadingState label={language === 'ar' ? 'الحساب' : 'Profile'} />;
  }

  return (
    <ScrollView
      style={styles.page}
      contentContainerStyle={styles.pageContent}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <View style={[styles.container, { direction: isRTL ? 'rtl' : 'ltr' }]}>
        <View style={styles.topUtilityRow}>
          <View style={styles.topUtilitySpacer} />

          <View style={styles.topUtilityActions}>
            <Pressable
              accessibilityRole="button"
              style={({ pressed }) => [styles.searchSquare, pressed && styles.pressed]}
              onPress={() => navigation.navigate('Explore', { focusSearch: true })}
            >
              <Ionicons name="search-outline" size={24} color="#FFFFFF" />
            </Pressable>

            <Pressable
              accessibilityRole="button"
              style={({ pressed }) => [styles.utilityPill, pressed && styles.pressed]}
              onPress={handleAreaSummary}
            >
              <Ionicons name="location-outline" size={18} color="#4E453F" />
              <Text style={styles.utilityPillText}>{copy.areaSummary}</Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              style={({ pressed }) => [styles.utilityPill, pressed && styles.pressed]}
              onPress={() => navigation.navigate('Explore', { where: copy.nearMe })}
            >
              <Ionicons name="paper-plane-outline" size={18} color="#4E453F" />
              <Text style={styles.utilityPillText}>{copy.nearMe}</Text>
            </Pressable>
          </View>
        </View>

        {setupIssue ? (
          <StatusBanner
            compact
            tone="warning"
            title={copy.profileIssueTitle}
            body={setupIssue}
            actions={[
              {
                label: copy.retry,
                tone: 'primary',
                onPress: handleRetry,
              },
            ]}
          />
        ) : null}

        <View style={styles.heroCard}>
          <View style={styles.heroLeft}>
            <Image source={{ uri: AVATAR }} style={styles.avatar} />

            <View style={styles.heroIdentity}>
              <Text
                style={[
                  styles.heroName,
                  { textAlign, writingDirection: isRTL ? 'rtl' : 'ltr' },
                ]}
              >
                {displayName}
              </Text>
              <Text style={styles.heroEmail}>{displayEmail || copy.defaultUsername}</Text>

              <View style={styles.badgeRow}>
                <View style={styles.roleBadge}>
                  <Text style={styles.roleBadgeText}>{copy.role}: {roleLabel}</Text>
                </View>

                <View style={styles.planBadge}>
                  <Text style={styles.planBadgeText}>{copy.plan}: {planLabel}</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.heroStats}>
            <View style={styles.heroStat}>
              <View style={[styles.heroStatIconWrap, styles.heroStatSoftRed]}>
                <Ionicons name="star-outline" size={22} color="#F55445" />
              </View>
              <View>
                <Text style={styles.heroStatValue}>{profileXp}</Text>
                <Text style={styles.heroStatLabel}>{copy.xp}</Text>
                <Text style={styles.heroStatSub}>{copy.keepExploring}</Text>
              </View>
            </View>

            <View style={styles.heroDivider} />

            <View style={styles.heroStat}>
              <View style={[styles.heroStatIconWrap, styles.heroStatSoftGreen]}>
                <Ionicons name="bookmark-outline" size={22} color="#70913C" />
              </View>
              <View>
                <Text style={styles.heroStatValue}>{favoritePostIds.length}</Text>
                <Text style={styles.heroStatLabel}>{copy.saves}</Text>
                <Text style={styles.heroStatSub}>{copy.savedPlaces}</Text>
              </View>
            </View>

            <View style={styles.heroDivider} />

            <View style={styles.heroStat}>
              <View style={[styles.heroStatIconWrap, styles.heroStatSoftBlue]}>
                <Ionicons name="notifications-outline" size={22} color="#4E8CE3" />
              </View>
              <View>
                <Text style={styles.heroStatValue}>{unreadCount}</Text>
                <Text style={styles.heroStatLabel}>{copy.unread}</Text>
                <Text style={styles.heroStatSub}>{copy.newNotifications}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.productPanels}>
          <LeaderboardPanel />
          <AdminConsolePanel role={role} />
        </View>

        <View style={styles.mainGrid}>
          <View style={styles.leftColumn}>
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionHeaderLeft}>
                  <Ionicons name="bookmark-outline" size={20} color="#6F655F" />
                  <Text style={styles.sectionTitle}>{copy.savedSpots}</Text>
                </View>

                <Pressable onPress={() => navigation.navigate('Explore')}>
                  <Text style={styles.viewAll}>{copy.viewAllSaves}</Text>
                </Pressable>
              </View>

              {savedSpots.length === 0 ? (
                <View style={styles.emptyPanel}>
                  <Text style={styles.emptyTitle}>{copy.noSavedTitle}</Text>
                  <Text style={styles.emptyBody}>{copy.noSavedBody}</Text>
                </View>
              ) : (
                <View style={styles.savedList}>
                  {savedSpots.map(item => (
                    <Pressable
                      key={item.id}
                      accessibilityRole="button"
                      onPress={() => navigation.navigate('Explore', { query: item.title })}
                      style={({ pressed }) => [styles.savedItem, pressed && styles.pressed]}
                    >
                      <Image source={{ uri: item.image }} style={styles.savedImage} />

                      <View style={styles.savedBody}>
                        <Text style={styles.savedTitle} numberOfLines={1}>{item.title}</Text>
                        <Text style={styles.savedMeta} numberOfLines={1}>{item.meta}</Text>
                        <Text style={styles.savedDescription} numberOfLines={1}>{item.description}</Text>
                      </View>

                      <View style={styles.savedRight}>
                        <Text style={styles.savedAgo}>{item.savedAgo}</Text>
                        <View style={styles.savedBookmarkButton}>
                          <Ionicons name="bookmark" size={16} color="#2F2A26" />
                        </View>
                      </View>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>

            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionHeaderLeft}>
                  <Ionicons name="git-network-outline" size={20} color="#6F655F" />
                  <Text style={styles.sectionTitle}>{copy.recentActivity}</Text>
                </View>

                <Pressable onPress={() => navigation.navigate('Home')}>
                  <Text style={styles.viewAll}>{copy.viewAllActivity}</Text>
                </Pressable>
              </View>

              {activityItems.length === 0 ? (
                <View style={styles.emptyPanel}>
                  <Text style={styles.emptyTitle}>{copy.noActivityTitle}</Text>
                  <Text style={styles.emptyBody}>{copy.noActivityBody}</Text>
                </View>
              ) : (
                <View style={styles.activityList}>
                  {activityItems.map(item => (
                    <Pressable
                      key={item.id}
                      accessibilityRole="button"
                      onPress={() => void handleMarkActivityRead(item)}
                      style={({ pressed }) => [styles.activityRow, pressed && styles.pressed]}
                    >
                      <View style={styles.activityIconWrap}>
                        <Ionicons
                          name={item.type}
                          size={18}
                          color={
                            item.type === 'heart'
                              ? '#F55445'
                              : item.type === 'bookmark'
                                ? '#47975A'
                                : '#4E8CE3'
                          }
                        />
                      </View>

                      <Image source={{ uri: item.imageUrl }} style={styles.activityImage} />

                      <View style={styles.activityBody}>
                        <Text style={styles.activityTitle} numberOfLines={1}>{item.title}</Text>
                        <Text style={styles.activityMeta} numberOfLines={1}>{item.meta}</Text>
                      </View>

                      <View style={styles.activityTail}>
                        {item.unread ? <View style={styles.redDot} /> : null}
                        <Text style={styles.activityTime}>{item.time}</Text>
                      </View>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>
          </View>

          <View style={styles.rightColumn}>
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeaderLeft}>
                <Ionicons name="settings-outline" size={20} color="#6F655F" />
                <Text style={styles.sectionTitle}>{copy.settings}</Text>
              </View>

              <Text style={styles.settingsSubtitle}>{copy.settingsBody}</Text>

              <View style={styles.settingsTable}>
                <View style={styles.settingsRow}>
                  <Text style={styles.settingsLabel}>{copy.username}</Text>
                  <TextInput
                    value={username}
                    onChangeText={setUsername}
                    placeholder={copy.defaultUsername}
                    placeholderTextColor={webDesktopColors.textSoft}
                    style={[
                      styles.settingsInput,
                      { textAlign, writingDirection: isRTL ? 'rtl' : 'ltr' },
                    ]}
                  />
                </View>

                <View style={styles.settingsRow}>
                  <Text style={styles.settingsLabel}>{copy.email}</Text>
                  <Text style={styles.settingsValue}>{displayEmail || '-'}</Text>
                </View>

                <View style={styles.settingsRow}>
                  <Text style={styles.settingsLabel}>{copy.planLabel}</Text>
                  <View style={styles.settingsRowRight}>
                    <View style={styles.inlinePillGreen}>
                      <Text style={styles.inlinePillGreenText}>{planLabel}</Text>
                    </View>
                    <Pressable
                      style={({ pressed }) => [styles.inlineActionButton, pressed && styles.pressed]}
                      onPress={() => showAlert(copy.planDetails, `${planLabel} - ${planStatusLabel}`)}
                    >
                      <Text style={styles.inlineActionText}>{planStatusLabel}</Text>
                    </Pressable>
                  </View>
                </View>

                <Pressable
                  style={({ pressed }) => [styles.settingsRow, pressed && styles.pressed]}
                  onPress={handleToggleLanguage}
                >
                  <Text style={styles.settingsLabel}>{copy.language}</Text>
                  <View style={styles.settingsRowRight}>
                    <Text style={styles.settingsValue}>{languageLabel}</Text>
                    <Ionicons name="chevron-down" size={18} color="#6D635D" />
                  </View>
                </Pressable>

                <View style={styles.settingsRow}>
                  <View style={styles.settingsTextBlock}>
                    <Text style={styles.settingsLabel}>{copy.privacy}</Text>
                    <Text style={styles.settingsHint}>{copy.privacyBody}</Text>
                  </View>
                  <Switch
                    value={privacyMode}
                    onValueChange={setPrivacyMode}
                    trackColor={{ false: '#D7D1CB', true: '#F7B1A8' }}
                    thumbColor={privacyMode ? '#F55445' : '#FFFFFF'}
                  />
                </View>

                <View style={styles.settingsRow}>
                  <Text style={styles.settingsLabel}>{copy.bio}</Text>
                  <TextInput
                    value={bio}
                    onChangeText={setBio}
                    multiline
                    placeholder={language === 'ar' ? 'نبذة قصيرة' : 'Short bio'}
                    placeholderTextColor={webDesktopColors.textSoft}
                    style={[
                      styles.settingsInput,
                      styles.bioInput,
                      { textAlign, writingDirection: isRTL ? 'rtl' : 'ltr' },
                    ]}
                  />
                </View>
              </View>

              <Text style={styles.preferencesHeading}>{copy.preferences}</Text>

              <View style={styles.preferencesCard}>
                <View style={styles.preferenceRow}>
                  <View style={styles.settingsTextBlock}>
                    <Text style={styles.preferenceLabel}>{copy.emailNotifications}</Text>
                    <Text style={styles.preferenceHint}>{copy.emailNotificationsBody}</Text>
                  </View>
                  <Switch
                    value={emailNotifications}
                    onValueChange={setEmailNotifications}
                    trackColor={{ false: '#D7D1CB', true: '#F7B1A8' }}
                    thumbColor={emailNotifications ? '#F55445' : '#FFFFFF'}
                  />
                </View>

                <View style={styles.preferenceRow}>
                  <View style={styles.settingsTextBlock}>
                    <Text style={styles.preferenceLabel}>{copy.marketingEmails}</Text>
                    <Text style={styles.preferenceHint}>{copy.marketingEmailsBody}</Text>
                  </View>
                  <Switch
                    value={marketingEmails}
                    onValueChange={setMarketingEmails}
                    trackColor={{ false: '#D7D1CB', true: '#F7B1A8' }}
                    thumbColor={marketingEmails ? '#F55445' : '#FFFFFF'}
                  />
                </View>

                <View style={styles.preferenceRow}>
                  <Text style={styles.preferenceLabel}>{copy.unread}</Text>

                  <View style={styles.preferenceUnreadWrap}>
                    <View style={styles.unreadBadge}>
                      <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={17} color="#6D635D" />
                  </View>
                </View>
              </View>

              <View style={styles.bottomActionRow}>
                <Pressable
                  accessibilityRole="button"
                  disabled={savingSettings || !user}
                  style={({ pressed }) => [
                    styles.primaryButton,
                    (savingSettings || !user) && styles.disabledButton,
                    pressed && !savingSettings && user && styles.pressed,
                  ]}
                  onPress={() => void handleSaveSettings()}
                >
                  {savingSettings ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.primaryButtonText}>{copy.saveSettings}</Text>
                  )}
                </Pressable>

                <Pressable
                  accessibilityRole="button"
                  disabled={signingOut}
                  style={({ pressed }) => [
                    styles.secondaryButton,
                    signingOut && styles.disabledButton,
                    pressed && !signingOut && styles.pressed,
                  ]}
                  onPress={() => void handleSignOut()}
                >
                  {signingOut ? (
                    <ActivityIndicator color={webDesktopColors.text} />
                  ) : (
                    <Text style={styles.secondaryButtonText}>{copy.signOut}</Text>
                  )}
                </Pressable>
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

  topUtilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topUtilitySpacer: {
    flex: 1,
  },
  topUtilityActions: {
    flexDirection: 'row',
    gap: 12,
  },
  searchSquare: {
    width: 88,
    height: 42,
    borderRadius: 12,
    backgroundColor: webDesktopColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  utilityPill: {
    minHeight: 42,
    paddingHorizontal: 18,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: webDesktopColors.border,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  utilityPillText: {
    fontSize: 15,
    lineHeight: 18,
    fontWeight: '600',
    color: '#4E453F',
  },

  heroCard: {
    minHeight: 140,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: webDesktopColors.border,
    backgroundColor: '#FFFDFB',
    paddingHorizontal: 28,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    flex: 1,
    minWidth: 0,
  },
  avatar: {
    width: 102,
    height: 102,
    borderRadius: 51,
    backgroundColor: '#DED6CE',
  },
  heroIdentity: {
    justifyContent: 'center',
    minWidth: 0,
  },
  heroName: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '800',
    color: webDesktopColors.text,
  },
  heroEmail: {
    marginTop: 6,
    fontSize: 16,
    lineHeight: 20,
    color: webDesktopColors.textMuted,
  },
  badgeRow: {
    marginTop: 14,
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  roleBadge: {
    minHeight: 32,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: '#F3EAE2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleBadgeText: {
    fontSize: 14,
    lineHeight: 17,
    color: '#5E554F',
    fontWeight: '700',
  },
  planBadge: {
    minHeight: 32,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: '#EAF5EA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  planBadgeText: {
    fontSize: 14,
    lineHeight: 17,
    color: '#4D8A57',
    fontWeight: '700',
  },

  heroStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 28,
    marginLeft: 32,
  },
  heroStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    minWidth: 180,
  },
  heroStatIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroStatSoftRed: {
    backgroundColor: '#FFF0EC',
  },
  heroStatSoftGreen: {
    backgroundColor: '#EEF7E5',
  },
  heroStatSoftBlue: {
    backgroundColor: '#EEF4FF',
  },
  heroStatValue: {
    fontSize: 18,
    lineHeight: 21,
    fontWeight: '800',
    color: webDesktopColors.text,
  },
  heroStatLabel: {
    marginTop: 2,
    fontSize: 14,
    lineHeight: 17,
    color: '#4B423C',
    fontWeight: '600',
  },
  heroStatSub: {
    marginTop: 5,
    fontSize: 14,
    lineHeight: 18,
    color: webDesktopColors.textMuted,
  },
  heroDivider: {
    width: 1,
    height: 74,
    backgroundColor: webDesktopColors.border,
  },
  productPanels: {
    gap: 18,
  },

  mainGrid: {
    flexDirection: 'row',
    gap: 22,
    alignItems: 'flex-start',
  },
  leftColumn: {
    flex: 1,
    minWidth: 0,
    gap: 16,
  },
  rightColumn: {
    width: 710,
  },

  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: webDesktopColors.border,
    borderRadius: 20,
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 12,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sectionTitle: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '800',
    color: webDesktopColors.text,
  },
  viewAll: {
    fontSize: 14,
    lineHeight: 18,
    color: webDesktopColors.primary,
    fontWeight: '700',
  },

  savedList: {
    gap: 10,
  },
  savedItem: {
    minHeight: 88,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EEE8E2',
    backgroundColor: '#FFFFFF',
    padding: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  savedImage: {
    width: 160,
    height: 72,
    borderRadius: 12,
    backgroundColor: '#E9E2DA',
  },
  savedBody: {
    flex: 1,
    minWidth: 0,
  },
  savedTitle: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '800',
    color: webDesktopColors.text,
  },
  savedMeta: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 16,
    color: '#6F655F',
  },
  savedDescription: {
    marginTop: 5,
    fontSize: 13,
    lineHeight: 17,
    color: '#7F746D',
  },
  savedRight: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    alignSelf: 'stretch',
    paddingVertical: 4,
  },
  savedAgo: {
    fontSize: 13,
    lineHeight: 16,
    color: '#7F746D',
    textAlign: 'right',
  },
  savedBookmarkButton: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: webDesktopColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  emptyPanel: {
    minHeight: 88,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EEE8E2',
    backgroundColor: '#FFFDFB',
    padding: 16,
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 15,
    lineHeight: 19,
    fontWeight: '800',
    color: webDesktopColors.text,
  },
  emptyBody: {
    marginTop: 4,
    fontSize: 14,
    lineHeight: 18,
    color: webDesktopColors.textMuted,
  },

  activityList: {
    gap: 0,
  },
  activityRow: {
    minHeight: 76,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderTopWidth: 1,
    borderTopColor: '#EEE8E2',
    paddingVertical: 12,
  },
  activityIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F4EF',
  },
  activityImage: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#E9E2DA',
  },
  activityBody: {
    flex: 1,
    minWidth: 0,
  },
  activityTitle: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '700',
    color: webDesktopColors.text,
  },
  activityMeta: {
    marginTop: 4,
    fontSize: 14,
    lineHeight: 18,
    color: '#6F655F',
  },
  activityTail: {
    alignItems: 'flex-end',
    gap: 6,
  },
  activityTime: {
    fontSize: 13,
    lineHeight: 16,
    color: '#7F746D',
  },
  redDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: webDesktopColors.primary,
  },

  settingsSubtitle: {
    marginTop: 8,
    marginBottom: 14,
    fontSize: 15,
    lineHeight: 20,
    color: webDesktopColors.textMuted,
  },
  settingsTable: {
    borderTopWidth: 1,
    borderTopColor: '#EEE8E2',
  },
  settingsRow: {
    minHeight: 58,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE8E2',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  settingsTextBlock: {
    flex: 1,
    minWidth: 0,
  },
  settingsLabel: {
    fontSize: 15,
    lineHeight: 18,
    fontWeight: '700',
    color: '#403732',
  },
  settingsHint: {
    marginTop: 4,
    fontSize: 14,
    lineHeight: 18,
    color: '#857A73',
  },
  settingsRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexShrink: 1,
  },
  settingsValue: {
    fontSize: 15,
    lineHeight: 19,
    color: '#4F4640',
  },
  settingsInput: {
    minWidth: 260,
    maxWidth: 390,
    minHeight: 38,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: webDesktopColors.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 15,
    lineHeight: 19,
    color: webDesktopColors.text,
    backgroundColor: '#FFFFFF',
  },
  bioInput: {
    minHeight: 58,
    textAlignVertical: 'top',
  },
  inlineActionButton: {
    minHeight: 30,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: webDesktopColors.border,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inlineActionText: {
    fontSize: 13,
    lineHeight: 16,
    color: '#5E554E',
    fontWeight: '600',
  },
  inlinePillGreen: {
    minHeight: 28,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: '#EAF5EA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inlinePillGreenText: {
    fontSize: 13,
    lineHeight: 16,
    color: '#4D8A57',
    fontWeight: '700',
  },

  preferencesHeading: {
    marginTop: 18,
    marginBottom: 12,
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '800',
    color: webDesktopColors.text,
  },
  preferencesCard: {
    borderWidth: 1,
    borderColor: '#EEE8E2',
    borderRadius: 16,
    overflow: 'hidden',
  },
  preferenceRow: {
    minHeight: 58,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE8E2',
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 14,
    backgroundColor: '#FFFFFF',
  },
  preferenceLabel: {
    fontSize: 15,
    lineHeight: 18,
    fontWeight: '700',
    color: '#403732',
  },
  preferenceHint: {
    marginTop: 4,
    fontSize: 14,
    lineHeight: 18,
    color: '#857A73',
  },
  preferenceUnreadWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  unreadBadge: {
    minWidth: 28,
    height: 28,
    borderRadius: 8,
    paddingHorizontal: 8,
    backgroundColor: '#F7F3EE',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: webDesktopColors.border,
  },
  unreadBadgeText: {
    fontSize: 13,
    lineHeight: 16,
    fontWeight: '700',
    color: '#5A514B',
  },

  bottomActionRow: {
    marginTop: 18,
    flexDirection: 'row',
    gap: 12,
  },
  primaryButton: {
    minHeight: 46,
    minWidth: 140,
    paddingHorizontal: 18,
    borderRadius: 12,
    backgroundColor: webDesktopColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    fontSize: 15,
    lineHeight: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  secondaryButton: {
    minHeight: 46,
    paddingHorizontal: 18,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: webDesktopColors.border,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontSize: 15,
    lineHeight: 18,
    fontWeight: '700',
    color: '#4F4640',
  },
  disabledButton: {
    opacity: 0.55,
  },
  pressed: {
    opacity: 0.82,
  },
});
