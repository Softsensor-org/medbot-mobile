import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useRoutineAssignments } from "../../../src/hooks/useRoutineAssignments";
import { useCompleteAssignment, useDeferAssignment } from "../../../src/hooks/useRoutineActions";
import { useRoutines } from "../../../src/hooks/useRoutines";
import type {
  RescheduleIntentType,
  RoutineAssignment,
  Routine,
  RoutineAssignmentActionRequest,
  RoutineRecoverySummary,
  RoutineStepCompletion,
} from "../../../src/types/medical";
import { colors, spacing, typography } from "../../../src/theme";
import { hapticService } from "../../../src/api/HapticService";
import { useSafetyGate } from "../../../src/hooks/useSafetyGate";
import { SafetyGateOverlay } from "../../../src/components/SafetyGateOverlay";
import { CommitBoxSheet } from "../../../src/components/routines/CommitBoxSheet";
import { RoutineAssignmentCard } from "../../../src/components/routines/RoutineAssignmentCard";
import { EmptyStateCard } from "../../../src/components/common/EmptyStateCard";
import { MetricChip } from "../../../src/components/common/MetricChip";
import { ScreenShell } from "../../../src/components/common/ScreenShell";
import { SectionHeader } from "../../../src/components/common/SectionHeader";
import { SoftCard } from "../../../src/components/common/SoftCard";
import { useRoutineIntelligence } from "../../../src/hooks/useRoutineIntelligence";

interface EnrichedAssignment {
  assignment: RoutineAssignment;
  routine?: Routine;
}

type AssignmentBucket = "active" | "recovery" | "template" | "history";

type CompleteRoutinePayload = RoutineAssignmentActionRequest & {
  steps?: RoutineStepCompletion[];
};

function getSyncMessage(
  completeStatus?: string,
  deferStatus?: string,
) {
  if (completeStatus === "queued" || deferStatus === "queued") {
    return "A routine action is queued for sync.";
  }
  if (completeStatus === "syncing" || deferStatus === "syncing") {
    return "Syncing routine actions...";
  }
  if (completeStatus === "synced" || deferStatus === "synced") {
    return "Routine sync complete.";
  }
  if (completeStatus === "failed" || deferStatus === "failed") {
    return "Routine sync failed. Retry.";
  }
  return null;
}

function getRecoveryState(assignment: RoutineAssignment): RoutineRecoverySummary["state"] {
  if (assignment.recovery?.state) {
    return assignment.recovery.state;
  }
  if (assignment.status === "deferred") return "deferred";
  if (assignment.status === "completed") return "completed";
  if (assignment.status === "cancelled") return "cancelled";
  return "on_track";
}

export default function RoutinesScreen() {
  const { from_chat } = useLocalSearchParams<{ from_chat?: string }>();
  const { data: assignments = [], isLoading, error: assignmentError } = useRoutineAssignments();
  const { data: routines = [], error: routinesError } = useRoutines();
  const { data: routineIntelligence } = useRoutineIntelligence();
  const completeMutation = useCompleteAssignment();
  const deferMutation = useDeferAssignment();
  const { safety, isLoading: isLoadingSafety } = useSafetyGate();

  const [chatBanner, setChatBanner] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    if (from_chat === "true") {
      setChatBanner(true);
      const timer = setTimeout(() => setChatBanner(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [from_chat]);
  // Step-level completion tracking: Map<assignmentId, Map<stepId, RoutineStepCompletion>>
  const [stepCompletions, setStepCompletions] = useState<Map<number, Map<number, RoutineStepCompletion>>>(new Map());

  const getStepCompletionsForAssignment = useCallback(
    (assignmentId: number): Map<number, RoutineStepCompletion> => {
      return stepCompletions.get(assignmentId) ?? new Map();
    },
    [stepCompletions],
  );

  const handleStepToggle = useCallback(
    (assignmentId: number, routine: Routine | undefined) => (stepId: number) => {
      const step = routine?.steps.find((s) => s.id === stepId);
      if (!step) return;

      setStepCompletions((prev) => {
        const next = new Map(prev);
        const assignmentSteps = new Map(next.get(assignmentId) ?? new Map());
        const current = assignmentSteps.get(stepId);
        const newState: RoutineStepCompletion["state"] =
          current?.state === "completed" ? "pending" : "completed";
        assignmentSteps.set(stepId, {
          step_id: stepId,
          step_name: step.name,
          state: newState,
          completed_at: newState === "completed" ? new Date().toISOString() : undefined,
        });
        next.set(assignmentId, assignmentSteps);
        return next;
      });
    },
    [],
  );

  const [selectedAssignment, setSelectedAssignment] = useState<RoutineAssignment | null>(null);
  const [deferReasonCode, setDeferReasonCode] = useState("too_busy");
  const [rescheduleType, setRescheduleType] = useState<RescheduleIntentType>("later_today");
  const [targetAt, setTargetAt] = useState("");
  const [comment, setComment] = useState("");

  const timeZone = useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC", []);
  const isSubmitting = completeMutation.isPending || deferMutation.isPending;

  const loadError =
    assignmentError instanceof Error
      ? assignmentError.message
      : assignmentError
        ? "Failed to load routines"
        : null;
  const routineDetailWarning =
    routinesError instanceof Error
      ? routinesError.message
      : routinesError
        ? "Routine detail is temporarily unavailable."
        : null;
  const syncMessage = getSyncMessage(completeMutation.syncStatus, deferMutation.syncStatus);

  const assignmentMap = useMemo(() => {
    return new Map(routines.map((routine) => [routine.id ?? -1, routine]));
  }, [routines]);

  const enrichedAssignments = useMemo<EnrichedAssignment[]>(() => {
    return assignments.map((assignment) => ({
      assignment,
      routine: assignmentMap.get(assignment.routine_id),
    }));
  }, [assignments, assignmentMap]);

  const getCategory = (item: EnrichedAssignment): AssignmentBucket => {
    if (item.routine?.category === "template") return "template";
    const recoveryState = getRecoveryState(item.assignment);
    if (item.assignment.status === "completed" || item.assignment.status === "cancelled") return "history";
    if (recoveryState === "snoozed" || recoveryState === "deferred" || recoveryState === "recovery_due") {
      return "recovery";
    }
    return "active";
  };

  const categorized = useMemo(() => {
    const active: EnrichedAssignment[] = [];
    const recovery: EnrichedAssignment[] = [];
    const template: EnrichedAssignment[] = [];
    const history: EnrichedAssignment[] = [];
    for (const item of enrichedAssignments) {
      const cat = getCategory(item);
      if (cat === "template") template.push(item);
      else if (cat === "recovery") recovery.push(item);
      else if (cat === "history") history.push(item);
      else active.push(item);
    }
    return { active, recovery, template, history };
  }, [enrichedAssignments]);

  const DAY_PART_ORDER = ["morning", "evening", "afternoon", undefined] as const;
  const DAY_PART_LABELS: Record<string, string> = {
    morning: "Morning",
    evening: "Evening",
    afternoon: "Afternoon",
  };

  const activeByDayPart = useMemo(() => {
    const groups: { dayPart: string | undefined; label: string; items: EnrichedAssignment[] }[] = [];
    for (const dp of DAY_PART_ORDER) {
      const items = categorized.active.filter((item) => (item.routine?.day_part ?? undefined) === dp);
      if (items.length > 0) {
        groups.push({
          dayPart: dp,
          label: dp ? DAY_PART_LABELS[dp] ?? dp : "Other",
          items,
        });
      }
    }
    // Include weekly routines in their groups
    const frequency = (item: EnrichedAssignment) =>
      typeof item.routine?.recurrence?.frequency === "string"
        ? item.routine.recurrence.frequency.toLowerCase()
        : null;
    // Tag weekly items within each group
    return groups.map((g) => ({
      ...g,
      items: g.items.sort((a, b) => {
        const aWeekly = frequency(a) === "weekly" ? 1 : 0;
        const bWeekly = frequency(b) === "weekly" ? 1 : 0;
        return aWeekly - bWeekly;
      }),
    }));
  }, [categorized.active]);

  const focusedAssignmentId = routineIntelligence?.focus.assignment_id ?? null;
  const featuredAssignment =
    (focusedAssignmentId != null
      ? categorized.active.find((item) => item.assignment.id === focusedAssignmentId)
        ?? categorized.recovery.find((item) => item.assignment.id === focusedAssignmentId)
        ?? null
      : null) ??
    categorized.active[0] ??
    categorized.recovery[0] ??
    null;
  const featuredId = featuredAssignment?.assignment.id ?? null;
  const focusTitle =
    routineIntelligence?.focus.routine_name ??
    featuredAssignment?.assignment.routine_name ??
    featuredAssignment?.routine?.name ??
    "Routine focus";
  const focusEyebrow =
    routineIntelligence?.focus.kind === "current"
      ? "Current ritual focus"
      : routineIntelligence?.focus.kind === "next"
        ? "Next ritual focus"
        : "Routine focus";
  const focusDescription =
    routineIntelligence?.recovery?.state &&
    !["on_track", "completed", "cancelled"].includes(routineIntelligence.recovery.state)
      ? routineIntelligence.recovery.detail
      : routineIntelligence?.focus.estimated_duration_basis ??
        "Use the hero card to complete the clearest next routine or capture a structured defer.";
  const adherenceRate7d = routineIntelligence?.adherence.adherence_rate_7d;
  const adherenceValue = adherenceRate7d != null ? `${Math.round(adherenceRate7d * 100)}%` : "Pending";
  const streakValue = routineIntelligence?.adherence.current_streak
    ? `${routineIntelligence.adherence.current_streak} days`
    : "Not started";
  const durationValue = routineIntelligence?.focus.estimated_duration_minutes
    ? `~${routineIntelligence.focus.estimated_duration_minutes} min`
    : "No estimate";
  const recoverySummary = routineIntelligence?.recovery;
  const showRecoveryCard = !!recoverySummary && !["on_track", "completed", "cancelled"].includes(recoverySummary.state);

  const isSafetyBlocked = !isLoadingSafety && !safety.isSafe && safety.reason !== "low_confidence";

  const handleComplete = useCallback(
    (assignmentId: number) => {
      setError(null);
      setInfo(null);
      hapticService.triggerWarning();

      // Collect step-level completions for this assignment
      const assignmentSteps = stepCompletions.get(assignmentId);
      const stepsArray: RoutineStepCompletion[] = assignmentSteps
        ? Array.from(assignmentSteps.values())
        : [];

      const payload: CompleteRoutinePayload = {
        action: "complete",
        timezone: timeZone,
        completed_at: new Date().toISOString(),
        completion_rate: 1.0,
        steps: stepsArray.length > 0 ? stepsArray : undefined,
      };

      completeMutation.mutate(
        {
          assignmentId,
          payload,
        },
        {
          onSuccess: (result) => {
            hapticService.triggerSuccess();
            // Clear step completions for this assignment
            setStepCompletions((prev) => {
              const next = new Map(prev);
              next.delete(assignmentId);
              return next;
            });
            setInfo(
              result?.mode === "queued"
                ? "Routine action queued offline and will sync automatically."
                : "Routine marked complete.",
            );
          },
          onError: (err) => setError(err instanceof Error ? err.message : "Unable to complete routine"),
        },
      );
    },
    [completeMutation, timeZone, stepCompletions],
  );

  const openCommitBox = useCallback((assignment: RoutineAssignment) => {
    setSelectedAssignment(assignment);
    setDeferReasonCode("too_busy");
    setRescheduleType("later_today");
    setTargetAt("");
    setComment("");
    setError(null);
    setInfo(null);
  }, []);

  const closeCommitBox = useCallback(() => {
    if (isSubmitting) return;
    setSelectedAssignment(null);
    setDeferReasonCode("too_busy");
    setRescheduleType("later_today");
    setTargetAt("");
    setComment("");
    setError(null);
  }, [isSubmitting]);

  const handleSubmitDefer = useCallback(() => {
    if (!selectedAssignment) return;
    if (rescheduleType === "specific_time" && !targetAt.trim()) {
      hapticService.triggerError();
      setError("Target time is required for specific_time.");
      return;
    }

    setError(null);
    setInfo(null);
    const recoveryPayload =
      rescheduleType === "skip_for_now"
        ? {
            action: "skip" as const,
            skip_reason_code: deferReasonCode,
            comment: comment.trim() || undefined,
          }
        : {
            action: (rescheduleType === "tomorrow" ? "defer" : "snooze") as "defer" | "snooze",
            defer_reason_code: deferReasonCode,
            comment: comment.trim() || undefined,
            reschedule_intent: {
              type: rescheduleType,
              target_at: rescheduleType === "specific_time" ? targetAt.trim() : undefined,
            },
          };
    deferMutation.mutate(
      {
        assignmentId: selectedAssignment.id,
        payload: recoveryPayload,
      },
      {
        onSuccess: (result) => {
          hapticService.triggerSuccess();
          setInfo(
            result?.mode === "queued"
              ? "Routine recovery action queued offline and will sync automatically."
              : rescheduleType === "skip_for_now"
                ? "Routine moved into recovery mode."
                : rescheduleType === "tomorrow"
                  ? "Routine deferred with commit details."
                  : "Routine snoozed with a recovery plan.",
          );
          setSelectedAssignment(null);
        },
        onError: (err) => setError(err instanceof Error ? err.message : "Unable to defer routine"),
      },
    );
  }, [comment, deferMutation, deferReasonCode, rescheduleType, selectedAssignment, targetAt]);

  return (
    <>
      <ScreenShell
        title="Routines"
        subtitle="Keep the next ritual clear, complete it in one tap, or capture a structured defer without losing context."
        testID="routines-screen"
      >
        {chatBanner && (
          <SoftCard tone="muted" testID="routine-chat-banner">
            <Text style={styles.chatBannerText}>Routine suggested from your chat</Text>
          </SoftCard>
        )}

        {isSafetyBlocked ? (
          <SafetyGateOverlay safety={safety} />
        ) : (
          <>
            <SoftCard tone="muted" style={styles.introCard}>
              <Text style={styles.introEyebrow}>Ritual flow</Text>
              <Text style={styles.introTitle}>One calm place for current assignments, cadence, and defer decisions.</Text>
              <Text style={styles.introBody}>
                Complete the current ritual from the hero card or open the Commit Box to document a structured recovery plan.
              </Text>
            </SoftCard>

            {routineIntelligence && routineIntelligence.focus.kind !== "none" ? (
              <SoftCard tone="highlight" style={styles.intelligenceCard} testID="routine-intelligence-card">
                <SectionHeader
                  eyebrow={focusEyebrow}
                  title={focusTitle}
                  subtitle={focusDescription}
                />
                <View style={styles.intelligenceMetrics}>
                  <MetricChip
                    label="Adherence"
                    value={adherenceValue}
                    tone={
                      adherenceRate7d == null
                        ? "default"
                        : adherenceRate7d >= 0.8
                          ? "success"
                          : adherenceRate7d >= 0.5
                            ? "info"
                            : "warning"
                    }
                    style={styles.metricChip}
                  />
                  <MetricChip
                    label="Current streak"
                    value={streakValue}
                    tone={routineIntelligence.adherence.current_streak ? "success" : "primary"}
                    style={styles.metricChip}
                  />
                  <MetricChip
                    label="Estimated time"
                    value={durationValue}
                    tone={routineIntelligence.focus.estimated_duration_minutes ? "info" : "default"}
                    style={styles.metricChip}
                  />
                </View>
              </SoftCard>
            ) : null}

            {showRecoveryCard && recoverySummary ? (
              <SoftCard tone="muted" style={styles.recoverySummaryCard} testID="routine-recovery-card">
                <SectionHeader
                  eyebrow="Recovery guidance"
                  title={recoverySummary.headline}
                  subtitle={recoverySummary.detail}
                />
                {recoverySummary.provider_follow_up ? (
                  <Text style={styles.recoveryFollowUp}>
                    Your care team may review this recovery signal.
                  </Text>
                ) : null}
              </SoftCard>
            ) : null}

            {isLoading || isLoadingSafety ? (
              <SoftCard tone="muted">
                <Text style={styles.metaText}>Loading assignments...</Text>
              </SoftCard>
            ) : null}

            {loadError ? (
              <SoftCard tone="warning">
                <Text style={[styles.metaText, styles.errorText]}>{loadError}</Text>
              </SoftCard>
            ) : null}

            {routineDetailWarning ? (
              <SoftCard tone="warning">
                <Text style={styles.metaText}>
                  Routine details are temporarily unavailable. Assignment actions still work.
                </Text>
                <Text style={[styles.metaText, styles.errorText]}>{routineDetailWarning}</Text>
              </SoftCard>
            ) : null}

            {info ? (
              <SoftCard tone="success">
                <Text style={[styles.metaText, styles.infoText]}>{info}</Text>
              </SoftCard>
            ) : null}

            {(error || syncMessage || completeMutation.syncError || deferMutation.syncError) ? (
              <SoftCard tone={error || completeMutation.syncError || deferMutation.syncError ? "warning" : "muted"} testID="routine-sync-status">
                {error ? <Text style={[styles.metaText, styles.errorText]}>{error}</Text> : null}
                {syncMessage ? <Text style={styles.metaText}>{syncMessage}</Text> : null}
                {completeMutation.syncError ? (
                  <Text style={[styles.metaText, styles.errorText]}>{completeMutation.syncError}</Text>
                ) : null}
                {deferMutation.syncError ? (
                  <Text style={[styles.metaText, styles.errorText]}>{deferMutation.syncError}</Text>
                ) : null}
                <View style={styles.retryRow}>
                  {completeMutation.syncStatus === "failed" ? (
                    <Pressable onPress={() => void completeMutation.retrySync()} testID="routine-complete-sync-retry-button">
                      <Text style={styles.retryText}>Retry complete sync</Text>
                    </Pressable>
                  ) : null}
                  {deferMutation.syncStatus === "failed" ? (
                    <Pressable onPress={() => void deferMutation.retrySync()} testID="routine-defer-sync-retry-button">
                      <Text style={styles.retryText}>Retry defer sync</Text>
                    </Pressable>
                  ) : null}
                </View>
              </SoftCard>
            ) : null}

            {!isLoading && !loadError && enrichedAssignments.length === 0 ? (
              <EmptyStateCard
                title="No rituals are ready right now"
                description="Your care team has not assigned an active routine yet. When one is ready, it will appear here with the full completion and defer workflow."
                testID="routine-empty-state"
              />
            ) : null}

            {/* Active Routines */}
            {categorized.active.length > 0 ? (
              <>
                <View style={styles.section}>
                  <SectionHeader
                    eyebrow="Active Routines"
                    title="Ready to act"
                    subtitle="The hero card keeps the next assignment, cadence, and authored steps in one place."
                  />
                  {featuredAssignment ? (
                    <RoutineAssignmentCard
                      assignment={featuredAssignment.assignment}
                      routine={featuredAssignment.routine}
                      variant="featured"
                      disabled={isSubmitting}
                      stepCompletions={getStepCompletionsForAssignment(featuredAssignment.assignment.id)}
                      onStepToggle={handleStepToggle(featuredAssignment.assignment.id, featuredAssignment.routine)}
                      onComplete={handleComplete}
                      onDefer={openCommitBox}
                    />
                  ) : null}
                </View>

                {activeByDayPart.map((group) => {
                  const remaining = group.items.filter((item) => item.assignment.id !== featuredId);
                  if (remaining.length === 0) return null;
                  return (
                    <View key={group.label} style={styles.section}>
                      <Text style={styles.subGroupLabel}>{group.label}</Text>
                      <View style={styles.stack}>
                        {remaining.map((item) => (
                          <RoutineAssignmentCard
                            key={item.assignment.id}
                            assignment={item.assignment}
                            routine={item.routine}
                            disabled={isSubmitting}
                            stepCompletions={getStepCompletionsForAssignment(item.assignment.id)}
                            onStepToggle={handleStepToggle(item.assignment.id, item.routine)}
                            onComplete={handleComplete}
                            onDefer={openCommitBox}
                          />
                        ))}
                      </View>
                    </View>
                  );
                })}
              </>
            ) : null}

            {categorized.recovery.length > 0 ? (
              <View style={styles.section}>
                <SectionHeader
                  eyebrow="Recovery Queue"
                  title="Safe resumption guidance"
                  subtitle="These routines already have a structured recovery plan. Resume from the first core step when you come back."
                />
                {!categorized.active.length && featuredAssignment ? (
                  <RoutineAssignmentCard
                    assignment={featuredAssignment.assignment}
                    routine={featuredAssignment.routine}
                    variant="featured"
                    disabled={isSubmitting}
                    stepCompletions={getStepCompletionsForAssignment(featuredAssignment.assignment.id)}
                    onStepToggle={handleStepToggle(featuredAssignment.assignment.id, featuredAssignment.routine)}
                    onComplete={handleComplete}
                    onDefer={openCommitBox}
                  />
                ) : null}
                <View style={styles.stack}>
                  {categorized.recovery
                    .filter((item) => item.assignment.id !== featuredId || categorized.active.length > 0)
                    .map((item) => (
                    <RoutineAssignmentCard
                      key={item.assignment.id}
                      assignment={item.assignment}
                      routine={item.routine}
                      muted={item.assignment.status === "deferred"}
                      disabled={isSubmitting}
                      stepCompletions={getStepCompletionsForAssignment(item.assignment.id)}
                      onStepToggle={handleStepToggle(item.assignment.id, item.routine)}
                      onComplete={handleComplete}
                      onDefer={openCommitBox}
                    />
                  ))}
                </View>
              </View>
            ) : null}

            {/* Available Templates */}
            {categorized.template.length > 0 ? (
              <View style={styles.section}>
                <SectionHeader
                  eyebrow="Available Templates"
                  title="Browse routines"
                  subtitle="Templates from your care team. These are not assigned yet."
                />
                <View style={styles.stack}>
                  {categorized.template.map((item) => (
                    <RoutineAssignmentCard
                      key={item.assignment.id}
                      assignment={item.assignment}
                      routine={item.routine}
                      browseOnly
                      disabled
                      onComplete={handleComplete}
                      onDefer={openCommitBox}
                    />
                  ))}
                </View>
              </View>
            ) : null}

            {/* History */}
            {categorized.history.length > 0 ? (
              <View style={styles.section}>
                <SectionHeader
                  eyebrow="History"
                  title="Past routines"
                  subtitle="Completed and inactive rituals for reference."
                />
                <View style={styles.stack}>
                  {categorized.history.map((item) => (
                    <RoutineAssignmentCard
                      key={item.assignment.id}
                      assignment={item.assignment}
                      routine={item.routine}
                      muted
                      disabled
                      onComplete={handleComplete}
                      onDefer={openCommitBox}
                    />
                  ))}
                </View>
              </View>
            ) : null}
          </>
        )}
      </ScreenShell>

      <CommitBoxSheet
        visible={selectedAssignment !== null}
        assignmentName={selectedAssignment?.routine_name || undefined}
        deferReasonCode={deferReasonCode}
        onDeferReasonChange={setDeferReasonCode}
        rescheduleType={rescheduleType}
        onRescheduleTypeChange={setRescheduleType}
        targetAt={targetAt}
        onTargetAtChange={setTargetAt}
        comment={comment}
        onCommentChange={setComment}
        error={error}
        isSubmitting={isSubmitting}
        onClose={closeCommitBox}
        onSubmit={handleSubmitDefer}
      />
    </>
  );
}

const styles = StyleSheet.create({
  introCard: {
    gap: spacing.sm,
  },
  intelligenceCard: {
    gap: spacing.md,
  },
  recoverySummaryCard: {
    gap: spacing.sm,
  },
  introEyebrow: {
    ...typography.eyebrow,
    color: colors.textSecondary,
  },
  introTitle: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  chatBannerText: {
    ...typography.body,
    color: colors.info,
    textAlign: "center",
  },
  introBody: {
    ...typography.body,
    color: colors.textSecondary,
  },
  recoveryFollowUp: {
    ...typography.caption,
    color: colors.warning,
  },
  metaText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  errorText: {
    color: colors.errorDark,
  },
  infoText: {
    color: colors.success,
  },
  retryRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },
  retryText: {
    ...typography.label,
    color: colors.primary,
  },
  subGroupLabel: {
    ...typography.eyebrow,
    color: colors.textSecondary,
    paddingLeft: spacing.xs,
  },
  section: {
    gap: spacing.md,
  },
  stack: {
    gap: spacing.md,
  },
  intelligenceMetrics: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  metricChip: {
    flexGrow: 1,
  },
});
