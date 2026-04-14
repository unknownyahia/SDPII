import React from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';

import { AppHeader } from '../../components/ui/AppHeader';
import { PrimaryButton } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { FilterChip } from '../../components/ui/Chip';
import { InfoRow } from '../../components/ui/InfoRow';
import { MetricTile } from '../../components/ui/MetricTile';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { Section } from '../../components/ui/Section';
import { TextField } from '../../components/ui/TextField';
import { useAuth } from '../../context/AuthContext';
import { subscribeToActivePromotedEventsCountByCreator } from '../../repositories/eventRepository';
import {
  createPromotedEvent,
  EventPermissionError,
  EventValidationError,
} from '../../services/eventService';
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
import { showAlert } from '../../utils/showAlert';
import type { SpotCategory } from '../../types/post';
import type { UserSubscription } from '../../types/subscription';

const CATEGORIES = [
  { id: 'fishing', label: 'Fishing' },
  { id: 'event', label: 'Event' },
  { id: 'sighting', label: 'Sighting' },
  { id: 'weather', label: 'Weather' },
] as const satisfies readonly {
  id: SpotCategory;
  label: string;
}[];

function StatusBanner({
  title,
  body,
  tone = 'neutral',
}: {
  title: string;
  body: string;
  tone?: 'neutral' | 'warning' | 'success';
}) {
  return (
    <View
      style={[
        styles.banner,
        tone === 'warning' && styles.bannerWarning,
        tone === 'success' && styles.bannerSuccess,
      ]}
    >
      <Text style={styles.bannerTitle}>{title}</Text>
      <Text style={styles.bannerBody}>{body}</Text>
    </View>
  );
}

export function PostScreen() {
  const { user } = useAuth();
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  const isWideLayout = isWeb && width >= 1040;
  const useSplitTimeFields = isWeb && width >= 880;
  const [userRole, setUserRole] = React.useState<string>('user');
  const [subscription, setSubscription] = React.useState<UserSubscription | null>(null);
  const [activePromotedEventsCount, setActivePromotedEventsCount] = React.useState(0);
  const [postText, setPostText] = React.useState('');
  const [category, setCategory] = React.useState<SpotCategory>('fishing');
  const [postLoading, setPostLoading] = React.useState(false);
  const [locationName, setLocationName] = React.useState('');
  const [lastPostSuccess, setLastPostSuccess] = React.useState(false);
  const [eventTitle, setEventTitle] = React.useState('');
  const [eventDescription, setEventDescription] = React.useState('');
  const [eventCategory, setEventCategory] = React.useState<SpotCategory>('event');
  const [eventStartTime, setEventStartTime] = React.useState('');
  const [eventEndTime, setEventEndTime] = React.useState('');
  const [eventLoading, setEventLoading] = React.useState(false);
  const [eventLocationName, setEventLocationName] = React.useState('');
  const [lastEventSuccess, setLastEventSuccess] = React.useState(false);

  React.useEffect(() => {
    if (!user) {
      setUserRole('user');
      return;
    }

    const unsubscribe = observeCurrentUserProfile(
      { user },
      profile => {
        setUserRole(profile.role);
      },
      error => {
        showAlert('Post setup error', error?.message ?? 'Failed to load your role.');
      }
    );

    return unsubscribe;
  }, [user]);

  React.useEffect(() => {
    const unsubscribe = observeUserSubscription(
      user?.id,
      nextSubscription => {
        setSubscription(nextSubscription.userId ? nextSubscription : null);
      },
      error => {
        showAlert(
          'Subscription error',
          error?.message ?? 'Failed to load your plan details.'
        );
      }
    );

    return unsubscribe;
  }, [user?.id]);

  React.useEffect(() => {
    if (!user?.id) {
      setActivePromotedEventsCount(0);
      return;
    }

    const unsubscribe = subscribeToActivePromotedEventsCountByCreator(
      user.id,
      setActivePromotedEventsCount,
      error => {
        showAlert(
          'Event access error',
          error?.message ?? 'Failed to load your active promoted event count.'
        );
      }
    );

    return unsubscribe;
  }, [user?.id]);

  const remainingChars = 280 - postText.length;
  const promotedEventAccess = getPromotedEventAccessState({
    userRole,
    subscription,
    activePromotedEventsCount,
  });

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
      setPostText('');
      setLastPostSuccess(true);
      showAlert('Post created', 'Your activity update has been saved with GPS.');
    } catch (error: any) {
      if (error instanceof PostValidationError) {
        const title = user ? 'Empty post' : 'Not logged in';
        showAlert(title, error.message);
      } else if (error instanceof PostLocationPermissionError) {
        showAlert('Location permission denied', error.message);
      } else {
        showAlert('Create post error', error?.message ?? 'Something went wrong');
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
      showAlert('Event created', 'Your promoted event was saved successfully.');
    } catch (error: any) {
      if (error instanceof EventValidationError) {
        showAlert('Event validation', error.message);
      } else if (error instanceof EventPermissionError) {
        showAlert('Location permission denied', error.message);
      } else {
        showAlert('Create event error', error?.message ?? 'Something went wrong');
      }
    } finally {
      setEventLoading(false);
    }
  };

  return (
    <ScreenContainer
      scroll
      contentContainerStyle={[styles.content, isWideLayout && styles.contentWide]}
    >
      <AppHeader
        eyebrow="Post"
        title="Create a cleaner update flow."
        subtitle="Share a location-based post, and if you’re an organization account, publish promoted events from the same polished workspace."
      />

      <View style={[styles.workspace, isWideLayout && styles.workspaceWide]}>
        <View
          style={[
            styles.workspacePrimaryColumn,
            isWideLayout && styles.workspacePrimaryColumnWide,
          ]}
        >
          <Card style={styles.postCard}>
            <Section
              title="Create a spot update"
              subtitle="Short, local, useful updates work best here."
            >
              {isWeb ? (
                <StatusBanner
                  title="Browser location will be requested when you post"
                  body="Allow browser location access when prompted. Outside localhost, web geolocation requires HTTPS."
                />
              ) : null}

              {!user ? (
                <StatusBanner
                  title="Sign-in required"
                  body="You need to be signed in before creating a location-based post."
                  tone="warning"
                />
              ) : null}

              <View style={styles.inlineSection}>
                <Text style={styles.inlineLabel}>Category</Text>
                <View style={styles.chipRow}>
                  {CATEGORIES.map(item => (
                    <FilterChip
                      key={item.id}
                      label={item.label}
                      active={category === item.id}
                      onPress={() => setCategory(item.id)}
                    />
                  ))}
                </View>
              </View>

              <TextField
                label="Post text"
                placeholder="Describe conditions, crowds, weather, or what you found..."
                multiline
                value={postText}
                onChangeText={setPostText}
                maxLength={280}
                style={styles.postInput}
                helperText={`${remainingChars} characters left`}
              />

              {locationName ? (
                <InfoRow label="Last known location" value={locationName} subtle />
              ) : (
                <InfoRow
                  label="Location"
                  value={
                    isWeb
                      ? 'Will be requested from your browser when you post'
                      : 'Will be requested when you post'
                  }
                  subtle
                />
              )}

              {lastPostSuccess ? (
                <StatusBanner
                  title="Post published"
                  body="Your most recent post was created successfully."
                  tone="success"
                />
              ) : null}

              <PrimaryButton
                label="Post With GPS"
                loading={postLoading}
                disabled={!user}
                onPress={handleCreatePost}
              />
            </Section>
          </Card>
        </View>

        <View
          style={[
            styles.workspaceSecondaryColumn,
            isWideLayout && styles.workspaceSecondaryColumnWide,
          ]}
        >
          {userRole === 'organization' ? (
            <Card>
              <Section
                title="Promoted event studio"
                subtitle="Create promoted events with clearer plan visibility and stronger event-specific hierarchy."
              >
                <View style={styles.metricRow}>
                  <MetricTile
                    label="Plan"
                    value={(subscription?.planLevel ?? 'free').replace('_', ' ')}
                    accent
                  />
                  <MetricTile
                    label="Status"
                    value={subscription?.status ?? 'inactive'}
                  />
                  <MetricTile
                    label="Active"
                    value={`${activePromotedEventsCount}/${promotedEventAccess.maxActivePromotedEvents}`}
                  />
                </View>

                <InfoRow
                  label="Analytics access"
                  value={
                    promotedEventAccess.analyticsEnabled
                      ? 'Premium analytics available'
                      : 'Upgrade to organization_premium'
                  }
                />

                {!promotedEventAccess.allowed ? (
                  <StatusBanner
                    title="Plan restriction"
                    body={promotedEventAccess.message}
                    tone="warning"
                  />
                ) : null}

                <TextField
                  label="Event title"
                  placeholder="Event title"
                  value={eventTitle}
                  onChangeText={setEventTitle}
                />

                <TextField
                  label="Event description"
                  placeholder="Describe the event, value, timing, and any important details"
                  value={eventDescription}
                  onChangeText={setEventDescription}
                  multiline
                  style={styles.eventDescription}
                />

                <View style={styles.inlineSection}>
                  <Text style={styles.inlineLabel}>Event category</Text>
                  <View style={styles.chipRow}>
                    {CATEGORIES.map(item => (
                      <FilterChip
                        key={`event-${item.id}`}
                        label={item.label}
                        active={eventCategory === item.id}
                        onPress={() => setEventCategory(item.id)}
                      />
                    ))}
                  </View>
                </View>

                <View
                  style={[
                    styles.timeGrid,
                    useSplitTimeFields && styles.timeGridWide,
                  ]}
                >
                  <View style={styles.timeField}>
                    <TextField
                      label="Start time"
                      placeholder={isWeb ? '2026-04-10T18:00' : '2026-04-10T18:00:00Z'}
                      value={eventStartTime}
                      onChangeText={setEventStartTime}
                      helperText={
                        isWeb
                          ? 'Uses your browser local time. Example: 2026-04-10T18:00'
                          : undefined
                      }
                      webType="datetime-local"
                    />
                  </View>

                  <View style={styles.timeField}>
                    <TextField
                      label="End time"
                      placeholder={isWeb ? '2026-04-10T20:00' : '2026-04-10T20:00:00Z'}
                      value={eventEndTime}
                      onChangeText={setEventEndTime}
                      onSubmitEditing={handleCreateEvent}
                      helperText={
                        isWeb
                          ? 'Uses your browser local time. Example: 2026-04-10T20:00'
                          : undefined
                      }
                      webType="datetime-local"
                    />
                  </View>
                </View>

                {eventLocationName ? (
                  <InfoRow label="Event location" value={eventLocationName} subtle />
                ) : (
                  <InfoRow
                    label="Location"
                    value={
                      isWeb
                        ? 'Will be captured from your browser when the event is created'
                        : 'Will be captured when the event is created'
                    }
                    subtle
                  />
                )}

                {lastEventSuccess ? (
                  <StatusBanner
                    title="Event published"
                    body="Your promoted event was created successfully."
                    tone="success"
                  />
                ) : null}

                <PrimaryButton
                  label="Create Promoted Event"
                  loading={eventLoading}
                  disabled={!promotedEventAccess.allowed}
                  onPress={handleCreateEvent}
                />
              </Section>
            </Card>
          ) : (
            <Card style={styles.secondaryInfoCard} muted>
              <Section
                title="Organization events"
                subtitle="Promoted event creation is reserved for organization accounts with an eligible plan."
              >
                <StatusBanner
                  title="Not enabled on this account"
                  body="The event creation workspace appears here automatically for organization users with the correct role."
                />
              </Section>
            </Card>
          )}
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: spacing.xxxl,
  },
  contentWide: {
    paddingBottom: spacing.xxxl + spacing.md,
  },
  workspace: {
    gap: spacing.lg,
  },
  workspaceWide: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  workspacePrimaryColumn: {
    gap: spacing.lg,
  },
  workspacePrimaryColumnWide: {
    flex: 1.15,
    minWidth: 0,
  },
  workspaceSecondaryColumn: {
    gap: spacing.lg,
  },
  workspaceSecondaryColumnWide: {
    flex: 0.95,
    minWidth: 340,
    maxWidth: 460,
  },
  postCard: {
    minHeight: 100,
  },
  secondaryInfoCard: {
    minHeight: 260,
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
  postInput: {
    minHeight: 140,
    textAlignVertical: 'top',
  },
  eventDescription: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  timeGrid: {
    gap: spacing.md,
  },
  timeGridWide: {
    flexDirection: 'row',
  },
  timeField: {
    flex: 1,
  },
  metricRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  banner: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  bannerWarning: {
    backgroundColor: colors.warningSoft,
    borderColor: '#F1DEB3',
  },
  bannerSuccess: {
    backgroundColor: colors.successSoft,
    borderColor: '#BDE4CF',
  },
  bannerTitle: {
    ...typography.button,
    color: colors.text,
  },
  bannerBody: {
    ...typography.bodyMuted,
  },
});
