import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { borderRadius, colors, spacing, typography } from "../../theme";
import type { RoutineStep } from "../../types/medical";
import { StepStateBadge, type StepState } from "./StepStateBadge";

type CompletionState = "completed" | "skipped" | "pending";

interface RoutineStepRowProps {
  step: RoutineStep;
  state: StepState;
  completionState?: CompletionState;
  onToggle?: (stepId: number) => void;
}

export function RoutineStepRow({ step, state, completionState, onToggle }: RoutineStepRowProps) {
  const isToggleable = onToggle != null && step.id != null;
  const showCheckbox = completionState != null;

  return (
    <View style={styles.row}>
      {showCheckbox ? (
        <Pressable
          onPress={isToggleable ? () => onToggle(step.id!) : undefined}
          style={[
            styles.checkbox,
            completionState === "completed" && styles.checkboxCompleted,
            completionState === "skipped" && styles.checkboxSkipped,
          ]}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: completionState === "completed" }}
          testID={`step-toggle-${step.id ?? step.step_order}`}
        >
          {completionState === "completed" ? (
            <Text style={styles.checkmark}>✓</Text>
          ) : completionState === "skipped" ? (
            <Text style={styles.skipMark}>–</Text>
          ) : null}
        </Pressable>
      ) : (
        <View style={styles.orderWrap}>
          <Text style={styles.orderLabel}>{step.step_order}</Text>
        </View>
      )}
      <View style={styles.copy}>
        <View style={styles.copyHeader}>
          <Text style={[styles.name, completionState === "completed" && styles.nameCompleted]}>
            {step.name}
          </Text>
          <StepStateBadge state={state} />
        </View>
        {step.description ? <Text style={styles.description}>{step.description}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  orderWrap: {
    width: 30,
    height: 30,
    borderRadius: borderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceStrong,
  },
  orderLabel: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  copy: {
    flex: 1,
    gap: spacing.xs,
  },
  copyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  name: {
    flex: 1,
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  description: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  checkbox: {
    width: 30,
    height: 30,
    borderRadius: borderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.borderMuted,
    backgroundColor: colors.surfaceLight,
  },
  checkboxCompleted: {
    backgroundColor: colors.successLight,
    borderColor: colors.success,
  },
  checkboxSkipped: {
    backgroundColor: colors.warningLight,
    borderColor: colors.warning,
  },
  checkmark: {
    ...typography.bodyStrong,
    color: colors.success,
    fontSize: 16,
  },
  skipMark: {
    ...typography.bodyStrong,
    color: colors.warning,
    fontSize: 16,
  },
  nameCompleted: {
    textDecorationLine: "line-through",
    color: colors.textSecondary,
  },
});
