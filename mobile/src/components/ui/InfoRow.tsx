import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '../../theme/designSystem';

type InfoRowProps = {
  label: string;
  value: string;
  subtle?: boolean;
};

export function InfoRow({ label, value, subtle = false }: InfoRowProps) {
  return (
    <View style={[styles.row, subtle && styles.rowSubtle]}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.lg,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowSubtle: {
    borderBottomColor: colors.surfaceStrong,
  },
  label: {
    ...typography.label,
    color: colors.textSubtle,
    flexGrow: 1,
    flexShrink: 1,
    minWidth: 120,
  },
  value: {
    ...typography.body,
    flexGrow: 1,
    flexShrink: 1,
    minWidth: 180,
    textAlign: 'right',
  },
});
