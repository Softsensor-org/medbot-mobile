import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { borderRadius, colors, spacing, typography } from "../../theme";
import type { RoutineStep } from "../../types/medical";
import { StepStateBadge, type StepState } from "./StepStateBadge";

interface RoutineStepRowProps {
  step: RoutineStep;
  state: StepState;
}

export function RoutineStepRow({ step, state }: RoutineStepRowProps) {
  return (
    <View style={styles.row}>
      <View style={styles.orderWrap}>
        <Text style={styles.orderLabel}>{step.step_order}</Text>
      </View>
      <View style={styles.copy}>
        <View style={styles.copyHeader}>
          <Text style={styles.name}>{step.name}</Text>
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
});
