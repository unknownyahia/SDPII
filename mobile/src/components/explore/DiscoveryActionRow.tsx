import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useLocalization } from '../../context/LocalizationContext';
import { colors, radius, spacing, typography } from '../../theme/designSystem';
import type { DiscoveryAction } from '../../types/discovery';

type DiscoveryActionRowProps = {
  actions: readonly DiscoveryAction[];
};

export function DiscoveryActionRow({ actions }: DiscoveryActionRowProps) {
  const { getRowDirection, isRTL } = useLocalization();

  if (actions.length === 0) {
    return null;
  }

  return (
    <View style={[styles.row, { flexDirection: getRowDirection() }]}>
      {actions.map(action => {
        return (
          <Pressable
            key={action.id}
            accessibilityRole="button"
            disabled={action.disabled || action.loading}
            onPress={action.onPress}
            style={({ pressed }) => [
              styles.action,
              (action.tone === 'primary' || action.active) && styles.actionPrimary,
              pressed && !(action.disabled || action.loading) && styles.actionPressed,
              (action.disabled || action.loading) && styles.actionDisabled,
            ]}
          >
            <Text
              style={[
                styles.actionText,
                (action.tone === 'primary' || action.active) && styles.actionTextPrimary,
                { writingDirection: isRTL ? 'rtl' : 'ltr' },
              ]}
            >
              {action.loading ? `${action.label}...` : action.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  action: {
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surfaceRaised,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 1,
  },
  actionPrimary: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  actionPressed: {
    opacity: 0.9,
  },
  actionDisabled: {
    opacity: 0.58,
  },
  actionText: {
    ...typography.caption,
    color: colors.text,
    fontWeight: '600',
  },
  actionTextPrimary: {
    color: colors.primaryPressed,
  },
});
