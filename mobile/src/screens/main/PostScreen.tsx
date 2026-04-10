import React from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '../../components/ui/AppHeader';
import { PrimaryButton, SecondaryButton } from '../../components/ui/Button';
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

    const unsubscribe = observeCurrentUserProfile({ user }, profile => {
      setUserRole(profile.role);
    });

    return unsubscribe;
  }, [user]);

  React.useEffect(() => {
    const unsubscribe = observeUserSubscription(user?.id, nextSubscription => {
      setSubscription(nextSubscription.userId ? nextSubscription : null);
    });

    return unsubscribe;
  }, [user?.id]);

  React.useEffect(() => {
    if (!user?.id) {
      setActivePromotedEventsCount(0);
      return;
    }

    const unsubscribe = subscribeToActivePromotedEventsCountByCreator(
      user.id,
      setActivePromotedEventsCount
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
      Alert.alert('Post created', 'Your activity update has been saved with GPS.');
    } catch (error: any) {
      if (error instanceof PostValidationError) {
        const title = user ? 'Empty post' : 'Not logged in';
        Alert.alert(title, error.message);
      } else if (error instanceof PostLocationPermissionError) {
        Alert.alert('Location permission denied', error.message);
      } else {
        Alert.alert('Create post error', error?.message ?? 'Something went wrong');
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
      Alert.alert('Event created', 'Your promoted event was saved successfully.');
    } catch (error: any) {
      if (error instanceof EventValidationError) {
        Alert.alert('Event validation', error.message);
      } else if (error instanceof EventPermissionError) {
        Alert.alert('Location permission denied', error.message);
      } else {
        Alert.alert('Create event error', error?.message ?? 'Something went wrong');
      }
    } finally {
      setEventLoading(false);
    }
  };

  return (
    <ScreenContainer scroll contentContainerStyle={styles.content}>
      <AppHeader
        eyebrow="Post"
        title="Create a cleaner update flow."
        subtitle="Share a location-based post, and if you’re an organization account, publish promoted events from the same polished workspace."
      />

      <View style={styles.stack}>
        <Card>
          <Section
            title="Create a spot update"
            subtitle="Short, local, useful updates work best here."
          >
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
              <InfoRow label="Location" value="Will be requested when you post" subtle />
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

              <TextField
                label="Start time"
                placeholder="2026-04-10T18:00:00Z"
                value={eventStartTime}
                onChangeText={setEventStartTime}
              />

              <TextField
                label="End time"
                placeholder="2026-04-10T20:00:00Z"
                value={eventEndTime}
                onChangeText={setEventEndTime}
              />

              {eventLocationName ? (
                <InfoRow label="Event location" value={eventLocationName} subtle />
              ) : (
                <InfoRow label="Location" value="Will be captured when the event is created" subtle />
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
          <Card>
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
  metricRow: {
    flexDirection: 'row',
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
