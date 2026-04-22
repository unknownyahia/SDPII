import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { useLocalization } from '../../context/LocalizationContext';
import { colors, spacing, typography } from '../../theme/designSystem';

type LoadingStateProps = {
  label?: string;
};

export function LoadingState({ label = 'Loading...' }: LoadingStateProps) {
  const { isRTL } = useLocalization();

  return (
    <View style={styles.container}>
      <View style={styles.panel}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text
          style={[
            styles.label,
            { writingDirection: isRTL ? 'rtl' : 'ltr' },
          ]}
        >
          {label}
        </Text>
      </View>
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
  panel: {
    minWidth: 220,
    maxWidth: 360,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  label: {
    ...typography.bodyMuted,
    textAlign: 'center',
  },
});
