import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { useLocalization } from '../../context/LocalizationContext';
import { colors, radius, spacing, typography } from '../../theme/designSystem';

type ButtonTone = 'primary' | 'secondary' | 'ghost' | 'danger';

type ButtonProps = Omit<PressableProps, 'style'> & {
  label: string;
  loading?: boolean;
  tone?: ButtonTone;
  compact?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

function getToneStyles(tone: ButtonTone) {
  switch (tone) {
    case 'secondary':
      return {
        container: styles.secondaryContainer,
        label: styles.secondaryLabel,
        spinner: colors.text,
      };
    case 'ghost':
      return {
        container: styles.ghostContainer,
        label: styles.ghostLabel,
        spinner: colors.primary,
      };
    case 'danger':
      return {
        container: styles.dangerContainer,
        label: styles.dangerLabel,
        spinner: '#FFFFFF',
      };
    case 'primary':
    default:
      return {
        container: styles.primaryContainer,
        label: styles.primaryLabel,
        spinner: '#FFFFFF',
      };
  }
}

export function Button({
  label,
  onPress,
  disabled = false,
  loading = false,
  tone = 'primary',
  compact = false,
  fullWidth = true,
  leftIcon,
  rightIcon,
  style,
  ...pressableProps
}: ButtonProps) {
  const { getRowDirection, isRTL } = useLocalization();
  const toneStyles = getToneStyles(tone);

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        toneStyles.container,
        compact && styles.compact,
        fullWidth && styles.fullWidth,
        (disabled || loading) && styles.disabled,
        pressed && !(disabled || loading) && styles.pressed,
        style,
      ]}
      {...pressableProps}
    >
      <View style={[styles.contentRow, { flexDirection: getRowDirection() }]}>
        {loading ? (
          <ActivityIndicator size="small" color={toneStyles.spinner} />
        ) : (
          <>
            {leftIcon ? <View style={styles.iconWrap}>{leftIcon}</View> : null}

            <Text
              style={[
                styles.label,
                toneStyles.label,
                compact && styles.labelCompact,
                { writingDirection: isRTL ? 'rtl' : 'ltr' },
              ]}
            >
              {label}
            </Text>

            {rightIcon ? <View style={styles.iconWrap}>{rightIcon}</View> : null}
          </>
        )}
      </View>
    </Pressable>
  );
}

export function PrimaryButton(props: Omit<ButtonProps, 'tone'>) {
  return <Button {...props} tone="primary" />;
}

export function SecondaryButton(props: Omit<ButtonProps, 'tone'>) {
  return <Button {...props} tone="secondary" />;
}

const styles = StyleSheet.create({
  base: {
    minHeight: 54,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },

  fullWidth: {
    width: '100%',
  },

  compact: {
    minHeight: 42,
    paddingHorizontal: spacing.md,
    borderRadius: 14,
  },

  contentRow: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs + 2,
  },

  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  label: {
    ...typography.button,
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '800',
  },

  labelCompact: {
    fontSize: 14,
    lineHeight: 17,
  },

  primaryContainer: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOpacity: 0.16,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  primaryLabel: {
    color: '#FFFFFF',
  },

  secondaryContainer: {
    backgroundColor: '#FFFFFF',
    borderColor: colors.borderStrong,
  },
  secondaryLabel: {
    color: colors.text,
  },

  ghostContainer: {
    backgroundColor: colors.primarySoft,
    borderColor: '#F3CDC6',
  },
  ghostLabel: {
    color: colors.primary,
  },

  dangerContainer: {
    backgroundColor: colors.danger,
    borderColor: colors.danger,
  },
  dangerLabel: {
    color: '#FFFFFF',
  },

  disabled: {
    opacity: 0.58,
  },

  pressed: {
    opacity: 0.84,
    transform: [{ scale: 0.995 }],
  },
});
