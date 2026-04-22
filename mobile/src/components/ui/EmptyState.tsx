import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';

import { useLocalization } from '../../context/LocalizationContext';
import { colors, radius, spacing, typography } from '../../theme/designSystem';

type EmptyStateProps = {
  title: string;
  subtitle: string;
  compact?: boolean;
};

export function EmptyState({
  title,
  subtitle,
  compact = false,
}: EmptyStateProps) {
  const { isRTL } = useLocalization();
  const isWeb = Platform.OS === 'web';

  return (
    <View
      style={[
        styles.container,
        isWeb && styles.containerWeb,
        compact && styles.containerCompact,
        compact && isWeb && styles.containerCompactWeb,
      ]}
    >
      <Text
        style={[
          styles.title,
          compact && styles.titleCompact,
          compact && isWeb && styles.titleCompactWeb,
          { writingDirection: isRTL ? 'rtl' : 'ltr' },
        ]}
      >
        {title}
      </Text>
      <Text
        style={[
          styles.subtitle,
          compact && styles.subtitleCompact,
          compact && isWeb && styles.subtitleCompactWeb,
          { writingDirection: isRTL ? 'rtl' : 'ltr' },
        ]}
      >
        {subtitle}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
    gap: spacing.sm,
  },
  containerWeb: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm + 2,
    borderRadius: radius.lg,
  },
  containerCompact: {
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: 0,
    borderRadius: radius.md,
    borderWidth: 0,
    backgroundColor: 'transparent',
    gap: 1,
  },
  containerCompactWeb: {
    paddingVertical: spacing.xs,
    gap: 2,
  },
  title: {
    ...typography.sectionTitle,
    textAlign: 'center',
  },
  titleCompact: {
    fontSize: 14,
    lineHeight: 18,
  },
  titleCompactWeb: {
    fontSize: 12,
    lineHeight: 16,
  },
  subtitle: {
    ...typography.bodyMuted,
    textAlign: 'center',
  },
  subtitleCompact: {
    fontSize: 11,
    lineHeight: 14,
  },
  subtitleCompactWeb: {
    fontSize: 11,
    lineHeight: 15,
  },
});
