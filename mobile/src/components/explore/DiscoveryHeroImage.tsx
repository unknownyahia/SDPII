import React from 'react';
import {
  Image,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { useLocalization } from '../../context/LocalizationContext';
import { colors, radius, spacing, typography } from '../../theme/designSystem';
import type { DiscoveryHero } from '../../types/discovery';

type DiscoveryHeroImageProps = {
  hero: DiscoveryHero;
  height?: number;
  style?: StyleProp<ViewStyle>;
};

function toneToBadgeStyle(tone: DiscoveryHero['badgeTone']) {
  switch (tone) {
    case 'success':
      return styles.badgeSuccess;
    case 'warning':
      return styles.badgeWarning;
    case 'info':
      return styles.badgeInfo;
    case 'primary':
      return styles.badgePrimary;
    case 'danger':
      return styles.badgeDanger;
    default:
      return styles.badgeNeutral;
  }
}

function getFallbackTone(hero: DiscoveryHero) {
  if (hero.badgeTone) {
    return hero.badgeTone;
  }

  return hero.eyebrow.toLowerCase().includes('event') ? 'warning' : 'primary';
}

export function DiscoveryHeroImage({
  hero,
  height = 156,
  style,
}: DiscoveryHeroImageProps) {
  const { getTextAlign, isRTL } = useLocalization();
  const fallbackTone = getFallbackTone(hero);

  return (
    <View style={[styles.frame, { height }, style]}>
      {hero.imageUrl ? (
        <Image source={{ uri: hero.imageUrl }} style={styles.image} resizeMode="cover" />
      ) : (
        <View
          style={[
            styles.fallback,
            fallbackTone === 'warning' && styles.fallbackWarning,
            fallbackTone === 'info' && styles.fallbackInfo,
            fallbackTone === 'success' && styles.fallbackSuccess,
          ]}
        >
          <View
            style={[
              styles.fallbackGlowLarge,
              isRTL && styles.fallbackGlowLargeRtl,
              fallbackTone === 'warning' && styles.fallbackGlowLargeWarning,
              fallbackTone === 'info' && styles.fallbackGlowLargeInfo,
              fallbackTone === 'success' && styles.fallbackGlowLargeSuccess,
            ]}
          />
          <View
            style={[
              styles.fallbackGlowSmall,
              isRTL && styles.fallbackGlowSmallRtl,
              fallbackTone === 'warning' && styles.fallbackGlowSmallWarning,
              fallbackTone === 'info' && styles.fallbackGlowSmallInfo,
              fallbackTone === 'success' && styles.fallbackGlowSmallSuccess,
            ]}
          />
          <View style={styles.fallbackCopy}>
            <Text
              style={[
                styles.eyebrow,
                fallbackTone === 'warning' && styles.eyebrowWarning,
                fallbackTone === 'info' && styles.eyebrowInfo,
                fallbackTone === 'success' && styles.eyebrowSuccess,
                { textAlign: getTextAlign(), writingDirection: isRTL ? 'rtl' : 'ltr' },
              ]}
            >
              {hero.eyebrow}
            </Text>
            <Text
              style={[
                styles.title,
                { textAlign: getTextAlign(), writingDirection: isRTL ? 'rtl' : 'ltr' },
              ]}
            >
              {hero.title}
            </Text>
            <Text
              style={[
                styles.subtitle,
                { textAlign: getTextAlign(), writingDirection: isRTL ? 'rtl' : 'ltr' },
              ]}
            >
              {hero.subtitle}
            </Text>
          </View>
        </View>
      )}

      {hero.badgeLabel ? (
        <View
          style={[
            styles.badge,
            toneToBadgeStyle(hero.badgeTone),
            isRTL ? styles.badgeRtl : null,
          ]}
        >
          <Text
            style={[
              styles.badgeText,
              { writingDirection: isRTL ? 'rtl' : 'ltr' },
            ]}
          >
            {hero.badgeLabel}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    overflow: 'hidden',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  fallback: {
    flex: 1,
    backgroundColor: colors.surfaceRaised,
    justifyContent: 'flex-end',
    padding: spacing.lg,
  },
  fallbackWarning: {
    backgroundColor: colors.warningSoft,
  },
  fallbackInfo: {
    backgroundColor: colors.infoSoft,
  },
  fallbackSuccess: {
    backgroundColor: colors.successSoft,
  },
  fallbackGlowLarge: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 180,
    top: -56,
    right: -28,
    backgroundColor: colors.primarySoft,
    opacity: 0.92,
  },
  fallbackGlowLargeRtl: {
    left: -28,
    right: undefined,
  },
  fallbackGlowLargeWarning: {
    backgroundColor: colors.warningSoft,
  },
  fallbackGlowLargeInfo: {
    backgroundColor: colors.infoSoft,
  },
  fallbackGlowLargeSuccess: {
    backgroundColor: colors.successSoft,
  },
  fallbackGlowSmall: {
    position: 'absolute',
    width: 96,
    height: 96,
    borderRadius: 96,
    bottom: 18,
    right: 24,
    backgroundColor: colors.surface,
    opacity: 0.7,
  },
  fallbackGlowSmallRtl: {
    left: 24,
    right: undefined,
  },
  fallbackGlowSmallWarning: {
    backgroundColor: '#FFF9EC',
  },
  fallbackGlowSmallInfo: {
    backgroundColor: '#F6FAFD',
  },
  fallbackGlowSmallSuccess: {
    backgroundColor: '#F4FAF6',
  },
  fallbackCopy: {
    gap: spacing.xs,
    maxWidth: '72%',
  },
  eyebrow: {
    ...typography.label,
    color: colors.primaryPressed,
  },
  eyebrowWarning: {
    color: colors.warning,
  },
  eyebrowInfo: {
    color: colors.info,
  },
  eyebrowSuccess: {
    color: colors.success,
  },
  title: {
    ...typography.sectionTitle,
  },
  subtitle: {
    ...typography.caption,
    color: colors.textMuted,
  },
  badge: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderWidth: 1,
  },
  badgeRtl: {
    left: spacing.md,
    right: undefined,
  },
  badgeNeutral: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  badgePrimary: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  badgeSuccess: {
    backgroundColor: colors.successSoft,
    borderColor: colors.success,
  },
  badgeWarning: {
    backgroundColor: colors.warningSoft,
    borderColor: colors.warning,
  },
  badgeInfo: {
    backgroundColor: colors.infoSoft,
    borderColor: colors.info,
  },
  badgeDanger: {
    backgroundColor: colors.dangerSoft,
    borderColor: colors.danger,
  },
  badgeText: {
    ...typography.caption,
    color: colors.text,
    fontWeight: '600',
  },
});
