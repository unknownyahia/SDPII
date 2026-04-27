import React from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  Platform,
  type StyleProp,
  type TextStyle,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';

import { useLocalization } from '../../context/LocalizationContext';
import { colors, radius, spacing, typography } from '../../theme/designSystem';

type TextFieldProps = TextInputProps & {
  label?: string;
  helperText?: string;
  errorText?: string;
  compact?: boolean;
  leftAdornment?: React.ReactNode;
  rightAdornment?: React.ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
  webType?: string;
};

export function TextField({
  label,
  value,
  onChangeText,
  placeholder,
  helperText,
  errorText,
  multiline = false,
  numberOfLines,
  keyboardType = 'default',
  secureTextEntry = false,
  editable = true,
  compact = false,
  leftAdornment,
  rightAdornment,
  containerStyle,
  inputStyle,
  style,
  webType,
  ...textInputProps
}: TextFieldProps) {
  const { getTextAlign, isRTL, getRowDirection } = useLocalization();
  const hasError = Boolean(errorText);
  const webInputProps =
    Platform.OS === 'web' && webType
      ? ({ type: webType } as unknown as TextInputProps)
      : undefined;

  return (
    <View style={containerStyle}>
      {label ? (
        <Text
          style={[
            styles.label,
            compact && styles.labelCompact,
            { textAlign: getTextAlign(), writingDirection: isRTL ? 'rtl' : 'ltr' },
          ]}
        >
          {label}
        </Text>
      ) : null}

      <View
        style={[
          styles.fieldShell,
          compact && styles.fieldShellCompact,
          hasError && styles.fieldShellError,
          !editable && styles.fieldShellDisabled,
        ]}
      >
        <View
          style={[
            styles.inputRow,
            { flexDirection: getRowDirection() },
            multiline && styles.inputRowMultiline,
          ]}
        >
          {leftAdornment ? <View style={styles.adornmentWrap}>{leftAdornment}</View> : null}

          <TextInput
            {...webInputProps}
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor={colors.textSubtle}
            multiline={multiline}
            numberOfLines={numberOfLines}
            keyboardType={keyboardType}
            secureTextEntry={secureTextEntry}
            editable={editable}
            {...textInputProps}
            style={[
              styles.input,
              compact && styles.inputCompact,
              multiline && styles.inputMultiline,
              {
                textAlign: getTextAlign(),
                writingDirection: isRTL ? 'rtl' : 'ltr',
              },
              style,
              inputStyle,
            ]}
          />

          {rightAdornment ? <View style={styles.adornmentWrap}>{rightAdornment}</View> : null}
        </View>
      </View>

      {errorText ? (
        <Text
          style={[
            styles.message,
            styles.errorText,
            compact && styles.messageCompact,
            { textAlign: getTextAlign(), writingDirection: isRTL ? 'rtl' : 'ltr' },
          ]}
        >
          {errorText}
        </Text>
      ) : helperText ? (
        <Text
          style={[
            styles.message,
            styles.helperText,
            compact && styles.messageCompact,
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
  label: {
    ...typography.label,
    marginBottom: 8,
    color: '#8C8078',
    fontSize: 11,
    lineHeight: 14,
  },

  labelCompact: {
    marginBottom: 6,
    fontSize: 10,
    lineHeight: 12,
  },

  fieldShell: {
    minHeight: 56,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
  },

  fieldShellCompact: {
    minHeight: 48,
    borderRadius: 14,
    paddingHorizontal: spacing.sm + 4,
  },

  fieldShellError: {
    borderColor: '#E7B5AE',
    backgroundColor: '#FFF8F7',
  },

  fieldShellDisabled: {
    backgroundColor: '#F6F3EF',
    opacity: 0.72,
  },

  inputRow: {
    alignItems: 'center',
    gap: spacing.xs + 2,
  },

  inputRowMultiline: {
    alignItems: 'flex-start',
    paddingVertical: spacing.sm + 2,
  },

  adornmentWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  input: {
    ...typography.body,
    flex: 1,
    color: colors.text,
    fontSize: 15,
    lineHeight: 20,
    paddingVertical: 0,
    paddingHorizontal: 0,
    margin: 0,
  },

  inputCompact: {
    fontSize: 14,
    lineHeight: 18,
  },

  inputMultiline: {
    minHeight: 96,
    textAlignVertical: 'top',
    paddingTop: 0,
  },

  message: {
    marginTop: 6,
    fontSize: 12,
    lineHeight: 16,
  },

  messageCompact: {
    marginTop: 5,
    fontSize: 11,
    lineHeight: 14,
  },

  helperText: {
    color: colors.textSubtle,
  },

  errorText: {
    color: '#BE5B50',
    fontWeight: '600',
  },
});
