import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { InfoRow } from '../ui/InfoRow';
import { useLocalization } from '../../context/LocalizationContext';
import { colors, radius, spacing, typography } from '../../theme/designSystem';
import type { DiscoveryAction, DiscoveryEvent } from '../../types/discovery';
import { DiscoveryActionRow } from './DiscoveryActionRow';
import { DiscoveryHeroImage } from './DiscoveryHeroImage';
import { TrustSignalRow } from './TrustSignalRow';

type EventDetailPanelProps = {
  event: DiscoveryEvent;
  actions?: readonly DiscoveryAction[];
  banner?: React.ReactNode;
  children?: React.ReactNode;
  compact?: boolean;
};

export function EventDetailPanel({
  event,
  actions = [],
  banner,
  children,
  compact = false,
}: EventDetailPanelProps) {
  const { getRowDirection, getTextAlign, isRTL, t } = useLocalization();
  const primaryFact = event.facts[0] ?? null;

  return (
    <View style={styles.stack}>
      {banner}
      <DiscoveryHeroImage hero={event.hero} height={compact ? 132 : 172} />
      <View style={styles.copy}>
        <View style={[styles.headerRow, { flexDirection: getRowDirection() }]}>
          <Text
            style={[
              styles.eyebrow,
              { textAlign: getTextAlign(), writingDirection: isRTL ? 'rtl' : 'ltr' },
            ]}
          >
            {t('explore.promotedEvent')}
          </Text>
          <Text
            style={[
              styles.organizer,
              { textAlign: getTextAlign(), writingDirection: isRTL ? 'rtl' : 'ltr' },
            ]}
          >
            {event.organizerLabel}
          </Text>
        </View>
        <Text
          style={[
            styles.title,
            { textAlign: getTextAlign(), writingDirection: isRTL ? 'rtl' : 'ltr' },
          ]}
        >
          {event.title}
        </Text>
        <Text
          style={[
            styles.meta,
            { textAlign: getTextAlign(), writingDirection: isRTL ? 'rtl' : 'ltr' },
          ]}
        >
          {event.scheduleLabel} · {event.venueLabel} · {event.distanceLabel}
        </Text>
      </View>
      <TrustSignalRow signals={event.trustSignals} limit={compact ? 1 : 3} />
      {event.socialSignal ? (
        <Text
          style={[
            styles.social,
            { textAlign: getTextAlign(), writingDirection: isRTL ? 'rtl' : 'ltr' },
          ]}
          numberOfLines={compact ? 1 : undefined}
        >
          {event.socialSignal.label}
        </Text>
      ) : null}
      <DiscoveryActionRow actions={actions} />
      <View style={styles.summaryBlock}>
        <Text
          style={[
            styles.summaryTitle,
            { textAlign: getTextAlign(), writingDirection: isRTL ? 'rtl' : 'ltr' },
          ]}
        >
          {t('explore.eventOverview')}
        </Text>
        <Text
          style={[
            styles.summaryBody,
            { textAlign: getTextAlign(), writingDirection: isRTL ? 'rtl' : 'ltr' },
          ]}
          numberOfLines={compact ? 3 : undefined}
        >
          {event.summary}
        </Text>
      </View>
      {compact ? (
        primaryFact ? (
          <View style={styles.factsBlock}>
            <InfoRow
              label={primaryFact.label}
              value={primaryFact.value}
              subtle={primaryFact.subtle}
            />
          </View>
        ) : null
      ) : (
        <View style={styles.factsBlock}>
          <Text
            style={[
              styles.factsTitle,
              { textAlign: getTextAlign(), writingDirection: isRTL ? 'rtl' : 'ltr' },
            ]}
          >
            {t('explore.eventDetails')}
          </Text>
          <View style={styles.facts}>
            {event.facts.map(fact => (
              <InfoRow
                key={`${event.eventId}-${fact.label}`}
                label={fact.label}
                value={fact.value}
                subtle={fact.subtle}
              />
            ))}
          </View>
        </View>
      )}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: spacing.md,
  },
  copy: {
    gap: spacing.xs,
  },
  headerRow: {
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  eyebrow: {
    ...typography.label,
    color: colors.warning,
  },
  organizer: {
    ...typography.caption,
    color: colors.textSubtle,
    flex: 1,
  },
  title: {
    ...typography.title,
  },
  meta: {
    ...typography.bodyMuted,
  },
  social: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: '600',
  },
  summaryBlock: {
    gap: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surfaceRaised,
    padding: spacing.lg,
  },
  summaryTitle: {
    ...typography.button,
    color: colors.text,
  },
  summaryBody: {
    ...typography.body,
  },
  factsBlock: {
    gap: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surfaceRaised,
    padding: spacing.lg,
  },
  factsTitle: {
    ...typography.button,
    color: colors.text,
  },
  facts: {
    gap: spacing.xs,
  },
});
