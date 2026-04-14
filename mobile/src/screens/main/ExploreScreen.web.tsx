import React from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';

import { ExploreMapSurface } from '../../components/explore/ExploreMapSurface.web';
import { AppHeader } from '../../components/ui/AppHeader';
import { PrimaryButton, SecondaryButton } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { FilterChip } from '../../components/ui/Chip';
import { EmptyState } from '../../components/ui/EmptyState';
import { InfoRow } from '../../components/ui/InfoRow';
import { LoadingState } from '../../components/ui/LoadingState';
import { MetricTile } from '../../components/ui/MetricTile';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { Section } from '../../components/ui/Section';
import { TextField } from '../../components/ui/TextField';
import { useAuth } from '../../context/AuthContext';
import { subscribeToEvents } from '../../repositories/eventRepository';
import { subscribeToPosts } from '../../repositories/postsRepository';
import {
  addCommentToPost,
  CommentValidationError,
  deleteOwnComment,
  observeCommentsForPost,
} from '../../services/commentService';
import {
  filterExploreEvents,
  filterExplorePosts,
  type CategoryFilter,
} from '../../services/exploreService';
import {
  FavoriteValidationError,
  observeFavoritePostIds,
  toggleFavoritePost,
} from '../../services/favoriteService';
import {
  getCurrentCoordinates,
  requestForegroundLocationPermission,
} from '../../services/locationService';
import {
  ReactionValidationError,
  observeLikeUserIdsForPost,
  togglePostLike,
} from '../../services/reactionService';
import {
  ReportValidationError,
  submitReport,
} from '../../services/reportService';
import { summarizeAreaPosts } from '../../services/summaryService';
import { colors, radius, spacing, typography } from '../../theme/designSystem';
import { showAlert } from '../../utils/showAlert';
import type { PostComment } from '../../types/comment';
import type { PromotedEvent } from '../../types/event';
import type { SpotCategory, SpotPost } from '../../types/post';
import type { ReportReason, ReportTargetType } from '../../types/report';

const FILTERS: readonly { id: CategoryFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'fishing', label: 'Fishing' },
  { id: 'event', label: 'Event' },
  { id: 'sighting', label: 'Sighting' },
  { id: 'weather', label: 'Weather' },
];

const REPORT_REASONS: readonly ReportReason[] = [
  'spam',
  'misleading',
  'offensive',
  'unsafe',
  'other',
];

type BrowserCoordinates = {
  latitude: number;
  longitude: number;
};

type RankedPost = {
  post: SpotPost;
  distanceKm: number | null;
  createdAtMs: number | null;
};

type RankedEvent = {
  event: PromotedEvent;
  distanceKm: number | null;
  startAtMs: number | null;
};

type SelectedResult =
  | { kind: 'post'; id: string }
  | { kind: 'event'; id: string };

type BannerTone = 'neutral' | 'warning' | 'success';

type BannerState = {
  tone: BannerTone;
  title: string;
  body: string;
};

function formatCategoryLabel(category?: SpotCategory) {
  if (!category) {
    return 'Spot';
  }

  return category.charAt(0).toUpperCase() + category.slice(1);
}

function formatReasonLabel(reason: ReportReason) {
  return reason.charAt(0).toUpperCase() + reason.slice(1);
}

function formatDateLabel(value: string) {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString();
}

function formatLocationLabel(input: {
  locationName?: string | null;
  lat: number;
  lng: number;
}) {
  return (
    input.locationName ||
    `Lat ${input.lat.toFixed(4)}, Lng ${input.lng.toFixed(4)}`
  );
}

function getTimestampMs(value: unknown) {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value.getTime();
  }

  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed.getTime();
  }

  if (typeof value === 'object') {
    const candidate = value as {
      toDate?: () => Date;
      seconds?: number;
    };

    if (typeof candidate.toDate === 'function') {
      const parsed = candidate.toDate();
      return Number.isNaN(parsed.getTime()) ? null : parsed.getTime();
    }

    if (typeof candidate.seconds === 'number') {
      return candidate.seconds * 1000;
    }
  }

  return null;
}

function formatTimestampLabel(value: number | null) {
  if (value === null) {
    return 'Pending timestamp';
  }

  return new Date(value).toLocaleString();
}

function calculateDistanceKm(
  origin: BrowserCoordinates,
  destination: { lat: number; lng: number }
) {
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const latitudeDelta = toRadians(destination.lat - origin.latitude);
  const longitudeDelta = toRadians(destination.lng - origin.longitude);
  const originLatitude = toRadians(origin.latitude);
  const destinationLatitude = toRadians(destination.lat);

  const a =
    Math.sin(latitudeDelta / 2) * Math.sin(latitudeDelta / 2) +
    Math.cos(originLatitude) *
      Math.cos(destinationLatitude) *
      Math.sin(longitudeDelta / 2) *
      Math.sin(longitudeDelta / 2);

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDistanceLabel(distanceKm: number | null) {
  if (distanceKm === null) {
    return 'Distance ranking unavailable';
  }

  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)} m away`;
  }

  return `${distanceKm.toFixed(distanceKm < 10 ? 1 : 0)} km away`;
}

function formatCoordinatesLabel(coords: BrowserCoordinates) {
  return `Lat ${coords.latitude.toFixed(4)}, Lng ${coords.longitude.toFixed(4)}`;
}

function StatusBanner({
  title,
  body,
  tone = 'neutral',
}: BannerState) {
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

function ResultCard({
  eyebrow,
  title,
  body,
  meta,
  selected = false,
  onPress,
}: {
  eyebrow: string;
  title: string;
  body: string;
  meta: string;
  selected?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.dataCard,
        selected && styles.dataCardSelected,
        pressed && styles.dataCardPressed,
      ]}
    >
      <Text style={styles.dataEyebrow}>{eyebrow}</Text>
      <Text style={styles.dataTitle}>{title}</Text>
      <Text style={styles.dataBody}>{body}</Text>
      <Text style={styles.dataMeta}>{meta}</Text>
    </Pressable>
  );
}

function CommentCard({
  comment,
  canDelete,
  deleting,
  onDelete,
  onReport,
}: {
  comment: PostComment;
  canDelete: boolean;
  deleting: boolean;
  onDelete: () => void;
  onReport: () => void;
}) {
  return (
    <View style={styles.commentCard}>
      <View style={styles.commentHeader}>
        <View style={styles.commentHeaderCopy}>
          <Text style={styles.commentAuthor}>{comment.authorLabel}</Text>
          <Text style={styles.commentTimestamp}>
            {formatTimestampLabel(getTimestampMs(comment.createdAt))}
          </Text>
        </View>

        <View style={styles.commentActionsInline}>
          <Pressable onPress={onReport}>
            <Text style={styles.commentActionText}>Report</Text>
          </Pressable>
          {canDelete ? (
            <Pressable onPress={onDelete} disabled={deleting}>
              <Text style={[styles.commentActionText, styles.commentDeleteText]}>
                {deleting ? 'Deleting...' : 'Delete'}
              </Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      <Text style={styles.commentBody}>{comment.text}</Text>
    </View>
  );
}

export function ExploreScreen() {
  const { user } = useAuth();
  const { width } = useWindowDimensions();
  const isWideLayout = Platform.OS === 'web' && width >= 960;
  const isDesktopLayout = Platform.OS === 'web' && width >= 1320;
  const splitResultsLayout = Platform.OS === 'web' && width >= 1120;
  const [events, setEvents] = React.useState<PromotedEvent[]>([]);
  const [posts, setPosts] = React.useState<SpotPost[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedCategory, setSelectedCategory] =
    React.useState<CategoryFilter>('all');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [browserLocation, setBrowserLocation] =
    React.useState<BrowserCoordinates | null>(null);
  const [locationLoading, setLocationLoading] = React.useState(false);
  const [locationStatus, setLocationStatus] = React.useState<BannerState>({
    tone: 'neutral',
    title: 'Interactive web map is active',
    body:
      'The browser version now includes a real interactive map while keeping the list/detail workflow available alongside it.',
  });
  const [selectedResult, setSelectedResult] =
    React.useState<SelectedResult | null>(null);
  const [summaryLoading, setSummaryLoading] = React.useState(false);
  const [summary, setSummary] = React.useState<string | null>(null);
  const [favoritePostIds, setFavoritePostIds] = React.useState<string[]>([]);
  const [favoriteLoading, setFavoriteLoading] = React.useState(false);
  const [comments, setComments] = React.useState<PostComment[]>([]);
  const [commentText, setCommentText] = React.useState('');
  const [commentLoading, setCommentLoading] = React.useState(false);
  const [deletingCommentId, setDeletingCommentId] = React.useState<string | null>(null);
  const [likeUserIds, setLikeUserIds] = React.useState<string[]>([]);
  const [likeLoading, setLikeLoading] = React.useState(false);
  const [reportLoading, setReportLoading] = React.useState(false);
  const [reportReason, setReportReason] = React.useState<ReportReason>('spam');
  const [reportNote, setReportNote] = React.useState('');
  const [reportTargetType, setReportTargetType] = React.useState<ReportTargetType>('post');
  const [reportTargetId, setReportTargetId] = React.useState<string | null>(null);
  const [detailFeedback, setDetailFeedback] = React.useState<BannerState | null>(null);

  React.useEffect(() => {
    const unsubscribe = subscribeToPosts(
      nextPosts => {
        setPosts(nextPosts);
        setLoading(false);
      },
      error => {
        setLoading(false);
        showAlert('Explore data error', error?.message ?? 'Failed to load posts.');
      }
    );

    return unsubscribe;
  }, []);

  React.useEffect(() => {
    const unsubscribe = subscribeToEvents(setEvents, error => {
      showAlert('Explore data error', error?.message ?? 'Failed to load events.');
    });
    return unsubscribe;
  }, []);

  React.useEffect(() => {
    const unsubscribe = observeFavoritePostIds(
      user?.id,
      setFavoritePostIds,
      error => {
        showAlert('Favorites error', error?.message ?? 'Failed to load favorites.');
      }
    );
    return unsubscribe;
  }, [user?.id]);

  const selectedPostId = selectedResult?.kind === 'post' ? selectedResult.id : null;

  React.useEffect(() => {
    const unsubscribe = observeCommentsForPost(
      selectedPostId,
      setComments,
      error => {
        showAlert('Comments error', error?.message ?? 'Failed to load comments.');
      }
    );
    return unsubscribe;
  }, [selectedPostId]);

  React.useEffect(() => {
    const unsubscribe = observeLikeUserIdsForPost(
      selectedPostId,
      setLikeUserIds,
      error => {
        showAlert('Likes error', error?.message ?? 'Failed to load likes.');
      }
    );
    return unsubscribe;
  }, [selectedPostId]);

  React.useEffect(() => {
    setSummary(null);
  }, [searchQuery, selectedCategory]);

  React.useEffect(() => {
    setCommentText('');
    setReportTargetId(null);
    setReportReason('spam');
    setReportNote('');
    setDetailFeedback(null);
  }, [selectedResult?.id]);

  const filteredPosts = React.useMemo(
    () => filterExplorePosts(posts, selectedCategory, searchQuery),
    [posts, searchQuery, selectedCategory]
  );
  const filteredEvents = React.useMemo(
    () => filterExploreEvents(events, selectedCategory, searchQuery),
    [events, searchQuery, selectedCategory]
  );

  const rankedPosts = React.useMemo<RankedPost[]>(
    () =>
      filteredPosts
        .map(post => ({
          post,
          distanceKm: browserLocation
            ? calculateDistanceKm(browserLocation, post)
            : null,
          createdAtMs: getTimestampMs(post.createdAt),
        }))
        .sort((left, right) => {
          if (left.distanceKm !== null && right.distanceKm !== null) {
            if (left.distanceKm !== right.distanceKm) {
              return left.distanceKm - right.distanceKm;
            }
          } else if (left.distanceKm !== null) {
            return -1;
          } else if (right.distanceKm !== null) {
            return 1;
          }

          return (right.createdAtMs ?? 0) - (left.createdAtMs ?? 0);
        }),
    [browserLocation, filteredPosts]
  );

  const rankedEvents = React.useMemo<RankedEvent[]>(
    () =>
      filteredEvents
        .map(event => ({
          event,
          distanceKm: browserLocation
            ? calculateDistanceKm(browserLocation, event)
            : null,
          startAtMs: getTimestampMs(event.startTime),
        }))
        .sort((left, right) => {
          if (left.distanceKm !== null && right.distanceKm !== null) {
            if (left.distanceKm !== right.distanceKm) {
              return left.distanceKm - right.distanceKm;
            }
          } else if (left.distanceKm !== null) {
            return -1;
          } else if (right.distanceKm !== null) {
            return 1;
          }

          if (left.startAtMs !== null && right.startAtMs !== null) {
            return left.startAtMs - right.startAtMs;
          }

          return (left.startAtMs ?? 0) - (right.startAtMs ?? 0);
        }),
    [browserLocation, filteredEvents]
  );

  const selectedPostEntry = React.useMemo(
    () =>
      selectedResult?.kind === 'post'
        ? rankedPosts.find(item => item.post.id === selectedResult.id) ?? null
        : null,
    [rankedPosts, selectedResult]
  );

  const selectedEventEntry = React.useMemo(
    () =>
      selectedResult?.kind === 'event'
        ? rankedEvents.find(item => item.event.id === selectedResult.id) ?? null
        : null,
    [rankedEvents, selectedResult]
  );

  const favoritePostIdSet = React.useMemo(() => new Set(favoritePostIds), [favoritePostIds]);
  const likeUserIdSet = React.useMemo(() => new Set(likeUserIds), [likeUserIds]);

  const selectedEvent = selectedEventEntry?.event ?? null;
  const selectedPost = selectedPostEntry?.post ?? null;
  const totalVisible = filteredPosts.length + filteredEvents.length;
  const hasNoResults = totalVisible === 0;

  const handleSelectPost = React.useCallback((post: SpotPost) => {
    setSelectedResult({ kind: 'post', id: post.id });
  }, []);

  const handleSelectEvent = React.useCallback((event: PromotedEvent) => {
    setSelectedResult({ kind: 'event', id: event.id });
  }, []);

  React.useEffect(() => {
    const hasSelectedPost =
      selectedResult?.kind === 'post' &&
      rankedPosts.some(item => item.post.id === selectedResult.id);
    const hasSelectedEvent =
      selectedResult?.kind === 'event' &&
      rankedEvents.some(item => item.event.id === selectedResult.id);

    if (hasSelectedPost || hasSelectedEvent) {
      return;
    }

    if (rankedEvents[0]) {
      setSelectedResult({ kind: 'event', id: rankedEvents[0].event.id });
      return;
    }

    if (rankedPosts[0]) {
      setSelectedResult({ kind: 'post', id: rankedPosts[0].post.id });
      return;
    }

    if (selectedResult !== null) {
      setSelectedResult(null);
    }
  }, [rankedEvents, rankedPosts, selectedResult]);

  const handleGenerateSummary = async () => {
    if (filteredPosts.length === 0) {
      setSummary('No posts in this view to summarize.');
      return;
    }

    setSummaryLoading(true);
    try {
      const nextSummary = await summarizeAreaPosts({
        posts: filteredPosts.map(post => ({
          text: post.text,
          category: post.category,
        })),
      });
      setSummary(nextSummary);
    } catch (error: any) {
      setSummary(`Failed to generate summary: ${String(error?.message || error)}`);
    } finally {
      setSummaryLoading(false);
    }
  };

  const handleShareBrowserLocation = async () => {
    setLocationLoading(true);
    try {
      const { status } = await requestForegroundLocationPermission();

      if (status !== 'granted') {
        setLocationStatus({
          tone: 'warning',
          title: 'Browser location was not granted',
          body:
            'Explore remains usable without location, but nearby ranking needs browser location access.',
        });
        return;
      }

      const coords = await getCurrentCoordinates();
      setBrowserLocation(coords);
      setLocationStatus({
        tone: 'success',
        title: 'Nearby ranking is enabled',
        body:
          'Posts and promoted events are now ranked from your current browser location.',
      });
    } catch (error: any) {
      setLocationStatus({
        tone: 'warning',
        title: 'Browser location is unavailable',
        body: error?.message ?? 'Unable to read your browser location right now.',
      });
    } finally {
      setLocationLoading(false);
    }
  };

  const handleToggleFavorite = async () => {
    if (!selectedPost) {
      return;
    }

    setFavoriteLoading(true);
    try {
      const isFavorite = await toggleFavoritePost({
        userId: user?.id,
        postId: selectedPost.id,
        isCurrentlyFavorite: favoritePostIdSet.has(selectedPost.id),
      });

      setDetailFeedback({
        tone: 'success',
        title: isFavorite ? 'Saved to favorites' : 'Removed from favorites',
        body: isFavorite
          ? 'This post now appears in your saved favorites list.'
          : 'This post is no longer in your saved favorites list.',
      });
    } catch (error: any) {
      setDetailFeedback({
        tone: 'warning',
        title: 'Favorite update failed',
        body:
          error instanceof FavoriteValidationError
            ? error.message
            : error?.message ?? 'Failed to update your favorites.',
      });
    } finally {
      setFavoriteLoading(false);
    }
  };

  const handleToggleLike = async () => {
    if (!selectedPost) {
      return;
    }

    setLikeLoading(true);
    try {
      const isLiked = await togglePostLike({
        postId: selectedPost.id,
        userId: user?.id,
        isCurrentlyLiked: !!(user?.id && likeUserIdSet.has(user.id)),
      });

      setDetailFeedback({
        tone: 'success',
        title: isLiked ? 'Post liked' : 'Like removed',
        body: isLiked
          ? 'Your like was saved on this post.'
          : 'Your like was removed from this post.',
      });
    } catch (error: any) {
      setDetailFeedback({
        tone: 'warning',
        title: 'Like update failed',
        body:
          error instanceof ReactionValidationError
            ? error.message
            : error?.message ?? 'Failed to update this like.',
      });
    } finally {
      setLikeLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!selectedPost) {
      return;
    }

    setCommentLoading(true);
    try {
      await addCommentToPost({
        postId: selectedPost.id,
        userId: user?.id,
        authorLabel: user?.displayInfo,
        text: commentText,
      });
      setCommentText('');
      setDetailFeedback({
        tone: 'success',
        title: 'Comment posted',
        body: 'Your comment was added to this spot.',
      });
    } catch (error: any) {
      setDetailFeedback({
        tone: 'warning',
        title: 'Comment failed',
        body:
          error instanceof CommentValidationError
            ? error.message
            : error?.message ?? 'Failed to add this comment.',
      });
    } finally {
      setCommentLoading(false);
    }
  };

  const handleDeleteComment = async (comment: PostComment) => {
    if (!selectedPost) {
      return;
    }

    setDeletingCommentId(comment.id);
    try {
      await deleteOwnComment({
        postId: selectedPost.id,
        commentId: comment.id,
        currentUserId: user?.id,
        commentUserId: comment.userId,
      });
      setDetailFeedback({
        tone: 'success',
        title: 'Comment deleted',
        body: 'Your comment was removed from this post.',
      });
    } catch (error: any) {
      setDetailFeedback({
        tone: 'warning',
        title: 'Delete failed',
        body:
          error instanceof CommentValidationError
            ? error.message
            : error?.message ?? 'Failed to delete this comment.',
      });
    } finally {
      setDeletingCommentId(null);
    }
  };

  const openReportComposer = (targetType: ReportTargetType, targetId: string) => {
    setReportTargetType(targetType);
    setReportTargetId(targetId);
    setReportReason('spam');
    setReportNote('');
  };

  const handleSubmitReport = async () => {
    if (!reportTargetId) {
      return;
    }

    setReportLoading(true);
    try {
      await submitReport({
        reporterUserId: user?.id,
        targetType: reportTargetType,
        targetId: reportTargetId,
        targetPostId: selectedPost?.id ?? null,
        reason: reportReason,
        note: reportNote,
      });

      setReportTargetId(null);
      setReportNote('');
      setDetailFeedback({
        tone: 'success',
        title: 'Report submitted',
        body: 'Thanks. Your report has been recorded.',
      });
    } catch (error: any) {
      setDetailFeedback({
        tone: 'warning',
        title: 'Report failed',
        body:
          error instanceof ReportValidationError
            ? error.message
            : error?.message ?? 'Failed to submit this report.',
      });
    } finally {
      setReportLoading(false);
    }
  };

  if (loading) {
    return <LoadingState label="Loading spots and events..." />;
  }

  return (
    <ScreenContainer
      scroll
      contentContainerStyle={[
        styles.content,
        isDesktopLayout && styles.contentDesktop,
      ]}
    >
      <AppHeader
        eyebrow="Explore"
        title="Explore on web with a real interactive map."
        subtitle="Filters, shared Firestore data, live map markers, selection details, social actions, and backend summaries are all available in the browser now."
      />

      <View style={[styles.stack, isDesktopLayout && styles.stackDesktop]}>
        <View style={[styles.overviewGrid, isWideLayout && styles.overviewGridWide]}>
          <View
            style={[
              styles.overviewPrimaryColumn,
              isWideLayout && styles.overviewPrimaryColumnWide,
            ]}
          >
            <Card>
              <Section
                title="Web status"
                subtitle="The browser map is live now, and the list/detail workflow remains available as a complementary fallback and desktop browsing aid."
              >
                <StatusBanner {...locationStatus} />

                <View
                  style={[
                    styles.locationActions,
                    isWideLayout && styles.locationActionsWide,
                  ]}
                >
                  <PrimaryButton
                    label={
                      locationLoading
                        ? 'Checking Browser Location...'
                        : browserLocation
                          ? 'Refresh Browser Location'
                          : 'Use Browser Location'
                    }
                    loading={locationLoading}
                    onPress={handleShareBrowserLocation}
                  />
                  {browserLocation ? (
                    <SecondaryButton
                      label="Keep Filtered List Mode"
                      onPress={() =>
                        setLocationStatus({
                          tone: 'success',
                          title: 'Nearby ranking is enabled',
                          body:
                            'You can keep browsing the filtered lists and detail panel while nearby ranking stays active.',
                        })
                      }
                    />
                  ) : null}
                </View>

                <InfoRow
                  label="Map surface"
                  value="Interactive web map enabled"
                  subtle
                />
                <InfoRow
                  label="Browser location"
                  value={
                    browserLocation
                      ? formatCoordinatesLabel(browserLocation)
                      : 'Not shared yet'
                  }
                  subtle
                />
              </Section>
            </Card>

            <Card>
              <Section
                title="Explore filters"
                subtitle="Filter current posts and promoted events in a browser-safe browser workspace."
              >
                <TextField
                  placeholder="Search by text or location"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />

                <View style={styles.filterRow}>
                  {FILTERS.map(filter => (
                    <FilterChip
                      key={filter.id}
                      label={filter.label}
                      active={selectedCategory === filter.id}
                      onPress={() => setSelectedCategory(filter.id)}
                    />
                  ))}
                </View>

                <View style={styles.metricRow}>
                  <MetricTile label="Visible" value={totalVisible} accent />
                  <MetricTile label="Posts" value={filteredPosts.length} />
                  <MetricTile label="Events" value={filteredEvents.length} />
                </View>
              </Section>
            </Card>
          </View>

          <View
            style={[
              styles.overviewSecondaryColumn,
              isWideLayout && styles.overviewSecondaryColumnWide,
            ]}
          >
            <Card style={styles.summaryCard}>
              <Section
                title="Area summary"
                subtitle="Generate a concise backend summary from the filtered posts currently visible in your browser workspace."
              >
                <PrimaryButton
                  label="Generate Summary"
                  loading={summaryLoading}
                  onPress={handleGenerateSummary}
                />

                {summary ? (
                  <View style={styles.summaryResult}>
                    <Text style={styles.summaryResultLabel}>Latest summary</Text>
                    <Text style={styles.summaryResultText}>{summary}</Text>
                  </View>
                ) : (
                  <View style={styles.summaryPlaceholder}>
                    <Text style={styles.summaryPlaceholderTitle}>
                      Summary stays tied to the current filters
                    </Text>
                    <Text style={styles.summaryPlaceholderText}>
                      Refine the map view, then generate a concise readout of the visible spot posts.
                    </Text>
                  </View>
                )}
              </Section>
            </Card>
          </View>
        </View>

        <View style={[styles.liveGrid, isWideLayout && styles.liveGridWide]}>
          <View
            style={[
              styles.mapColumn,
              isWideLayout && styles.mapColumnWide,
              isDesktopLayout && styles.mapColumnDesktop,
            ]}
          >
            <Card>
              <Section
                title="Live map"
                subtitle="Click any marker to inspect its detail panel. The selected item stays synced with the list below."
              >
                <ExploreMapSurface
                  posts={filteredPosts}
                  events={filteredEvents}
                  selectedResult={selectedResult}
                  browserLocation={browserLocation}
                  onSelectPost={handleSelectPost}
                  onSelectEvent={handleSelectEvent}
                  style={[
                    styles.mapSurface,
                    isWideLayout && styles.mapSurfaceWide,
                    isDesktopLayout && styles.mapSurfaceDesktop,
                  ]}
                />

                <View style={styles.legendRow}>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, styles.legendDotPost]} />
                    <Text style={styles.legendLabel}>Spot posts</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, styles.legendDotEvent]} />
                    <Text style={styles.legendLabel}>Promoted events</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, styles.legendDotLocation]} />
                    <Text style={styles.legendLabel}>Your location</Text>
                  </View>
                </View>

                <InfoRow
                  label="Selection"
                  value={
                    selectedEvent
                      ? selectedEvent.title
                      : selectedPost
                        ? formatLocationLabel(selectedPost)
                        : 'Click a marker or list item'
                  }
                  subtle
                />
              </Section>
            </Card>
          </View>

          <View
            style={[
              styles.detailColumn,
              isWideLayout && styles.detailColumnWide,
            ]}
          >
            <Card
              style={[
                styles.detailCard,
                isWideLayout && styles.detailCardWide,
              ]}
            >
              <Section
                title="Selected details"
                subtitle="The browser map now drives the same selection state used by the lists, summary flow, and post interactions."
              >
                {selectedEvent ? (
                  <View style={styles.detailStack}>
                    <Text style={styles.detailEyebrow}>PROMOTED EVENT</Text>
                    <Text style={styles.detailTitle}>{selectedEvent.title}</Text>
                    <Text style={styles.detailBody}>{selectedEvent.description}</Text>
                    <InfoRow
                      label="Location"
                      value={formatLocationLabel(selectedEvent)}
                    />
                    <InfoRow
                      label="Starts"
                      value={formatDateLabel(selectedEvent.startTime)}
                      subtle
                    />
                    <InfoRow
                      label="Ends"
                      value={formatDateLabel(selectedEvent.endTime)}
                      subtle
                    />
                    <InfoRow
                      label="Organizer"
                      value={selectedEvent.createdBy || 'Unknown'}
                      subtle
                    />
                    <InfoRow
                      label="Distance"
                      value={formatDistanceLabel(selectedEventEntry?.distanceKm ?? null)}
                      subtle
                    />
                  </View>
                ) : null}

                {selectedPost ? (
                  <View style={styles.detailStack}>
                    {detailFeedback ? <StatusBanner {...detailFeedback} /> : null}

                    {!user ? (
                      <StatusBanner
                        tone="warning"
                        title="Sign in for social actions"
                        body="Likes, bookmarks, comments, and reports require a signed-in account on web just like mobile."
                      />
                    ) : null}

                    <Text style={styles.detailEyebrow}>
                      {formatCategoryLabel(selectedPost.category).toUpperCase()}
                    </Text>
                    <Text style={styles.detailTitle}>
                      {formatLocationLabel(selectedPost)}
                    </Text>
                    <Text style={styles.detailBody}>{selectedPost.text}</Text>

                    <View style={styles.metricRow}>
                      <MetricTile label="Likes" value={likeUserIds.length} accent />
                      <MetricTile label="Comments" value={comments.length} />
                      <MetricTile
                        label="Saved"
                        value={favoritePostIdSet.has(selectedPost.id) ? 'Yes' : 'No'}
                      />
                    </View>

                    <InfoRow
                      label="Posted"
                      value={formatTimestampLabel(selectedPostEntry?.createdAtMs ?? null)}
                    />
                    <InfoRow
                      label="Distance"
                      value={formatDistanceLabel(selectedPostEntry?.distanceKm ?? null)}
                      subtle
                    />

                    <View style={styles.actionGrid}>
                      <PrimaryButton
                        label={
                          user?.id && likeUserIdSet.has(user.id)
                            ? `Liked (${likeUserIds.length})`
                            : `Like (${likeUserIds.length})`
                        }
                        loading={likeLoading}
                        disabled={!user}
                        onPress={handleToggleLike}
                      />
                      <SecondaryButton
                        label={
                          favoritePostIdSet.has(selectedPost.id)
                            ? 'Remove Bookmark'
                            : 'Save Bookmark'
                        }
                        loading={favoriteLoading}
                        disabled={!user}
                        onPress={handleToggleFavorite}
                      />
                    </View>

                    <SecondaryButton
                      label="Report Post"
                      disabled={!user}
                      onPress={() => openReportComposer('post', selectedPost.id)}
                    />

                    <Section
                      title="Comments"
                      subtitle="Commenting, likes, bookmarks, and reports now work in this web map workflow using the same shared data services."
                    >
                      <TextField
                        placeholder="Add a comment"
                        value={commentText}
                        onChangeText={setCommentText}
                        multiline
                        editable={!!user}
                        style={styles.commentInput}
                        helperText={
                          user
                            ? 'Comments post immediately to the shared backend.'
                            : 'Sign in to add a comment.'
                        }
                      />
                      <PrimaryButton
                        label="Add Comment"
                        loading={commentLoading}
                        disabled={!user}
                        onPress={handleAddComment}
                      />

                      {comments.length === 0 ? (
                        <EmptyState
                          title="No comments yet"
                          subtitle="Start the conversation on this spot."
                        />
                      ) : (
                        <View style={styles.listStack}>
                          {comments.map(comment => (
                            <CommentCard
                              key={comment.id}
                              comment={comment}
                              canDelete={user?.id === comment.userId}
                              deleting={deletingCommentId === comment.id}
                              onDelete={() => handleDeleteComment(comment)}
                              onReport={() => openReportComposer('comment', comment.id)}
                            />
                          ))}
                        </View>
                      )}
                    </Section>

                    {reportTargetId ? (
                      <Section
                        title={
                          reportTargetType === 'comment'
                            ? 'Report comment'
                            : 'Report post'
                        }
                        subtitle="Choose the reason that best fits and add an optional note."
                      >
                        <View style={styles.filterRowCompact}>
                          {REPORT_REASONS.map(reason => (
                            <FilterChip
                              key={reason}
                              label={formatReasonLabel(reason)}
                              active={reportReason === reason}
                              onPress={() => setReportReason(reason)}
                            />
                          ))}
                        </View>

                        <TextField
                          placeholder="Optional note"
                          value={reportNote}
                          onChangeText={setReportNote}
                          multiline
                          style={styles.reportNoteInput}
                        />

                        <View style={styles.actionGrid}>
                          <SecondaryButton
                            label="Cancel Report"
                            disabled={reportLoading}
                            onPress={() => setReportTargetId(null)}
                          />
                          <PrimaryButton
                            label="Submit Report"
                            loading={reportLoading}
                            disabled={!user}
                            onPress={handleSubmitReport}
                          />
                        </View>
                      </Section>
                    ) : null}
                  </View>
                ) : null}

                {!selectedEvent && !selectedPost ? (
                  hasNoResults ? (
                    <EmptyState
                      title="No explore data in this view"
                      subtitle="No posts or promoted events matched the current filters."
                    />
                  ) : (
                    <EmptyState
                      title="Select an item"
                      subtitle="Choose a post or promoted event from the map or filtered lists to inspect its details here."
                    />
                  )
                ) : null}
              </Section>
            </Card>
          </View>
        </View>

        <View style={[styles.resultsGrid, splitResultsLayout && styles.resultsGridWide]}>
          <View style={[styles.resultsPane, splitResultsLayout && styles.resultsPaneWide]}>
            <Card>
              <Section
                title="Promoted events"
                subtitle="Current active events under the selected filters. Click any item to sync it with the live map and detail panel."
              >
                {rankedEvents.length === 0 ? (
                  <EmptyState
                    title="No promoted events in view"
                    subtitle="Adjust your filters or publish an event from a qualified organization account."
                  />
                ) : (
                  <View style={styles.listStack}>
                    {rankedEvents.map(item => (
                      <ResultCard
                        key={`event-${item.event.id}`}
                        eyebrow="PROMOTED EVENT"
                        title={item.event.title}
                        body={item.event.description}
                        meta={`${formatDateLabel(item.event.startTime)} • ${formatDistanceLabel(
                          item.distanceKm
                        )}`}
                        selected={
                          selectedResult?.kind === 'event' &&
                          selectedResult.id === item.event.id
                        }
                        onPress={() => handleSelectEvent(item.event)}
                      />
                    ))}
                  </View>
                )}
              </Section>
            </Card>
          </View>

          <View style={[styles.resultsPane, splitResultsLayout && styles.resultsPaneWide]}>
            <Card>
              <Section
                title="Spot posts"
                subtitle="Recent location-based updates under the current filters. Click any item to sync it with the live map and detail panel."
              >
                {rankedPosts.length === 0 ? (
                  <EmptyState
                    title="No posts in view"
                    subtitle="Adjust your filters or create a new location-based post."
                  />
                ) : (
                  <View style={styles.listStack}>
                    {rankedPosts.map(item => (
                      <ResultCard
                        key={item.post.id}
                        eyebrow={formatCategoryLabel(item.post.category).toUpperCase()}
                        title={formatLocationLabel(item.post)}
                        body={item.post.text}
                        meta={`${formatTimestampLabel(item.createdAtMs)} • ${formatDistanceLabel(
                          item.distanceKm
                        )}`}
                        selected={
                          selectedResult?.kind === 'post' &&
                          selectedResult.id === item.post.id
                        }
                        onPress={() => handleSelectPost(item.post)}
                      />
                    ))}
                  </View>
                )}
              </Section>
            </Card>
          </View>
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: spacing.xxxl,
  },
  contentDesktop: {
    paddingBottom: spacing.xxxl + spacing.lg,
  },
  stack: {
    gap: spacing.lg,
  },
  stackDesktop: {
    gap: spacing.xl,
  },
  overviewGrid: {
    gap: spacing.lg,
  },
  overviewGridWide: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  overviewPrimaryColumn: {
    gap: spacing.lg,
  },
  overviewPrimaryColumnWide: {
    flex: 1.15,
    minWidth: 0,
  },
  overviewSecondaryColumn: {
    gap: spacing.lg,
  },
  overviewSecondaryColumnWide: {
    flex: 0.9,
    minWidth: 320,
    maxWidth: 420,
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
    borderColor: '#F1DEB3',
    backgroundColor: colors.warningSoft,
  },
  bannerSuccess: {
    borderColor: '#BDE4CF',
    backgroundColor: colors.successSoft,
  },
  bannerTitle: {
    ...typography.button,
    color: colors.text,
  },
  bannerBody: {
    ...typography.bodyMuted,
  },
  locationActions: {
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  locationActionsWide: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  filterRowCompact: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  metricRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  summaryResult: {
    marginTop: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  summaryResultLabel: {
    ...typography.label,
    color: colors.textSubtle,
  },
  summaryResultText: {
    ...typography.body,
  },
  summaryCard: {
    flex: 1,
  },
  summaryPlaceholder: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  summaryPlaceholderTitle: {
    ...typography.button,
    color: colors.text,
  },
  summaryPlaceholderText: {
    ...typography.bodyMuted,
  },
  listStack: {
    gap: spacing.sm,
  },
  liveGrid: {
    gap: spacing.lg,
  },
  liveGridWide: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  mapColumn: {
    minWidth: 0,
  },
  mapColumnWide: {
    flex: 1.45,
    minWidth: 440,
  },
  mapColumnDesktop: {
    flex: 1.6,
  },
  resultsGrid: {
    gap: spacing.lg,
  },
  resultsGridWide: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  resultsPane: {
    flex: 1,
    minWidth: 320,
  },
  resultsPaneWide: {
    minWidth: 0,
  },
  detailColumn: {
    minWidth: 0,
  },
  detailColumnWide: {
    flex: 0.92,
    minWidth: 360,
    maxWidth: 430,
  },
  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: radius.pill,
  },
  legendDotPost: {
    backgroundColor: colors.primary,
  },
  legendDotEvent: {
    backgroundColor: '#F59E0B',
  },
  legendDotLocation: {
    backgroundColor: colors.success,
  },
  legendLabel: {
    ...typography.caption,
    color: colors.textMuted,
  },
  dataCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
    padding: spacing.lg,
    gap: spacing.sm,
    minHeight: 148,
  },
  dataCardSelected: {
    borderColor: '#C9DBF6',
    backgroundColor: colors.primarySoft,
  },
  dataCardPressed: {
    opacity: 0.92,
  },
  dataEyebrow: {
    ...typography.label,
    color: colors.primary,
  },
  dataTitle: {
    ...typography.sectionTitle,
  },
  dataBody: {
    ...typography.body,
  },
  dataMeta: {
    ...typography.caption,
  },
  detailCard: {
    minHeight: 260,
  },
  detailCardWide: {
    minHeight: 620,
  },
  detailStack: {
    gap: spacing.md,
  },
  mapSurface: {
    height: 460,
  },
  mapSurfaceWide: {
    height: 540,
  },
  mapSurfaceDesktop: {
    height: 620,
  },
  detailEyebrow: {
    ...typography.label,
    color: colors.primary,
  },
  detailTitle: {
    ...typography.title,
  },
  detailBody: {
    ...typography.body,
  },
  actionGrid: {
    gap: spacing.sm,
  },
  commentInput: {
    minHeight: 92,
    textAlignVertical: 'top',
  },
  commentCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  commentHeaderCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  commentAuthor: {
    ...typography.button,
    color: colors.text,
  },
  commentTimestamp: {
    ...typography.caption,
  },
  commentActionsInline: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  commentActionText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },
  commentDeleteText: {
    color: colors.danger,
  },
  commentBody: {
    ...typography.body,
    color: colors.textMuted,
  },
  reportNoteInput: {
    minHeight: 110,
    textAlignVertical: 'top',
  },
});
