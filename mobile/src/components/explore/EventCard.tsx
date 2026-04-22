import React from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { useLocalization } from '../../context/LocalizationContext';
import { colors, radius, spacing, typography } from '../../theme/designSystem';
import type { DiscoveryEvent } from '../../types/discovery';
import { formatDisplayDateTime } from '../../utils/formatDisplayDateTime';
import { DiscoveryHeroImage } from './DiscoveryHeroImage';
import { TrustSignalRow } from './TrustSignalRow';

type EventCardProps = {
  event: DiscoveryEvent;
  selected?: boolean;
  compact?: boolean;
  variant?: 'default' | 'desktopSearch';
  onPress: () => void;
};

export function EventCard({
  event,
  selected = false,
  compact = false,
  variant = 'default',
  onPress,
}: EventCardProps) {
  const { getRowDirection, getTextAlign, isRTL, language, t } = useLocalization();
  const isWeb = Platform.OS === 'web';
  const isDesktopSearch = variant === 'desktopSearch';
  const isCompactWebCard = compact && isWeb;
  const primaryTrustSignal =
    event.trustSignals.find(signal => signal.id === 'promoted') ??
    event.trustSignals[0] ??
    null;
  const primarySignals =
    primaryTrustSignal && primaryTrustSignal.id !== 'updated'
      ? [primaryTrustSignal]
      : [];
  const supportingSignal =
    event.socialSignal?.label ??
    event.trustSignals.find(
      signal => signal.id !== primaryTrustSignal?.id && signal.id !== 'updated'
    )?.label ??
    null;
  const scheduleLabel =
    isWeb
      ? formatDisplayDateTime(event.rawEvent.startTime, language) ?? event.scheduleLabel
      : event.scheduleLabel;
  const compactSupportLabel = supportingSignal ?? event.organizerLabel;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        isDesktopSearch && styles.cardDesktop,
        compact && styles.cardCompact,
        compact && isWeb && styles.cardCompactWeb,
        selected && styles.cardSelected,
        selected &&
          isDesktopSearch &&
          (isRTL ? styles.cardSelectedDesktopRtl : styles.cardSelectedDesktopLtr),
        pressed && styles.cardPressed,
      ]}
    >
      <DiscoveryHeroImage
        hero={
          isDesktopSearch || isCompactWebCard ? { ...event.hero, badgeLabel: null } : event.hero
        }
        height={
          isDesktopSearch
            ? 80
            : isCompactWebCard
              ? 68
              : compact
                ? 92
                : 126
        }
        style={isDesktopSearch ? styles.heroDesktop : undefined}
      />
      <View
        style={[
          styles.copy,
          isDesktopSearch && styles.copyDesktop,
          compact && isWeb && styles.copyCompactWeb,
        ]}
      >
        {isDesktopSearch ? (
          <View style={[styles.desktopShell, { flexDirection: getRowDirection() }]}>
            <View style={styles.desktopMainCopy}>
              <Text
                style={[
                  styles.desktopTitle,
                  { textAlign: getTextAlign(), writingDirection: isRTL ? 'rtl' : 'ltr' },
                ]}
                numberOfLines={2}
              >
                {event.title}
              </Text>
              <View style={[styles.desktopMetaRow, { flexDirection: getRowDirection() }]}>
                <Text
                  style={[
                    styles.desktopMeta,
                    { writingDirection: isRTL ? 'rtl' : 'ltr' },
                  ]}
                  numberOfLines={1}
                >
                  {scheduleLabel}
                </Text>
                <Text style={styles.desktopMetaDot}>•</Text>
                <Text
                  style={[
                    styles.desktopVenue,
                    { writingDirection: isRTL ? 'rtl' : 'ltr' },
                  ]}
                  numberOfLines={1}
                >
                  {event.venueLabel || event.areaLabel}
                </Text>
              </View>
              <Text
                style={[
                  styles.desktopDescription,
                  { textAlign: getTextAlign(), writingDirection: isRTL ? 'rtl' : 'ltr' },
                ]}
                numberOfLines={1}
              >
                {event.description}
              </Text>
              <View style={styles.desktopCueRow}>
                {primarySignals.length > 0 ? (
                  <TrustSignalRow signals={primarySignals} limit={1} compact />
                ) : null}
                {supportingSignal ? (
                  <Text
                    style={[
                      styles.desktopSupportingSignal,
                      { textAlign: getTextAlign(), writingDirection: isRTL ? 'rtl' : 'ltr' },
                    ]}
                    numberOfLines={1}
                  >
                    {supportingSignal}
                  </Text>
                ) : null}
              </View>
            </View>

            <View style={styles.desktopAside}>
              <Text
                style={[
                  styles.desktopDistance,
                  { writingDirection: isRTL ? 'rtl' : 'ltr' },
                ]}
                numberOfLines={1}
              >
                {event.distanceLabel}
              </Text>
              <Text
                style={[
                  styles.desktopUpdated,
                  { writingDirection: isRTL ? 'rtl' : 'ltr' },
                ]}
                numberOfLines={1}
              >
                {event.activeNow ? t('discovery.activeNow') : event.organizerLabel}
              </Text>
              <View style={[styles.desktopActionsRow, { flexDirection: getRowDirection() }]}>
                <View style={styles.desktopActionButton}>
                  <Text style={styles.desktopActionGlyph}>☆</Text>
                </View>
                <View style={styles.desktopActionButton}>
                  <Text style={styles.desktopActionGlyph}>⋯</Text>
                </View>
              </View>
            </View>
          </View>
        ) : isCompactWebCard ? (
          <>
            <Text
              style={[
                styles.title,
                styles.compactTitleWeb,
                { textAlign: getTextAlign(), writingDirection: isRTL ? 'rtl' : 'ltr' },
              ]}
              numberOfLines={2}
            >
              {event.title}
            </Text>
            <Text
              style={[
                styles.meta,
                styles.compactMetaWeb,
                { textAlign: getTextAlign(), writingDirection: isRTL ? 'rtl' : 'ltr' },
              ]}
              numberOfLines={1}
            >
              {scheduleLabel}
            </Text>
            <Text
              style={[
                styles.submeta,
                styles.compactVenueWeb,
                { textAlign: getTextAlign(), writingDirection: isRTL ? 'rtl' : 'ltr' },
              ]}
              numberOfLines={1}
            >
              {event.venueLabel || event.areaLabel}
            </Text>
            {primarySignals.length > 0 ? (
              <TrustSignalRow signals={primarySignals} limit={1} compact />
            ) : null}
            {compactSupportLabel ? (
              <Text
                style={[
                  styles.compactSupportText,
                  { textAlign: getTextAlign(), writingDirection: isRTL ? 'rtl' : 'ltr' },
                ]}
                numberOfLines={1}
              >
                {compactSupportLabel}
              </Text>
            ) : null}
          </>
        ) : (
          <>
            <View style={[styles.headerRow, { flexDirection: getRowDirection() }]}>
              <Text
                style={[
                  styles.eyebrow,
                  { textAlign: getTextAlign(), writingDirection: isRTL ? 'rtl' : 'ltr' },
                ]}
              >
                {t('explore.liveEvent')}
              </Text>
              {!compact ? (
                <Text
                  style={[
                    styles.organizer,
                    { textAlign: getTextAlign(), writingDirection: isRTL ? 'rtl' : 'ltr' },
                  ]}
                  numberOfLines={1}
                >
                  {event.organizerLabel}
                </Text>
              ) : null}
            </View>
            <Text
              style={[
                styles.title,
                { textAlign: getTextAlign(), writingDirection: isRTL ? 'rtl' : 'ltr' },
              ]}
              numberOfLines={2}
            >
              {event.title}
            </Text>
            <Text
              style={[
                styles.meta,
                { textAlign: getTextAlign(), writingDirection: isRTL ? 'rtl' : 'ltr' },
              ]}
              numberOfLines={1}
            >
              {scheduleLabel}
            </Text>
            {!compact ? (
              <>
                <Text
                  style={[
                    styles.submeta,
                    { textAlign: getTextAlign(), writingDirection: isRTL ? 'rtl' : 'ltr' },
                  ]}
                  numberOfLines={1}
                >
                  {event.venueLabel}
                </Text>
                <Text
                  style={[
                    styles.body,
                    { textAlign: getTextAlign(), writingDirection: isRTL ? 'rtl' : 'ltr' },
                  ]}
                  numberOfLines={1}
                >
                  {event.description}
                </Text>
              </>
            ) : null}
            <TrustSignalRow signals={event.trustSignals.slice(0, 1)} limit={1} />
            {event.socialSignal ? (
              <Text
                style={[
                  styles.social,
                  { textAlign: getTextAlign(), writingDirection: isRTL ? 'rtl' : 'ltr' },
                ]}
                numberOfLines={1}
              >
                {event.socialSignal.label}
              </Text>
            ) : null}
          </>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
    padding: spacing.md,
    gap: spacing.md,
  },
  cardDesktop: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: spacing.md,
    paddingVertical: spacing.md + 2,
    paddingHorizontal: spacing.md,
    borderRadius: 0,
    borderColor: colors.border,
    borderWidth: 0,
    borderBottomWidth: 1,
    backgroundColor: colors.surface,
  },
  cardCompact: {
    gap: spacing.sm,
    padding: spacing.sm + 2,
  },
  cardCompactWeb: {
    paddingVertical: spacing.xs + 3,
    paddingHorizontal: spacing.xs + 3,
    gap: 4,
  },
  cardSelected: {
    borderColor: colors.warning,
    backgroundColor: colors.surface,
  },
  cardSelectedDesktopLtr: {
    borderLeftWidth: 3,
    paddingLeft: spacing.md - 3,
    backgroundColor: '#FFF8F0',
  },
  cardSelectedDesktopRtl: {
    borderRightWidth: 3,
    paddingRight: spacing.md - 3,
    backgroundColor: '#FFF8F0',
  },
  cardPressed: {
    opacity: 0.94,
  },
  copy: {
    gap: spacing.sm,
  },
  copyDesktop: {
    flex: 1,
    minWidth: 0,
    gap: 0,
  },
  copyCompactWeb: {
    gap: 3,
  },
  heroDesktop: {
    width: 168,
    flexShrink: 0,
    borderRadius: radius.md,
    borderColor: colors.border,
    borderWidth: 1,
  },
  desktopShell: {
    flex: 1,
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  desktopMainCopy: {
    flex: 1,
    minWidth: 0,
    gap: 6,
  },
  desktopMetaRow: {
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  desktopMetaDot: {
    ...typography.caption,
    color: colors.textSubtle,
    fontSize: 11,
    lineHeight: 12,
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
    ...typography.sectionTitle,
  },
  desktopTitle: {
    ...typography.sectionTitle,
    color: colors.text,
    fontSize: 17,
    lineHeight: 22,
  },
  meta: {
    ...typography.button,
    color: colors.text,
    fontWeight: '600',
  },
  desktopMeta: {
    ...typography.caption,
    color: colors.text,
    fontWeight: '600',
    fontSize: 12,
    lineHeight: 16,
  },
  submeta: {
    ...typography.caption,
    color: colors.textMuted,
  },
  desktopVenue: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: '600',
    fontSize: 12,
    lineHeight: 16,
  },
  body: {
    ...typography.bodyMuted,
    color: colors.textMuted,
  },
  desktopDescription: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 18,
  },
  desktopCueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  social: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: '600',
  },
  desktopSupportingSignal: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: '600',
    fontSize: 12,
    lineHeight: 16,
  },
  desktopAside: {
    width: 96,
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: spacing.sm,
    alignSelf: 'stretch',
  },
  desktopDistance: {
    ...typography.button,
    color: colors.text,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '600',
  },
  desktopUpdated: {
    ...typography.caption,
    color: colors.textSubtle,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
  },
  desktopActionsRow: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  desktopActionButton: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  desktopActionGlyph: {
    color: colors.textMuted,
    fontSize: 18,
    lineHeight: 18,
  },
  compactTitleWeb: {
    fontSize: 14,
    lineHeight: 18,
  },
  compactMetaWeb: {
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '700',
  },
  compactVenueWeb: {
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '600',
  },
  compactSupportText: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: '600',
    fontSize: 10,
    lineHeight: 14,
  },
});
