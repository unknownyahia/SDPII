import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '../../theme/designSystem';
import { useLocalization } from '../../context/LocalizationContext';

type MetricTileProps = {
  label: string;
  value: string | number;
  accent?: boolean;
  compact?: boolean;
};

export function MetricTile({
  label,
  value,
  accent = false,
  compact = false,
}: MetricTileProps) {
  const { getTextAlign, isRTL } = useLocalization();
  const isWeb = Platform.OS === 'web';

  return (
    <View
      style={[
        styles.tile,
        compact && styles.tileCompact,
        compact && isWeb && styles.tileCompactWeb,
        accent && styles.tileAccent,
      ]}
    >
      <Text
        style={[
          styles.value,
          compact && styles.valueCompact,
          compact && isWeb && styles.valueCompactWeb,
          accent && styles.valueAccent,
          { textAlign: getTextAlign(), writingDirection: isRTL ? 'rtl' : 'ltr' },
        ]}
      >
        {value}
      </Text>
      <Text
        style={[
          styles.label,
          compact && isWeb && styles.labelCompactWeb,
          accent && styles.labelAccent,
          { textAlign: getTextAlign(), writingDirection: isRTL ? 'rtl' : 'ltr' },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    minWidth: 110,
    flex: 1,
    borderRadius: radius.md,
    borderWidth: 0.75,
    borderColor: colors.border,
    backgroundColor: colors.surfaceRaised,
    padding: spacing.sm + 2,
    gap: 2,
  },
  tileCompact: {
    minWidth: 84,
    padding: spacing.sm + 2,
  },
  tileCompactWeb: {
    minWidth: 68,
    paddingVertical: spacing.xs + 1,
    paddingHorizontal: spacing.xs + 2,
    borderWidth: 0.5,
    backgroundColor: colors.surfaceMuted,
  },
  tileAccent: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.border,
  },
  value: {
    ...typography.title,
  },
  valueCompact: {
    fontSize: 17,
    lineHeight: 21,
  },
  valueCompactWeb: {
    fontSize: 13,
    lineHeight: 16,
  },
  valueAccent: {
    color: colors.primaryPressed,
  },
  label: {
    ...typography.caption,
    color: colors.textSubtle,
    fontSize: 12,
    lineHeight: 15,
  },
  labelCompactWeb: {
    fontSize: 10,
    lineHeight: 12,
  },
  labelAccent: {
    color: colors.primaryPressed,
  },
});
