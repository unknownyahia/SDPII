import React from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { colors, radius, spacing, typography } from '../../theme/designSystem';

type ButtonBaseProps = Omit<PressableProps, 'style'> & {
  label: string;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
};

function AppButton({
  label,
  loading = false,
  disabled,
  style,
  variant,
  ...rest
}: ButtonBaseProps & { variant: 'primary' | 'secondary' }) {
  const isDisabled = disabled || loading;
  const isPrimary = variant === 'primary';
  const webInteractionStyle =
    Platform.OS === 'web'
      ? ({
          cursor: isDisabled ? 'not-allowed' : 'pointer',
          userSelect: 'none',
        } as unknown as ViewStyle)
      : null;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        isPrimary ? styles.primary : styles.secondary,
        pressed && !isDisabled && (isPrimary ? styles.primaryPressed : styles.secondaryPressed),
        isDisabled && styles.disabled,
        webInteractionStyle,
        style,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={isPrimary ? colors.surface : colors.primary} />
      ) : (
        <Text style={[styles.label, isPrimary ? styles.primaryLabel : styles.secondaryLabel]}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

export function PrimaryButton(props: ButtonBaseProps) {
  return <AppButton {...props} variant="primary" />;
}

export function SecondaryButton(props: ButtonBaseProps) {
  return <AppButton {...props} variant="secondary" />;
}

const styles = StyleSheet.create({
  base: {
    minHeight: 52,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  primary: {
    backgroundColor: colors.primary,
  },
  secondary: {
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.border,
  },
  primaryPressed: {
    backgroundColor: colors.primaryPressed,
  },
  secondaryPressed: {
    backgroundColor: '#D8E7FB',
  },
  disabled: {
    opacity: 0.65,
  },
  label: {
    ...typography.button,
  },
  primaryLabel: {
    color: colors.surface,
  },
  secondaryLabel: {
    color: colors.primary,
  },
});
