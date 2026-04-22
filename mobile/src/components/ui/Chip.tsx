import React from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { colors, radius, spacing, typography } from '../../theme/designSystem';
import { useLocalization } from '../../context/LocalizationContext';

type FilterChipProps = Omit<PressableProps, 'style'> & {
  label: string;
  active?: boolean;
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function FilterChip({
  label,
  active = false,
  compact = false,
  style,
  ...props
}: FilterChipProps) {
  const { isRTL } = useLocalization();
  const isWeb = Platform.OS === 'web';
  return (
    <Pressable
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.base,
        compact && styles.baseCompact,
        compact && isWeb && styles.baseCompactWeb,
        active ? styles.active : styles.inactive,
        active && compact && styles.activeCompact,
        !active && compact && styles.inactiveCompact,
        pressed && !active && styles.pressed,
        style,
      ]}
      {...props}
    >
      <Text
        style={[
          styles.text,
          compact && styles.textCompact,
          compact && isWeb && styles.textCompactWeb,
          active ? styles.activeText : styles.inactiveText,
          { writingDirection: isRTL ? 'rtl' : 'ltr' },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 44,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  baseCompact: {
    minHeight: 26,
    paddingHorizontal: spacing.xs + 3,
    borderWidth: 0.5,
  },
  baseCompactWeb: {
    minHeight: 22,
    paddingHorizontal: spacing.xs,
  },
  active: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  activeCompact: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.border,
  },
  inactive: {
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.borderStrong,
  },
  inactiveCompact: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  pressed: {
    backgroundColor: colors.surfaceMuted,
  },
  text: {
    ...typography.button,
    fontSize: 14,
  },
  textCompact: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '500',
  },
  textCompactWeb: {
    fontSize: 10,
    lineHeight: 12,
    fontWeight: '500',
  },
  activeText: {
    color: colors.primaryPressed,
  },
  inactiveText: {
    color: colors.textMuted,
  },
});
