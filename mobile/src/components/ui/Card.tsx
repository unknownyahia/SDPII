import React, { type ReactNode } from 'react';
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, radius, shadows, spacing } from '../../theme/designSystem';

type CardProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  muted?: boolean;
};

export function Card({ children, style, muted = false }: CardProps) {
  const isWeb = Platform.OS === 'web';

  return (
    <View
      style={[
        styles.card,
        isWeb && styles.cardWeb,
        muted && styles.cardMuted,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 0.75,
    borderColor: colors.border,
    padding: spacing.lg,
    ...shadows.card,
  },
  cardWeb: {
    borderRadius: radius.lg,
    padding: spacing.md + 2,
    shadowOpacity: 0.03,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
  },
  cardMuted: {
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.border,
  },
});
