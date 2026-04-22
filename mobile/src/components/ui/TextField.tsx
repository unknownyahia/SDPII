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
import { useLocalization } from '../../context/LocalizationContext';
import { webDesktopControl } from '../../theme/webDesktopSystem';

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
  const { getTextAlign, isRTL } = useLocalization();
  const isWeb = Platform.OS === 'web';
  const webInputProps =
    isWeb && webType
      ? ({ type: webType } as unknown as TextInputProps)
      : undefined;

  return (
    <View style={styles.wrapper}>
      {label ? (
        <Text
          style={[
            styles.label,
            { textAlign: getTextAlign(), writingDirection: isRTL ? 'rtl' : 'ltr' },
          ]}
        >
          {label}
        </Text>
      ) : null}
      <TextInput
        {...webInputProps}
        placeholderTextColor={colors.textSubtle}
        style={[
          styles.input,
          isWeb && styles.inputWeb,
          {
            textAlign: getTextAlign(),
            writingDirection: isRTL ? 'rtl' : 'ltr',
          },
          style,
        ]}
        {...props}
      />
      {helperText ? (
        <Text
          style={[
            styles.helper,
            { textAlign: getTextAlign(), writingDirection: isRTL ? 'rtl' : 'ltr' },
          ]}
        >
          {helperText}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing.xs,
  },
  label: {
    ...typography.label,
    color: colors.textMuted,
  },
  input: {
    minHeight: 54,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surfaceRaised,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    color: colors.text,
    fontSize: 15,
  },
  inputWeb: {
    ...webDesktopControl,
    minHeight: 44,
    paddingHorizontal: spacing.md + 2,
    paddingVertical: spacing.sm + 2,
  },
  helper: {
    ...typography.caption,
    color: colors.textSubtle,
  },
});
