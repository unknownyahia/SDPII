import React, { type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '../theme/designSystem';

type PlaceholderScreenProps = {
  title: string;
  subtitle: string;
  children?: ReactNode;
};

export function PlaceholderScreen({
  title,
  subtitle,
  children,
}: PlaceholderScreenProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
      {children ? <View style={styles.actions}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
    backgroundColor: colors.canvas,
  },
  title: {
    ...typography.title,
  },
  subtitle: {
    ...typography.bodyMuted,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  actions: {
    width: '100%',
    maxWidth: 280,
    marginTop: spacing.xxl,
    gap: spacing.md,
  },
});
