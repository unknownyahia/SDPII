import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '../../theme/designSystem';

type MetricTileProps = {
  label: string;
  value: string | number;
  accent?: boolean;
};

export function MetricTile({ label, value, accent = false }: MetricTileProps) {
  return (
    <View style={[styles.tile, accent && styles.tileAccent]}>
      <Text style={[styles.value, accent && styles.valueAccent]}>{value}</Text>
      <Text style={[styles.label, accent && styles.labelAccent]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    minWidth: 110,
    flex: 1,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  tileAccent: {
    backgroundColor: colors.primarySoft,
    borderColor: '#C9DBF6',
  },
  value: {
    ...typography.sectionTitle,
  },
  valueAccent: {
    color: colors.primary,
  },
  label: {
    ...typography.caption,
  },
  labelAccent: {
    color: colors.primary,
  },
});
