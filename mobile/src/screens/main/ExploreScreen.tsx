import React from 'react';
import {
  Alert,
  FlatList,
  Keyboard,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import MapView, { Marker, type Region } from 'react-native-maps';

import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { FilterChip } from '../../components/ui/Chip';
import { InfoRow } from '../../components/ui/InfoRow';
import { LoadingState } from '../../components/ui/LoadingState';
import { MetricTile } from '../../components/ui/MetricTile';
import { PrimaryButton, SecondaryButton } from '../../components/ui/Button';
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
  DEFAULT_EXPLORE_REGION,
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
import { colors, radius, shadows, spacing, typography } from '../../theme/designSystem';
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

function OverlayPanel({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: object;
}) {
  return <View style={[styles.overlayPanel, style]}>{children}</View>;
}

function CommentListItem({
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
        <Text style={styles.commentAuthor}>{comment.authorLabel}</Text>
        <View style={styles.commentActionsInline}>
          <Pressable onPress={onReport}>
            <Text style={styles.commentReportText}>Report</Text>
          </Pressable>
          {canDelete ? (
            <Pressable onPress={onDelete} disabled={deleting}>
              <Text style={styles.commentDeleteText}>
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
  const [events, setEvents] = React.useState<PromotedEvent[]>([]);
  const [posts, setPosts] = React.useState<SpotPost[]>([]);
  const [selectedPost, setSelectedPost] = React.useState<SpotPost | null>(null);
  const [selectedEvent, setSelectedEvent] = React.useState<PromotedEvent | null>(null);
  const [favoritePostIds, setFavoritePostIds] = React.useState<string[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [region, setRegion] = React.useState<Region>(DEFAULT_EXPLORE_REGION);
  const [selectedCategory, setSelectedCategory] = React.useState<CategoryFilter>('all');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [summaryLoading, setSummaryLoading] = React.useState(false);
  const [summary, setSummary] = React.useState<string | null>(null);
  const [favoriteLoading, setFavoriteLoading] = React.useState(false);
  const [comments, setComments] = React.useState<PostComment[]>([]);
  const [commentText, setCommentText] = React.useState('');
  const [commentLoading, setCommentLoading] = React.useState(false);
  const [deletingCommentId, setDeletingCommentId] = React.useState<string | null>(null);
  const [likeUserIds, setLikeUserIds] = React.useState<string[]>([]);
  const [likeLoading, setLikeLoading] = React.useState(false);
  const [reportVisible, setReportVisible] = React.useState(false);
  const [reportReason, setReportReason] = React.useState<ReportReason>('spam');
  const [reportNote, setReportNote] = React.useState('');
  const [reportLoading, setReportLoading] = React.useState(false);
  const [reportTargetType, setReportTargetType] = React.useState<ReportTargetType>('post');
  const [reportTargetId, setReportTargetId] = React.useState<string | null>(null);

  React.useEffect(() => {
    const unsubscribe = subscribeToPosts(
      nextPosts => {
        setPosts(nextPosts);
        setLoading(false);
      },
      () => setLoading(false)
    );
    return unsubscribe;
  }, []);

  React.useEffect(() => {
    const unsubscribe = subscribeToEvents(setEvents);
    return unsubscribe;
  }, []);

  React.useEffect(() => {
    const unsubscribe = observeFavoritePostIds(user?.id, setFavoritePostIds);
    return unsubscribe;
  }, [user?.id]);

  React.useEffect(() => {
    const unsubscribe = observeCommentsForPost(selectedPost?.id, setComments);
    return unsubscribe;
  }, [selectedPost?.id]);

  React.useEffect(() => {
    const unsubscribe = observeLikeUserIdsForPost(selectedPost?.id, setLikeUserIds);
    return unsubscribe;
  }, [selectedPost?.id]);

  React.useEffect(() => {
    const syncRegionToUser = async () => {
      try {
        const { status } = await requestForegroundLocationPermission();
        if (status !== 'granted') {
          return;
        }

        const coords = await getCurrentCoordinates();
        setRegion(prev => ({
          ...prev,
          latitude: coords.latitude,
          longitude: coords.longitude,
        }));
      } catch (error) {
        console.log('Explore location error:', error);
      }
    };

    void syncRegionToUser();
  }, []);

  const filteredPosts = React.useMemo(
    () => filterExplorePosts(posts, selectedCategory, searchQuery),
    [posts, searchQuery, selectedCategory]
  );
  const filteredEvents = React.useMemo(
    () => filterExploreEvents(events, selectedCategory, searchQuery),
    [events, searchQuery, selectedCategory]
  );
  const favoritePostIdSet = React.useMemo(() => new Set(favoritePostIds), [favoritePostIds]);
  const likeUserIdSet = React.useMemo(() => new Set(likeUserIds), [likeUserIds]);

  React.useEffect(() => {
    if (selectedPost && !filteredPosts.some(post => post.id === selectedPost.id)) {
      setSelectedPost(null);
    }
  }, [filteredPosts, selectedPost]);

  React.useEffect(() => {
    if (selectedEvent && !filteredEvents.some(event => event.id === selectedEvent.id)) {
      setSelectedEvent(null);
    }
  }, [filteredEvents, selectedEvent]);

  React.useEffect(() => {
    setSummary(null);
  }, [searchQuery, selectedCategory]);

  React.useEffect(() => {
    setCommentText('');
  }, [selectedPost?.id]);

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

  const handleToggleFavorite = async () => {
    if (!selectedPost) {
      return;
    }

    setFavoriteLoading(true);
    try {
      await toggleFavoritePost({
        userId: user?.id,
        postId: selectedPost.id,
        isCurrentlyFavorite: favoritePostIdSet.has(selectedPost.id),
      });
    } catch (error: any) {
      if (error instanceof FavoriteValidationError) {
        setSummary(error.message);
      } else {
        setSummary(`Favorite error: ${String(error?.message || error)}`);
      }
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
      await togglePostLike({
        postId: selectedPost.id,
        userId: user?.id,
        isCurrentlyLiked: !!(user?.id && likeUserIdSet.has(user.id)),
      });
    } catch (error: any) {
      if (error instanceof ReactionValidationError) {
        Alert.alert('Like error', error.message);
      } else {
        Alert.alert('Like error', error?.message ?? 'Failed to update like');
      }
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
    } catch (error: any) {
      if (error instanceof CommentValidationError) {
        Alert.alert('Comment error', error.message);
      } else {
        Alert.alert('Comment error', error?.message ?? 'Failed to add comment');
      }
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
    } catch (error: any) {
      if (error instanceof CommentValidationError) {
        Alert.alert('Delete error', error.message);
      } else {
        Alert.alert('Delete error', error?.message ?? 'Failed to delete comment');
      }
    } finally {
      setDeletingCommentId(null);
    }
  };

  const openReportModal = (targetType: ReportTargetType, targetId: string) => {
    setReportTargetType(targetType);
    setReportTargetId(targetId);
    setReportReason('spam');
    setReportNote('');
    setReportVisible(true);
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
        targetPostId:
          reportTargetType === 'comment'
            ? selectedPost?.id ?? null
            : selectedPost?.id ?? null,
        reason: reportReason,
        note: reportNote,
      });
      setReportVisible(false);
      setReportNote('');
      Alert.alert('Report submitted', 'Thanks. Your report has been recorded.');
    } catch (error: any) {
      if (error instanceof ReportValidationError) {
        Alert.alert('Report error', error.message);
      } else {
        Alert.alert('Report error', error?.message ?? 'Failed to submit report');
      }
    } finally {
      setReportLoading(false);
    }
  };

  if (loading) {
    return <LoadingState label="Loading spots and events..." />;
  }

  const hasNoResults = filteredPosts.length === 0 && filteredEvents.length === 0;
  const totalVisible = filteredPosts.length + filteredEvents.length;
  const totalAvailable = posts.length + events.length;

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={styles.container}>
        <MapView
          style={StyleSheet.absoluteFillObject}
          region={region}
          onRegionChangeComplete={setRegion}
          showsUserLocation
          showsMyLocationButton
        >
          {filteredPosts.map(post => (
            <Marker
              key={post.id}
              coordinate={{ latitude: post.lat, longitude: post.lng }}
              title={formatCategoryLabel(post.category)}
              description={post.text}
              pinColor={selectedPost?.id === post.id ? colors.primary : undefined}
              onPress={() => {
                setSelectedEvent(null);
                setSelectedPost(post);
              }}
            />
          ))}

          {filteredEvents.map(event => (
            <Marker
              key={`event-${event.id}`}
              coordinate={{ latitude: event.lat, longitude: event.lng }}
              title={event.title}
              description={event.description}
              pinColor={selectedEvent?.id === event.id ? '#D97706' : '#F59E0B'}
              onPress={() => {
                setSelectedPost(null);
                setSelectedEvent(event);
              }}
            />
          ))}
        </MapView>

        <View style={styles.overlayTop}>
          <OverlayPanel>
            <View style={styles.headerRow}>
              <View style={styles.headerCopy}>
                <Text style={styles.eyebrow}>Explore</Text>
                <Text style={styles.headerTitle}>Live map activity</Text>
                <Text style={styles.headerSubtitle}>
                  Browse posts and promoted events with calmer filtering and quick area insights.
                </Text>
              </View>
              <View style={styles.countBadge}>
                <Text style={styles.countValue}>{totalVisible}</Text>
                <Text style={styles.countLabel}>Visible</Text>
              </View>
            </View>

            <TextField
              placeholder="Search by text or location"
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="done"
              onSubmitEditing={() => Keyboard.dismiss()}
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
              <MetricTile label="Total data" value={totalAvailable} />
              <MetricTile label="Posts" value={filteredPosts.length} accent />
              <MetricTile label="Events" value={filteredEvents.length} />
            </View>

            <Card muted style={styles.summaryCard}>
              <Section
                title="Area summary"
                subtitle="Generate a concise backend summary from the filtered posts currently in view."
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
                ) : null}
              </Section>
            </Card>
          </OverlayPanel>
        </View>

        <View style={styles.overlayBottom}>
          <OverlayPanel style={styles.bottomPanel}>
            {selectedEvent ? (
              <Card style={styles.detailCard}>
                <Section
                  title={selectedEvent.title}
                  subtitle="Promoted event"
                >
                  <Text style={styles.bodyText}>{selectedEvent.description}</Text>
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
                </Section>
              </Card>
            ) : null}

            {selectedPost ? (
              <Card style={styles.detailCard}>
                <Section
                  title={formatCategoryLabel(selectedPost.category)}
                  subtitle={formatLocationLabel(selectedPost)}
                >
                  <Text style={styles.bodyText}>{selectedPost.text}</Text>

                  <View style={styles.actionGrid}>
                    <PrimaryButton
                      label={
                        user?.id && likeUserIdSet.has(user.id)
                          ? `Liked (${likeUserIds.length})`
                          : `Like (${likeUserIds.length})`
                      }
                      loading={likeLoading}
                      onPress={handleToggleLike}
                    />
                    <SecondaryButton
                      label={
                        favoritePostIdSet.has(selectedPost.id)
                          ? 'Remove Bookmark'
                          : 'Save Bookmark'
                      }
                      loading={favoriteLoading}
                      onPress={handleToggleFavorite}
                    />
                  </View>

                  <SecondaryButton
                    label="Report Post"
                    onPress={() => openReportModal('post', selectedPost.id)}
                  />

                  <Section
                    title="Comments"
                    subtitle="Add context, react to updates, or review the conversation."
                  >
                    <TextField
                      placeholder="Add a comment"
                      value={commentText}
                      onChangeText={setCommentText}
                      multiline
                      style={styles.commentInput}
                    />
                    <PrimaryButton
                      label="Add Comment"
                      loading={commentLoading}
                      onPress={handleAddComment}
                    />

                    {comments.length === 0 ? (
                      <EmptyState
                        title="No comments yet"
                        subtitle="Start the conversation on this spot."
                      />
                    ) : (
                      <FlatList
                        data={comments}
                        keyExtractor={item => item.id}
                        scrollEnabled={false}
                        contentContainerStyle={styles.commentList}
                        renderItem={({ item }) => (
                          <CommentListItem
                            comment={item}
                            canDelete={user?.id === item.userId}
                            deleting={deletingCommentId === item.id}
                            onDelete={() => handleDeleteComment(item)}
                            onReport={() => openReportModal('comment', item.id)}
                          />
                        )}
                      />
                    )}
                  </Section>
                </Section>
              </Card>
            ) : null}

            {!selectedEvent && !selectedPost ? (
              hasNoResults ? (
                <Card>
                  <EmptyState
                    title="No spots found"
                    subtitle="Adjust your filters or create a new post to see activity appear here."
                  />
                </Card>
              ) : (
                <Card>
                  <EmptyState
                    title="Select a marker"
                    subtitle="Tap a post or promoted event on the map to inspect details, comments, and actions."
                  />
                </Card>
              )
            ) : null}
          </OverlayPanel>
        </View>

        <Modal
          visible={reportVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setReportVisible(false)}
        >
          <View style={styles.modalBackdrop}>
            <Card style={styles.modalCard}>
              <Section
                title="Report content"
                subtitle="Choose the reason that best fits and add an optional note."
              >
                <View style={styles.filterRow}>
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

                <View style={styles.modalActions}>
                  <SecondaryButton
                    label="Cancel"
                    disabled={reportLoading}
                    onPress={() => setReportVisible(false)}
                  />
                  <PrimaryButton
                    label="Submit Report"
                    loading={reportLoading}
                    onPress={handleSubmitReport}
                  />
                </View>
              </Section>
            </Card>
          </View>
        </Modal>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  overlayTop: {
    position: 'absolute',
    top: 18,
    left: spacing.lg,
    right: spacing.lg,
  },
  overlayBottom: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    bottom: spacing.lg,
    maxHeight: '46%',
  },
  overlayPanel: {
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(216,226,238,0.92)',
    padding: spacing.lg,
    ...shadows.floating,
  },
  bottomPanel: {
    padding: spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    gap: spacing.lg,
    alignItems: 'flex-start',
  },
  headerCopy: {
    flex: 1,
  },
  eyebrow: {
    ...typography.label,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  headerTitle: {
    ...typography.title,
  },
  headerSubtitle: {
    ...typography.bodyMuted,
    marginTop: spacing.sm,
  },
  countBadge: {
    minWidth: 78,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#C9DBF6',
  },
  countValue: {
    ...typography.sectionTitle,
    color: colors.primary,
  },
  countLabel: {
    ...typography.caption,
    color: colors.primary,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  metricRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  summaryCard: {
    marginTop: spacing.md,
    padding: spacing.lg,
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
  detailCard: {
    padding: spacing.lg,
  },
  bodyText: {
    ...typography.body,
  },
  actionGrid: {
    gap: spacing.sm,
  },
  commentInput: {
    minHeight: 92,
    textAlignVertical: 'top',
  },
  commentList: {
    gap: spacing.sm,
  },
  commentCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceMuted,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  commentAuthor: {
    ...typography.button,
    color: colors.text,
  },
  commentActionsInline: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  commentBody: {
    ...typography.body,
    color: colors.textMuted,
  },
  commentReportText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },
  commentDeleteText: {
    ...typography.caption,
    color: colors.danger,
    fontWeight: '600',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  modalCard: {
    width: '100%',
    maxWidth: 520,
  },
  reportNoteInput: {
    minHeight: 110,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
});
