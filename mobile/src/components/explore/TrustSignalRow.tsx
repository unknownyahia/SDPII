import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';

import { useLocalization } from '../../context/LocalizationContext';
import { colors, radius, spacing, typography } from '../../theme/designSystem';
import type { DiscoveryTrustSignal } from '../../types/discovery';

type TrustSignalRowProps = {
  signals: readonly DiscoveryTrustSignal[];
  limit?: number;
  compact?: boolean;
};

function toneToPillStyle(tone: DiscoveryTrustSignal['tone']) {
  switch (tone) {
    case 'primary':
      return styles.pillPrimary;
    case 'success':
      return styles.pillSuccess;
    case 'warning':
      return styles.pillWarning;
    case 'danger':
      return styles.pillDanger;
    case 'info':
      return styles.pillInfo;
    default:
      return styles.pillNeutral;
  }
}

function toneToTextStyle(tone: DiscoveryTrustSignal['tone']) {
  switch (tone) {
    case 'primary':
      return styles.textPrimary;
    default:
      return styles.textDefault;
  }
}

export function TrustSignalRow({
  signals,
  limit = 3,
  compact = false,
}: TrustSignalRowProps) {
  const { getRowDirection, isRTL } = useLocalization();
  const isWeb = Platform.OS === 'web';

  if (signals.length === 0) {
    return null;
  }

  return (
    <View
      style={[
        styles.row,
        compact && styles.rowCompact,
        compact && isWeb && styles.rowCompactWeb,
        { flexDirection: getRowDirection() },
      ]}
    >
      {signals.slice(0, limit).map(signal => {
        return (
          <View
            key={signal.id}
            style={[
              styles.pill,
              compact && styles.pillCompact,
              compact && isWeb && styles.pillCompactWeb,
              toneToPillStyle(signal.tone),
            ]}
          >
            <Text
              style={[
                styles.text,
                compact && styles.textCompact,
                compact && isWeb && styles.textCompactWeb,
                toneToTextStyle(signal.tone),
                { writingDirection: isRTL ? 'rtl' : 'ltr' },
              ]}
            >
              {signal.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  rowCompact: {
    gap: 2,
  },
  rowCompactWeb: {
    gap: 1,
  },
  pill: {
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs + 1,
    borderWidth: 1,
  },
  pillCompact: {
    paddingHorizontal: spacing.sm - 1,
    paddingVertical: 2,
    borderWidth: 0.5,
  },
  pillCompactWeb: {
    paddingHorizontal: spacing.xs + 4,
    paddingVertical: 1,
  },
  pillNeutral: {
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.borderStrong,
  },
  pillPrimary: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  pillSuccess: {
    backgroundColor: colors.successSoft,
    borderColor: colors.success,
  },
  pillWarning: {
    backgroundColor: colors.warningSoft,
    borderColor: colors.warning,
  },
  pillDanger: {
    backgroundColor: colors.dangerSoft,
    borderColor: colors.danger,
  },
  pillInfo: {
    backgroundColor: colors.infoSoft,
    borderColor: colors.info,
  },
  text: {
    ...typography.caption,
    fontWeight: '600',
  },
  textCompact: {
    fontSize: 11,
    lineHeight: 14,
  },
  textCompactWeb: {
    fontSize: 10,
    lineHeight: 12,
  },
  textDefault: {
    color: colors.textMuted,
  },
  textPrimary: {
    color: colors.primaryPressed,
  },
});
