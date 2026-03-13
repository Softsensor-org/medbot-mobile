import React from "react";
import { Modal, StyleSheet, Text, TextInput, View } from "react-native";
import { parseISO, isValid } from "date-fns";
import { borderRadius, colors, spacing, typography } from "../../theme";
import type { RescheduleIntentType } from "../../types/medical";
import { ChipSelect } from "../common/ChipSelect";
import { NativeDateTimePicker } from "../common/NativeDateTimePicker";
import { PrimaryButton } from "../common/PrimaryButton";
import { SecondaryButton } from "../common/SecondaryButton";

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

interface CommitBoxSheetProps {
  visible: boolean;
  assignmentName?: string;
  deferReasonCode: string;
  onDeferReasonChange: (value: string) => void;
  rescheduleType: RescheduleIntentType;
  onRescheduleTypeChange: (value: RescheduleIntentType) => void;
  targetAt: string;
  onTargetAtChange: (value: string) => void;
  comment: string;
  onCommentChange: (value: string) => void;
  error?: string | null;
  isSubmitting?: boolean;
  onClose: () => void;
  onSubmit: () => void;
}

export function CommitBoxSheet({
  visible,
  assignmentName,
  deferReasonCode,
  onDeferReasonChange,
  rescheduleType,
  onRescheduleTypeChange,
  targetAt,
  onTargetAtChange,
  comment,
  onCommentChange,
  error,
  isSubmitting = false,
  onClose,
  onSubmit,
}: CommitBoxSheetProps) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.title}>Commit Box</Text>
          <Text style={styles.subtitle}>
            Capture a structured defer reason and reschedule intent
            {assignmentName ? ` for ${assignmentName}.` : "."}
          </Text>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <ChipSelect
            label="Defer reason"
            options={deferOptions}
            selectedValue={deferReasonCode}
            onSelect={onDeferReasonChange}
            horizontal={false}
          />

          <ChipSelect
            label="Reschedule intent"
            options={rescheduleOptions}
            selectedValue={rescheduleType}
            onSelect={(value) => onRescheduleTypeChange(value as RescheduleIntentType)}
            horizontal={false}
          />

          {rescheduleType === "specific_time" ? (
            <NativeDateTimePicker
              label="Target time"
              mode="datetime"
              value={isValid(parseISO(targetAt)) ? parseISO(targetAt) : new Date()}
              onChange={(date) => onTargetAtChange(date.toISOString())}
              testID="routine-target-time-picker"
            />
          ) : null}

          <Text style={styles.label}>Comment (optional)</Text>
          <TextInput
            value={comment}
            onChangeText={onCommentChange}
            placeholder="Add context for your provider"
            placeholderTextColor={colors.textSecondary}
            style={styles.input}
            multiline
            testID="routine-comment-input"
          />

          <View style={styles.actions}>
            <SecondaryButton
              label="Cancel"
              onPress={onClose}
              disabled={isSubmitting}
              style={styles.actionButton}
              testID="routine-cancel-button"
            />
            <PrimaryButton
              label="Submit defer"
              onPress={onSubmit}
              disabled={isSubmitting}
              style={styles.actionButton}
              testID="routine-submit-defer-button"
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: colors.overlay,
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.xxl,
    borderTopRightRadius: borderRadius.xxl,
    padding: spacing.lg,
    gap: spacing.md,
  },
  title: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
  },
  error: {
    ...typography.bodySmall,
    color: colors.errorDark,
  },
  label: {
    ...typography.label,
    color: colors.textPrimary,
  },
  input: {
    minHeight: 88,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.borderMuted,
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    textAlignVertical: "top",
    color: colors.textPrimary,
    ...typography.body,
  },
  actions: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
  },
});
