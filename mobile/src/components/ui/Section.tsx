import React, { type ReactNode } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';

import { useLocalization } from '../../context/LocalizationContext';
import { colors, spacing, typography } from '../../theme/designSystem';

type SectionProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
};

export function Section({ title, subtitle, children }: SectionProps) {
  const { getTextAlign, isRTL } = useLocalization();
  const isWeb = Platform.OS === 'web';

  return (
    <View style={[styles.section, isWeb && styles.sectionWeb]}>
      <View style={styles.header}>
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
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: spacing.md,
  },
  sectionWeb: {
    gap: spacing.xs + 2,
  },
  header: {
    gap: 1,
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
    maxWidth: 680,
    fontSize: 14,
    lineHeight: 20,
  },
  subtitleWeb: {
    fontSize: 11,
    lineHeight: 15,
    maxWidth: 520,
  },
});
