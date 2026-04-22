import React from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';

import { ExploreMapSurface } from '../../components/explore/ExploreMapSurface.web';
import { DiscoveryFilterBar } from '../../components/explore/DiscoveryFilterBar';
import { EventCard } from '../../components/explore/EventCard';
import { EventDetailPanel } from '../../components/explore/EventDetailPanel';
import { SpotCard } from '../../components/explore/SpotCard';
import { SpotDetailPanel } from '../../components/explore/SpotDetailPanel';
import { PrimaryButton, SecondaryButton } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { FilterChip } from '../../components/ui/Chip';
import { EmptyState } from '../../components/ui/EmptyState';
import { LoadingState } from '../../components/ui/LoadingState';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { Section } from '../../components/ui/Section';
import { StatusBanner } from '../../components/ui/StatusBanner';
import { TextField } from '../../components/ui/TextField';
import { useAuth } from '../../context/AuthContext';
import { useLocalization } from '../../context/LocalizationContext';
import { getReportReasonLabel } from '../../i18n';
import { subscribeToEvents } from '../../repositories/eventRepository';
import { subscribeToPosts } from '../../repositories/postsRepository';
import {
  addCommentToPost,
  CommentValidationError,
  deleteOwnComment,
  observeCommentCountsByPost,
  observeCommentsForPost,
} from '../../services/commentService';
import {
  buildDiscoveryEventItems,
  buildDiscoverySpotItems,
  diversifyDiscoveryItems,
  formatRelativeTime,
  getTimestampMs,
} from '../../services/discoveryService';
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
  observeLikeCountsByPost,
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
import type { PostComment } from '../../types/comment';
import type { PromotedEvent } from '../../types/event';
import type { SpotPost } from '../../types/post';
import type { ReportReason, ReportTargetType } from '../../types/report';

const FILTER_IDS: readonly CategoryFilter[] = [
  'all',
  'fishing',
  'event',
  'sighting',
  'weather',
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

type SelectedResult =
  | { kind: 'post'; id: string }
  | { kind: 'event'; id: string };

type BannerTone = 'neutral' | 'warning' | 'success';

type BannerState = {
  tone: BannerTone;
  title: string;
  body: string;
};

function formatReasonLabel(reason: ReportReason) {
  return getReportReasonLabel(reason);
}

function formatTimestampLabel(
  value: unknown,
  t: (key: string) => string
) {
  const relative = formatRelativeTime(getTimestampMs(value));
  if (relative) {
    return relative;
  }

  return t('common.pendingTimestamp');
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
  const { getRowDirection, getTextAlign, isRTL, t } = useLocalization();

  return (
    <View style={styles.commentCard}>
      <View style={[styles.commentHeader, { flexDirection: getRowDirection() }]}>
        <View style={styles.commentHeaderCopy}>
          <Text
            style={[
              styles.commentAuthor,
              { textAlign: getTextAlign(), writingDirection: isRTL ? 'rtl' : 'ltr' },
            ]}
          >
            {comment.authorLabel}
          </Text>
          <Text
            style={[
              styles.commentTimestamp,
              { textAlign: getTextAlign(), writingDirection: isRTL ? 'rtl' : 'ltr' },
            ]}
          >
            {formatTimestampLabel(comment.createdAt, key => t(key))}
          </Text>
        </View>

        <View style={[styles.commentActionsInline, { flexDirection: getRowDirection() }]}>
          <Pressable onPress={onReport}>
            <Text
              style={[
                styles.commentActionText,
                { writingDirection: isRTL ? 'rtl' : 'ltr' },
              ]}
            >
              {t('explore.report')}
            </Text>
          </Pressable>
          {canDelete ? (
            <Pressable onPress={onDelete} disabled={deleting}>
              <Text
                style={[
                  styles.commentActionText,
                  styles.commentDeleteText,
                  { writingDirection: isRTL ? 'rtl' : 'ltr' },
                ]}
              >
                {deleting ? t('explore.deleting') : t('explore.delete')}
              </Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      <Text
        style={[
          styles.commentBody,
          { textAlign: getTextAlign(), writingDirection: isRTL ? 'rtl' : 'ltr' },
        ]}
      >
        {comment.text}
      </Text>
    </View>
  );
}

export function ExploreScreen() {
  const { user } = useAuth();
  const { getRowDirection, getTextAlign, isRTL, language, t } = useLocalization();
  const { width, height } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  const hasToolbarColumns = isWeb && width >= 960;
  const hasWorkspaceColumns = isWeb && width >= 1120;
  const useFixedWorkspace = isWeb && width >= 1120;
  const [events, setEvents] = React.useState<PromotedEvent[]>([]);
  const [posts, setPosts] = React.useState<SpotPost[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedCategory, setSelectedCategory] =
    React.useState<CategoryFilter>('all');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [whereQuery, setWhereQuery] = React.useState('');
  const [showExtraFilters, setShowExtraFilters] = React.useState(false);
  const [mapSearchAsMove, setMapSearchAsMove] = React.useState(true);
  const [browserLocation, setBrowserLocation] =
    React.useState<BrowserCoordinates | null>(null);
  const [locationLoading, setLocationLoading] = React.useState(false);
  const [locationStatus, setLocationStatus] = React.useState<BannerState | null>(null);
  const [selectedResult, setSelectedResult] =
    React.useState<SelectedResult | null>(null);
  const [summaryLoading, setSummaryLoading] = React.useState(false);
  const [summary, setSummary] = React.useState<string | null>(null);
  const [dataIssue, setDataIssue] = React.useState<string | null>(null);
  const [refreshToken, setRefreshToken] = React.useState(0);
  const [favoritePostIds, setFavoritePostIds] = React.useState<string[]>([]);
  const [commentCountsByPostId, setCommentCountsByPostId] = React.useState<Record<string, number>>({});
  const [likeCountsByPostId, setLikeCountsByPostId] = React.useState<Record<string, number>>({});
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
  const [detailExpanded, setDetailExpanded] = React.useState(false);
  const resultsScrollRef = React.useRef<ScrollView | null>(null);
  const workspaceHeight = useFixedWorkspace
    ? Math.max(620, height - 60)
    : null;

  const handleDataIssue = React.useCallback(
    (error: unknown, fallbackMessage: string) => {
      const nextMessage = isDataAccessBlockedError(error)
        ? getBlockedDataMessage('one or more Explore data feeds')
        : getErrorMessage(error, fallbackMessage);

      setDataIssue(current => current ?? nextMessage);
    },
    []
  );

  const handleRetry = React.useCallback(() => {
    setDataIssue(null);
    setLoading(true);
    setRefreshToken(current => current + 1);
  }, []);

  const handleShowResultsList = React.useCallback(() => {
    setDetailExpanded(false);
    resultsScrollRef.current?.scrollTo({
      y: 0,
      animated: true,
    });
  }, []);

  React.useEffect(() => {
    const unsubscribe = subscribeToPosts(
      nextPosts => {
        setPosts(nextPosts);
        setLoading(false);
      },
      error => {
        setLoading(false);
        handleDataIssue(error, 'Failed to load posts.');
      }
    );

    return unsubscribe;
  }, [handleDataIssue, refreshToken]);

  React.useEffect(() => {
    const unsubscribe = subscribeToEvents(setEvents, error => {
      handleDataIssue(error, 'Failed to load events.');
    });
    return unsubscribe;
  }, [handleDataIssue, refreshToken]);

  React.useEffect(() => {
    const unsubscribe = observeFavoritePostIds(
      user?.id,
      setFavoritePostIds,
      error => {
        handleDataIssue(error, 'Failed to load favorites.');
      }
    );
    return unsubscribe;
  }, [handleDataIssue, refreshToken, user?.id]);

  React.useEffect(() => {
    const unsubscribe = observeCommentCountsByPost(
      setCommentCountsByPostId,
      error => {
        handleDataIssue(error, 'Failed to load comment counts.');
      }
    );
    return unsubscribe;
  }, [handleDataIssue, refreshToken]);

  React.useEffect(() => {
    const unsubscribe = observeLikeCountsByPost(
      setLikeCountsByPostId,
      error => {
        handleDataIssue(error, 'Failed to load like counts.');
      }
    );
    return unsubscribe;
  }, [handleDataIssue, refreshToken]);

  const selectedPostId = selectedResult?.kind === 'post' ? selectedResult.id : null;

  React.useEffect(() => {
    const unsubscribe = observeCommentsForPost(
      selectedPostId,
      setComments,
      error => {
        handleDataIssue(error, 'Failed to load comments.');
      }
    );
    return unsubscribe;
  }, [handleDataIssue, selectedPostId]);

  React.useEffect(() => {
    const unsubscribe = observeLikeUserIdsForPost(
      selectedPostId,
      setLikeUserIds,
      error => {
        handleDataIssue(error, 'Failed to load likes.');
      }
    );
    return unsubscribe;
  }, [handleDataIssue, selectedPostId]);

  React.useEffect(() => {
    setSummary(null);
  }, [searchQuery, selectedCategory, whereQuery]);

  React.useEffect(() => {
    setCommentText('');
    setReportTargetId(null);
    setReportReason('spam');
    setReportNote('');
    setDetailFeedback(null);
    setDetailExpanded(false);
  }, [selectedResult?.id]);

  const filteredPosts = React.useMemo(
    () => {
      const baseResults = filterExplorePosts(posts, selectedCategory, searchQuery);
      const normalizedWhereQuery = whereQuery.trim().toLowerCase();

      if (!normalizedWhereQuery) {
        return baseResults;
      }

      return baseResults.filter(post => {
        const fields = [post.locationName ?? '', post.text];
        return fields.some(field => field.toLowerCase().includes(normalizedWhereQuery));
      });
    },
    [posts, searchQuery, selectedCategory, whereQuery]
  );
  const filteredEvents = React.useMemo(
    () => {
      const baseResults = filterExploreEvents(events, selectedCategory, searchQuery);
      const normalizedWhereQuery = whereQuery.trim().toLowerCase();

      if (!normalizedWhereQuery) {
        return baseResults;
      }

      return baseResults.filter(event => {
        const fields = [
          event.locationName ?? '',
          event.venueName ?? '',
          event.title,
          event.description,
        ];

        return fields.some(field => field.toLowerCase().includes(normalizedWhereQuery));
      });
    },
    [events, searchQuery, selectedCategory, whereQuery]
  );

  const discoverySpotItems = React.useMemo(
    () =>
      buildDiscoverySpotItems(filteredPosts, {
        commentCountsByPostId,
        likeCountsByPostId,
        favoritePostIds,
        browserLocation,
        searchQuery,
      }),
    [
      browserLocation,
      commentCountsByPostId,
      favoritePostIds,
      filteredPosts,
      likeCountsByPostId,
      searchQuery,
    ]
  );

  const discoveryEventItems = React.useMemo(
    () =>
      buildDiscoveryEventItems(filteredEvents, {
        posts: filteredPosts,
        browserLocation,
        searchQuery,
      }),
    [browserLocation, filteredEvents, filteredPosts, searchQuery]
  );
  const rankedResults = React.useMemo(
    () =>
      diversifyDiscoveryItems(
        [...discoverySpotItems, ...discoveryEventItems].sort(
          (left, right) => right.rankingScore - left.rankingScore
        )
      ),
    [discoveryEventItems, discoverySpotItems]
  );

  const favoritePostIdSet = React.useMemo(() => new Set(favoritePostIds), [favoritePostIds]);
  const likeUserIdSet = React.useMemo(() => new Set(likeUserIds), [likeUserIds]);

  const selectedPost =
    selectedResult?.kind === 'post'
      ? filteredPosts.find(post => post.id === selectedResult.id) ?? null
      : null;
  const selectedSpotItem =
    selectedResult?.kind === 'post'
      ? discoverySpotItems.find(item => item.postId === selectedResult.id) ?? null
      : null;
  const selectedEventItem =
    selectedResult?.kind === 'event'
      ? discoveryEventItems.find(item => item.eventId === selectedResult.id) ?? null
      : null;
  const totalVisible = filteredPosts.length + filteredEvents.length;
  const hasNoResults = totalVisible === 0;
  const filterOptions = React.useMemo(
    () =>
      FILTER_IDS.map(id => ({
        id,
        label: t(`category.${id}`),
      })),
    [t]
  );

  const handleSelectPost = React.useCallback((post: SpotPost) => {
    const isSameSelection =
      selectedResult?.kind === 'post' && selectedResult.id === post.id;

    setSelectedResult({ kind: 'post', id: post.id });
    setDetailExpanded(current => (isSameSelection ? !current : false));
  }, [selectedResult]);

  const handleSelectEvent = React.useCallback((event: PromotedEvent) => {
    const isSameSelection =
      selectedResult?.kind === 'event' && selectedResult.id === event.id;

    setSelectedResult({ kind: 'event', id: event.id });
    setDetailExpanded(current => (isSameSelection ? !current : false));
  }, [selectedResult]);

  React.useEffect(() => {
    const hasSelectedPost =
      selectedResult?.kind === 'post' &&
      rankedResults.some(
        item => item.kind === 'spot' && item.postId === selectedResult.id
      );
    const hasSelectedEvent =
      selectedResult?.kind === 'event' &&
      rankedResults.some(
        item => item.kind === 'event' && item.eventId === selectedResult.id
      );

    if (hasSelectedPost || hasSelectedEvent) {
      return;
    }

    if (rankedResults[0]) {
      setSelectedResult(
        rankedResults[0].kind === 'spot'
          ? { kind: 'post', id: rankedResults[0].postId }
          : { kind: 'event', id: rankedResults[0].eventId }
      );
      return;
    }

    if (selectedResult !== null) {
      setSelectedResult(null);
    }
  }, [rankedResults, selectedResult]);

  const handleGenerateSummary = async () => {
    if (filteredPosts.length === 0) {
      setSummary(t('explore.noSummary'));
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
    } catch {
      setSummary(t('explore.summaryError'));
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
          title: t('explore.locationDeniedTitle'),
          body: t('explore.locationDeniedBody'),
        });
        return;
      }

      const coords = await getCurrentCoordinates();
      setBrowserLocation(coords);
      setLocationStatus({
        tone: 'success',
        title: t('explore.locationEnabledTitle'),
        body: t('explore.locationEnabledBody'),
      });
    } catch (error: any) {
      setLocationStatus({
        tone: 'warning',
        title: t('explore.locationUnavailableTitle'),
        body: error?.message ?? t('explore.locationUnavailableBody'),
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
        title: isFavorite
          ? t('explore.savedToFavoritesTitle')
          : t('explore.removedFromFavoritesTitle'),
        body: isFavorite
          ? t('explore.savedToFavoritesBody')
          : t('explore.removedFromFavoritesBody'),
      });
    } catch (error: any) {
      setDetailFeedback({
        tone: 'warning',
        title: t('explore.favoriteErrorTitle'),
        body:
          error instanceof FavoriteValidationError
            ? error.message
            : error?.message ?? t('explore.favoriteFailedBody'),
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
        title: isLiked ? t('explore.likedTitle') : t('explore.unlikedTitle'),
        body: isLiked
          ? t('explore.likedBody')
          : t('explore.unlikedBody'),
      });
    } catch (error: any) {
      setDetailFeedback({
        tone: 'warning',
        title: t('explore.likeErrorTitle'),
        body:
          error instanceof ReactionValidationError
            ? error.message
            : error?.message ?? t('explore.likeFailedBody'),
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
        title: t('explore.commentPostedTitle'),
        body: t('explore.commentPostedBody'),
      });
    } catch (error: any) {
      setDetailFeedback({
        tone: 'warning',
        title: t('explore.commentErrorTitle'),
        body:
          error instanceof CommentValidationError
            ? error.message
            : error?.message ?? t('explore.commentFailedBody'),
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
        title: t('explore.commentDeletedTitle'),
        body: t('explore.commentDeletedBody'),
      });
    } catch (error: any) {
      setDetailFeedback({
        tone: 'warning',
        title: t('explore.deleteErrorTitle'),
        body:
          error instanceof CommentValidationError
            ? error.message
            : error?.message ?? t('explore.deleteFailedBody'),
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
        title: t('explore.reportSubmittedTitle'),
        body: t('explore.reportSubmittedBody'),
      });
    } catch (error: any) {
      setDetailFeedback({
        tone: 'warning',
        title: t('explore.reportErrorTitle'),
        body:
          error instanceof ReportValidationError
            ? error.message
            : error?.message ?? t('explore.reportFailedBody'),
      });
    } finally {
      setReportLoading(false);
    }
  };

  const stickyToolbarStyle =
    isWeb
      ? ({
          position: 'sticky',
          top: 0,
          zIndex: 12,
        } as unknown as object)
      : null;
  const locationSummaryLabel = browserLocation
    ? t('explore.locationStatusActive')
    : locationStatus?.tone === 'warning'
      ? t('explore.locationStatusUnavailable')
      : null;
  const locationContextLabel = whereQuery.trim()
    ? whereQuery.trim()
    : language === 'ar'
      ? 'قطر'
      : 'Qatar';
  const desktopFilterOptions = React.useMemo(
    () =>
      language === 'ar'
        ? [
            { id: 'all', label: 'الكل', glyph: '' },
            { id: 'food', label: 'مأكولات ومشروبات', glyph: '✦' },
            { id: 'coffee', label: 'قهوة', glyph: '☕' },
            { id: 'study', label: 'دراسة وعمل', glyph: '▣' },
            { id: 'outdoors', label: 'خارجي', glyph: '△' },
            { id: 'events', label: 'فعاليات', glyph: '✷' },
            { id: 'family', label: 'عائلة', glyph: '◎' },
            { id: 'sights', label: 'معالم', glyph: '◌' },
            { id: 'more', label: 'المزيد من الفلاتر', glyph: '⋯' },
          ]
        : [
            { id: 'all', label: 'All', glyph: '' },
            { id: 'food', label: 'Food & Drinks', glyph: '✦' },
            { id: 'coffee', label: 'Coffee', glyph: '☕' },
            { id: 'study', label: 'Study & Work', glyph: '▣' },
            { id: 'outdoors', label: 'Outdoors', glyph: '△' },
            { id: 'events', label: 'Events', glyph: '✷' },
            { id: 'family', label: 'Family', glyph: '◎' },
            { id: 'sights', label: 'Sights', glyph: '◌' },
            { id: 'more', label: 'More filters', glyph: '⋯' },
          ],
    [language]
  );
  const activeDesktopFilterId = React.useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    if (showExtraFilters) {
      return 'more';
    }

    if (!normalizedQuery && !whereQuery.trim() && selectedCategory === 'all') {
      return 'all';
    }

    if (selectedCategory === 'event') {
      return 'events';
    }

    if (normalizedQuery.includes('coffee')) {
      return 'coffee';
    }

    if (normalizedQuery.includes('study')) {
      return 'study';
    }

    if (normalizedQuery.includes('walk') || normalizedQuery.includes('outdoor')) {
      return 'outdoors';
    }

    if (normalizedQuery.includes('family')) {
      return 'family';
    }

    if (normalizedQuery.includes('culture') || selectedCategory === 'sighting') {
      return 'sights';
    }

    if (
      normalizedQuery.includes('dinner') ||
      normalizedQuery.includes('dessert') ||
      normalizedQuery.includes('lunch')
    ) {
      return 'food';
    }

    return null;
  }, [searchQuery, selectedCategory, showExtraFilters, whereQuery]);
  const handleDesktopFilterSelect = React.useCallback((filterId: string) => {
    setShowExtraFilters(false);

    switch (filterId) {
      case 'all':
        setSelectedCategory('all');
        setSearchQuery('');
        setWhereQuery('');
        return;
      case 'food':
        setSelectedCategory('all');
        setSearchQuery('dinner');
        return;
      case 'coffee':
        setSelectedCategory('all');
        setSearchQuery('coffee');
        return;
      case 'study':
        setSelectedCategory('all');
        setSearchQuery('study');
        return;
      case 'outdoors':
        setSelectedCategory('all');
        setSearchQuery('walk');
        return;
      case 'events':
        setSelectedCategory('event');
        setSearchQuery('');
        return;
      case 'family':
        setSelectedCategory('all');
        setSearchQuery('family');
        return;
      case 'sights':
        setSelectedCategory('sighting');
        setSearchQuery('culture');
        return;
      case 'more':
        setShowExtraFilters(current => !current);
        return;
      default:
        return;
    }
  }, []);

  if (loading) {
    return <LoadingState label={t('common.loading')} />;
  }

  return (
    <ScreenContainer
      scroll
      contentContainerStyle={[
        styles.content,
        styles.contentWebCompact,
        useFixedWorkspace && styles.contentWebWide,
      ]}
    >
      <Card style={[styles.toolbarCard, stickyToolbarStyle]}>
        <View style={[styles.searchToolbarRow, hasToolbarColumns && styles.searchToolbarRowWide]}>
          <View style={styles.searchSystemShell}>
            <View style={styles.searchFieldBlock}>
              <Text
                style={[
                  styles.searchFieldLabel,
                  { writingDirection: isRTL ? 'rtl' : 'ltr' },
                ]}
              >
                {language === 'ar' ? 'ماذا' : 'What'}
              </Text>
              <TextInput
                placeholder={
                  language === 'ar'
                    ? 'قهوة، أماكن للدراسة، فعاليات...'
                    : 'Coffee, study spots, events...'
                }
                placeholderTextColor={colors.textSubtle}
                value={searchQuery}
                onChangeText={setSearchQuery}
                style={[
                  styles.searchFieldInput,
                  { textAlign: getTextAlign(), writingDirection: isRTL ? 'rtl' : 'ltr' },
                ]}
              />
            </View>

            <View style={styles.searchFieldDivider} />

            <View style={styles.searchFieldBlock}>
              <Text
                style={[
                  styles.searchFieldLabel,
                  { writingDirection: isRTL ? 'rtl' : 'ltr' },
                ]}
              >
                {language === 'ar' ? 'أين' : 'Where'}
              </Text>
              <TextInput
                placeholder={
                  language === 'ar'
                    ? 'قطر، مدينة، أو منطقة'
                    : 'Qatar, City, or area'
                }
                placeholderTextColor={colors.textSubtle}
                value={whereQuery}
                onChangeText={setWhereQuery}
                style={[
                  styles.searchFieldInput,
                  { textAlign: getTextAlign(), writingDirection: isRTL ? 'rtl' : 'ltr' },
                ]}
              />
            </View>

            <Pressable
              accessibilityRole="button"
              onPress={handleShareBrowserLocation}
              style={({ pressed }) => [
                styles.toolbarTargetButton,
                pressed && styles.toolbarIconButtonPressed,
              ]}
            >
              <Text style={styles.toolbarTargetButtonText}>⌖</Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              onPress={() => setDetailExpanded(false)}
              style={({ pressed }) => [
                styles.toolbarSearchButton,
                pressed && styles.toolbarSearchButtonPressed,
              ]}
            >
              <Text style={styles.toolbarSearchButtonText}>⌕</Text>
            </Pressable>
          </View>

          <View style={styles.toolbarQuickActions}>
            <SecondaryButton
              label={t('explore.summaryButton')}
              loading={summaryLoading}
              onPress={handleGenerateSummary}
              style={styles.toolbarActionButton}
            />
            <SecondaryButton
              label={
                locationLoading
                  ? t('explore.locationChecking')
                  : browserLocation
                    ? t('explore.locationRefresh')
                    : language === 'ar'
                      ? 'بالقرب مني'
                      : 'Near Me'
              }
              loading={locationLoading}
              onPress={handleShareBrowserLocation}
              style={styles.toolbarActionButton}
            />
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[
            styles.desktopFilterRail,
            { flexDirection: getRowDirection() },
          ]}
        >
          {desktopFilterOptions.map(filter => {
            const isActive = activeDesktopFilterId === filter.id;

            return (
              <Pressable
                key={filter.id}
                accessibilityRole="button"
                onPress={() => handleDesktopFilterSelect(filter.id)}
                style={({ pressed }) => [
                  styles.desktopFilterChip,
                  isActive && styles.desktopFilterChipActive,
                  pressed && styles.desktopFilterChipPressed,
                ]}
              >
                {filter.glyph ? (
                  <Text style={[styles.desktopFilterGlyph, isActive && styles.desktopFilterGlyphActive]}>
                    {filter.glyph}
                  </Text>
                ) : null}
                <Text
                  style={[
                    styles.desktopFilterText,
                    isActive && styles.desktopFilterTextActive,
                    { writingDirection: isRTL ? 'rtl' : 'ltr' },
                  ]}
                >
                  {filter.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {showExtraFilters ? (
          <View style={styles.extraFiltersWrap}>
            <DiscoveryFilterBar
              filters={filterOptions}
              activeId={selectedCategory}
              onSelect={filterId => setSelectedCategory(filterId as CategoryFilter)}
              compact
              style={styles.filterBar}
            />
          </View>
        ) : null}

        {locationSummaryLabel || summary || dataIssue ? (
          <View style={[styles.toolbarInfoRow, { flexDirection: getRowDirection() }]}>
            {locationSummaryLabel ? (
              <Text
                style={[
                  styles.toolbarInfoText,
                  browserLocation && styles.toolbarInfoTextSuccess,
                  locationStatus?.tone === 'warning' && styles.toolbarInfoTextWarning,
                  { writingDirection: isRTL ? 'rtl' : 'ltr' },
                ]}
              >
                {locationSummaryLabel}
              </Text>
            ) : null}

            {summary ? (
              <Text
                style={[
                  styles.toolbarInfoText,
                  styles.toolbarInfoTextPrimary,
                  { writingDirection: isRTL ? 'rtl' : 'ltr' },
                ]}
                numberOfLines={1}
              >
                {`${t('explore.summaryTitle')}: ${summary}`}
              </Text>
            ) : null}

            {dataIssue ? (
              <Pressable
                accessibilityRole="button"
                onPress={handleRetry}
                style={({ pressed }) => [
                  styles.toolbarInfoAction,
                  pressed && styles.issueStripActionPressed,
                ]}
              >
                <Text
                  style={[
                    styles.issueStripActionText,
                    { writingDirection: isRTL ? 'rtl' : 'ltr' },
                  ]}
                >
                  {t('common.retry')}
                </Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}
      </Card>

      <View style={[styles.resultsMetaRow, { flexDirection: getRowDirection() }]}>
        <View style={styles.resultsMetaCopy}>
          <Text
            style={[
              styles.resultsCountHeadline,
              { writingDirection: isRTL ? 'rtl' : 'ltr' },
            ]}
          >
            {t('explore.resultsCount', { count: totalVisible })}
          </Text>
          <Text
            style={[
              styles.resultsContextText,
              { writingDirection: isRTL ? 'rtl' : 'ltr' },
            ]}
          >
            {language === 'ar' ? `في ${locationContextLabel}` : `in ${locationContextLabel}`}
          </Text>
        </View>

        <View style={[styles.resultsMetaActions, { flexDirection: getRowDirection() }]}>
          <Text
            style={[
              styles.sortLabelText,
              { writingDirection: isRTL ? 'rtl' : 'ltr' },
            ]}
          >
            {language === 'ar' ? 'ترتيب حسب' : 'Sort by'}
          </Text>
          <Pressable
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.sortControl,
              pressed && styles.desktopFilterChipPressed,
            ]}
          >
            <Text
              style={[
                styles.sortControlText,
                { writingDirection: isRTL ? 'rtl' : 'ltr' },
              ]}
            >
              {language === 'ar' ? 'موصى به' : 'Recommended'}
            </Text>
            <Text
              style={[
                styles.sortControlCaret,
                { writingDirection: isRTL ? 'rtl' : 'ltr' },
              ]}
            >
              ⌄
            </Text>
          </Pressable>
        </View>
      </View>

      <View
        style={[
          styles.workspace,
          hasWorkspaceColumns && styles.workspaceWide,
          workspaceHeight ? { minHeight: workspaceHeight } : null,
        ]}
      >
        <Card
          style={[
            styles.resultsCard,
            hasWorkspaceColumns && styles.resultsCardWide,
            workspaceHeight ? { height: workspaceHeight } : null,
          ]}
        >
          {hasNoResults ? (
            <EmptyState
              compact
              title={t('explore.noResultsTitle')}
              subtitle={t('explore.noResultsSubtitle')}
            />
          ) : (
            <ScrollView
              ref={resultsScrollRef}
              style={styles.panelScroll}
              contentContainerStyle={styles.resultsList}
              showsVerticalScrollIndicator={false}
            >
              {detailExpanded && selectedEventItem ? (
                <View style={styles.inlineDetailPanel}>
                  <View style={[styles.inlineDetailTopBar, { flexDirection: getRowDirection() }]}>
                    <Text
                      style={[
                        styles.inlineDetailHeading,
                        { textAlign: getTextAlign(), writingDirection: isRTL ? 'rtl' : 'ltr' },
                      ]}
                    >
                      {selectedEventItem.title}
                    </Text>
                    <SecondaryButton
                      label={t('explore.collapse')}
                      onPress={() => setDetailExpanded(false)}
                      style={styles.inlineDetailCollapseButton}
                    />
                  </View>
                  <EventDetailPanel event={selectedEventItem} />
                </View>
              ) : null}

              {detailExpanded && selectedSpotItem && selectedPost ? (
                <View style={styles.inlineDetailPanel}>
                  <View style={[styles.inlineDetailTopBar, { flexDirection: getRowDirection() }]}>
                    <Text
                      style={[
                        styles.inlineDetailHeading,
                        { textAlign: getTextAlign(), writingDirection: isRTL ? 'rtl' : 'ltr' },
                      ]}
                    >
                      {selectedSpotItem.title}
                    </Text>
                    <SecondaryButton
                      label={t('explore.collapse')}
                      onPress={() => setDetailExpanded(false)}
                      style={styles.inlineDetailCollapseButton}
                    />
                  </View>
                  <SpotDetailPanel
                    spot={selectedSpotItem}
                    banner={
                      <>
                        {detailFeedback ? <StatusBanner compact {...detailFeedback} /> : null}
                        {!user ? (
                          <View style={styles.inlineNote}>
                            <Text
                              style={[
                                styles.inlineNoteText,
                                { textAlign: getTextAlign(), writingDirection: isRTL ? 'rtl' : 'ltr' },
                              ]}
                            >
                              {t('explore.signInForActionsBody')}
                            </Text>
                          </View>
                        ) : null}
                      </>
                    }
                    actions={[
                      {
                        id: 'save',
                        label: favoritePostIdSet.has(selectedPost.id)
                          ? t('common.saved')
                          : t('common.save'),
                        tone: favoritePostIdSet.has(selectedPost.id) ? 'primary' : 'neutral',
                        loading: favoriteLoading,
                        disabled: !user,
                        onPress: handleToggleFavorite,
                      },
                      {
                        id: 'like',
                        label:
                          user?.id && likeUserIdSet.has(user.id)
                            ? `${t('common.liked')} (${likeUserIds.length})`
                            : `${t('common.like')} (${likeUserIds.length})`,
                        tone:
                          user?.id && likeUserIdSet.has(user.id) ? 'primary' : 'neutral',
                        loading: likeLoading,
                        disabled: !user,
                        onPress: handleToggleLike,
                      },
                      {
                        id: 'report',
                        label: t('explore.report'),
                        disabled: !user,
                        onPress: () => openReportComposer('post', selectedPost.id),
                      },
                    ]}
                  >
                    <Section
                      title={t('explore.commentsTitle', { count: comments.length })}
                      subtitle={t('explore.commentsSubtitle')}
                    >
                      <TextField
                        placeholder={t('explore.commentPlaceholder')}
                        value={commentText}
                        onChangeText={setCommentText}
                        multiline
                        editable={!!user}
                        style={styles.commentInput}
                        helperText={
                          user
                            ? t('explore.commentHelperSignedIn')
                            : t('explore.commentHelperSignedOut')
                        }
                      />
                      <PrimaryButton
                        label={t('explore.addComment')}
                        loading={commentLoading}
                        disabled={!user}
                        onPress={handleAddComment}
                      />

                      {comments.length === 0 ? (
                        <EmptyState
                          compact
                          title={t('explore.noCommentsTitle')}
                          subtitle={t('explore.noCommentsSubtitle')}
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
                        title={t('explore.reportTitle')}
                        subtitle={t('explore.reportSubtitle')}
                      >
                        <View style={styles.filterRowCompact}>
                          {REPORT_REASONS.map(reason => (
                            <FilterChip
                              key={reason}
                              label={formatReasonLabel(reason)}
                              compact
                              active={reportReason === reason}
                              onPress={() => setReportReason(reason)}
                            />
                          ))}
                        </View>

                        <TextField
                          placeholder={t('explore.reportNotePlaceholder')}
                          value={reportNote}
                          onChangeText={setReportNote}
                          multiline
                          style={styles.reportNoteInput}
                        />

                        <View style={styles.actionGrid}>
                          <SecondaryButton
                            label={t('common.cancel')}
                            disabled={reportLoading}
                            onPress={() => setReportTargetId(null)}
                          />
                          <PrimaryButton
                            label={t('explore.submitReport')}
                            loading={reportLoading}
                            disabled={!user}
                            onPress={handleSubmitReport}
                          />
                        </View>
                      </Section>
                    ) : null}
                  </SpotDetailPanel>
                </View>
              ) : null}

              {rankedResults.map(item =>
                item.kind === 'spot' ? (
                  <SpotCard
                    key={item.id}
                    spot={item}
                    selected={
                      selectedResult?.kind === 'post' &&
                      selectedResult.id === item.postId
                    }
                    variant="desktopSearch"
                    onPress={() => handleSelectPost(item.rawPost)}
                  />
                ) : (
                  <EventCard
                    key={item.id}
                    event={item}
                    selected={
                      selectedResult?.kind === 'event' &&
                      selectedResult.id === item.eventId
                    }
                    variant="desktopSearch"
                    onPress={() => handleSelectEvent(item.rawEvent)}
                  />
                )
              )}
            </ScrollView>
            )}
        </Card>

        <View style={styles.mapColumn}>
          <Card
            style={[
              styles.mapCard,
              hasWorkspaceColumns && styles.mapCardWide,
              workspaceHeight ? { height: workspaceHeight } : null,
            ]}
          >
            <View style={styles.mapSurfaceWrap}>
              <ExploreMapSurface
                posts={filteredPosts}
                events={filteredEvents}
                selectedResult={selectedResult}
                browserLocation={browserLocation}
                onSelectPost={handleSelectPost}
                onSelectEvent={handleSelectEvent}
                style={[
                  workspaceHeight
                    ? {
                        height: Math.max(620, workspaceHeight - 28),
                      }
                    : styles.mapSurface,
                  !workspaceHeight && hasWorkspaceColumns && styles.mapSurfaceWide,
                ]}
              />

              <View style={styles.mapOverlayTopRow}>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setMapSearchAsMove(current => !current)}
                  style={({ pressed }) => [
                    styles.mapOverlayChip,
                    mapSearchAsMove && styles.mapOverlayChipActive,
                    pressed && styles.desktopFilterChipPressed,
                  ]}
                >
                  <Text style={styles.mapOverlayChipIcon}>⌖</Text>
                  <Text
                    style={[
                      styles.mapOverlayChipText,
                      mapSearchAsMove && styles.mapOverlayChipTextActive,
                      { writingDirection: isRTL ? 'rtl' : 'ltr' },
                    ]}
                  >
                    {language === 'ar' ? 'ابحث عند تحريك الخريطة' : 'Search as I move the map'}
                  </Text>
                </Pressable>

                <Pressable
                  accessibilityRole="button"
                  onPress={handleShowResultsList}
                  style={({ pressed }) => [
                    styles.mapOverlayChip,
                    pressed && styles.desktopFilterChipPressed,
                  ]}
                >
                  <Text style={styles.mapOverlayChipIcon}>≡</Text>
                  <Text
                    style={[
                      styles.mapOverlayChipText,
                      { writingDirection: isRTL ? 'rtl' : 'ltr' },
                    ]}
                  >
                    {language === 'ar' ? 'إظهار القائمة' : 'Show list'}
                  </Text>
                </Pressable>
              </View>

              <View style={styles.mapOverlayControlRail}>
                <Pressable
                  accessibilityRole="button"
                  onPress={handleShareBrowserLocation}
                  style={({ pressed }) => [
                    styles.mapControlButton,
                    pressed && styles.desktopFilterChipPressed,
                  ]}
                >
                  <Text style={styles.mapControlButtonText}>⌖</Text>
                </Pressable>
              </View>

              <View style={styles.mapLegendFloating}>
                <View style={[styles.mapLegendChip, { flexDirection: getRowDirection() }]}>
                  <View style={[styles.legendDot, styles.legendDotPost]} />
                  <Text
                    style={[
                      styles.mapLegendChipText,
                      { writingDirection: isRTL ? 'rtl' : 'ltr' },
                    ]}
                  >
                    {language === 'ar' ? 'الأماكن الشائعة' : 'Popular'}
                  </Text>
                </View>
                <View style={[styles.mapLegendChip, { flexDirection: getRowDirection() }]}>
                  <View style={[styles.legendDot, styles.legendDotEvent]} />
                  <Text
                    style={[
                      styles.mapLegendChipText,
                      { writingDirection: isRTL ? 'rtl' : 'ltr' },
                    ]}
                  >
                    {language === 'ar' ? 'الفعاليات المروجة' : 'Promoted'}
                  </Text>
                </View>
                <View style={[styles.mapLegendChip, { flexDirection: getRowDirection() }]}>
                  <View style={[styles.legendDot, styles.legendDotLocation]} />
                  <Text
                    style={[
                      styles.mapLegendChipText,
                      { writingDirection: isRTL ? 'rtl' : 'ltr' },
                    ]}
                  >
                    {language === 'ar' ? 'اليوم' : 'Event today'}
                  </Text>
                </View>
              </View>
            </View>
          </Card>
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    width: '100%',
    alignSelf: 'center',
    paddingBottom: spacing.xxxl,
    gap: spacing.md,
  },
  contentWebCompact: {
    paddingTop: spacing.lg,
    paddingHorizontal: webDesktopLayout.horizontalPadding - spacing.lg,
    maxWidth: webDesktopLayout.maxWidth + 120,
  },
  contentWebWide: {
    paddingHorizontal: webDesktopLayout.horizontalPadding,
  },
  toolbarCard: {
    ...webDesktopSupportSurface,
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  searchToolbarRow: {
    gap: spacing.sm,
  },
  searchToolbarRowWide: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  searchSystemShell: {
    flex: 1,
    minWidth: 0,
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingLeft: spacing.lg,
    paddingRight: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  searchFieldBlock: {
    flex: 1,
    minWidth: 0,
    gap: 2,
    paddingVertical: spacing.xs,
  },
  searchFieldLabel: {
    ...typography.label,
    color: colors.text,
    fontSize: 13,
    lineHeight: 16,
    letterSpacing: 0.16,
    textTransform: 'none',
  },
  searchFieldInput: {
    ...typography.body,
    color: colors.text,
    fontSize: 15,
    lineHeight: 20,
    margin: 0,
    paddingHorizontal: 0,
    paddingVertical: 0,
    backgroundColor: 'transparent',
  },
  searchFieldDivider: {
    width: 1,
    height: 30,
    backgroundColor: colors.border,
  },
  toolbarTargetButton: {
    ...webDesktopControl,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolbarTargetButtonText: {
    color: colors.textMuted,
    fontSize: 18,
    lineHeight: 18,
  },
  toolbarIconButtonPressed: {
    opacity: 0.86,
    backgroundColor: colors.surfaceMuted,
  },
  toolbarSearchButton: {
    minWidth: 102,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    shadowColor: colors.primaryPressed,
    shadowOpacity: 0.14,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  toolbarSearchButtonPressed: {
    backgroundColor: colors.primaryPressed,
  },
  toolbarSearchButtonText: {
    color: colors.surface,
    fontSize: 22,
    lineHeight: 22,
  },
  toolbarQuickActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  toolbarActionButton: {
    ...webDesktopControl,
    minHeight: 44,
    paddingHorizontal: spacing.lg,
  },
  desktopFilterRail: {
    gap: spacing.sm,
    paddingVertical: 2,
  },
  desktopFilterChip: {
    ...webDesktopChip,
    minHeight: 38,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: spacing.sm + 1,
    paddingHorizontal: spacing.md + 2,
  },
  desktopFilterChipActive: {
    borderColor: colors.primary,
    backgroundColor: '#FFF4F0',
  },
  desktopFilterChipPressed: {
    opacity: 0.88,
  },
  desktopFilterGlyph: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 14,
  },
  desktopFilterGlyphActive: {
    color: colors.primaryPressed,
  },
  desktopFilterText: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: '600',
  },
  desktopFilterTextActive: {
    color: colors.primaryPressed,
  },
  extraFiltersWrap: {
    paddingTop: 2,
  },
  filterBar: {
    flex: 1,
  },
  toolbarInfoRow: {
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
    minHeight: 22,
  },
  toolbarInfoText: {
    ...typography.caption,
    color: colors.textSubtle,
    fontSize: 12,
    lineHeight: 16,
  },
  toolbarInfoTextSuccess: {
    color: colors.success,
  },
  toolbarInfoTextWarning: {
    color: colors.warning,
  },
  toolbarInfoTextPrimary: {
    flexShrink: 1,
    color: colors.textMuted,
  },
  toolbarInfoAction: {
    paddingVertical: 2,
  },
  issueStripAction: {
    paddingVertical: 2,
  },
  issueStripActionPressed: {
    opacity: 0.7,
  },
  issueStripActionText: {
    ...typography.caption,
    color: colors.primaryPressed,
    fontSize: 12,
    lineHeight: 15,
    fontWeight: '600',
  },
  resultsMetaRow: {
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingHorizontal: spacing.xs,
    paddingTop: 2,
  },
  resultsMetaCopy: {
    flexDirection: 'row',
    alignItems: 'baseline',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  resultsCountHeadline: {
    ...typography.sectionTitle,
    ...webDesktopSectionTitle,
    color: colors.text,
  },
  resultsContextText: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: '600',
  },
  resultsMetaActions: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  sortLabelText: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: '600',
  },
  sortControl: {
    ...webDesktopControl,
    minHeight: 36,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
  },
  sortControlText: {
    ...typography.caption,
    color: colors.text,
    fontWeight: '700',
  },
  sortControlCaret: {
    ...typography.caption,
    color: colors.textSubtle,
    fontWeight: '700',
  },
  workspace: {
    gap: spacing.md,
  },
  workspaceWide: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: spacing.md,
  },
  resultsCard: {
    ...webDesktopSurface,
    minHeight: 0,
    padding: 0,
    overflow: 'hidden',
  },
  resultsCardWide: {
    flex: 1.08,
    minWidth: 700,
    maxWidth: 920,
  },
  panelScroll: {
    flex: 1,
    minHeight: 0,
  },
  resultsList: {
    paddingVertical: spacing.xs,
    paddingBottom: spacing.md,
  },
  inlineDetailPanel: {
    margin: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceRaised,
    gap: spacing.sm,
  },
  inlineDetailTopBar: {
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  inlineDetailHeading: {
    ...typography.sectionTitle,
    flex: 1,
    color: colors.text,
    fontSize: 18,
    lineHeight: 23,
  },
  inlineDetailCollapseButton: {
    minHeight: 34,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
  },
  mapColumn: {
    minWidth: 0,
    flex: 0.92,
  },
  mapCard: {
    ...webDesktopSurface,
    minHeight: 0,
    padding: 0,
    overflow: 'hidden',
  },
  mapCardWide: {
    flex: 0.92,
    minWidth: 500,
    maxWidth: 680,
  },
  mapSurfaceWrap: {
    flex: 1,
    minHeight: 0,
    position: 'relative',
    overflow: 'hidden',
    borderRadius: webDesktopSurface.borderRadius,
    backgroundColor: colors.surfaceMuted,
  },
  mapSurface: {
    height: 620,
  },
  mapSurfaceWide: {
    height: 760,
  },
  mapOverlayTopRow: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    right: spacing.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  mapOverlayChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm + 1,
    paddingHorizontal: spacing.md + 2,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(229, 220, 209, 0.95)',
    backgroundColor: 'rgba(255, 252, 248, 0.97)',
    shadowColor: '#2A2119',
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
  },
  mapOverlayChipActive: {
    borderColor: colors.borderStrong,
    backgroundColor: '#FFFDFB',
  },
  mapOverlayChipIcon: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 16,
  },
  mapOverlayChipText: {
    ...typography.caption,
    color: colors.text,
    fontWeight: '600',
  },
  mapOverlayChipTextActive: {
    color: colors.text,
  },
  mapOverlayControlRail: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    gap: spacing.sm,
  },
  mapControlButton: {
    width: 46,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(229, 220, 209, 0.95)',
    backgroundColor: 'rgba(255, 252, 248, 0.97)',
    shadowColor: '#2A2119',
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
  },
  mapControlButtonText: {
    color: colors.text,
    fontSize: 18,
    lineHeight: 18,
  },
  mapLegendFloating: {
    position: 'absolute',
    left: spacing.md,
    bottom: spacing.md,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  mapLegendChip: {
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md + 2,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(229, 220, 209, 0.95)',
    backgroundColor: 'rgba(255, 252, 248, 0.97)',
    shadowColor: '#2A2119',
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: radius.pill,
  },
  legendDotPost: {
    backgroundColor: colors.primary,
  },
  legendDotEvent: {
    backgroundColor: colors.warning,
  },
  legendDotLocation: {
    backgroundColor: colors.info,
  },
  mapLegendChipText: {
    ...typography.caption,
    color: colors.text,
    fontWeight: '600',
  },
  inlineNote: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceRaised,
    padding: spacing.sm + 2,
  },
  inlineNoteText: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: '600',
  },
  filterRowCompact: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs + 2,
  },
  actionGrid: {
    gap: spacing.sm,
  },
  commentInput: {
    minHeight: 84,
    textAlignVertical: 'top',
  },
  listStack: {
    gap: spacing.sm,
  },
  commentCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceRaised,
    padding: spacing.md,
    gap: spacing.xs + 2,
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
    color: colors.textSubtle,
  },
  commentActionsInline: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
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
    minHeight: 92,
    textAlignVertical: 'top',
  },
});
