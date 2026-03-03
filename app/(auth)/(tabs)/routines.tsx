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

export default function RoutinesScreen() {
  const { data: assignments = [], isLoading, error: queryError } = useRoutineAssignments();
  const completeMutation = useCompleteAssignment();
  const deferMutation = useDeferAssignment();

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
          onSuccess: () => setInfo("Routine marked complete."),
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
        onSuccess: () => {
          setInfo("Routine deferred with commit details.");
          setSelectedAssignment(null);
        },
        onError: (err) => setError(err instanceof Error ? err.message : "Unable to defer routine"),
      },
    );
  }, [comment, deferMutation, deferReasonCode, rescheduleType, selectedAssignment, targetAt]);

  const activeAssignments = assignments.filter((item) => item.status === "active");

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Routines</Text>
      <Text style={styles.placeholder}>
        Right action completes the assignment. Left action opens the Commit Box for structured defer + reschedule.
      </Text>

      {isLoading ? <Text style={styles.metaText}>Loading assignments...</Text> : null}
      {(error || loadError) ? <Text style={[styles.metaText, styles.error]}>{error || loadError}</Text> : null}
      {info ? <Text style={[styles.metaText, styles.info]}>{info}</Text> : null}

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

      <Modal visible={selectedAssignment !== null} animationType="slide" transparent onRequestClose={closeCommitBox}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Commit Box</Text>
            <Text style={styles.modalHint}>Capture a structured defer reason and reschedule intent.</Text>

            <Text style={styles.label}>Defer reason</Text>
            <View style={styles.chipsRow}>
              {[
                { code: "too_busy", label: "Too busy" },
                { code: "waiting_for_product", label: "Waiting for product" },
                { code: "skin_irritated", label: "Skin irritated" },
                { code: "travel", label: "Travel" },
              ].map((option) => (
                <Pressable
                  key={option.code}
                  onPress={() => setDeferReasonCode(option.code)}
                  style={[styles.chip, deferReasonCode === option.code && styles.chipSelected]}
                >
                  <Text style={styles.chipText}>{option.label}</Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.label}>Reschedule intent</Text>
            <View style={styles.chipsRow}>
              {[
                { value: "later_today" as const, label: "Later today" },
                { value: "tomorrow" as const, label: "Tomorrow" },
                { value: "skip_for_now" as const, label: "Skip for now" },
                { value: "specific_time" as const, label: "Specific time" },
              ].map((option) => (
                <Pressable
                  key={option.value}
                  onPress={() => setRescheduleType(option.value)}
                  style={[styles.chip, rescheduleType === option.value && styles.chipSelected]}
                >
                  <Text style={styles.chipText}>{option.label}</Text>
                </Pressable>
              ))}
            </View>

            {rescheduleType === "specific_time" ? (
              <>
                <Text style={styles.label}>Target ISO time</Text>
                <TextInput
                  value={targetAt}
                  onChangeText={setTargetAt}
                  placeholder="2026-02-26T09:00:00Z"
                  placeholderTextColor={colors.textSecondary}
                  style={styles.input}
                  autoCapitalize="none"
                  testID="routine-target-time-input"
                />
              </>
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
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  chip: {
    borderWidth: 1,
    borderColor: colors.borderMuted,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: colors.surfaceLight,
  },
  chipSelected: {
    borderColor: colors.teal,
    backgroundColor: colors.tealLight,
  },
  chipText: {
    ...typography.caption,
    color: colors.textPrimary,
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
