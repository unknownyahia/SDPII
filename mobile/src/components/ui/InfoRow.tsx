import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '../../theme/designSystem';
import { useLocalization } from '../../context/LocalizationContext';

type InfoRowProps = {
  label: string;
  value: string;
  subtle?: boolean;
};

export function InfoRow({ label, value, subtle = false }: InfoRowProps) {
  const { getOppositeTextAlign, getRowDirection, getTextAlign, isRTL } = useLocalization();
  const isWeb = Platform.OS === 'web';

  return (
    <View
      style={[
        styles.row,
        isWeb && styles.rowWeb,
        subtle && styles.rowSubtle,
        { flexDirection: getRowDirection() },
      ]}
    >
      <Text
        style={[
          styles.label,
          isWeb && styles.labelWeb,
          { textAlign: getTextAlign(), writingDirection: isRTL ? 'rtl' : 'ltr' },
        ]}
      >
        {label}
      </Text>
      <Text
        style={[
          styles.value,
          isWeb && styles.valueWeb,
          { textAlign: getOppositeTextAlign(), writingDirection: isRTL ? 'rtl' : 'ltr' },
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderBottomWidth: 0.75,
    borderBottomColor: colors.border,
  },
  rowWeb: {
    gap: spacing.xs + 2,
    paddingVertical: spacing.xs,
  },
  rowSubtle: {
    borderBottomColor: colors.border,
  },
  label: {
    ...typography.label,
    color: colors.textSubtle,
    flexGrow: 1,
    flexShrink: 1,
    minWidth: 96,
  },
  labelWeb: {
    minWidth: 80,
    fontSize: 11,
    lineHeight: 14,
  },
  value: {
    ...typography.body,
    fontSize: 14,
    lineHeight: 20,
    flexGrow: 1,
    flexShrink: 1,
    minWidth: 120,
  },
  valueWeb: {
    fontSize: 12,
    lineHeight: 16,
    minWidth: 100,
  },
});
