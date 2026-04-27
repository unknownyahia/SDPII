import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, radius, spacing } from '../../theme/designSystem';

type CardProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  compact?: boolean;
  elevated?: boolean;
  inset?: boolean;
  muted?: boolean;
};

export function Card({
  children,
  style,
  compact = false,
  elevated = false,
  inset = false,
  muted = false,
}: CardProps) {
  return (
    <View
      style={[
        styles.base,
        compact && styles.compact,
        elevated && styles.elevated,
        (inset || muted) && styles.inset,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },

  compact: {
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },

  elevated: {
    shadowColor: '#20150E',
    shadowOpacity: 0.05,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },

  inset: {
    backgroundColor: colors.surfaceMuted,
    borderColor: '#EEE7E0',
  },
});
