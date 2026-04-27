import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useLocalization } from '../../context/LocalizationContext';
import {
  addCommentToPost,
  CommentValidationError,
  observeCommentsForPost,
} from '../../services/commentService';
import {
  observeLikeUserIdsForPost,
  ReactionValidationError,
  togglePostLike,
} from '../../services/reactionService';
import {
  ReportValidationError,
  submitReport,
} from '../../services/reportService';
import { colors, radius, spacing, typography } from '../../theme/designSystem';
import { getErrorMessage } from '../../utils/dataAccessError';
import { showAlert } from '../../utils/showAlert';
import type { PostComment } from '../../types/comment';
import type { SpotPost } from '../../types/post';
import type { ReportReason } from '../../types/report';

type PostInteractionPanelProps = {
  post: SpotPost;
  currentUserId: string | null | undefined;
  currentUserLabel: string | null | undefined;
  compact?: boolean;
};

const REPORT_REASONS: readonly ReportReason[] = [
  'spam',
  'misleading',
  'offensive',
  'unsafe',
  'other',
];

function getReasonLabel(reason: ReportReason, language: 'en' | 'ar') {
  if (language === 'ar') {
    switch (reason) {
      case 'spam':
        return 'مزعج';
      case 'misleading':
        return 'مضلل';
      case 'offensive':
        return 'مسيء';
      case 'unsafe':
        return 'غير آمن';
      default:
        return 'أخرى';
    }
  }

  switch (reason) {
    case 'spam':
      return 'Spam';
    case 'misleading':
      return 'Misleading';
    case 'offensive':
      return 'Offensive';
    case 'unsafe':
      return 'Unsafe';
    default:
      return 'Other';
  }
}

function formatCommentTime(value: unknown, language: 'en' | 'ar') {
  if (
    value &&
    typeof value === 'object' &&
    'toDate' in value &&
    typeof (value as { toDate?: unknown }).toDate === 'function'
  ) {
    const date = (value as { toDate: () => Date }).toDate();
    return new Intl.DateTimeFormat(language === 'ar' ? 'ar-QA' : 'en-US', {
      hour: 'numeric',
      minute: '2-digit',
    }).format(date);
  }

  return language === 'ar' ? 'الآن' : 'now';
}

export function PostInteractionPanel({
  post,
  currentUserId,
  currentUserLabel,
  compact = false,
}: PostInteractionPanelProps) {
  const { getRowDirection, getTextAlign, isRTL, language } = useLocalization();
  const [comments, setComments] = React.useState<PostComment[]>([]);
  const [likeUserIds, setLikeUserIds] = React.useState<string[]>([]);
  const [commentText, setCommentText] = React.useState('');
  const [reportNote, setReportNote] = React.useState('');
  const [reportReason, setReportReason] = React.useState<ReportReason>('unsafe');
  const [commentLoading, setCommentLoading] = React.useState(false);
  const [likeLoading, setLikeLoading] = React.useState(false);
  const [reportLoading, setReportLoading] = React.useState(false);

  React.useEffect(() => {
    return observeCommentsForPost(
      post.id,
      setComments,
      error => {
        showAlert(
          language === 'ar' ? 'تعذر تحميل التعليقات' : 'Could not load comments',
          getErrorMessage(error, 'Unable to load comments right now.')
        );
      }
    );
  }, [language, post.id]);

  React.useEffect(() => {
    return observeLikeUserIdsForPost(
      post.id,
      setLikeUserIds,
      error => {
        showAlert(
          language === 'ar' ? 'تعذر تحميل التفاعلات' : 'Could not load reactions',
          getErrorMessage(error, 'Unable to load reactions right now.')
        );
      }
    );
  }, [language, post.id]);

  const liked = currentUserId ? likeUserIds.includes(currentUserId) : false;
  const visibleComments = compact ? comments.slice(0, 2) : comments.slice(0, 4);
  const textAlign = getTextAlign();

  const handleToggleLike = React.useCallback(async () => {
    setLikeLoading(true);

    try {
      await togglePostLike({
        postId: post.id,
        userId: currentUserId,
        isCurrentlyLiked: liked,
      });
    } catch (error) {
      const message =
        error instanceof ReactionValidationError
          ? error.message
          : getErrorMessage(error, 'Unable to update reaction right now.');
      showAlert(language === 'ar' ? 'تعذر التفاعل' : 'Could not react', message);
    } finally {
      setLikeLoading(false);
    }
  }, [currentUserId, language, liked, post.id]);

  const handleAddComment = React.useCallback(async () => {
    setCommentLoading(true);

    try {
      await addCommentToPost({
        postId: post.id,
        userId: currentUserId,
        authorLabel: currentUserLabel,
        text: commentText,
      });
      setCommentText('');
    } catch (error) {
      const message =
        error instanceof CommentValidationError
          ? error.message
          : getErrorMessage(error, 'Unable to add comment right now.');
      showAlert(language === 'ar' ? 'تعذر إضافة التعليق' : 'Could not comment', message);
    } finally {
      setCommentLoading(false);
    }
  }, [commentText, currentUserId, currentUserLabel, language, post.id]);

  const handleReportPost = React.useCallback(async () => {
    setReportLoading(true);

    try {
      await submitReport({
        reporterUserId: currentUserId,
        targetType: 'post',
        targetId: post.id,
        reason: reportReason,
        note: reportNote,
      });
      setReportNote('');
      showAlert(
        language === 'ar' ? 'تم إرسال البلاغ' : 'Report submitted',
        language === 'ar'
          ? 'سيراجع المشرفون هذا المحتوى.'
          : 'Moderators will review this content.'
      );
    } catch (error) {
      const message =
        error instanceof ReportValidationError
          ? error.message
          : getErrorMessage(error, 'Unable to submit report right now.');
      showAlert(language === 'ar' ? 'تعذر إرسال البلاغ' : 'Could not report', message);
    } finally {
      setReportLoading(false);
    }
  }, [currentUserId, language, post.id, reportNote, reportReason]);

  return (
    <View style={styles.panel}>
      <View style={[styles.metricRow, { flexDirection: getRowDirection() }]}>
        <Pressable
          accessibilityRole="button"
          disabled={likeLoading}
          onPress={() => void handleToggleLike()}
          style={({ pressed }) => [
            styles.metricButton,
            liked && styles.metricButtonActive,
            pressed && styles.pressed,
          ]}
        >
          {likeLoading ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <Text style={[styles.metricText, liked && styles.metricTextActive]}>
              {liked ? '♥' : '♡'} {likeUserIds.length}
            </Text>
          )}
        </Pressable>

        <View style={styles.metricButton}>
          <Text style={styles.metricText}>
            {language === 'ar' ? 'تعليقات' : 'Comments'} {comments.length}
          </Text>
        </View>
      </View>

      <View style={styles.commentList}>
        {visibleComments.length === 0 ? (
          <Text
            style={[
              styles.emptyText,
              { textAlign, writingDirection: isRTL ? 'rtl' : 'ltr' },
            ]}
          >
            {language === 'ar'
              ? 'لا توجد تعليقات بعد. ابدأ المحادثة.'
              : 'No comments yet. Start the conversation.'}
          </Text>
        ) : (
          visibleComments.map(comment => (
            <View key={comment.id} style={styles.commentBubble}>
              <View style={[styles.commentHeader, { flexDirection: getRowDirection() }]}>
                <Text
                  style={[
                    styles.commentAuthor,
                    { textAlign, writingDirection: isRTL ? 'rtl' : 'ltr' },
                  ]}
                  numberOfLines={1}
                >
                  {comment.authorLabel}
                </Text>
                <Text style={styles.commentTime}>
                  {formatCommentTime(comment.createdAt, language)}
                </Text>
              </View>
              <Text
                style={[
                  styles.commentBody,
                  { textAlign, writingDirection: isRTL ? 'rtl' : 'ltr' },
                ]}
              >
                {comment.text}
              </Text>
            </View>
          ))
        )}
      </View>

      <View style={[styles.commentComposer, { flexDirection: getRowDirection() }]}>
        <TextInput
          value={commentText}
          onChangeText={setCommentText}
          placeholder={language === 'ar' ? 'اكتب تعليقًا...' : 'Write a comment...'}
          placeholderTextColor={colors.textSubtle}
          style={[
            styles.commentInput,
            { textAlign, writingDirection: isRTL ? 'rtl' : 'ltr' },
          ]}
        />
        <Pressable
          accessibilityRole="button"
          disabled={commentLoading}
          onPress={() => void handleAddComment()}
          style={({ pressed }) => [
            styles.sendButton,
            commentLoading && styles.sendButtonDisabled,
            pressed && styles.pressed,
          ]}
        >
          {commentLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.sendButtonText}>{language === 'ar' ? 'إرسال' : 'Send'}</Text>
          )}
        </Pressable>
      </View>

      <View style={styles.reportBlock}>
        <View style={[styles.reasonRow, { flexDirection: getRowDirection() }]}>
          {REPORT_REASONS.map(reason => {
            const active = reportReason === reason;

            return (
              <Pressable
                key={reason}
                accessibilityRole="button"
                onPress={() => setReportReason(reason)}
                style={({ pressed }) => [
                  styles.reasonChip,
                  active && styles.reasonChipActive,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={[styles.reasonChipText, active && styles.reasonChipTextActive]}>
                  {getReasonLabel(reason, language)}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={[styles.commentComposer, { flexDirection: getRowDirection() }]}>
          <TextInput
            value={reportNote}
            onChangeText={setReportNote}
            placeholder={language === 'ar' ? 'ملاحظة اختيارية للبلاغ' : 'Optional report note'}
            placeholderTextColor={colors.textSubtle}
            style={[
              styles.commentInput,
              { textAlign, writingDirection: isRTL ? 'rtl' : 'ltr' },
            ]}
          />
          <Pressable
            accessibilityRole="button"
            disabled={reportLoading}
            onPress={() => void handleReportPost()}
            style={({ pressed }) => [
              styles.reportButton,
              reportLoading && styles.sendButtonDisabled,
              pressed && styles.pressed,
            ]}
          >
            {reportLoading ? (
              <ActivityIndicator color={colors.danger} />
            ) : (
              <Text style={styles.reportButtonText}>
                {language === 'ar' ? 'بلاغ' : 'Report'}
              </Text>
            )}
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    padding: spacing.md,
  },
  metricRow: {
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  metricButton: {
    minHeight: 34,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceRaised,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricButtonActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  metricText: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: '700',
  },
  metricTextActive: {
    color: colors.primaryPressed,
  },
  commentList: {
    gap: spacing.sm,
  },
  emptyText: {
    ...typography.caption,
    color: colors.textMuted,
  },
  commentBubble: {
    borderRadius: radius.md,
    backgroundColor: colors.surfaceRaised,
    padding: spacing.md,
    gap: spacing.xs,
  },
  commentHeader: {
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  commentAuthor: {
    ...typography.caption,
    flex: 1,
    color: colors.text,
    fontWeight: '800',
  },
  commentTime: {
    ...typography.caption,
    color: colors.textSubtle,
  },
  commentBody: {
    ...typography.body,
    color: colors.text,
  },
  commentComposer: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  commentInput: {
    flex: 1,
    minHeight: 42,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceRaised,
    paddingHorizontal: spacing.md,
    color: colors.text,
  },
  sendButton: {
    minHeight: 42,
    minWidth: 74,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
  },
  sendButtonDisabled: {
    opacity: 0.72,
  },
  sendButtonText: {
    ...typography.button,
    color: '#FFFFFF',
  },
  reportBlock: {
    gap: spacing.sm,
  },
  reasonRow: {
    alignItems: 'center',
    gap: spacing.xs,
    flexWrap: 'wrap',
  },
  reasonChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceRaised,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
  },
  reasonChipActive: {
    borderColor: colors.danger,
    backgroundColor: '#FFF0EE',
  },
  reasonChipText: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: '700',
  },
  reasonChipTextActive: {
    color: colors.danger,
  },
  reportButton: {
    minHeight: 42,
    minWidth: 78,
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF8F6',
    paddingHorizontal: spacing.md,
  },
  reportButtonText: {
    ...typography.button,
    color: colors.danger,
  },
  pressed: {
    opacity: 0.84,
  },
});
