import React, { useCallback, useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useRoutineAssignments } from "../../../src/hooks/useRoutineAssignments";
import { useCompleteAssignment, useDeferAssignment } from "../../../src/hooks/useRoutineActions";
import type { RescheduleIntentType, RoutineAssignment } from "../../../src/types/medical";
import { colors, typography, spacing } from "../../../src/theme";
import { NativeDateTimePicker } from "../../../src/components/common/NativeDateTimePicker";
import { parseISO, isValid } from "date-fns";
import { ChipSelect } from "../../../src/components/common/ChipSelect";
import { hapticService } from "../../../src/api/HapticService";
import { useSafetyGate } from "../../../src/hooks/useSafetyGate";
import { SafetyGateOverlay } from "../../../src/components/SafetyGateOverlay";

export default function RoutinesScreen() {
  const { data: assignments = [], isLoading, error: queryError } = useRoutineAssignments();
  const completeMutation = useCompleteAssignment();
  const deferMutation = useDeferAssignment();
  const { safety, isLoading: isLoadingSafety } = useSafetyGate();

  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [selectedAssignment, setSelectedAssignment] = useState<RoutineAssignment | null>(null);
  const [deferReasonCode, setDeferReasonCode] = useState("too_busy");
  const [rescheduleType, setRescheduleType] = useState<RescheduleIntentType>("later_today");
  const [targetAt, setTargetAt] = useState("");
  const [comment, setComment] = useState("");

  const timeZone = useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC", []);

  const isSubmitting = completeMutation.isPending || deferMutation.isPending;

  const loadError = queryError instanceof Error ? queryError.message : queryError ? "Failed to load routines" : null;

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
    setInfo(null);
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

  const activeAssignments = assignments.filter((item) => item.status === "active");

  const deferOptions = [
    { value: "too_busy", label: "Too busy" },
    { value: "waiting_for_product", label: "Waiting for product" },
    { value: "skin_irritated", label: "Skin irritated" },
    { value: "travel", label: "Travel" },
  ];

  const rescheduleOptions = [
    { value: "later_today", label: "Later today" },
    { value: "tomorrow", label: "Tomorrow" },
    { value: "skip_for_now", label: "Skip for now" },
    { value: "specific_time", label: "Specific time" },
  ];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Routines</Text>
      
      {!safety.isSafe && safety.reason !== 'low_confidence' ? (
        <SafetyGateOverlay safety={safety} />
      ) : (
        <>
          <Text style={styles.placeholder}>
            Right action completes the assignment. Left action opens the Commit Box for structured defer + reschedule.
          </Text>

          {(isLoading || isLoadingSafety) ? <Text style={styles.metaText}>Loading assignments...</Text> : null}
          {(error || loadError) ? <Text style={[styles.metaText, styles.error]}>{error || loadError}</Text> : null}
          {info ? <Text style={[styles.metaText, styles.info]}>{info}</Text> : null}

          {((completeMutation.syncStatus && completeMutation.syncStatus !== "idle") ||
            (deferMutation.syncStatus && deferMutation.syncStatus !== "idle")) ? (
            <View style={styles.syncBanner} testID="routine-sync-status">
              <Text style={styles.metaText}>
                {completeMutation.syncStatus === "queued" || deferMutation.syncStatus === "queued"
                  ? "A routine action is queued for sync."
                  : null}
                {completeMutation.syncStatus === "syncing" || deferMutation.syncStatus === "syncing"
                  ? "Syncing routine actions..."
                  : null}
                {completeMutation.syncStatus === "synced" || deferMutation.syncStatus === "synced"
                  ? "Routine sync complete."
                  : null}
                {completeMutation.syncStatus === "failed" || deferMutation.syncStatus === "failed"
                  ? "Routine sync failed. Retry."
                  : null}
              </Text>
              {completeMutation.syncStatus === "failed" && (
                <Pressable onPress={() => void completeMutation.retrySync()} testID="routine-complete-sync-retry-button">
                  <Text style={styles.retryText}>Retry complete sync</Text>
                </Pressable>
              )}
              {deferMutation.syncStatus === "failed" && (
                <Pressable onPress={() => void deferMutation.retrySync()} testID="routine-defer-sync-retry-button">
                  <Text style={styles.retryText}>Retry defer sync</Text>
                </Pressable>
              )}
              {completeMutation.syncError ? <Text style={[styles.metaText, styles.error]}>{completeMutation.syncError}</Text> : null}
              {deferMutation.syncError ? <Text style={[styles.metaText, styles.error]}>{deferMutation.syncError}</Text> : null}
            </View>
          ) : null}

          {!isLoading && activeAssignments.length === 0 ? (
            <Text style={styles.metaText}>No active routine assignments.</Text>
          ) : null}

          {activeAssignments.map((assignment) => (
            <View key={assignment.id} style={styles.card}>
              <Text style={styles.cardTitle}>{assignment.routine_name || `Routine #${assignment.routine_id}`}</Text>
              {assignment.routine_description ? (
                <Text style={styles.cardSubtitle}>{assignment.routine_description}</Text>
              ) : null}
              <View style={styles.actionsRow}>
                <Pressable
                  style={[styles.button, styles.completeButton, isSubmitting && styles.buttonDisabled]}
                  disabled={isSubmitting}
                  onPress={() => handleComplete(assignment.id)}
                  testID="routine-complete-button"
                >
                  <Text style={styles.buttonText}>Complete</Text>
                </Pressable>
                <Pressable
                  style={[styles.button, styles.deferButton, isSubmitting && styles.buttonDisabled]}
                  disabled={isSubmitting}
                  onPress={() => openCommitBox(assignment)}
                  testID="routine-defer-button"
                >
                  <Text style={styles.buttonText}>Defer (Commit Box)</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </>
      )}

      <Modal visible={selectedAssignment !== null} animationType="slide" transparent onRequestClose={closeCommitBox}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Commit Box</Text>
            <Text style={styles.modalHint}>Capture a structured defer reason and reschedule intent.</Text>

            <ChipSelect
              label="Defer reason"
              options={deferOptions}
              selectedValue={deferReasonCode}
              onSelect={(val) => setDeferReasonCode(val)}
              horizontal={false}
            />

            <ChipSelect
              label="Reschedule intent"
              options={rescheduleOptions}
              selectedValue={rescheduleType}
              onSelect={(val) => setRescheduleType(val)}
              horizontal={false}
            />

            {rescheduleType === "specific_time" ? (
              <NativeDateTimePicker
                label="Target time"
                mode="datetime"
                value={isValid(parseISO(targetAt)) ? parseISO(targetAt) : new Date()}
                onChange={(date) => setTargetAt(date.toISOString())}
                testID="routine-target-time-picker"
              />
            ) : null}

            <Text style={styles.label}>Comment (optional)</Text>
            <TextInput
              value={comment}
              onChangeText={setComment}
              placeholder="Add context for your provider"
              placeholderTextColor={colors.textSecondary}
              style={[styles.input, styles.textArea]}
              multiline
              testID="routine-comment-input"
            />

            <View style={styles.actionsRow}>
              <Pressable style={[styles.button, styles.cancelButton]} onPress={closeCommitBox} disabled={isSubmitting} testID="routine-cancel-button">
                <Text style={styles.buttonText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.button, styles.deferButton, isSubmitting && styles.buttonDisabled]}
                onPress={handleSubmitDefer}
                disabled={isSubmitting}
                testID="routine-submit-defer-button"
              >
                <Text style={styles.buttonText}>Submit defer</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    backgroundColor: colors.background,
    gap: spacing.md,
  },
  title: {
    ...typography.h2,
    color: colors.textPrimary,
  },
  placeholder: {
    ...typography.body,
    color: colors.textSecondary,
  },
  metaText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  error: {
    color: colors.errorDark,
  },
  info: {
    color: colors.teal,
  },
  syncBanner: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: spacing.sm,
    gap: spacing.xs,
  },
  retryText: {
    ...typography.label,
    color: colors.primary,
  },
  card: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: spacing.md,
    backgroundColor: colors.surface,
    gap: spacing.sm,
  },
  cardTitle: {
    ...typography.label,
    color: colors.textPrimary,
  },
  cardSubtitle: {
    ...typography.body,
    color: colors.textSecondary,
  },
  actionsRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  button: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
    minWidth: 120,
    alignItems: "center",
  },
  completeButton: {
    backgroundColor: colors.teal,
  },
  deferButton: {
    backgroundColor: colors.amber,
  },
  cancelButton: {
    backgroundColor: colors.slate,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: colors.surface,
    ...typography.button,
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: colors.overlay,
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  modalTitle: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  modalHint: {
    ...typography.body,
    color: colors.textSecondary,
  },
  label: {
    ...typography.label,
    color: colors.textPrimary,
    marginTop: spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.borderMuted,
    borderRadius: 8,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    color: colors.textPrimary,
    ...typography.body,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: "top",
  },
});
