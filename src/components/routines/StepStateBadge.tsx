import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { borderRadius, colors, spacing, typography } from "../../theme";

export type StepState =
  | "active"
  | "deferred"
  | "completed"
  | "cancelled"
  | "up-next"
  | "queued";

const stateMeta: Record<
  StepState,
  { label: string; backgroundColor: string; borderColor: string; textColor: string }
> = {
  active: {
    label: "Active",
    backgroundColor: colors.infoLight,
    borderColor: colors.info,
    textColor: colors.textPrimary,
  },
  deferred: {
    label: "Deferred",
    backgroundColor: colors.warningLight,
    borderColor: colors.warning,
    textColor: colors.textPrimary,
  },
  completed: {
    label: "Completed",
    backgroundColor: colors.successLight,
    borderColor: colors.success,
    textColor: colors.textPrimary,
  },
  cancelled: {
    label: "Inactive",
    backgroundColor: colors.surfaceLight,
    borderColor: colors.borderMuted,
    textColor: colors.textSecondary,
  },
  "up-next": {
    label: "Up next",
    backgroundColor: colors.surfaceStrong,
    borderColor: colors.borderMuted,
    textColor: colors.textPrimary,
  },
  queued: {
    label: "Then",
    backgroundColor: colors.surfaceLight,
    borderColor: colors.borderLight,
    textColor: colors.textSecondary,
  },
};

interface StepStateBadgeProps {
  state: StepState;
}

export function StepStateBadge({ state }: StepStateBadgeProps) {
  const meta = stateMeta[state];

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: meta.backgroundColor, borderColor: meta.borderColor },
      ]}
    >
      <Text style={[styles.label, { color: meta.textColor }]}>{meta.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: borderRadius.full,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  label: {
    ...typography.caption,
    fontWeight: "700",
  },
});
