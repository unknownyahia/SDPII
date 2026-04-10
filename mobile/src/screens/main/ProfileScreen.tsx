import React from 'react';
import {
  Alert,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';

import { AppHeader } from '../../components/ui/AppHeader';
import { PrimaryButton, SecondaryButton } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { FilterChip } from '../../components/ui/Chip';
import { InfoRow } from '../../components/ui/InfoRow';
import { LoadingState } from '../../components/ui/LoadingState';
import { MetricTile } from '../../components/ui/MetricTile';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { Section } from '../../components/ui/Section';
import { TextField } from '../../components/ui/TextField';
import { useAuth } from '../../context/AuthContext';
import { subscribeToPosts } from '../../repositories/postsRepository';
import {
  AnalyticsValidationError,
  getAdminAnalytics,
} from '../../services/analyticsService';
import { logoutUser } from '../../services/authService';
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
import {
  observeUserSubscription,
  SubscriptionValidationError,
  updateUserPlan,
} from '../../services/subscriptionService';
import { colors, radius, spacing, typography } from '../../theme/designSystem';
import type { AdminAnalyticsSnapshot } from '../../types/analytics';
import type { AppNotification } from '../../types/notification';
import type { AppLanguage } from '../../types/profile';
import type { SpotPost } from '../../types/post';
import type { ModerationReport, ReportStatus } from '../../types/report';
import type {
  PlanLevel,
  PlanStatus,
  UserSubscription,
} from '../../types/subscription';

function ItemCard({
  eyebrow,
  title,
  subtitle,
  children,
  accent,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <View style={[styles.itemCard, accent && styles.itemCardAccent]}>
      <Text style={[styles.itemEyebrow, accent && styles.itemEyebrowAccent]}>{eyebrow}</Text>
      <Text style={styles.itemTitle}>{title}</Text>
      {subtitle ? <Text style={styles.itemSubtitle}>{subtitle}</Text> : null}
      {children ? <View style={styles.itemContent}>{children}</View> : null}
    </View>
  );
}

export function ProfileScreen() {
  const { user } = useAuth();
  const [logoutLoading, setLogoutLoading] = React.useState(false);
  const [loadingProfile, setLoadingProfile] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [role, setRole] = React.useState('user');
  const [email, setEmail] = React.useState<string | null>(user?.email ?? null);
  const [xp, setXp] = React.useState(0);
  const [subscription, setSubscription] = React.useState<UserSubscription | null>(null);
  const [username, setUsername] = React.useState('');
  const [bio, setBio] = React.useState('');
  const [language, setLanguage] = React.useState<AppLanguage>('en');
  const [privacyMode, setPrivacyMode] = React.useState(false);
  const [posts, setPosts] = React.useState<SpotPost[]>([]);
  const [favoritePostIds, setFavoritePostIds] = React.useState<string[]>([]);
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

  React.useEffect(() => {
    const unsubscribe = observeFavoritePostIds(user?.id, setFavoritePostIds);
    return unsubscribe;
  }, [user?.id]);

  React.useEffect(() => {
    const unsubscribe = observeNotifications(user?.id, setNotifications);
    return unsubscribe;
  }, [user?.id]);

  React.useEffect(() => {
    const unsubscribe = observeUserSubscription(user?.id, nextSubscription => {
      setSubscription(nextSubscription.userId ? nextSubscription : null);
    });
    return unsubscribe;
  }, [user?.id]);

  React.useEffect(() => {
    const unsubscribe = observeReports(role, setReports);
    return unsubscribe;
  }, [role]);

  React.useEffect(() => {
    const unsubscribe = subscribeToPosts(setPosts);
    return unsubscribe;
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
          setEmail(profile.email);
          setRole(profile.role);
          setXp(profile.xp);
          setUsername(profile.username);
          setBio(profile.bio);
          setLanguage(profile.language);
          setPrivacyMode(profile.privacyMode);
          setLoadingProfile(false);
        },
        error => {
          Alert.alert('Profile error', error?.message ?? 'Failed to load profile');
          setLoadingProfile(false);
        }
      );
    } catch (error: any) {
      Alert.alert('Profile error', error?.message ?? 'Failed to load profile');
      setLoadingProfile(false);
    }

    return unsubscribe;
  }, [user]);

  const favoritePosts = React.useMemo(() => {
    const favoriteSet = new Set(favoritePostIds);
    return posts.filter(post => favoriteSet.has(post.id));
  }, [favoritePostIds, posts]);

  const unreadNotificationsCount = React.useMemo(
    () => notifications.filter(notification => !notification.isRead).length,
    [notifications]
  );

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveCurrentUserProfile({
        userId: user?.id,
        username,
        bio,
        language,
        privacyMode,
      });
      Alert.alert('Saved', 'Your profile settings were updated.');
    } catch (error: any) {
      if (error instanceof ProfileValidationError) {
        Alert.alert('Profile validation', error.message);
      } else {
        Alert.alert('Save error', error?.message ?? 'Failed to update profile');
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
      Alert.alert('Logout error', error?.message ?? 'Something went wrong');
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
        Alert.alert('Notification error', error.message);
      } else {
        Alert.alert('Notification error', error?.message ?? 'Failed to update notification');
      }
    } finally {
      setReadingNotificationId(null);
    }
  };

  const handleReportStatusChange = async (reportId: string, status: ReportStatus) => {
    setReviewingReportId(reportId);
    try {
      await reviewReportStatus({ role, reportId, status });
    } catch (error: any) {
      if (error instanceof ModerationValidationError) {
        Alert.alert('Moderation error', error.message);
      } else {
        Alert.alert('Moderation error', error?.message ?? 'Failed to update report');
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
        Alert.alert('Moderation error', error.message);
      } else {
        Alert.alert('Moderation error', error?.message ?? 'Failed to hide content');
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
      Alert.alert('Updated', 'The account was marked as an organization.');
    } catch (error: any) {
      if (error instanceof OrganizationValidationError) {
        Alert.alert('Organization error', error.message);
      } else {
        Alert.alert('Organization error', error?.message ?? 'Failed to update account role');
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
      Alert.alert('Updated', 'The subscription plan was updated.');
    } catch (error: any) {
      if (error instanceof SubscriptionValidationError) {
        Alert.alert('Plan error', error.message);
      } else {
        Alert.alert('Plan error', error?.message ?? 'Failed to update plan');
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
        Alert.alert('Analytics error', error.message);
      } else {
        Alert.alert('Analytics error', error?.message ?? 'Failed to load analytics');
      }
    } finally {
      setAnalyticsLoading(false);
    }
  }, [role]);

  React.useEffect(() => {
    if (role !== 'admin') {
      setAnalytics(null);
      return;
    }

    void handleLoadAnalytics();
  }, [role, handleLoadAnalytics]);

  if (loadingProfile) {
    return <LoadingState label="Loading profile..." />;
  }

  return (
    <ScreenContainer scroll contentContainerStyle={styles.content}>
      <AppHeader
        eyebrow="Profile"
        title="Account, settings, and operator tools."
        subtitle="Everything stays on one screen for now, but the layout is grouped more intentionally to reduce clutter."
      />

      <View style={styles.stack}>
        <Card>
          <Section
            title={username || 'Your profile'}
            subtitle={email ?? 'No email available'}
          >
            <View style={styles.metricRow}>
              <MetricTile label="Role" value={role} accent />
              <MetricTile label="XP" value={xp} />
              <MetricTile
                label="Plan"
                value={subscription?.planLevel ?? 'free'}
              />
            </View>
            <InfoRow label="Plan status" value={subscription?.status ?? 'inactive'} />
            <InfoRow label="Unread notifications" value={String(unreadNotificationsCount)} subtle />
          </Section>
        </Card>

        <Card>
          <Section
            title="Edit profile"
            subtitle="Refine your public identity and personal preferences."
          >
            <TextField
              label="Username"
              placeholder="Username"
              value={username}
              onChangeText={setUsername}
            />
            <TextField
              label="Bio"
              placeholder="Short bio"
              value={bio}
              onChangeText={setBio}
              multiline
              style={styles.bioInput}
            />

            <View style={styles.inlineSection}>
              <Text style={styles.inlineLabel}>Language</Text>
              <View style={styles.chipRow}>
                <FilterChip label="English" active={language === 'en'} onPress={() => setLanguage('en')} />
                <FilterChip label="Arabic" active={language === 'ar'} onPress={() => setLanguage('ar')} />
              </View>
            </View>

            <View style={styles.switchCard}>
              <View style={styles.switchCopy}>
                <Text style={styles.switchTitle}>Privacy mode</Text>
                <Text style={styles.switchSubtitle}>
                  Reduce profile visibility for future social features.
                </Text>
              </View>
              <Switch value={privacyMode} onValueChange={setPrivacyMode} />
            </View>
          </Section>
        </Card>

        <Card>
          <Section
            title="Saved favorites"
            subtitle="Posts you bookmarked from Explore for quick access."
          >
            {favoritePosts.length === 0 ? (
              <EmptyState
                title="No saved posts yet"
                subtitle="Bookmark posts from Explore to build your personal shortlist."
              />
            ) : (
              <View style={styles.listStack}>
                {favoritePosts.map(post => (
                  <ItemCard
                    key={post.id}
                    eyebrow={(post.category || 'spot').toUpperCase()}
                    title={post.text}
                    subtitle={
                      post.locationName ||
                      `Lat ${post.lat.toFixed(4)}, Lng ${post.lng.toFixed(4)}`
                    }
                  />
                ))}
              </View>
            )}
          </Section>
        </Card>

        <Card>
          <Section
            title={`Notifications (${unreadNotificationsCount} unread)`}
            subtitle="Stay on top of likes and comments connected to your activity."
          >
            {notifications.length === 0 ? (
              <EmptyState
                title="No notifications yet"
                subtitle="You’ll see activity updates here once people start interacting."
              />
            ) : (
              <View style={styles.listStack}>
                {notifications.map(notification => (
                  <ItemCard
                    key={notification.id}
                    eyebrow={notification.type === 'comment_on_post' ? 'COMMENT' : 'LIKE'}
                    title={notification.message}
                    subtitle={notification.isRead ? 'Read' : 'Unread'}
                    accent={!notification.isRead}
                  >
                    {!notification.isRead ? (
                      <View style={styles.singleAction}>
                        <SecondaryButton
                          label={readingNotificationId === notification.id ? 'Updating...' : 'Mark as Read'}
                          disabled={readingNotificationId === notification.id}
                          onPress={() => handleMarkNotificationRead(notification.id)}
                        />
                      </View>
                    ) : null}
                  </ItemCard>
                ))}
              </View>
            )}
          </Section>
        </Card>

        {role === 'admin' ? (
          <>
            <Card>
              <Section
                title="Organization accounts"
                subtitle="Grant organization capabilities to a target account."
              >
                <TextField
                  label="Target user id"
                  placeholder="User id to mark as organization"
                  value={organizationUserId}
                  onChangeText={setOrganizationUserId}
                />
                <PrimaryButton
                  label={organizationLoading ? 'Updating...' : 'Mark User As Organization'}
                  disabled={organizationLoading}
                  onPress={handleMarkOrganization}
                />
              </Section>
            </Card>

            <Card>
              <Section
                title="Plan management"
                subtitle="Adjust subscription access without leaving the profile workspace."
              >
                <TextField
                  label="Target user id"
                  placeholder="User id to update plan"
                  value={planTargetUserId}
                  onChangeText={setPlanTargetUserId}
                />

                <View style={styles.inlineSection}>
                  <Text style={styles.inlineLabel}>Plan level</Text>
                  <View style={styles.chipRow}>
                    {(['free', 'organization_basic', 'organization_premium'] as PlanLevel[]).map(item => (
                      <FilterChip
                        key={item}
                        label={item}
                        active={planLevel === item}
                        onPress={() => setPlanLevel(item)}
                      />
                    ))}
                  </View>
                </View>

                <View style={styles.inlineSection}>
                  <Text style={styles.inlineLabel}>Plan status</Text>
                  <View style={styles.chipRow}>
                    {(['active', 'inactive', 'trial'] as PlanStatus[]).map(item => (
                      <FilterChip
                        key={item}
                        label={item}
                        active={planStatus === item}
                        onPress={() => setPlanStatus(item)}
                      />
                    ))}
                  </View>
                </View>

                <PrimaryButton
                  label={planLoading ? 'Updating...' : 'Update User Plan'}
                  disabled={planLoading}
                  onPress={handleUpdatePlan}
                />
              </Section>
            </Card>

            <Card>
              <Section
                title="Analytics"
                subtitle="Snapshot metrics across users, content, and platform operations."
              >
                <PrimaryButton
                  label={analyticsLoading ? 'Refreshing...' : 'Refresh Analytics'}
                  disabled={analyticsLoading}
                  onPress={handleLoadAnalytics}
                />

                {analytics ? (
                  <View style={styles.analyticsStack}>
                    <View style={styles.metricGrid}>
                      <MetricTile label="Users" value={analytics.totalUsers} accent />
                      <MetricTile label="Posts" value={analytics.totalPosts} />
                      <MetricTile label="Events" value={analytics.totalPromotedEvents} />
                      <MetricTile label="Reports" value={analytics.totalReports} />
                      <MetricTile label="Comments" value={analytics.totalComments} />
                      <MetricTile label="Likes" value={analytics.totalLikes} />
                      <MetricTile label="Alerts" value={analytics.totalNotifications} />
                      <MetricTile label="Organizations" value={analytics.totalOrganizationAccounts} />
                    </View>

                    <Section title="Posts by category">
                      <View style={styles.listStack}>
                        {analytics.postsByCategory.map(item => (
                          <ItemCard
                            key={`post-${item.category}`}
                            eyebrow="POSTS"
                            title={item.category}
                            subtitle={`Count: ${item.count}`}
                          />
                        ))}
                      </View>
                    </Section>

                    <Section title="Events by category">
                      <View style={styles.listStack}>
                        {analytics.eventsByCategory.map(item => (
                          <ItemCard
                            key={`event-${item.category}`}
                            eyebrow="EVENTS"
                            title={item.category}
                            subtitle={`Count: ${item.count}`}
                          />
                        ))}
                      </View>
                    </Section>

                    <Section title="Reports by status">
                      <View style={styles.listStack}>
                        {analytics.reportsByStatus.map(item => (
                          <ItemCard
                            key={`report-${item.status}`}
                            eyebrow="REPORTS"
                            title={item.status}
                            subtitle={`Count: ${item.count}`}
                          />
                        ))}
                      </View>
                    </Section>
                  </View>
                ) : (
                  <EmptyState
                    title="No analytics loaded yet"
                    subtitle="Use refresh to request the latest admin snapshot."
                  />
                )}
              </Section>
            </Card>

            <Card>
              <Section
                title="Moderation"
                subtitle="Review user reports and take follow-up actions."
              >
                {reports.length === 0 ? (
                  <EmptyState
                    title="No reports to review"
                    subtitle="When users report posts or comments, they will show up here."
                  />
                ) : (
                  <View style={styles.listStack}>
                    {reports.map(report => (
                      <ItemCard
                        key={report.id}
                        eyebrow={`${report.targetType.toUpperCase()} REPORT`}
                        title={`Reporter: ${report.reporterUserId}`}
                        subtitle={`Target: ${report.targetId} • Reason: ${report.reason}`}
                      >
                        <Text style={styles.reportMeta}>Status: {report.status}</Text>
                        <Text style={styles.reportMeta}>Note: {report.note || 'No note'}</Text>
                        <View style={styles.chipRow}>
                          {(['open', 'reviewed', 'dismissed', 'action_taken'] as ReportStatus[]).map(status => (
                            <FilterChip
                              key={status}
                              label={status}
                              active={report.status === status}
                              onPress={() => handleReportStatusChange(report.id, status)}
                              disabled={reviewingReportId === report.id}
                            />
                          ))}
                        </View>
                        <View style={styles.singleAction}>
                          <SecondaryButton
                            label={
                              reviewingReportId === report.id
                                ? 'Updating...'
                                : 'Hide Reported Content'
                            }
                            disabled={reviewingReportId === report.id}
                            onPress={() => handleHideReportedTarget(report)}
                          />
                        </View>
                      </ItemCard>
                    ))}
                  </View>
                )}
              </Section>
            </Card>
          </>
        ) : null}

        <View style={styles.footerActions}>
          <PrimaryButton
            label="Save Settings"
            loading={saving}
            onPress={handleSave}
          />
          <SecondaryButton
            label={logoutLoading ? 'Signing Out...' : 'Sign Out'}
            disabled={logoutLoading}
            onPress={handleLogout}
          />
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: spacing.xxxl,
  },
  stack: {
    gap: spacing.lg,
  },
  metricRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  analyticsStack: {
    gap: spacing.xl,
  },
  inlineSection: {
    gap: spacing.sm,
  },
  inlineLabel: {
    ...typography.label,
    color: colors.textSubtle,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  switchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.lg,
    padding: spacing.lg,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
  },
  switchCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  switchTitle: {
    ...typography.button,
    color: colors.text,
  },
  switchSubtitle: {
    ...typography.caption,
  },
  bioInput: {
    minHeight: 110,
    textAlignVertical: 'top',
  },
  listStack: {
    gap: spacing.sm,
  },
  itemCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceMuted,
    padding: spacing.lg,
  },
  itemCardAccent: {
    backgroundColor: colors.primarySoft,
    borderColor: '#C9DBF6',
  },
  itemEyebrow: {
    ...typography.label,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  itemEyebrowAccent: {
    color: colors.primaryPressed,
  },
  itemTitle: {
    ...typography.body,
    fontWeight: '600',
  },
  itemSubtitle: {
    ...typography.caption,
    marginTop: spacing.xs,
  },
  itemContent: {
    marginTop: spacing.md,
    gap: spacing.md,
  },
  singleAction: {
    alignSelf: 'flex-start',
    minWidth: 180,
  },
  reportMeta: {
    ...typography.caption,
  },
  footerActions: {
    gap: spacing.md,
    marginTop: spacing.sm,
  },
});
