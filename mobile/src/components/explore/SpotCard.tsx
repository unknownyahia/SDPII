import React from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { useLocalization } from '../../context/LocalizationContext';
import { colors, radius, spacing, typography } from '../../theme/designSystem';
import type { DiscoverySpot } from '../../types/discovery';
import { DiscoveryHeroImage } from './DiscoveryHeroImage';
import { TrustSignalRow } from './TrustSignalRow';

function getPrimarySignals(spot: DiscoverySpot) {
  const prioritizedSignals = spot.trustSignals.filter(signal => signal.id !== 'updated');
  return prioritizedSignals.length > 0
    ? prioritizedSignals.slice(0, 1)
    : spot.trustSignals.slice(0, 1);
}

type SpotCardProps = {
  spot: DiscoverySpot;
  selected?: boolean;
  compact?: boolean;
  variant?: 'default' | 'desktopSearch';
  onPress: () => void;
};

export function SpotCard({
  spot,
  selected = false,
  compact = false,
  variant = 'default',
  onPress,
}: SpotCardProps) {
  const { getRowDirection, getTextAlign, isRTL, t } = useLocalization();
  const isWeb = Platform.OS === 'web';
  const isDesktopSearch = variant === 'desktopSearch';
  const isCompactWebCard = compact && isWeb;
  const primarySignals = getPrimarySignals(spot);
  const distanceAvailable = spot.distanceLabel !== t('discovery.distanceUnavailable');
  const utilityLabel = distanceAvailable ? spot.distanceLabel : spot.areaLabel;
  const desktopSupportLabel = spot.socialSignal?.label ?? null;
  const compactSupportLabel = spot.socialSignal?.label ?? utilityLabel;

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
        hero={isDesktopSearch || isCompactWebCard ? { ...spot.hero, badgeLabel: null } : spot.hero}
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
                {spot.title}
              </Text>
              <View style={[styles.desktopMetaRow, { flexDirection: getRowDirection() }]}>
                <Text
                  style={[
                    styles.desktopMeta,
                    { writingDirection: isRTL ? 'rtl' : 'ltr' },
                  ]}
                  numberOfLines={1}
                >
                  {spot.categoryLabel}
                </Text>
                <Text style={styles.desktopMetaDot}>•</Text>
                <Text
                  style={[
                    styles.desktopMeta,
                    { writingDirection: isRTL ? 'rtl' : 'ltr' },
                  ]}
                  numberOfLines={1}
                >
                  {spot.areaLabel}
                </Text>
              </View>
              <Text
                style={[
                  styles.desktopDescription,
                  { textAlign: getTextAlign(), writingDirection: isRTL ? 'rtl' : 'ltr' },
                ]}
                numberOfLines={1}
              >
                {spot.description}
              </Text>
              <View style={styles.desktopCueRow}>
                {primarySignals.length > 0 ? (
                  <TrustSignalRow signals={primarySignals} limit={1} compact />
                ) : null}
                {desktopSupportLabel ? (
                  <Text
                    style={[
                      styles.desktopUtilityText,
                      { textAlign: getTextAlign(), writingDirection: isRTL ? 'rtl' : 'ltr' },
                    ]}
                    numberOfLines={1}
                  >
                    {desktopSupportLabel}
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
                {utilityLabel}
              </Text>
              <Text
                style={[
                  styles.desktopUpdated,
                  { writingDirection: isRTL ? 'rtl' : 'ltr' },
                ]}
                numberOfLines={1}
              >
                {spot.updatedLabel}
              </Text>
              <View style={[styles.desktopActionsRow, { flexDirection: getRowDirection() }]}>
                <View
                  style={[
                    styles.desktopActionButton,
                    spot.saved && styles.desktopActionButtonActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.desktopActionGlyph,
                      spot.saved && styles.desktopActionGlyphActive,
                    ]}
                  >
                    {spot.saved ? '★' : '☆'}
                  </Text>
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
              {spot.title}
            </Text>
            <Text
              style={[
                styles.meta,
                styles.compactMetaWeb,
                { textAlign: getTextAlign(), writingDirection: isRTL ? 'rtl' : 'ltr' },
              ]}
              numberOfLines={1}
            >
              {`${spot.categoryLabel} • ${spot.areaLabel}`}
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
                {t('explore.communitySpot')}
              </Text>
              {!compact ? (
                <View style={styles.utilityPill}>
                  <Text
                    style={[
                      styles.utilityText,
                      { writingDirection: isRTL ? 'rtl' : 'ltr' },
                    ]}
                  >
                    {spot.distanceLabel}
                  </Text>
                </View>
              ) : null}
            </View>
            <Text
              style={[
                styles.title,
                { textAlign: getTextAlign(), writingDirection: isRTL ? 'rtl' : 'ltr' },
              ]}
              numberOfLines={2}
            >
              {spot.title}
            </Text>
            <Text
              style={[
                styles.meta,
                { textAlign: getTextAlign(), writingDirection: isRTL ? 'rtl' : 'ltr' },
              ]}
              numberOfLines={1}
            >
              {compact ? spot.distanceLabel : spot.areaLabel}
            </Text>
            {!compact ? (
              <Text
                style={[
                  styles.body,
                  { textAlign: getTextAlign(), writingDirection: isRTL ? 'rtl' : 'ltr' },
                ]}
                numberOfLines={2}
              >
                {spot.description}
              </Text>
            ) : null}
            <TrustSignalRow signals={spot.trustSignals.slice(0, 1)} limit={1} />
            {spot.socialSignal ? (
              <Text
                style={[
                  styles.social,
                  { textAlign: getTextAlign(), writingDirection: isRTL ? 'rtl' : 'ltr' },
                ]}
                numberOfLines={1}
              >
                {spot.socialSignal.label}
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
    borderColor: colors.primary,
    backgroundColor: colors.surface,
  },
  cardSelectedDesktopLtr: {
    borderLeftWidth: 3,
    paddingLeft: spacing.md - 3,
    backgroundColor: '#FFF6F3',
  },
  cardSelectedDesktopRtl: {
    borderRightWidth: 3,
    paddingRight: spacing.md - 3,
    backgroundColor: '#FFF6F3',
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
    color: colors.primaryPressed,
  },
  utilityPill: {
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surfaceRaised,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
  },
  utilityText: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: '600',
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
    color: colors.textMuted,
  },
  desktopMeta: {
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
  desktopUtilityText: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: '600',
    fontSize: 12,
    lineHeight: 16,
  },
  desktopAside: {
    width: 88,
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
  desktopActionButtonActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  desktopActionGlyph: {
    color: colors.textMuted,
    fontSize: 18,
    lineHeight: 18,
  },
  desktopActionGlyphActive: {
    color: colors.primaryPressed,
  },
  compactTitleWeb: {
    fontSize: 14,
    lineHeight: 18,
  },
  compactMetaWeb: {
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
