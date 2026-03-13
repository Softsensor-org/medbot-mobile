import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { API_BASE_URL } from "../api/config";
import { triggerEngagementHaptic } from "../engagement/haptics";
import type { CarePlanAction } from "../types/medical";
import type { DailyCarePlanWithAdaptation } from "../types/wellness";
import { colors, spacing, typography } from "../theme";
import { MetricChip } from "./common/MetricChip";
import { SecondaryButton } from "./common/SecondaryButton";
import { SectionHeader } from "./common/SectionHeader";
import { SoftCard } from "./common/SoftCard";

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
    queryKey: ["care-plan", "today"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/api/v1/care-plan/today`);
      if (!res.ok) throw new Error("Failed to fetch care plan");
      const json = await res.json();
      return json.data;
    },
    staleTime: 30_000,
  });

  const { data: careGraph } = useQuery<CareGraphData | null>({
    queryKey: ["care-graph", "today"],
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
    mutationFn: async ({ routineId, status }: { routineId: number; status: string }) => {
      const res = await fetch(`${API_BASE_URL}/api/v1/routines/${routineId}/log`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["care-plan", "today"] });
      queryClient.invalidateQueries({ queryKey: ["care-graph"] });
    },
  });

  const handleToggle = useCallback(
    (routineId: number | undefined, currentDone: boolean) => {
      if (!routineId || currentDone || logMutation.isPending) return;
      void triggerEngagementHaptic("routine_complete");
      logMutation.mutate({ routineId, status: "completed" });
    },
    [logMutation],
  );

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
  const symptomEvents = careGraph?.event_counts?.symptom_event || 0;
  const safetyEvents = careGraph?.event_counts?.safety_event || 0;
  const isElevatedRisk = latestTriage?.triage_label === "urgent" || safetyEvents > 0;
  const adaptation = plan.adaptation;

  const renderActionList = (actions: CarePlanAction[]) =>
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
        <Text style={[styles.actionText, item.done && styles.actionDoneText]}>{item.action}</Text>
      </TouchableOpacity>
    ));

  return (
    <SoftCard style={styles.card}>
      <SectionHeader
        eyebrow="Today"
        title="Today's Plan"
        subtitle={plan.confidence_context}
      />

      <View style={styles.metrics}>
        <MetricChip
          tone={isElevatedRisk ? "warning" : "default"}
          label="Latest triage"
          value={latestTriage?.triage_label ?? "routine"}
          icon={<MaterialIcons name="monitor-heart" size={16} color={colors.primary} />}
        />
        <MetricChip
          tone="info"
          label="Symptoms"
          value={`${symptomEvents}`}
          icon={<MaterialIcons name="timeline" size={16} color={colors.info} />}
        />
        <MetricChip
          tone={safetyEvents > 0 ? "warning" : "default"}
          label="Safety"
          value={`${safetyEvents}`}
          icon={<MaterialIcons name="shield" size={16} color={colors.warning} />}
        />
      </View>

      {isElevatedRisk ? (
        <SoftCard tone="warning" style={styles.alert}>
          <View style={styles.alertCopy}>
            <SectionHeader
              eyebrow="Safety note"
              title="Elevated risk detected"
              subtitle="Prioritize your routine and monitor symptoms."
            />
            <SecondaryButton
              label={safetyAcknowledged ? "Acknowledged" : "Acknowledge Safety Note"}
              onPress={handleAcknowledgeSafety}
              testID="todayplan-safety-ack-button"
            />
          </View>
        </SoftCard>
      ) : null}

      {adaptation ? (
        <SoftCard tone="muted" style={styles.adaptationCard}>
          <SectionHeader
            eyebrow="Tomorrow"
            title="Tomorrow's adjustments"
            subtitle="Adaptive suggestions based on your recent routine rhythm."
          />
          {adaptation.suppressed ? (
            <View style={styles.suppressedRow}>
              <MaterialIcons name="health-and-safety" size={18} color={colors.error} />
              <Text style={styles.suppressedText}>
                {adaptation.fallback_message || "Adaptive changes are paused while safety checks are active."}
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
              {adaptation.status === "fallback" && adaptation.fallback_message ? (
                <Text style={styles.fallbackText}>{adaptation.fallback_message}</Text>
              ) : null}
            </>
          )}
        </SoftCard>
      ) : null}

      <View style={styles.section}>
        <SectionHeader title="Morning" eyebrow="AM" />
        {renderActionList(plan.am_actions)}
      </View>

      <View style={styles.divider} />

      <View style={styles.section}>
        <SectionHeader title="Evening" eyebrow="PM" />
        {renderActionList(plan.pm_actions)}
      </View>

      <View style={styles.divider} />

      <View style={styles.footerRow}>
        <View style={styles.footerCol}>
          <SectionHeader title="Avoid" eyebrow="Protect" />
          {plan.avoid_today.map((item, index) => (
            <Text key={`${item}-${index}`} style={styles.footerText}>
              • {item}
            </Text>
          ))}
        </View>
        <View style={styles.footerCol}>
          <SectionHeader title="Watch" eyebrow="Monitor" />
          {plan.watch_for.map((item, index) => (
            <Text key={`${item}-${index}`} style={styles.footerText}>
              • {item}
            </Text>
          ))}
        </View>
      </View>
    </SoftCard>
  );
};

const styles = StyleSheet.create({
  card: {
    gap: spacing.md,
    marginVertical: spacing.md,
  },
  metrics: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  alert: {
    padding: spacing.md,
  },
  alertCopy: {
    gap: spacing.md,
  },
  adaptationCard: {
    gap: spacing.sm,
  },
  suppressedRow: {
    flexDirection: "row",
    gap: spacing.sm,
    alignItems: "flex-start",
  },
  suppressedText: {
    ...typography.bodySmall,
    color: colors.textPrimary,
    flex: 1,
  },
  section: {
    gap: spacing.sm,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  actionText: {
    ...typography.body,
    color: colors.textPrimary,
    flex: 1,
  },
  actionDoneText: {
    color: colors.textSecondary,
    textDecorationLine: "line-through",
  },
  divider: {
    height: 1,
    backgroundColor: colors.divider,
  },
  footerRow: {
    flexDirection: "row",
    gap: spacing.md,
  },
  footerCol: {
    flex: 1,
    gap: spacing.sm,
  },
  footerText: {
    ...typography.bodySmall,
    color: colors.textPrimary,
  },
  adjustmentRow: {
    gap: spacing.xxs,
    paddingVertical: spacing.xs,
  },
  adjustmentTitle: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  adjustmentDetail: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  fallbackText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  errorText: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
});
