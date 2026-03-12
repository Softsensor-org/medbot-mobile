import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { colors, typography, spacing, borderRadius, shadows } from '../theme';
import type { CarePlanAction } from '../types/medical';
import type { DailyCarePlanWithAdaptation } from '../types/wellness';
import { API_BASE_URL } from '../api/config';
import { triggerEngagementHaptic } from '../engagement/haptics';

interface TriageSummary {
  triage_label?: string | null;
  red_flags?: string[];
}

interface CareGraphData {
  triage_sessions?: TriageSummary[];
  event_counts?: Record<string, number>;
}

export const TodayPlan: React.FC = () => {
  const queryClient = useQueryClient();
  const [safetyAcknowledged, setSafetyAcknowledged] = useState(false);

  const { data: plan, isLoading, isError } = useQuery<DailyCarePlanWithAdaptation>({
    queryKey: ['care-plan', 'today'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/api/v1/care-plan/today`);
      if (!res.ok) throw new Error('Failed to fetch care plan');
      const json = await res.json();
      return json.data;
    },
    staleTime: 30_000,
  });

  const { data: careGraph } = useQuery<CareGraphData | null>({
    queryKey: ['care-graph', 'today'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/api/v1/care-graph`);
      if (!res.ok) return null;
      const json = await res.json();
      return json.data as CareGraphData;
    },
    staleTime: 60_000,
    retry: false,
  });

  const logMutation = useMutation({
    mutationFn: async ({ routineId, status }: { routineId: number, status: string }) => {
      const res = await fetch(`${API_BASE_URL}/api/v1/routines/${routineId}/log`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['care-plan', 'today'] });
      queryClient.invalidateQueries({ queryKey: ['care-graph'] });
    }
  });

  const handleToggle = useCallback((routineId: number | undefined, currentDone: boolean) => {
    if (!routineId || currentDone || logMutation.isPending) return;
    void triggerEngagementHaptic("routine_complete");
    logMutation.mutate(
      { routineId, status: 'completed' },
    );
  }, [logMutation]);

  const handleAcknowledgeSafety = useCallback(() => {
    setSafetyAcknowledged(true);
    void triggerEngagementHaptic("warning_acknowledged");
  }, []);

  if (isLoading) {
    return <ActivityIndicator color={colors.primary} style={{ margin: spacing.xl }} />;
  }

  if (isError || !plan) {
    return <Text style={styles.errorText}>Failed to load your plan</Text>;
  }

  const latestTriage = careGraph?.triage_sessions?.[0];
  const safetyEvents = careGraph?.event_counts?.safety_event || 0;
  const isElevatedRisk = latestTriage?.triage_label === 'urgent' || safetyEvents > 0;
  const adaptation = plan.adaptation;

  const renderActionList = (actions: CarePlanAction[]) => (
    actions.map((item, idx) => (
      <TouchableOpacity 
        key={`${item.action}-${idx}`}
        style={styles.actionRow}
        onPress={() => handleToggle(item.id, item.done)}
        disabled={!item.id || item.done || logMutation.isPending}
      >
        <Ionicons 
          name={item.done ? "checkbox" : "square-outline"} 
          size={22} 
          color={item.done ? colors.success : colors.primary} 
        />
        <Text style={[
          styles.actionText,
          item.done && styles.actionDoneText
        ]}>
          {item.action}
        </Text>
      </TouchableOpacity>
    ))
  );

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Today's Plan</Text>
      <Text style={styles.contextText}>{plan.confidence_context}</Text>

      {isElevatedRisk && (
        <View style={styles.alert}>
          <MaterialIcons name="warning" size={20} color={colors.warning} />
          <View style={styles.alertBody}>
            <Text style={styles.alertText}>
              Elevated risk detected. Prioritize your routine and monitor symptoms.
            </Text>
            <TouchableOpacity
              onPress={handleAcknowledgeSafety}
              style={styles.alertButton}
              testID="todayplan-safety-ack-button"
            >
              <Text style={styles.alertButtonText}>
                {safetyAcknowledged ? "Acknowledged" : "Acknowledge Safety Note"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {adaptation && (
        <View style={styles.adaptationContainer}>
          <View style={styles.sectionHeader}>
            <Ionicons name="sparkles-outline" size={18} color={colors.primary} />
            <Text style={styles.sectionTitle}>Tomorrow's adjustments</Text>
          </View>
          {adaptation.suppressed ? (
            <View style={styles.suppressedRow}>
              <MaterialIcons name="health-and-safety" size={18} color={colors.error} />
              <Text style={styles.suppressedText}>
                {adaptation.fallback_message || 'Adaptive changes are paused while safety checks are active.'}
              </Text>
            </View>
          ) : (
            <>
              {adaptation.next_day_adjustments.map((item) => (
                <View key={item.code} style={styles.adjustmentRow}>
                  <Text style={styles.adjustmentTitle}>{item.title}</Text>
                  <Text style={styles.adjustmentDetail}>{item.detail}</Text>
                </View>
              ))}
              {adaptation.status === 'fallback' && adaptation.fallback_message && (
                <Text style={styles.fallbackText}>{adaptation.fallback_message}</Text>
              )}
            </>
          )}
        </View>
      )}

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="sunny-outline" size={18} color={colors.warning} />
          <Text style={styles.sectionTitle}>Morning</Text>
        </View>
        {renderActionList(plan.am_actions)}
      </View>

      <View style={styles.divider} />

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="moon-outline" size={18} color={colors.primary} />
          <Text style={styles.sectionTitle}>Evening</Text>
        </View>
        {renderActionList(plan.pm_actions)}
      </View>

      <View style={styles.divider} />

      <View style={styles.footerRow}>
        <View style={styles.footerCol}>
          <View style={styles.sectionHeader}>
            <Ionicons name="close-circle-outline" size={18} color={colors.error} />
            <Text style={styles.sectionTitle}>Avoid</Text>
          </View>
          {plan.avoid_today.map((item, i) => (
            <Text key={i} style={styles.footerText}>• {item}</Text>
          ))}
        </View>
        <View style={styles.footerCol}>
          <View style={styles.sectionHeader}>
            <Ionicons name="eye-outline" size={18} color={colors.info} />
            <Text style={styles.sectionTitle}>Watch</Text>
          </View>
          {plan.watch_for.map((item, i) => (
            <Text key={i} style={styles.footerText}>• {item}</Text>
          ))}
        </View>
      </View>
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
  cardTitle: {
    ...typography.h2,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  contextText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  alert: {
    flexDirection: 'row',
    backgroundColor: colors.warningLight,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.warning,
  },
  alertBody: {
    marginLeft: spacing.sm,
    flex: 1,
    gap: spacing.xs,
  },
  alertText: {
    ...typography.bodySmall,
    color: colors.textPrimary,
  },
  alertButton: {
    alignSelf: "flex-start",
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.warning,
    backgroundColor: colors.surface,
  },
  alertButtonText: {
    ...typography.caption,
    color: colors.warning,
    fontWeight: "700",
  },
  adaptationContainer: {
    backgroundColor: colors.surfaceVariant,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    ...typography.label,
    fontWeight: '700',
    marginLeft: spacing.xs,
    color: colors.textPrimary,
  },
  adjustmentRow: {
    marginBottom: spacing.sm,
  },
  adjustmentTitle: {
    ...typography.bodySmall,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  adjustmentDetail: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  suppressedRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  suppressedText: {
    ...typography.bodySmall,
    color: colors.error,
    marginLeft: spacing.xs,
    flex: 1,
  },
  fallbackText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginTop: spacing.xs,
  },
  section: {
    marginVertical: spacing.sm,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    gap: spacing.sm,
  },
  actionText: {
    ...typography.body,
    color: colors.textPrimary,
  },
  actionDoneText: {
    textDecorationLine: 'line-through',
    color: colors.textDisabled,
  },
  divider: {
    height: 1,
    backgroundColor: colors.divider,
    marginVertical: spacing.md,
  },
  footerRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  footerCol: {
    flex: 1,
  },
  footerText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  errorText: {
    ...typography.bodySmall,
    color: colors.error,
    textAlign: 'center',
    margin: spacing.md,
  },
});
