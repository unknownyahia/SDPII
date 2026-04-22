import React from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import { colors, radius, spacing, typography } from '../../theme/designSystem';
import { useLocalization } from '../../context/LocalizationContext';

type StatusBannerTone = 'neutral' | 'warning' | 'success' | 'info';

type StatusBannerAction = {
  label: string;
  onPress: () => void;
  tone?: 'primary' | 'secondary';
};

type StatusBannerProps = {
  title: string;
  body: string;
  tone?: StatusBannerTone;
  compact?: boolean;
  actions?: readonly StatusBannerAction[];
};

export function StatusBanner({
  title,
  body,
  tone = 'neutral',
  compact = false,
  actions = [],
}: StatusBannerProps) {
  const { getRowDirection, getTextAlign, isRTL } = useLocalization();
  const isWeb = Platform.OS === 'web';
  const { width } = useWindowDimensions();
  const isDesktopWeb = isWeb && width >= 1024;
  const compactMode = compact || isDesktopWeb;

  return (
    <View
      style={[
        styles.banner,
        compactMode && styles.bannerCompact,
        compactMode && isWeb && styles.bannerCompactWeb,
        isDesktopWeb && styles.bannerDesktopWeb,
        tone === 'warning' && styles.bannerWarning,
        tone === 'success' && styles.bannerSuccess,
        tone === 'info' && styles.bannerInfo,
        isDesktopWeb && tone === 'warning' && styles.bannerWarningDesktopWeb,
        isDesktopWeb && tone === 'success' && styles.bannerSuccessDesktopWeb,
        isDesktopWeb && tone === 'info' && styles.bannerInfoDesktopWeb,
      ]}
    >
      <Text
        style={[
          styles.title,
          compactMode && styles.titleCompact,
          compactMode && isWeb && styles.titleCompactWeb,
          isDesktopWeb && styles.titleDesktopWeb,
          { textAlign: getTextAlign(), writingDirection: isRTL ? 'rtl' : 'ltr' },
        ]}
      >
        {title}
      </Text>
      <Text
        style={[
          styles.body,
          compactMode && styles.bodyCompact,
          compactMode && isWeb && styles.bodyCompactWeb,
          isDesktopWeb && styles.bodyDesktopWeb,
          { textAlign: getTextAlign(), writingDirection: isRTL ? 'rtl' : 'ltr' },
        ]}
      >
        {body}
      </Text>
      {actions.length > 0 ? (
        <View
          style={[
            styles.actions,
            compactMode && styles.actionsCompact,
            compactMode && isWeb && styles.actionsCompactWeb,
            isDesktopWeb && styles.actionsDesktopWeb,
            {
              flexDirection: getRowDirection(),
              justifyContent: isRTL ? 'flex-start' : 'flex-start',
            },
          ]}
        >
          {actions.map(action => (
            <Pressable
              key={action.label}
              accessibilityRole="button"
              onPress={action.onPress}
              style={({ pressed }) => [
                styles.action,
                compactMode && styles.actionCompact,
                compactMode && isWeb && styles.actionCompactWeb,
                isDesktopWeb && styles.actionDesktopWeb,
                action.tone === 'primary' && styles.actionPrimary,
                pressed && styles.actionPressed,
              ]}
            >
              <Text
                style={[
                  styles.actionText,
                  compactMode && styles.actionTextCompact,
                  compactMode && isWeb && styles.actionTextCompactWeb,
                  isDesktopWeb && styles.actionTextDesktopWeb,
                  action.tone === 'primary' && styles.actionTextPrimary,
                  { writingDirection: isRTL ? 'rtl' : 'ltr' },
                ]}
              >
                {action.label}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    borderRadius: radius.lg,
    borderWidth: 0.75,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surfaceRaised,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  bannerCompact: {
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.sm + 2,
    borderRadius: radius.sm,
    borderWidth: 0.5,
    gap: 1,
  },
  bannerCompactWeb: {
    paddingVertical: 2,
    paddingHorizontal: spacing.xs + 1,
    gap: 0,
  },
  bannerDesktopWeb: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#E6DDD2',
    backgroundColor: '#FFFEFB',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    gap: 2,
  },
  bannerWarning: {
    borderColor: colors.warning,
    backgroundColor: colors.warningSoft,
  },
  bannerWarningDesktopWeb: {
    borderColor: '#E8D7BC',
    backgroundColor: '#FFF9F0',
  },
  bannerSuccess: {
    borderColor: colors.success,
    backgroundColor: colors.successSoft,
  },
  bannerSuccessDesktopWeb: {
    borderColor: '#CFE3D6',
    backgroundColor: '#F7FCF8',
  },
  bannerInfo: {
    borderColor: colors.info,
    backgroundColor: colors.infoSoft,
  },
  bannerInfoDesktopWeb: {
    borderColor: '#D7E2F0',
    backgroundColor: '#F7FAFE',
  },
  title: {
    ...typography.button,
    color: colors.text,
  },
  titleCompact: {
    fontSize: 12,
    lineHeight: 15,
  },
  titleCompactWeb: {
    fontSize: 10,
    lineHeight: 11,
  },
  titleDesktopWeb: {
    fontSize: 12,
    lineHeight: 15,
    color: '#3E342B',
  },
  body: {
    ...typography.bodyMuted,
    color: colors.textMuted,
  },
  bodyCompact: {
    fontSize: 11,
    lineHeight: 15,
  },
  bodyCompactWeb: {
    fontSize: 10,
    lineHeight: 11,
  },
  bodyDesktopWeb: {
    fontSize: 11,
    lineHeight: 15,
    color: '#6C6056',
  },
  actions: {
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  actionsCompact: {
    gap: spacing.xs,
    marginTop: 1,
  },
  actionsCompactWeb: {
    gap: 4,
    marginTop: 0,
  },
  actionsDesktopWeb: {
    marginTop: 2,
    gap: spacing.xs,
  },
  action: {
    minHeight: 34,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionCompact: {
    minHeight: 26,
    paddingHorizontal: spacing.sm,
    borderWidth: 0.5,
  },
  actionCompactWeb: {
    minHeight: 18,
    paddingHorizontal: spacing.xs + 1,
  },
  actionDesktopWeb: {
    minHeight: 22,
    paddingHorizontal: spacing.sm,
    borderColor: '#E4DACF',
    backgroundColor: '#FFFCF8',
  },
  actionPrimary: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  actionPressed: {
    opacity: 0.9,
  },
  actionText: {
    ...typography.caption,
    color: colors.text,
    fontWeight: '600',
  },
  actionTextCompact: {
    fontSize: 11,
    lineHeight: 15,
  },
  actionTextCompactWeb: {
    fontSize: 9,
    lineHeight: 11,
  },
  actionTextDesktopWeb: {
    fontSize: 10,
    lineHeight: 13,
  },
  actionTextPrimary: {
    color: colors.primaryPressed,
  },
});
