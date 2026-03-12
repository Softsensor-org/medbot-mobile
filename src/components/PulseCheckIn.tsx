import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { colors, typography, spacing, borderRadius, shadows } from '../theme';
import { medicalApi } from '../api/medicalApi';
import { triggerEngagementHaptic } from '../engagement/haptics';

const SEVERITY_OPTIONS = [
  { value: 1, label: 'Great', color: '#4caf50' },
  { value: 2, label: 'Good', color: '#8bc34a' },
  { value: 3, label: 'Okay', color: '#ff9800' },
  { value: 4, label: 'Bad', color: '#f44336' },
  { value: 5, label: 'Terrible', color: '#b71c1c' },
] as const;

export const PulseCheckIn: React.FC = () => {
  const queryClient = useQueryClient();
  const [severity, setSeverity] = useState<number | null>(null);
  const [note, setNote] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const mutation = useMutation({
    mutationFn: ({ sev, txt }: { sev: number; txt?: string }) =>
      medicalApi.submitPulse(sev, txt),
    onSuccess: () => {
      setSubmitted(true);
      queryClient.invalidateQueries({ queryKey: ['pulses'] });
      queryClient.invalidateQueries({ queryKey: ['care-graph'] });
    },
  });

  const handleSelect = useCallback((value: number) => {
    setSeverity(value);
    void triggerEngagementHaptic('routine_complete');
  }, []);

  const handleSubmit = useCallback(() => {
    if (severity === null) return;
    mutation.mutate({ sev: severity, txt: note.trim() || undefined });
  }, [severity, note, mutation]);

  const handleReset = useCallback(() => {
    setSubmitted(false);
    setSeverity(null);
    setNote('');
  }, []);

  if (submitted) {
    const selectedOption = SEVERITY_OPTIONS.find((o) => o.value === severity);
    return (
      <View style={styles.card}>
        <View style={styles.successContainer}>
          <Text style={styles.successText}>
            Pulse logged! You reported feeling{' '}
            <Text style={styles.successBold}>
              {selectedOption?.label.toLowerCase() ?? 'unknown'}
            </Text>{' '}
            today.
          </Text>
          <TouchableOpacity
            onPress={handleReset}
            style={styles.resetButton}
            testID="pulse-reset"
          >
            <Text style={styles.resetButtonText}>Log another</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <Text style={styles.title}>How's your skin today?</Text>
      <Text style={styles.subtitle}>
        Quick daily check-in to track your skin health over time.
      </Text>

      <View style={styles.severityRow}>
        {SEVERITY_OPTIONS.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.severityButton,
              severity === option.value && {
                backgroundColor: option.color,
                borderColor: option.color,
              },
            ]}
            onPress={() => handleSelect(option.value)}
            testID={`pulse-severity-${option.value}`}
          >
            <Text
              style={[
                styles.severityNumber,
                severity === option.value && styles.severityNumberSelected,
              ]}
            >
              {option.value}
            </Text>
            <Text
              style={[
                styles.severityLabel,
                severity === option.value && styles.severityLabelSelected,
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TextInput
        style={styles.noteInput}
        placeholder="Any notes? (optional)"
        placeholderTextColor={colors.textDisabled}
        value={note}
        onChangeText={(text) => setNote(text.slice(0, 500))}
        maxLength={500}
        multiline
        numberOfLines={3}
        textAlignVertical="top"
      />

      {mutation.isError && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Failed to submit. Please try again.</Text>
        </View>
      )}

      <TouchableOpacity
        style={[
          styles.submitButton,
          (severity === null || mutation.isPending) && styles.submitButtonDisabled,
        ]}
        onPress={handleSubmit}
        disabled={severity === null || mutation.isPending}
        testID="pulse-submit"
      >
        {mutation.isPending ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text style={styles.submitButtonText}>Submit</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginVertical: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.md,
  },
  title: {
    ...typography.h2,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  severityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  severityButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: 4,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    backgroundColor: colors.surface,
  },
  severityNumber: {
    ...typography.h2,
    color: colors.textPrimary,
    fontSize: 18,
  },
  severityNumberSelected: {
    color: '#fff',
  },
  severityLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 9,
    marginTop: 2,
  },
  severityLabelSelected: {
    color: '#fff',
  },
  noteInput: {
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    marginBottom: spacing.md,
    ...typography.body,
    color: colors.textPrimary,
    minHeight: 60,
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },
  errorText: {
    ...typography.bodySmall,
    color: colors.error,
  },
  submitButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    alignSelf: 'flex-end',
  },
  submitButtonDisabled: {
    backgroundColor: colors.textDisabled,
  },
  submitButtonText: {
    ...typography.label,
    color: '#fff',
    fontWeight: '700',
  },
  successContainer: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  successText: {
    ...typography.body,
    color: colors.success,
    textAlign: 'center',
  },
  successBold: {
    fontWeight: '700',
  },
  resetButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  resetButtonText: {
    ...typography.bodySmall,
    color: colors.primary,
    fontWeight: '600',
  },
});
