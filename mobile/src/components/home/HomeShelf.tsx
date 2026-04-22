import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';

import { useLocalization } from '../../context/LocalizationContext';
import { Card } from '../ui/Card';
import { colors, spacing, typography } from '../../theme/designSystem';

type HomeShelfTone = 'primary' | 'warning' | 'neutral';

type HomeShelfProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  tone?: HomeShelfTone;
  right?: React.ReactNode;
  children: React.ReactNode;
};

export function HomeShelf({
  eyebrow,
  title,
  subtitle,
  tone = 'neutral',
  right,
  children,
}: HomeShelfProps) {
  const { getRowDirection, getTextAlign, isRTL } = useLocalization();
  const isWeb = Platform.OS === 'web';

  return (
    <Card style={[styles.card, isWeb && styles.cardWeb]}>
      <View style={[styles.header, { flexDirection: getRowDirection() }]}>
        <View style={styles.copy}>
          {eyebrow ? (
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
          ) : null}
          <Text
              style={[
                styles.title,
                isWeb && styles.titleWeb,
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
        {right ? <View>{right}</View> : null}
      </View>

      {children}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.md + 2,
  },
  cardWeb: {
    gap: spacing.xs,
  },
  header: {
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.xs,
  },
  copy: {
    flex: 1,
    gap: 3,
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
  titleWeb: {
    fontSize: 16,
    lineHeight: 20,
  },
  subtitle: {
    ...typography.bodyMuted,
    maxWidth: 520,
    fontSize: 14,
    lineHeight: 20,
  },
  subtitleWeb: {
    fontSize: 11,
    lineHeight: 15,
    maxWidth: 400,
  },
});
