import React from 'react';
import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { colors, radius, spacing, typography } from '../../theme/designSystem';
import { useLocalization } from '../../context/LocalizationContext';

type EmptyStateProps = {
  title: string;
  subtitle?: string;
  body?: string;
  actionLabel?: string;
  onActionPress?: () => void;
  compact?: boolean;
  style?: ViewStyle;
};

export function EmptyState({
  title,
  subtitle,
  body,
  actionLabel,
  onActionPress,
  compact = false,
  style,
}: EmptyStateProps) {
  const { getTextAlign, isRTL } = useLocalization();
  const resolvedBody = body ?? subtitle;

  return (
    <View
      style={[
        styles.container,
        compact && styles.containerCompact,
        style,
      ]}
    >
      <View style={[styles.iconWrap, compact && styles.iconWrapCompact]}>
        <Text style={[styles.iconGlyph, compact && styles.iconGlyphCompact]}>⌂</Text>
      </View>

      <Text
        style={[
          styles.title,
          compact && styles.titleCompact,
          { textAlign: getTextAlign(), writingDirection: isRTL ? 'rtl' : 'ltr' },
        ]}
      >
        {title}
      </Text>

      {resolvedBody ? (
        <Text
          style={[
            styles.body,
            compact && styles.bodyCompact,
            { textAlign: getTextAlign(), writingDirection: isRTL ? 'rtl' : 'ltr' },
          ]}
        >
          {resolvedBody}
        </Text>
      ) : null}

      {actionLabel && onActionPress ? (
        <Pressable
          accessibilityRole="button"
          onPress={onActionPress}
          style={({ pressed }) => [
            styles.actionButton,
            compact && styles.actionButtonCompact,
            pressed && styles.pressed,
          ]}
        >
          <Text style={[styles.actionLabel, compact && styles.actionLabelCompact]}>
            {actionLabel}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
    gap: spacing.sm,
  },

  containerCompact: {
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    gap: spacing.xs + 2,
  },

  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },

  iconWrapCompact: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginBottom: 2,
  },

  iconGlyph: {
    fontSize: 24,
    lineHeight: 26,
    color: colors.primary,
  },

  iconGlyphCompact: {
    fontSize: 20,
    lineHeight: 22,
  },

  title: {
    ...typography.sectionTitle,
    fontSize: 18,
    lineHeight: 23,
    color: colors.text,
  },

  titleCompact: {
    fontSize: 16,
    lineHeight: 20,
  },

  body: {
    ...typography.bodyMuted,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textMuted,
    maxWidth: 280,
  },

  bodyCompact: {
    fontSize: 13,
    lineHeight: 18,
    maxWidth: 250,
  },

  actionButton: {
    minHeight: 42,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: '#F3CDC6',
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xs,
  },

  actionButtonCompact: {
    minHeight: 36,
    paddingHorizontal: spacing.md + 2,
    marginTop: 4,
  },

  actionLabel: {
    ...typography.button,
    color: colors.primary,
    fontSize: 14,
    lineHeight: 17,
  },

  actionLabelCompact: {
    fontSize: 13,
    lineHeight: 16,
  },

  pressed: {
    opacity: 0.82,
  },
});
