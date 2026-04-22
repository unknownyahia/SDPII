import React from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { useLocalization } from '../../context/LocalizationContext';
import { Card } from '../ui/Card';
import { colors, spacing, typography } from '../../theme/designSystem';

type StudioTone = 'primary' | 'warning' | 'neutral';

type StudioPanelProps = {
  eyebrow: string;
  title: string;
  subtitle?: string;
  tone?: StudioTone;
  muted?: boolean;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
};

export function StudioPanel({
  eyebrow,
  title,
  subtitle,
  tone = 'neutral',
  muted = false,
  style,
  children,
}: StudioPanelProps) {
  const { getTextAlign, isRTL } = useLocalization();
  const isWeb = Platform.OS === 'web';

  return (
    <Card style={[styles.card, isWeb && styles.cardWeb, style]} muted={muted}>
      <View style={[styles.hero, isWeb && styles.heroWeb]}>
        <Text
          style={[
            styles.eyebrow,
            tone === 'primary' && styles.eyebrowPrimary,
            tone === 'warning' && styles.eyebrowWarning,
            { textAlign: getTextAlign(), writingDirection: isRTL ? 'rtl' : 'ltr' },
          ]}
        >
          {eyebrow}
        </Text>
        <Text
          style={[
            styles.title,
            { textAlign: getTextAlign(), writingDirection: isRTL ? 'rtl' : 'ltr' },
          ]}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text
            style={[
              styles.subtitle,
              isWeb && styles.subtitleWeb,
              { textAlign: getTextAlign(), writingDirection: isRTL ? 'rtl' : 'ltr' },
            ]}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>

      <View style={[styles.body, isWeb && styles.bodyWeb]}>{children}</View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.lg,
  },
  cardWeb: {
    gap: spacing.xs + 3,
  },
  hero: {
    gap: 3,
    paddingBottom: spacing.md,
    borderBottomWidth: 0.75,
    borderBottomColor: colors.border,
  },
  heroWeb: {
    gap: 1,
    paddingBottom: spacing.xs + 1,
  },
  eyebrow: {
    ...typography.label,
    color: colors.textSubtle,
  },
  eyebrowPrimary: {
    color: colors.primaryPressed,
  },
  eyebrowWarning: {
    color: colors.warning,
  },
  title: {
    ...typography.sectionTitle,
    color: colors.text,
  },
  subtitle: {
    ...typography.bodyMuted,
    maxWidth: 620,
    fontSize: 14,
    lineHeight: 20,
  },
  subtitleWeb: {
    fontSize: 13,
    lineHeight: 18,
  },
  body: {
    gap: spacing.md,
  },
  bodyWeb: {
    gap: spacing.xs + 2,
  },
});
