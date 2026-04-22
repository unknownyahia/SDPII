import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';

import { Card } from '../ui/Card';
import { MetricTile } from '../ui/MetricTile';
import { useLocalization } from '../../context/LocalizationContext';
import { colors, radius, spacing, typography } from '../../theme/designSystem';

type AccountSummaryCardProps = {
  username: string;
  email?: string | null;
  bio?: string;
  role: string;
  xp: number;
  plan: string;
  planStatus?: string;
  saves: number;
  unreadActivity: number;
};

export function AccountSummaryCard({
  username,
  email,
  bio,
  role,
  xp,
  plan,
  planStatus,
  saves,
  unreadActivity,
}: AccountSummaryCardProps) {
  const { getPlanStatusLabel, getRoleLabel, getTextAlign, getRowDirection, isRTL, t } =
    useLocalization();
  const isWeb = Platform.OS === 'web';
  const avatarInitial = (username || email || 'Spots').trim().charAt(0).toUpperCase();

  return (
    <Card style={[styles.card, isWeb && styles.cardWeb]}>
      <View style={[styles.header, isWeb && styles.headerWeb, { flexDirection: getRowDirection() }]}>
        <View style={[styles.identity, isWeb && styles.identityWeb, { flexDirection: getRowDirection() }]}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{avatarInitial || 'S'}</Text>
          </View>
          <View style={[styles.copy, isWeb && styles.copyWeb]}>
            <Text
              style={[
                styles.eyebrow,
                { textAlign: getTextAlign(), writingDirection: isRTL ? 'rtl' : 'ltr' },
              ]}
            >
              {t('account.eyebrow')}
            </Text>
            <Text
              style={[
                styles.title,
                isWeb && styles.titleWeb,
                { textAlign: getTextAlign(), writingDirection: isRTL ? 'rtl' : 'ltr' },
              ]}
            >
              {username || t('account.fallbackTitle')}
            </Text>
            <Text
              style={[
                styles.subtitle,
                isWeb && styles.subtitleWeb,
                { textAlign: getTextAlign(), writingDirection: isRTL ? 'rtl' : 'ltr' },
              ]}
            >
              {email ?? t('account.noEmail')}
            </Text>
            {bio ? (
              <Text
                style={[
                  styles.bio,
                  isWeb && styles.bioWeb,
                  { textAlign: getTextAlign(), writingDirection: isRTL ? 'rtl' : 'ltr' },
                ]}
                numberOfLines={2}
              >
                {bio}
              </Text>
            ) : null}
          </View>
        </View>
        <View
          style={[
            styles.metaPills,
            isWeb && styles.metaPillsWeb,
            {
              flexDirection: getRowDirection(),
              justifyContent: isRTL ? 'flex-start' : 'flex-end',
            },
          ]}
        >
          <View style={[styles.metaPill, isWeb && styles.metaPillWeb, styles.metaPillPrimary]}>
            <Text
              style={[
                styles.metaPillLabel,
                { textAlign: getTextAlign(), writingDirection: isRTL ? 'rtl' : 'ltr' },
              ]}
            >
              {t('account.role')}
            </Text>
            <Text
              style={[
                styles.metaPillValue,
                { textAlign: getTextAlign(), writingDirection: isRTL ? 'rtl' : 'ltr' },
              ]}
            >
              {getRoleLabel(role)}
            </Text>
          </View>
          <View style={[styles.metaPill, isWeb && styles.metaPillWeb]}>
            <Text
              style={[
                styles.metaPillLabel,
                { textAlign: getTextAlign(), writingDirection: isRTL ? 'rtl' : 'ltr' },
              ]}
            >
              {t('account.plan')}
            </Text>
            <Text
              style={[
                styles.metaPillValue,
                { textAlign: getTextAlign(), writingDirection: isRTL ? 'rtl' : 'ltr' },
              ]}
            >
              {plan}
            </Text>
          </View>
        </View>
      </View>

      <View style={[styles.metricRow, isWeb && styles.metricRowWeb, { flexDirection: getRowDirection() }]}>
        <MetricTile label={t('account.xp')} value={xp} accent compact />
        <MetricTile label={t('account.saves')} value={saves} compact />
        <MetricTile label={t('account.unread')} value={unreadActivity} compact />
      </View>

      <Text
        style={[
          styles.metaLine,
          isWeb && styles.metaLineWeb,
          { textAlign: getTextAlign(), writingDirection: isRTL ? 'rtl' : 'ltr' },
        ]}
      >
        {planStatus
          ? t('account.planStatusLine', {
              status: getPlanStatusLabel(planStatus),
              email: email ?? t('account.noEmail'),
            })
          : t('account.planStatusUnavailable')}
        {planStatus ? '' : ` · ${email ?? t('account.noEmail')}`}
      </Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.md + 2,
  },
  cardWeb: {
    gap: spacing.xs + 2,
  },
  header: {
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  headerWeb: {
    gap: spacing.sm,
  },
  identity: {
    flex: 1,
    minWidth: 0,
    gap: spacing.sm,
    alignItems: 'center',
  },
  identityWeb: {
    gap: spacing.md,
  },
  avatar: {
    width: 68,
    height: 68,
    borderRadius: 68,
    borderWidth: 0.75,
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: {
    ...typography.title,
    color: colors.primaryPressed,
    fontSize: 24,
    lineHeight: 28,
  },
  copy: {
    flex: 1,
    gap: spacing.xs,
  },
  copyWeb: {
    gap: 4,
  },
  eyebrow: {
    ...typography.label,
    color: colors.primaryPressed,
  },
  title: {
    ...typography.title,
    color: colors.text,
    fontSize: 24,
    lineHeight: 30,
  },
  titleWeb: {
    fontSize: 18,
    lineHeight: 22,
  },
  subtitle: {
    ...typography.bodyMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  subtitleWeb: {
    fontSize: 13,
    lineHeight: 18,
  },
  bio: {
    ...typography.body,
    color: colors.textMuted,
    marginTop: 2,
    fontSize: 14,
    lineHeight: 20,
  },
  bioWeb: {
    fontSize: 13,
    lineHeight: 18,
  },
  metaPills: {
    flexWrap: 'wrap',
    gap: spacing.xs,
    maxWidth: 240,
  },
  metaPillsWeb: {
    gap: 6,
    maxWidth: 220,
  },
  metaPill: {
    borderRadius: radius.md,
    borderWidth: 0.75,
    borderColor: colors.border,
    backgroundColor: colors.surfaceRaised,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs + 1,
    gap: 2,
  },
  metaPillWeb: {
    paddingHorizontal: spacing.xs + 3,
    paddingVertical: spacing.xs,
  },
  metaPillPrimary: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  metaPillLabel: {
    ...typography.caption,
    color: colors.textSubtle,
  },
  metaPillValue: {
    ...typography.caption,
    color: colors.text,
    textTransform: 'capitalize',
    fontWeight: '700',
  },
  metricRow: {
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  metricRowWeb: {
    gap: 4,
  },
  metaLine: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 11,
    lineHeight: 15,
  },
  metaLineWeb: {
    fontSize: 10,
    lineHeight: 13,
  },
});
