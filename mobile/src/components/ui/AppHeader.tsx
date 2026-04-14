import React, { type ReactNode } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';

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

  return (
    <View style={[styles.row, isWeb && styles.rowWeb]}>
      <View style={[styles.copy, isWeb && styles.copyWeb]}>
        {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
        <Text style={styles.title}>{title}</Text>
        {subtitle ? (
          <Text style={[styles.subtitle, isWeb && styles.subtitleWeb]}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right ? <View>{right}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.lg,
    marginBottom: spacing.xl,
  },
  rowWeb: {
    marginBottom: spacing.xxl,
  },
  copy: {
    flex: 1,
  },
  copyWeb: {
    maxWidth: 760,
  },
  eyebrow: {
    ...typography.label,
    marginBottom: spacing.sm,
    color: colors.primary,
  },
  title: {
    ...typography.hero,
  },
  subtitle: {
    ...typography.bodyMuted,
    marginTop: spacing.sm,
    maxWidth: 520,
  },
  subtitleWeb: {
    maxWidth: 680,
  },
});
