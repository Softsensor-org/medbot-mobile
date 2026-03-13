import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { colors, typography, spacing } from '../../theme';
import { hapticService } from '../../api/HapticService';

interface Option {
  value: string | number;
  label: string;
  icon?: string;
}

interface ChipSelectProps {
  options: Option[];
  selectedValue: string | number | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSelect: (value: any) => void;
  label?: string;
  horizontal?: boolean;
  multiSelect?: boolean;
  selectedValues?: (string | number)[];
}

export const ChipSelect: React.FC<ChipSelectProps> = ({
  options,
  selectedValue,
  onSelect,
  label,
  horizontal = true,
  multiSelect = false,
  selectedValues = [],
}) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handlePress = (value: any) => {
    hapticService.triggerSelection();
    onSelect(value);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const isSelected = (value: any) => {
    if (multiSelect) {
      return selectedValues.includes(value);
    }
    return selectedValue === value;
  };

  const renderChips = () => (
    <View style={[styles.chipContainer, !horizontal && styles.verticalContainer]}>
      {options.map((option) => (
        <TouchableOpacity
          key={option.value}
          style={[
            styles.chip,
            isSelected(option.value) && styles.chipSelected,
          ]}
          onPress={() => handlePress(option.value)}
        >
          <Text
            style={[
              styles.chipText,
              isSelected(option.value) && styles.chipTextSelected,
            ]}
          >
            {option.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      {horizontal ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {renderChips()}
        </ScrollView>
      ) : (
        renderChips()
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    ...typography.label,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  chipContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  verticalContainer: {
    flexWrap: 'wrap',
  },
  scrollContent: {
    paddingRight: spacing.lg,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    ...typography.bodySmall,
    color: colors.textPrimary,
  },
  chipTextSelected: {
    color: colors.surface,
    fontWeight: '600',
  },
});
