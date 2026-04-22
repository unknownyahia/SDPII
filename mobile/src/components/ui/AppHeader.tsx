import React, { type ReactNode } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';

import { useLocalization } from '../../context/LocalizationContext';
import { colors, spacing, typography } from '../../theme/designSystem';

type AppHeaderProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  right?: ReactNode;
};

export function AppHeader({
  eyebrow,
  title,
  subtitle,
  right,
}: AppHeaderProps) {
  const isWeb = Platform.OS === 'web';
  const { getRowDirection, getTextAlign, isRTL } = useLocalization();

  return (
    <View
      style={[
        styles.row,
        isWeb && styles.rowWeb,
        { flexDirection: getRowDirection() },
      ]}
    >
      <View style={[styles.copy, isWeb && styles.copyWeb]}>
        {eyebrow ? (
          <Text
            style={[
              styles.eyebrow,
              { textAlign: getTextAlign(), writingDirection: isRTL ? 'rtl' : 'ltr' },
            ]}
          >
            {eyebrow}
          </Text>
        ) : null}
        <Text
          style={[
            styles.title,
            isWeb && styles.titleWeb,
            { textAlign: getTextAlign(), writingDirection: isRTL ? 'rtl' : 'ltr' },
          ]}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text
            style={[
              styles.subtitle,
              isWeb && styles.subtitleWeb,
              { textAlign: getTextAlign(), writingDirection: isRTL ? 'rtl' : 'ltr' },
            ]}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right ? (
        <View style={[styles.actions, { flexDirection: getRowDirection() }]}>{right}</View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  rowWeb: {
    gap: spacing.sm + 2,
    marginBottom: spacing.sm + 2,
  },
  copy: {
    flex: 1,
    minWidth: 260,
  },
  copyWeb: {
    maxWidth: 760,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.xs + 2,
  },
  eyebrow: {
    ...typography.label,
    marginBottom: spacing.xs,
    color: colors.primaryPressed,
  },
  title: {
    ...typography.hero,
  },
  titleWeb: {
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: -0.4,
  },
  subtitle: {
    ...typography.bodyMuted,
    marginTop: spacing.xs,
    maxWidth: 580,
  },
  subtitleWeb: {
    marginTop: 4,
    maxWidth: 560,
    fontSize: 12,
    lineHeight: 17,
  },
});
