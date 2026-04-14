import React from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';

import { colors, radius, spacing, typography } from '../../theme/designSystem';

type TextFieldProps = TextInputProps & {
  label?: string;
  helperText?: string;
  webType?: string;
};

export function TextField({
  label,
  helperText,
  style,
  webType,
  ...props
}: TextFieldProps) {
  const webInputProps =
    Platform.OS === 'web' && webType
      ? ({ type: webType } as unknown as TextInputProps)
      : undefined;

  return (
    <View style={styles.wrapper}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        {...webInputProps}
        placeholderTextColor={colors.textSubtle}
        style={[styles.input, style]}
        {...props}
      />
      {helperText ? <Text style={styles.helper}>{helperText}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing.sm,
  },
  label: {
    ...typography.label,
    color: colors.textMuted,
  },
  input: {
    minHeight: 52,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    color: colors.text,
    fontSize: 15,
  },
  helper: {
    ...typography.caption,
  },
});
