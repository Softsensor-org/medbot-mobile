import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useRoutineAssignments } from "../../../src/hooks/useRoutineAssignments";
import { useCompleteAssignment, useDeferAssignment } from "../../../src/hooks/useRoutineActions";
import { useRoutines } from "../../../src/hooks/useRoutines";
import type { RescheduleIntentType, RoutineAssignment, Routine } from "../../../src/types/medical";
import { colors, spacing, typography } from "../../../src/theme";
import { hapticService } from "../../../src/api/HapticService";
import { useSafetyGate } from "../../../src/hooks/useSafetyGate";
import { SafetyGateOverlay } from "../../../src/components/SafetyGateOverlay";
import { CommitBoxSheet } from "../../../src/components/routines/CommitBoxSheet";
import { RoutineAssignmentCard } from "../../../src/components/routines/RoutineAssignmentCard";
import { EmptyStateCard } from "../../../src/components/common/EmptyStateCard";
import { ScreenShell } from "../../../src/components/common/ScreenShell";
import { SectionHeader } from "../../../src/components/common/SectionHeader";
import { SoftCard } from "../../../src/components/common/SoftCard";

interface EnrichedAssignment {
  assignment: RoutineAssignment;
  routine?: Routine;
}

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

export default function RoutinesScreen() {
  const { from_chat } = useLocalSearchParams<{ from_chat?: string }>();
  const { data: assignments = [], isLoading, error: assignmentError } = useRoutineAssignments();
  const { data: routines = [], error: routinesError } = useRoutines();
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

  const activeAssignments = enrichedAssignments.filter((item) => item.assignment.status === "active");
  const recentAssignments = enrichedAssignments.filter((item) => item.assignment.status !== "active");
  const featuredAssignment = activeAssignments[0] ?? recentAssignments[0] ?? null;
  const featuredId = featuredAssignment?.assignment.id ?? null;
  const queuedActiveAssignments = activeAssignments.filter((item) => item.assignment.id !== featuredId);
  const secondaryRecentAssignments = recentAssignments.filter((item) => item.assignment.id !== featuredId);

  const isSafetyBlocked = !isLoadingSafety && !safety.isSafe && safety.reason !== "low_confidence";

  const handleComplete = useCallback(
    (assignmentId: number) => {
      setError(null);
      setInfo(null);
      hapticService.triggerWarning();
      completeMutation.mutate(
        {
          assignmentId,
          payload: {
            action: "complete",
            timezone: timeZone,
            completed_at: new Date().toISOString(),
            completion_rate: 1.0,
          },
        },
        {
          onSuccess: (result) => {
            hapticService.triggerSuccess();
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
    [completeMutation, timeZone],
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
    deferMutation.mutate(
      {
        assignmentId: selectedAssignment.id,
        payload: {
          action: "defer",
          defer_reason_code: deferReasonCode,
          comment: comment.trim() || undefined,
          reschedule_intent: {
            type: rescheduleType,
            target_at: rescheduleType === "specific_time" ? targetAt.trim() : undefined,
          },
        },
      },
      {
        onSuccess: (result) => {
          hapticService.triggerSuccess();
          setInfo(
            result?.mode === "queued"
              ? "Routine defer queued offline and will sync automatically."
              : "Routine deferred with commit details.",
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
                Complete the current ritual from the hero card or open the Commit Box to document a structured reschedule.
              </Text>
            </SoftCard>

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

            {!isLoading && !loadError && !featuredAssignment ? (
              <EmptyStateCard
                title="No rituals are ready right now"
                description="Your care team has not assigned an active routine yet. When one is ready, it will appear here with the full completion and defer workflow."
                testID="routine-empty-state"
              />
            ) : null}

            {featuredAssignment ? (
              <View style={styles.section}>
                <SectionHeader
                  eyebrow={featuredAssignment.assignment.status === "active" ? "Current focus" : "Latest state"}
                  title={
                    featuredAssignment.assignment.status === "active"
                      ? "Ready to act"
                      : "No active ritual is waiting right now"
                  }
                  subtitle={
                    featuredAssignment.assignment.status === "active"
                      ? "The hero card keeps the next assignment, cadence, and authored steps in one place."
                      : "The latest assignment state stays visible until the next active ritual is available."
                  }
                />
                <RoutineAssignmentCard
                  assignment={featuredAssignment.assignment}
                  routine={featuredAssignment.routine}
                  variant="featured"
                  disabled={isSubmitting}
                  onComplete={handleComplete}
                  onDefer={openCommitBox}
                />
              </View>
            ) : null}

            {queuedActiveAssignments.length > 0 ? (
              <View style={styles.section}>
                <SectionHeader
                  eyebrow="More active routines"
                  title="Queued assignments"
                  subtitle="The same workflow, with lighter framing for secondary routines."
                />
                <View style={styles.stack}>
                  {queuedActiveAssignments.map((item) => (
                    <RoutineAssignmentCard
                      key={item.assignment.id}
                      assignment={item.assignment}
                      routine={item.routine}
                      disabled={isSubmitting}
                      onComplete={handleComplete}
                      onDefer={openCommitBox}
                    />
                  ))}
                </View>
              </View>
            ) : null}

            {secondaryRecentAssignments.length > 0 ? (
              <View style={styles.section}>
                <SectionHeader
                  eyebrow="Recent states"
                  title="Completed and deferred rituals"
                  subtitle="Visual confirmation of the latest assignment state without changing the current routine workflow."
                />
                <View style={styles.stack}>
                  {secondaryRecentAssignments.map((item) => (
                    <RoutineAssignmentCard
                      key={item.assignment.id}
                      assignment={item.assignment}
                      routine={item.routine}
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
  section: {
    gap: spacing.md,
  },
  stack: {
    gap: spacing.md,
  },
});
