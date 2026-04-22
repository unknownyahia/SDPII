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
import { useLocalization } from '../../context/LocalizationContext';

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
  const { isRTL } = useLocalization();
  const isDisabled = disabled || loading;
  const isPrimary = variant === 'primary';
  const isWeb = Platform.OS === 'web';
  const webInteractionStyle =
    isWeb
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
        isWeb && styles.baseWeb,
        isPrimary ? styles.primary : styles.secondary,
        isWeb && isPrimary && styles.primaryWeb,
        isWeb && !isPrimary && styles.secondaryWeb,
        pressed && !isDisabled && (isPrimary ? styles.primaryPressed : styles.secondaryPressed),
        isDisabled && styles.disabled,
        webInteractionStyle,
        style,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={isPrimary ? colors.surface : colors.text} />
      ) : (
        <Text
          style={[
            styles.label,
            isPrimary ? styles.primaryLabel : styles.secondaryLabel,
            { textAlign: 'center', writingDirection: isRTL ? 'rtl' : 'ltr' },
          ]}
        >
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
    minHeight: 48,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  baseWeb: {
    minHeight: 40,
    borderRadius: radius.sm,
  },
  primary: {
    backgroundColor: colors.primary,
    shadowColor: colors.primaryPressed,
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  primaryWeb: {
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  secondary: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryWeb: {
    borderWidth: 0.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sm + 2,
  },
  primaryPressed: {
    backgroundColor: colors.primaryPressed,
  },
  secondaryPressed: {
    backgroundColor: colors.surfaceMuted,
  },
  disabled: {
    opacity: 0.6,
  },
  label: {
    ...typography.button,
    letterSpacing: 0.1,
  },
  primaryLabel: {
    color: colors.surface,
  },
  secondaryLabel: {
    color: colors.text,
  },
});
