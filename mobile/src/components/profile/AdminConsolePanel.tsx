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
import { getAdminAnalytics } from '../../services/analyticsService';
import {
  hideReportedTarget,
  ModerationValidationError,
  observeReports,
  reviewReportStatus,
} from '../../services/moderationService';
import {
  markUserAsOrganization,
  OrganizationValidationError,
} from '../../services/organizationService';
import {
  SubscriptionValidationError,
  updateUserPlan,
} from '../../services/subscriptionService';
import { colors, radius, spacing, typography } from '../../theme/designSystem';
import { getErrorMessage } from '../../utils/dataAccessError';
import { showAlert } from '../../utils/showAlert';
import type { AdminAnalyticsSnapshot } from '../../types/analytics';
import type { ModerationReport, ReportStatus } from '../../types/report';
import type { PlanLevel, PlanStatus } from '../../types/subscription';

type AdminConsolePanelProps = {
  role: string | null | undefined;
};

const PLAN_LEVELS: readonly PlanLevel[] = [
  'free',
  'organization_basic',
  'organization_premium',
];

const PLAN_STATUSES: readonly PlanStatus[] = [
  'active',
  'trial',
  'inactive',
];

function formatLabel(value: string) {
  return value.replace(/_/g, ' ');
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

export function AdminConsolePanel({ role }: AdminConsolePanelProps) {
  const { getRowDirection, getTextAlign, isRTL, language } = useLocalization();
  const [analytics, setAnalytics] = React.useState<AdminAnalyticsSnapshot | null>(null);
  const [reports, setReports] = React.useState<ModerationReport[]>([]);
  const [loadingAnalytics, setLoadingAnalytics] = React.useState(false);
  const [workingReportId, setWorkingReportId] = React.useState<string | null>(null);
  const [targetUserId, setTargetUserId] = React.useState('');
  const [planLevel, setPlanLevel] = React.useState<PlanLevel>('organization_basic');
  const [planStatus, setPlanStatus] = React.useState<PlanStatus>('active');
  const [savingPlan, setSavingPlan] = React.useState(false);

  const isAdmin = role === 'admin';
  const textAlign = getTextAlign();

  React.useEffect(() => {
    if (!isAdmin) {
      setAnalytics(null);
      setReports([]);
      return undefined;
    }

    setLoadingAnalytics(true);
    void getAdminAnalytics(role)
      .then(setAnalytics)
      .catch(error => {
        showAlert(
          language === 'ar' ? 'تعذر تحميل التحليلات' : 'Could not load analytics',
          getErrorMessage(error, 'Unable to load admin analytics right now.')
        );
      })
      .finally(() => setLoadingAnalytics(false));

    return observeReports(
      role,
      setReports,
      error => {
        showAlert(
          language === 'ar' ? 'تعذر تحميل البلاغات' : 'Could not load reports',
          getErrorMessage(error, 'Unable to load reports right now.')
        );
      }
    );
  }, [isAdmin, language, role]);

  const handleReview = React.useCallback(
    async (report: ModerationReport, status: ReportStatus) => {
      setWorkingReportId(report.id);

      try {
        await reviewReportStatus({
          role,
          reportId: report.id,
          status,
        });
      } catch (error) {
        const message =
          error instanceof ModerationValidationError
            ? error.message
            : getErrorMessage(error, 'Unable to update report right now.');
        showAlert(language === 'ar' ? 'تعذر تحديث البلاغ' : 'Could not update report', message);
      } finally {
        setWorkingReportId(null);
      }
    },
    [language, role]
  );

  const handleHide = React.useCallback(
    async (report: ModerationReport) => {
      setWorkingReportId(report.id);

      try {
        await hideReportedTarget({ role, report });
        showAlert(
          language === 'ar' ? 'تم اتخاذ الإجراء' : 'Moderation action taken',
          language === 'ar'
            ? 'تم إخفاء المحتوى وتحديث البلاغ.'
            : 'The content was hidden and the report was updated.'
        );
      } catch (error) {
        const message =
          error instanceof ModerationValidationError
            ? error.message
            : getErrorMessage(error, 'Unable to moderate this target right now.');
        showAlert(language === 'ar' ? 'تعذر الإشراف' : 'Could not moderate', message);
      } finally {
        setWorkingReportId(null);
      }
    },
    [language, role]
  );

  const handlePlanUpdate = React.useCallback(async () => {
    setSavingPlan(true);

    try {
      await updateUserPlan({
        adminRole: role,
        targetUserId,
        planLevel,
        status: planStatus,
      });
      showAlert(
        language === 'ar' ? 'تم تحديث الخطة' : 'Plan updated',
        language === 'ar'
          ? 'تم حفظ حالة الاشتراك لهذا المستخدم.'
          : 'The subscription state was saved for this user.'
      );
    } catch (error) {
      const message =
        error instanceof SubscriptionValidationError
          ? error.message
          : getErrorMessage(error, 'Unable to update subscription right now.');
      showAlert(language === 'ar' ? 'تعذر تحديث الخطة' : 'Could not update plan', message);
    } finally {
      setSavingPlan(false);
    }
  }, [language, planLevel, planStatus, role, targetUserId]);

  const handleMarkOrganization = React.useCallback(async () => {
    setSavingPlan(true);

    try {
      await markUserAsOrganization({
        adminRole: role,
        targetUserId,
      });
      showAlert(
        language === 'ar' ? 'تم تحديث الدور' : 'Role updated',
        language === 'ar'
          ? 'تم تحويل المستخدم إلى حساب منظمة.'
          : 'The user can now use organization features.'
      );
    } catch (error) {
      const message =
        error instanceof OrganizationValidationError
          ? error.message
          : getErrorMessage(error, 'Unable to update user role right now.');
      showAlert(language === 'ar' ? 'تعذر تحديث الدور' : 'Could not update role', message);
    } finally {
      setSavingPlan(false);
    }
  }, [language, role, targetUserId]);

  if (!isAdmin) {
    return null;
  }

  const openReports = reports.filter(report => report.status === 'open');

  return (
    <View style={styles.card}>
      <Text
        style={[
          styles.title,
          { textAlign, writingDirection: isRTL ? 'rtl' : 'ltr' },
        ]}
      >
        {language === 'ar' ? 'لوحة المشرف' : 'Admin Console'}
      </Text>
      <Text
        style={[
          styles.subtitle,
          { textAlign, writingDirection: isRTL ? 'rtl' : 'ltr' },
        ]}
      >
        {language === 'ar'
          ? 'تحليلات، بلاغات، وخطط اشتراك للمراجعة النهائية.'
          : 'Analytics, reports, and subscription controls for final evaluation.'}
      </Text>

      {loadingAnalytics ? (
        <ActivityIndicator color={colors.primary} />
      ) : analytics ? (
        <View style={[styles.metricGrid, { flexDirection: getRowDirection() }]}>
          <Metric label={language === 'ar' ? 'مستخدمون' : 'Users'} value={analytics.totalUsers} />
          <Metric label={language === 'ar' ? 'منشورات' : 'Posts'} value={analytics.totalPosts} />
          <Metric label={language === 'ar' ? 'بلاغات' : 'Reports'} value={analytics.totalReports} />
          <Metric label={language === 'ar' ? 'فعاليات' : 'Events'} value={analytics.totalPromotedEvents} />
          <Metric label={language === 'ar' ? 'تعليقات' : 'Comments'} value={analytics.totalComments} />
          <Metric label={language === 'ar' ? 'إعجابات' : 'Likes'} value={analytics.totalLikes} />
        </View>
      ) : null}

      <View style={styles.toolBlock}>
        <Text style={styles.blockTitle}>
          {language === 'ar' ? 'إدارة الاشتراك والمنظمات' : 'Subscription and Organization'}
        </Text>
        <TextInput
          value={targetUserId}
          onChangeText={setTargetUserId}
          placeholder={language === 'ar' ? 'معرّف المستخدم' : 'Target user id'}
          placeholderTextColor={colors.textSubtle}
          autoCapitalize="none"
          style={[
            styles.input,
            { textAlign, writingDirection: isRTL ? 'rtl' : 'ltr' },
          ]}
        />
        <View style={[styles.chipRow, { flexDirection: getRowDirection() }]}>
          {PLAN_LEVELS.map(level => (
            <Pressable
              key={level}
              onPress={() => setPlanLevel(level)}
              style={[styles.chip, planLevel === level && styles.chipActive]}
            >
              <Text style={[styles.chipText, planLevel === level && styles.chipTextActive]}>
                {formatLabel(level)}
              </Text>
            </Pressable>
          ))}
        </View>
        <View style={[styles.chipRow, { flexDirection: getRowDirection() }]}>
          {PLAN_STATUSES.map(status => (
            <Pressable
              key={status}
              onPress={() => setPlanStatus(status)}
              style={[styles.chip, planStatus === status && styles.chipActive]}
            >
              <Text style={[styles.chipText, planStatus === status && styles.chipTextActive]}>
                {formatLabel(status)}
              </Text>
            </Pressable>
          ))}
        </View>
        <View style={[styles.actionRow, { flexDirection: getRowDirection() }]}>
          <Pressable
            disabled={savingPlan}
            onPress={() => void handlePlanUpdate()}
            style={[styles.primaryButton, savingPlan && styles.disabled]}
          >
            <Text style={styles.primaryButtonText}>
              {language === 'ar' ? 'تحديث الخطة' : 'Update Plan'}
            </Text>
          </Pressable>
          <Pressable
            disabled={savingPlan}
            onPress={() => void handleMarkOrganization()}
            style={[styles.secondaryButton, savingPlan && styles.disabled]}
          >
            <Text style={styles.secondaryButtonText}>
              {language === 'ar' ? 'اجعله منظمة' : 'Make Organization'}
            </Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.toolBlock}>
        <Text style={styles.blockTitle}>
          {language === 'ar'
            ? `البلاغات المفتوحة (${openReports.length})`
            : `Open Reports (${openReports.length})`}
        </Text>
        {openReports.length === 0 ? (
          <Text style={styles.emptyText}>
            {language === 'ar' ? 'لا توجد بلاغات مفتوحة.' : 'No open reports.'}
          </Text>
        ) : (
          openReports.slice(0, 4).map(report => (
            <View key={report.id} style={styles.reportRow}>
              <Text style={styles.reportTitle}>
                {report.targetType} · {report.reason}
              </Text>
              <Text style={styles.reportBody} numberOfLines={2}>
                {report.note || report.targetId}
              </Text>
              <View style={[styles.actionRow, { flexDirection: getRowDirection() }]}>
                <Pressable
                  disabled={workingReportId === report.id}
                  onPress={() => void handleReview(report, 'reviewed')}
                  style={styles.secondaryButton}
                >
                  <Text style={styles.secondaryButtonText}>
                    {language === 'ar' ? 'مراجَع' : 'Review'}
                  </Text>
                </Pressable>
                <Pressable
                  disabled={workingReportId === report.id}
                  onPress={() => void handleReview(report, 'dismissed')}
                  style={styles.secondaryButton}
                >
                  <Text style={styles.secondaryButtonText}>
                    {language === 'ar' ? 'رفض' : 'Dismiss'}
                  </Text>
                </Pressable>
                <Pressable
                  disabled={workingReportId === report.id}
                  onPress={() => void handleHide(report)}
                  style={styles.dangerButton}
                >
                  <Text style={styles.dangerButtonText}>
                    {language === 'ar' ? 'إخفاء' : 'Hide'}
                  </Text>
                </Pressable>
              </View>
            </View>
          ))
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.md,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
    padding: spacing.lg,
  },
  title: {
    ...typography.sectionTitle,
    color: colors.text,
  },
  subtitle: {
    ...typography.bodyMuted,
    color: colors.textMuted,
  },
  metricGrid: {
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  metric: {
    minWidth: 92,
    flexGrow: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceRaised,
    padding: spacing.md,
    gap: spacing.xs,
  },
  metricValue: {
    ...typography.sectionTitle,
    color: colors.primaryPressed,
  },
  metricLabel: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: '700',
  },
  toolBlock: {
    gap: spacing.sm,
  },
  blockTitle: {
    ...typography.button,
    color: colors.text,
  },
  input: {
    minHeight: 44,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceRaised,
    paddingHorizontal: spacing.md,
    color: colors.text,
  },
  chipRow: {
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceRaised,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
  },
  chipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  chipText: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  chipTextActive: {
    color: colors.primaryPressed,
  },
  actionRow: {
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  primaryButton: {
    minHeight: 42,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
  },
  primaryButtonText: {
    ...typography.button,
    color: '#FFFFFF',
  },
  secondaryButton: {
    minHeight: 42,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceRaised,
    paddingHorizontal: spacing.md,
  },
  secondaryButtonText: {
    ...typography.button,
    color: colors.text,
  },
  dangerButton: {
    minHeight: 42,
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.dangerSoft,
    paddingHorizontal: spacing.md,
  },
  dangerButtonText: {
    ...typography.button,
    color: colors.danger,
  },
  disabled: {
    opacity: 0.7,
  },
  emptyText: {
    ...typography.bodyMuted,
    color: colors.textMuted,
  },
  reportRow: {
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceRaised,
    padding: spacing.md,
  },
  reportTitle: {
    ...typography.button,
    color: colors.text,
    textTransform: 'capitalize',
  },
  reportBody: {
    ...typography.caption,
    color: colors.textMuted,
  },
});
