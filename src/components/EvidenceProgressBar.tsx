import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { colors, typography, spacing } from '../theme';
import { EvidenceSlot } from '../types/ai';

interface EvidenceProgressBarProps {
  evidenceSlots: EvidenceSlot[];
  evidenceCompleteness: number;
  missingEvidence: string[];
  onPress: () => void;
  style?: ViewStyle;
}

export default function EvidenceProgressBar({
  evidenceSlots,
  evidenceCompleteness,
  missingEvidence,
  onPress,
  style,
}: EvidenceProgressBarProps) {
  if (evidenceCompleteness === 0 || evidenceCompleteness === 1) {
    return null;
  }

  const getChipStyles = (state: string) => {
    switch (state) {
      case 'provided':
        return {
          backgroundColor: '#E8F5E9', // success.light equivalent
          color: '#2E7D32', // success.dark equivalent
        };
      case 'pending':
        return {
          backgroundColor: '#FFF3E0', // warning.light equivalent
          color: '#EF6C00', // warning.dark equivalent
        };
      case 'unknown':
        return {
          backgroundColor: '#EEEEEE', // grey.200 equivalent
          color: '#757575', // grey.600 equivalent
        };
      default:
        return {
          backgroundColor: colors.border,
          color: colors.textSecondary,
        };
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={[styles.container, style]}
      accessibilityRole="button"
      accessibilityLabel="View intake progress details"
    >
      <View style={styles.header}>
        <Text style={styles.title}>INTAKE PROGRESS</Text>
        <Text style={styles.percentage}>{Math.round(evidenceCompleteness * 100)}%</Text>
      </View>

      <View style={styles.progressContainer}>
        <View 
          style={[
            styles.progressBar, 
            { width: `${evidenceCompleteness * 100}%` }
          ]} 
        />
      </View>

      <View style={styles.chipsContainer}>
        {evidenceSlots.map((slot) => {
          const chipStyles = getChipStyles(slot.state);
          return (
            <View 
              key={slot.name} 
              style={[styles.chip, { backgroundColor: chipStyles.backgroundColor }]}
            >
              <Text style={[styles.chipText, { color: chipStyles.color }]}>
                {slot.name.replace('_', ' ')}
              </Text>
            </View>
          );
        })}
      </View>

      {missingEvidence.length > 0 && (
        <View style={styles.hintContainer}>
          <View style={styles.bullet} />
          <Text style={styles.hintText}>
            Still needed: {missingEvidence[0].replace('_', ' ')}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
    backgroundColor: '#F8FAFC', // colors.surfaceLight equivalent
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  title: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  percentage: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.primary,
  },
  progressContainer: {
    height: 6,
    backgroundColor: colors.border,
    borderRadius: 3,
    marginBottom: spacing.sm,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 3,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: spacing.xs,
  },
  chip: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  chipText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  hintContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  bullet: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primary,
    marginRight: 6,
  },
  hintText: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.primary,
  },
});
