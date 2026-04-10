import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { colors, radius, spacing, typography } from '../../theme/designSystem';

type FilterChipProps = Omit<PressableProps, 'style'> & {
  label: string;
  active?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function FilterChip({
  label,
  active = false,
  style,
  ...props
}: FilterChipProps) {
  return (
    <Pressable
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.base,
        active ? styles.active : styles.inactive,
        pressed && !active && styles.pressed,
        style,
      ]}
      {...props}
    >
      <Text style={[styles.text, active ? styles.activeText : styles.inactiveText]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 40,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  active: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  inactive: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  pressed: {
    backgroundColor: colors.surfaceStrong,
  },
  text: {
    ...typography.button,
    fontSize: 14,
  },
  activeText: {
    color: colors.surface,
  },
  inactiveText: {
    color: colors.textMuted,
  },
});
