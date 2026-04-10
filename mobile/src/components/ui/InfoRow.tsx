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
    alignItems: 'center',
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
    flex: 1,
  },
  value: {
    ...typography.body,
    flex: 1,
    textAlign: 'right',
  },
});
