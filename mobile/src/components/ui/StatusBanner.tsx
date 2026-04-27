import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useLocalization } from '../../context/LocalizationContext';
import { colors, radius, spacing, typography } from '../../theme/designSystem';

type StatusBannerTone = 'neutral' | 'info' | 'warning' | 'success' | 'danger';

type StatusBannerAction = {
  label: string;
  onPress: () => void;
  tone?: 'primary' | 'secondary';
};

type StatusBannerProps = {
  title: string;
  body?: string;
  tone?: StatusBannerTone;
  compact?: boolean;
  actions?: readonly StatusBannerAction[];
};

function getToneStyles(tone: StatusBannerTone) {
  switch (tone) {
    case 'success':
      return {
        container: styles.successContainer,
        title: styles.successTitle,
        body: styles.successBody,
        iconWrap: styles.successIconWrap,
        icon: styles.successIcon,
        primaryButton: styles.successPrimaryButton,
        primaryButtonLabel: styles.successPrimaryButtonLabel,
      };
    case 'danger':
      return {
        container: styles.dangerContainer,
        title: styles.dangerTitle,
        body: styles.dangerBody,
        iconWrap: styles.dangerIconWrap,
        icon: styles.dangerIcon,
        primaryButton: styles.dangerPrimaryButton,
        primaryButtonLabel: styles.dangerPrimaryButtonLabel,
      };
    case 'warning':
      return {
        container: styles.warningContainer,
        title: styles.warningTitle,
        body: styles.warningBody,
        iconWrap: styles.warningIconWrap,
        icon: styles.warningIcon,
        primaryButton: styles.warningPrimaryButton,
        primaryButtonLabel: styles.warningPrimaryButtonLabel,
      };
    case 'neutral':
    case 'info':
    default:
      return {
        container: styles.infoContainer,
        title: styles.infoTitle,
        body: styles.infoBody,
        iconWrap: styles.infoIconWrap,
        icon: styles.infoIcon,
        primaryButton: styles.infoPrimaryButton,
        primaryButtonLabel: styles.infoPrimaryButtonLabel,
      };
  }
}

function getToneGlyph(tone: StatusBannerTone) {
  switch (tone) {
    case 'success':
      return '✓';
    case 'danger':
      return '!';
    case 'warning':
      return '!';
    case 'neutral':
    case 'info':
    default:
      return 'i';
  }
}

export function StatusBanner({
  title,
  body,
  tone = 'info',
  compact = false,
  actions = [],
}: StatusBannerProps) {
  const { getTextAlign, getRowDirection, isRTL } = useLocalization();
  const toneStyles = getToneStyles(tone);
  const glyph = getToneGlyph(tone);

  return (
    <View
      style={[
        styles.container,
        toneStyles.container,
        compact && styles.containerCompact,
      ]}
    >
      <View style={[styles.row, { flexDirection: getRowDirection() }]}>
        <View style={[styles.iconWrap, toneStyles.iconWrap, compact && styles.iconWrapCompact]}>
          <Text style={[styles.icon, toneStyles.icon, compact && styles.iconCompact]}>
            {glyph}
          </Text>
        </View>

        <View style={styles.copyWrap}>
          <Text
            style={[
              styles.title,
              toneStyles.title,
              compact && styles.titleCompact,
              { textAlign: getTextAlign(), writingDirection: isRTL ? 'rtl' : 'ltr' },
            ]}
          >
            {title}
          </Text>

          {body ? (
            <Text
              style={[
                styles.body,
                toneStyles.body,
                compact && styles.bodyCompact,
                { textAlign: getTextAlign(), writingDirection: isRTL ? 'rtl' : 'ltr' },
              ]}
            >
              {body}
            </Text>
          ) : null}
        </View>
      </View>

      {actions.length > 0 ? (
        <View
          style={[
            styles.actionsRow,
            compact && styles.actionsRowCompact,
            { flexDirection: getRowDirection() },
          ]}
        >
          {actions.map(action => {
            const primary = action.tone !== 'secondary';

            return (
              <Pressable
                key={action.label}
                accessibilityRole="button"
                onPress={action.onPress}
                style={({ pressed }) => [
                  styles.actionButton,
                  compact && styles.actionButtonCompact,
                  primary
                    ? [styles.primaryActionButton, toneStyles.primaryButton]
                    : styles.secondaryActionButton,
                  pressed && styles.pressed,
                ]}
              >
                <Text
                  style={[
                    styles.actionButtonLabel,
                    compact && styles.actionButtonLabelCompact,
                    primary
                      ? [styles.primaryActionButtonLabel, toneStyles.primaryButtonLabel]
                      : styles.secondaryActionButtonLabel,
                  ]}
                >
                  {action.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: radius.lg,
    borderWidth: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },

  containerCompact: {
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    gap: spacing.xs + 2,
  },

  row: {
    alignItems: 'flex-start',
    gap: spacing.sm,
  },

  copyWrap: {
    flex: 1,
    gap: 4,
  },

  iconWrap: {
    width: 30,
    height: 30,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },

  iconWrapCompact: {
    width: 24,
    height: 24,
  },

  icon: {
    fontSize: 15,
    lineHeight: 16,
    fontWeight: '800',
  },

  iconCompact: {
    fontSize: 13,
    lineHeight: 14,
  },

  title: {
    ...typography.button,
    fontSize: 14,
    lineHeight: 18,
  },

  titleCompact: {
    fontSize: 13,
    lineHeight: 16,
  },

  body: {
    ...typography.caption,
    fontSize: 13,
    lineHeight: 18,
  },

  bodyCompact: {
    fontSize: 12,
    lineHeight: 16,
  },

  actionsRow: {
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },

  actionsRowCompact: {
    gap: spacing.xs + 2,
  },

  actionButton: {
    minHeight: 36,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },

  actionButtonCompact: {
    minHeight: 32,
    paddingHorizontal: spacing.sm + 4,
  },

  actionButtonLabel: {
    fontSize: 13,
    lineHeight: 16,
    fontWeight: '700',
  },

  actionButtonLabelCompact: {
    fontSize: 12,
    lineHeight: 14,
  },

  primaryActionButton: {
    borderColor: 'transparent',
  },

  primaryActionButtonLabel: {
    color: '#FFFFFF',
  },

  secondaryActionButton: {
    backgroundColor: '#FFFFFF',
    borderColor: colors.borderStrong,
  },

  secondaryActionButtonLabel: {
    color: colors.text,
  },

  pressed: {
    opacity: 0.82,
  },

  infoContainer: {
    backgroundColor: colors.infoSoft,
    borderColor: '#D5E4F8',
  },
  infoTitle: {
    color: '#2E5F9D',
  },
  infoBody: {
    color: '#557AA8',
  },
  infoIconWrap: {
    backgroundColor: '#DCEAFB',
  },
  infoIcon: {
    color: '#3E79C5',
  },
  infoPrimaryButton: {
    backgroundColor: '#3E79C5',
    borderColor: '#3E79C5',
  },
  infoPrimaryButtonLabel: {
    color: '#FFFFFF',
  },

  warningContainer: {
    backgroundColor: colors.warningSoft,
    borderColor: '#F0DFC5',
  },
  warningTitle: {
    color: '#8B6120',
  },
  warningBody: {
    color: '#9A753D',
  },
  warningIconWrap: {
    backgroundColor: '#F8E8CC',
  },
  warningIcon: {
    color: '#B87A24',
  },
  warningPrimaryButton: {
    backgroundColor: '#B87A24',
    borderColor: '#B87A24',
  },
  warningPrimaryButtonLabel: {
    color: '#FFFFFF',
  },

  successContainer: {
    backgroundColor: colors.successSoft,
    borderColor: '#D8EEDC',
  },
  successTitle: {
    color: '#256D43',
  },
  successBody: {
    color: '#4B8363',
  },
  successIconWrap: {
    backgroundColor: '#DDF3E4',
  },
  successIcon: {
    color: '#2E9B57',
  },
  successPrimaryButton: {
    backgroundColor: '#2E9B57',
    borderColor: '#2E9B57',
  },
  successPrimaryButtonLabel: {
    color: '#FFFFFF',
  },

  dangerContainer: {
    backgroundColor: colors.dangerSoft,
    borderColor: '#F3D7D1',
  },
  dangerTitle: {
    color: '#9C463D',
  },
  dangerBody: {
    color: '#AC655D',
  },
  dangerIconWrap: {
    backgroundColor: '#F7DFDB',
  },
  dangerIcon: {
    color: '#C34E42',
  },
  dangerPrimaryButton: {
    backgroundColor: '#C34E42',
    borderColor: '#C34E42',
  },
  dangerPrimaryButtonLabel: {
    color: '#FFFFFF',
  },
});
