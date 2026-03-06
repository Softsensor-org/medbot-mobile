import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { colors, typography, spacing } from '../theme';
import { DailyCarePlan, CarePlanAction } from '../types/medical';
import { API_BASE_URL } from '../api/config';
import { colorFor } from '../status/statusHelpers';

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

  const { data: plan, isLoading, isError } = useQuery<DailyCarePlan>({
    queryKey: ['care-plan', 'today'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/care-plan/today`);
      if (!res.ok) throw new Error('Failed to fetch care plan');
      const json = await res.json();
      return json.data;
    },
    staleTime: 30_000,
  });

  const { data: careGraph } = useQuery<CareGraphData | null>({
    queryKey: ['care-graph', 'today'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/care-graph`);
      if (!res.ok) return null;
      const json = await res.json();
      return json.data as CareGraphData;
    },
    staleTime: 60_000,
    retry: false,
  });

  const logMutation = useMutation({
    mutationFn: async ({ routineId, status }: { routineId: number, status: string }) => {
      const res = await fetch(`${API_BASE_URL}/routines/${routineId}/log`, {
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
    logMutation.mutate({ routineId, status: 'completed' });
  }, [logMutation]);

  if (isLoading) {
    return <ActivityIndicator style={{ padding: spacing.xl }} color={colors.primary} />;
  }

  if (isError || !plan) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Failed to load today's plan.</Text>
      </View>
    );
  }

  const latestTriage = careGraph?.triage_sessions?.[0];
  const symptomEvents = careGraph?.event_counts?.symptom_event || 0;
  const safetyEvents = careGraph?.event_counts?.safety_event || 0;
  const isElevatedRisk = latestTriage?.triage_label === 'urgent' || safetyEvents > 0;

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
          <MaterialIcons name="warning" size={20} color={colors.amber} />
          <Text style={styles.alertText}>
            Elevated risk detected. Prioritize your routine and monitor symptoms.
          </Text>
        </View>
      )}

      {careGraph && (
        <View style={styles.chipContainer}>
          {symptomEvents > 0 && <View style={styles.chip}><Text style={styles.chipText}>Symptoms: {symptomEvents}</Text></View>}
          {safetyEvents > 0 && <View style={[styles.chip, { borderColor: colors.error }]}><Text style={[styles.chipText, { color: colors.error }]}>Safety: {safetyEvents}</Text></View>}
          {latestTriage?.triage_label && (
            <View style={[styles.chip, { backgroundColor: colorFor(latestTriage.triage_label as any) }]}> {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
              <Text style={[styles.chipText, { color: colors.surface }]}>
                {latestTriage.triage_label.replace('_', ' ')}
              </Text>
            </View>
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
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  cardTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  contextText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  alert: {
    flexDirection: 'row',
    backgroundColor: '#FFFBEB',
    padding: spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FEF3C7',
    marginBottom: spacing.md,
    alignItems: 'center',
  },
  alertText: {
    ...typography.bodySmall,
    color: colors.amber,
    marginLeft: spacing.sm,
    flex: 1,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  chip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
  },
  section: {
    marginVertical: spacing.sm,
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
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  actionText: {
    ...typography.bodySmall,
    marginLeft: spacing.sm,
    color: colors.textPrimary,
  },
  actionDoneText: {
    textDecorationLine: 'line-through',
    color: colors.textDisabled,
  },
  divider: {
    height: 1,
    backgroundColor: colors.divider,
    marginVertical: spacing.sm,
  },
  footerRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  footerCol: {
    flex: 1,
  },
  footerText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  errorContainer: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  errorText: {
    ...typography.bodySmall,
    color: colors.error,
  }
});
