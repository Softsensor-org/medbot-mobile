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
import { medicalApi } from "../api/medicalApi";
import { triggerEngagementHaptic } from "../engagement/haptics";
import type { CareGraphResponse, CarePlanAction, RoutineLog } from "../types/medical";
import type { DailyCarePlanWithAdaptation } from "../types/wellness";
import { borderRadius, colors, spacing, typography } from "../theme";
import { MetricChip } from "./common/MetricChip";
import { SecondaryButton } from "./common/SecondaryButton";
import { SectionHeader } from "./common/SectionHeader";
import { SoftCard } from "./common/SoftCard";

export const TodayPlan: React.FC = () => {
  const queryClient = useQueryClient();
  const [safetyAcknowledged, setSafetyAcknowledged] = useState(false);

  const { data: plan, isLoading, isError } = useQuery<DailyCarePlanWithAdaptation>({
    queryKey: ["care-plan", "today"],
    queryFn: () => medicalApi.getTodayCarePlan(),
    staleTime: 30_000,
  });

  const { data: careGraph } = useQuery<CareGraphResponse | null>({
    queryKey: ["care-graph", "today"],
    queryFn: async () => {
      try {
        return await medicalApi.getCareGraph();
      } catch {
        return null;
      }
    },
    staleTime: 60_000,
    retry: false,
  });

  const logMutation = useMutation({
    mutationFn: ({ routineId, status }: { routineId: number; status: RoutineLog["status"] }) =>
      medicalApi.logRoutineCompletion(routineId, status),
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
  const safetyEvents = careGraph?.event_counts?.safety_event || 0;
  const isElevatedRisk = latestTriage?.triage_label === "urgent" || safetyEvents > 0;
  const adaptation = plan.adaptation;
  const morningRemaining = plan.am_actions.filter((item) => !item.done).length;
  const eveningRemaining = plan.pm_actions.filter((item) => !item.done).length;

  const renderActionList = (actions: CarePlanAction[], emptyCopy: string) => {
    if (actions.length === 0) {
      return <Text style={styles.emptyText}>{emptyCopy}</Text>;
    }

    return actions.map((item, idx) => (
      <TouchableOpacity
        key={`${item.action}-${idx}`}
        style={[styles.actionRow, item.done && styles.actionRowDone]}
        onPress={() => handleToggle(item.id, item.done)}
        disabled={!item.id || item.done || logMutation.isPending}
      >
        <View style={styles.actionMain}>
          <Ionicons
            name={item.done ? "checkbox" : "square-outline"}
            size={22}
            color={item.done ? colors.success : colors.primary}
          />
          <Text style={[styles.actionText, item.done && styles.actionDoneText]}>{item.action}</Text>
        </View>
        <Text style={[styles.actionMeta, item.done && styles.actionMetaDone]}>
          {item.done ? "Done" : "Tap to complete"}
        </Text>
      </TouchableOpacity>
    ));
  };

  return (
    <SoftCard style={styles.card}>
      <SectionHeader
        eyebrow="Today"
        title="Today's Plan"
        subtitle={plan.confidence_context}
      />

      <View style={styles.metrics}>
        <MetricChip
          tone={morningRemaining > 0 ? "primary" : "success"}
          label="Morning"
          value={morningRemaining > 0 ? `${morningRemaining} left` : "Done"}
          icon={<MaterialIcons name="wb-sunny" size={16} color={colors.primary} />}
        />
        <MetricChip
          tone={eveningRemaining > 0 ? "info" : "success"}
          label="Evening"
          value={eveningRemaining > 0 ? `${eveningRemaining} left` : "Done"}
          icon={<MaterialIcons name="dark-mode" size={16} color={colors.info} />}
        />
        <MetricChip
          tone={safetyEvents > 0 ? "warning" : "default"}
          label="Safety"
          value={isElevatedRisk ? (latestTriage?.triage_label ?? "elevated") : "steady"}
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

      <SoftCard tone="muted" padded={false} style={styles.planSection}>
        <View style={styles.planSectionBody}>
          <SectionHeader
            title="Morning"
            eyebrow="AM"
            subtitle={morningRemaining > 0 ? `${morningRemaining} step${morningRemaining === 1 ? "" : "s"} left` : "Everything logged for this window."}
          />
          {renderActionList(plan.am_actions, "No morning steps are queued right now.")}
        </View>
      </SoftCard>

      <View style={styles.divider} />

      <SoftCard tone="muted" padded={false} style={styles.planSection}>
        <View style={styles.planSectionBody}>
          <SectionHeader
            title="Evening"
            eyebrow="PM"
            subtitle={eveningRemaining > 0 ? `${eveningRemaining} step${eveningRemaining === 1 ? "" : "s"} left` : "Everything logged for tonight."}
          />
          {renderActionList(plan.pm_actions, "No evening steps are queued right now.")}
        </View>
      </SoftCard>

      <View style={styles.divider} />

      <SoftCard tone="muted" padded={false} style={styles.guidanceCard}>
        <View style={styles.guidanceBody}>
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
        </View>
      </SoftCard>
    </SoftCard>
  );
};

const styles = StyleSheet.create({
  card: {
    gap: spacing.lg,
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
  planSection: {
    overflow: "visible",
  },
  planSectionBody: {
    padding: spacing.md,
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
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.smd,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: borderRadius.lg,
  },
  actionRowDone: {
    backgroundColor: colors.surfaceLight,
    borderColor: colors.divider,
  },
  actionMain: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
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
  actionMeta: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: "700",
  },
  actionMetaDone: {
    color: colors.success,
  },
  divider: {
    height: 1,
    backgroundColor: colors.divider,
  },
  guidanceCard: {
    overflow: "visible",
  },
  guidanceBody: {
    padding: spacing.md,
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
  emptyText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  errorText: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
});
