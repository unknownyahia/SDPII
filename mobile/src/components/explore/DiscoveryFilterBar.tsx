import React from 'react';
import {
  ScrollView,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { useLocalization } from '../../context/LocalizationContext';
import { FilterChip } from '../ui/Chip';
import { spacing } from '../../theme/designSystem';
import type { DiscoveryFilterOption } from '../../types/discovery';

type DiscoveryFilterBarProps = {
  filters: readonly DiscoveryFilterOption[];
  activeId: string;
  onSelect: (filterId: string) => void;
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function DiscoveryFilterBar({
  filters,
  activeId,
  onSelect,
  compact = false,
  style,
}: DiscoveryFilterBarProps) {
  const { getRowDirection } = useLocalization();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[
        styles.row,
        compact && styles.rowCompact,
        { flexDirection: getRowDirection() },
      ]}
      style={style}
    >
      {filters.map(filter => (
        <FilterChip
          key={filter.id}
          label={
            typeof filter.count === 'number'
              ? `${filter.label} (${filter.count})`
              : filter.label
          }
          compact={compact}
          active={activeId === filter.id}
          onPress={() => onSelect(filter.id)}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  rowCompact: {
    gap: 2,
  },
});
