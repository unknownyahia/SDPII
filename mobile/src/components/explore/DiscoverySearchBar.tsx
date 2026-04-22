import React from 'react';
import {
  Platform,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { useLocalization } from '../../context/LocalizationContext';
import { SecondaryButton } from '../ui/Button';
import { TextField } from '../ui/TextField';
import { colors, radius, spacing } from '../../theme/designSystem';

type DiscoverySearchBarProps = {
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  summaryLabel?: string;
  summaryLoading?: boolean;
  onPressSummary?: () => void;
  inlineActions?: boolean;
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function DiscoverySearchBar({
  value,
  onChangeText,
  placeholder,
  summaryLabel,
  summaryLoading = false,
  onPressSummary,
  inlineActions = false,
  compact = false,
  style,
}: DiscoverySearchBarProps) {
  const { getRowDirection, t } = useLocalization();
  const isWeb = Platform.OS === 'web';
  const resolvedPlaceholder = placeholder ?? t('explore.searchPlaceholder');
  const resolvedSummaryLabel = summaryLabel ?? t('explore.summaryButton');

  return (
    <View
      style={[
        styles.container,
        compact && styles.containerCompact,
        inlineActions && styles.containerInline,
        inlineActions && { flexDirection: getRowDirection() },
        style,
      ]}
    >
      <View style={styles.inputWrap}>
        <TextField
          placeholder={resolvedPlaceholder}
          value={value}
          onChangeText={onChangeText}
          returnKeyType="search"
          style={[compact ? styles.compactInput : undefined, compact && isWeb && styles.compactInputWeb]}
        />
      </View>
      {onPressSummary ? (
        <View style={[styles.actionWrap, compact && styles.actionWrapCompact]}>
          <SecondaryButton
            label={resolvedSummaryLabel}
            loading={summaryLoading}
            onPress={onPressSummary}
            style={[
              compact ? styles.compactActionButton : undefined,
              compact && isWeb && styles.compactActionButtonWeb,
            ]}
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  containerCompact: {
    gap: spacing.xs,
  },
  containerInline: {
    flexDirection: 'row',
    alignItems: 'stretch',
    flexWrap: 'wrap',
  },
  inputWrap: {
    flex: 1,
    minWidth: 240,
  },
  compactInput: {
    minHeight: 48,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surfaceRaised,
    paddingVertical: spacing.sm - 1,
  },
  compactInputWeb: {
    minHeight: 48,
    borderWidth: 0.75,
    borderColor: colors.border,
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.md,
  },
  actionWrap: {
    minWidth: 156,
  },
  actionWrapCompact: {
    minWidth: 84,
  },
  compactActionButton: {
    minHeight: 32,
    paddingHorizontal: spacing.xs + 2,
    borderRadius: radius.sm,
    borderWidth: 0.5,
    borderColor: colors.border,
    backgroundColor: 'transparent',
  },
  compactActionButtonWeb: {
    minHeight: 40,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
});
