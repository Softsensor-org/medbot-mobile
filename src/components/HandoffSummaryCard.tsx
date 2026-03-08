import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  ScrollView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius, shadows } from '../theme';
import { useHandoffSummary } from '../hooks/useInterventions';
import { format, parseISO } from 'date-fns';

export const HandoffSummaryCard: React.FC = () => {
  const { data: summary, isLoading, refetch } = useHandoffSummary();
  const [showModal, setShowModal] = useState(false);

  const handleGenerate = () => {
    refetch();
    setShowModal(true);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.card} onPress={handleGenerate}>
        <View style={styles.iconContainer}>
          <MaterialIcons name="assignment-ind" size={24} color={colors.primary} />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.title}>Provider Handoff</Text>
          <Text style={styles.subtitle}>Generate clinical snapshot for your doctor.</Text>
        </View>
        <MaterialIcons name="chevron-right" size={24} color={colors.textSecondary} />
      </TouchableOpacity>

      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Clinical Handoff</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <MaterialIcons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            {isLoading ? (
              <ActivityIndicator size="large" color={colors.primary} style={{ margin: spacing.xl }} />
            ) : summary ? (
              <ScrollView style={styles.summaryScroll}>
                <View style={styles.summarySection}>
                  <Text style={styles.summaryLabel}>Active Interventions</Text>
                  {summary.active_interventions.length === 0 ? (
                    <Text style={styles.noneText}>None reported</Text>
                  ) : (
                    summary.active_interventions.map((i, idx) => (
                      <Text key={idx} style={styles.summaryItem}>
                        • {i.name} ({i.dosage}, {i.frequency})
                      </Text>
                    ))
                  )}
                </View>

                <View style={styles.summarySection}>
                  <Text style={styles.summaryLabel}>Recent Symptoms (Last 30 days)</Text>
                  {summary.recent_symptoms.length === 0 ? (
                    <Text style={styles.noneText}>No significant symptoms</Text>
                  ) : (
                    summary.recent_symptoms.map((s, idx) => (
                      <Text key={idx} style={styles.summaryItem}>
                        • {s.symptom_name}: Severity {s.severity}/5 ({format(parseISO(s.occurred_at), 'MMM dd')})
                      </Text>
                    ))
                  )}
                </View>

                <View style={styles.summarySection}>
                  <Text style={styles.summaryLabel}>Habit Performance</Text>
                  {summary.habit_performance.length === 0 ? (
                    <Text style={styles.noneText}>No habit data</Text>
                  ) : (
                    summary.habit_performance.map((h, idx) => (
                      <Text key={idx} style={styles.summaryItem}>
                        • {h.routine_name}: {h.current_streak} day current streak
                      </Text>
                    ))
                  )}
                </View>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>Generated on {format(parseISO(summary.generated_at), 'PPP p')}</Text>
                    <Text style={styles.footerHint}>Share this screen with your provider during consultation.</Text>
                </View>
              </ScrollView>
            ) : null}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.md,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.sm,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryLight + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    ...typography.h3,
    color: colors.textPrimary,
    fontSize: 16,
  },
  subtitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.lg,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  modalTitle: {
    ...typography.h2,
    color: colors.textPrimary,
  },
  summaryScroll: {
    marginBottom: spacing.xxl,
  },
  summarySection: {
    marginBottom: spacing.xl,
  },
  summaryLabel: {
    ...typography.label,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  summaryItem: {
    ...typography.body,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  noneText: {
    ...typography.body,
    color: colors.textDisabled,
    fontStyle: 'italic',
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingTop: spacing.md,
    marginTop: spacing.md,
  },
  footerText: {
    ...typography.caption,
    color: colors.textDisabled,
  },
  footerHint: {
    ...typography.caption,
    color: colors.primary,
    fontStyle: 'italic',
    marginTop: 4,
  }
});
