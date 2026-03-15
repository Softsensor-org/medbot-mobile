import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { borderRadius, colors, spacing, typography } from "../../theme";
import type { Routine, RoutineAssignment, RoutineRecoverySummary, RoutineStepCompletion } from "../../types/medical";
import { HeroSurface } from "../common/HeroSurface";
import { MetricChip } from "../common/MetricChip";
import { PrimaryButton } from "../common/PrimaryButton";
import { SecondaryButton } from "../common/SecondaryButton";
import { SectionHeader } from "../common/SectionHeader";
import { SoftCard } from "../common/SoftCard";
import { RoutineStepRow } from "./RoutineStepRow";
import { StepStateBadge, type StepState } from "./StepStateBadge";
import { WeeklyCadenceStrip, getRoutineCadenceSummary } from "./WeeklyCadenceStrip";

type CardVariant = "featured" | "standard";

function getRecoveryState(assignment: RoutineAssignment): RoutineRecoverySummary["state"] {
  if (assignment.recovery?.state) {
    return assignment.recovery.state;
  }
  if (assignment.status === "deferred") return "deferred";
  if (assignment.status === "completed") return "completed";
  if (assignment.status === "cancelled") return "cancelled";
  return "on_track";
}

function getStatusDetail(assignment: RoutineAssignment) {
  const recoveryState = getRecoveryState(assignment);
  switch (recoveryState) {
    case "completed":
      return {
        label: "Completed",
        summary: "This ritual has already been finished for the current window.",
        metricTone: "success" as const,
      };
    case "snoozed":
      return {
        label: "Snoozed",
        summary: assignment.recovery?.headline ?? "This ritual will come back later in the day.",
        metricTone: "info" as const,
      };
    case "deferred":
      return {
        label: "Deferred",
        summary: assignment.recovery?.headline ?? "A structured defer reason was captured and the next timing was adjusted.",
        metricTone: "warning" as const,
      };
    case "recovery_due":
      return {
        label: "Recovery due",
        summary: assignment.recovery?.headline ?? "Restart gently from the first core step.",
        metricTone: "warning" as const,
      };
    case "cancelled":
      return {
        label: "Inactive",
        summary: "This assignment is no longer actionable.",
        metricTone: "default" as const,
      };
    default:
      return {
        label: "Active",
        summary: "Ready for completion or a structured defer.",
        metricTone: "primary" as const,
      };
  }
}

function getStepState(assignment: RoutineAssignment, index: number): StepState {
  const recoveryState = getRecoveryState(assignment);
  if (recoveryState === "completed") return "completed";
  if (recoveryState === "deferred") return "deferred";
  if (recoveryState === "snoozed") return "snoozed";
  if (recoveryState === "recovery_due") return "recovery";
  if (recoveryState === "cancelled") return "cancelled";
  return index === 0 ? "up-next" : "queued";
}

interface RoutineAssignmentCardProps {
  assignment: RoutineAssignment;
  routine?: Routine;
  variant?: CardVariant;
  disabled?: boolean;
  stepCompletions?: Map<number, RoutineStepCompletion>;
  onStepToggle?: (stepId: number) => void;
  browseOnly?: boolean;
  muted?: boolean;
  onComplete: (assignmentId: number) => void;
  onDefer: (assignment: RoutineAssignment) => void;
}

export function RoutineAssignmentCard({
  assignment,
  routine,
  variant = "standard",
  disabled = false,
  stepCompletions,
  onStepToggle,
  browseOnly = false,
  muted = false,
  onComplete,
  onDefer,
}: RoutineAssignmentCardProps) {
  const status = getStatusDetail(assignment);
  const cadence = getRoutineCadenceSummary(routine);
  const name = assignment.routine_name || routine?.name || `Routine #${assignment.routine_id}`;
  const description =
    assignment.routine_description || routine?.description || status.summary;
  const recovery = assignment.recovery;
  const isActionable = assignment.status !== "completed" && assignment.status !== "cancelled";
  const steps = routine?.steps ?? [];
  const visibleSteps = variant === "featured" ? steps.slice(0, 4) : steps.slice(0, 2);
  const hiddenStepCount = steps.length - visibleSteps.length;
  const actionButtons =
    isActionable && !browseOnly ? (
      <>
        <PrimaryButton
          label="Complete"
          onPress={() => onComplete(assignment.id)}
          disabled={disabled}
          style={styles.actionButton}
          testID={variant === "featured" ? "routine-complete-button" : `routine-complete-button-${assignment.id}`}
        />
        <SecondaryButton
          label="Defer (Commit Box)"
          onPress={() => onDefer(assignment)}
          disabled={disabled}
          style={styles.actionButton}
          testID={variant === "featured" ? "routine-defer-button" : `routine-defer-button-${assignment.id}`}
        />
      </>
    ) : null;

  const stepsBlock = (
    <View style={styles.stepsBlock}>
      <SectionHeader
        eyebrow="Suggested flow"
        title={steps.length > 0 ? `${steps.length} authored step${steps.length === 1 ? "" : "s"}` : "Assignment details"}
        subtitle={steps.length > 0 ? "Sequence only; completion state is tracked at the assignment level." : status.summary}
      />
      {steps.length === 0 ? (
        <Text style={styles.emptyStepText}>Your provider has not added step detail for this routine yet.</Text>
      ) : (
        <>
          {visibleSteps.map((step, index) => {
            const completion = step.id != null ? stepCompletions?.get(step.id) : undefined;
            return (
              <RoutineStepRow
                key={`${assignment.id}-${step.step_order}-${step.name}`}
                step={step}
                state={getStepState(assignment, index)}
                completionState={completion?.state}
                onToggle={isActionable ? onStepToggle : undefined}
              />
            );
          })}
          {hiddenStepCount > 0 ? (
            <Text style={styles.hiddenStepsText}>+{hiddenStepCount} more step{hiddenStepCount === 1 ? "" : "s"} in this routine.</Text>
          ) : null}
        </>
      )}
    </View>
  );

  if (variant === "featured") {
    return (
      <HeroSurface
        eyebrow={status.label}
        title={name}
        subtitle={description}
        metrics={
          <>
            <MetricChip label="Cadence" value={cadence.label} />
            <MetricChip label="Steps" value={`${steps.length}`} tone={steps.length > 0 ? "info" : "default"} />
            <MetricChip label="State" value={status.label} tone={status.metricTone} />
          </>
        }
        actions={actionButtons}
      >
        {recovery && recovery.state !== "on_track" && recovery.state !== "completed" && recovery.state !== "cancelled" ? (
          <SoftCard tone="muted" style={styles.recoveryCard}>
            <Text style={styles.recoveryTitle}>{recovery.headline}</Text>
            <Text style={styles.recoveryDetail}>{recovery.detail}</Text>
            {recovery.provider_follow_up ? (
              <Text style={styles.recoveryFollowUp}>Your care team may review this recovery signal.</Text>
            ) : null}
          </SoftCard>
        ) : null}
        <WeeklyCadenceStrip routine={routine} />
        {stepsBlock}
      </HeroSurface>
    );
  }

  return (
    <SoftCard style={[styles.standardCard, muted && styles.mutedCard]}>
      <View style={styles.standardHeader}>
        <View style={styles.standardCopy}>
          <Text style={styles.cardTitle}>{name}</Text>
          <Text style={styles.cardDescription}>{description}</Text>
          {recovery && recovery.state !== "on_track" && recovery.state !== "completed" && recovery.state !== "cancelled" ? (
            <View style={styles.recoveryInlineBlock}>
              <Text style={styles.recoveryInlineTitle}>{recovery.headline}</Text>
              <Text style={styles.recoveryInlineDetail}>{recovery.detail}</Text>
            </View>
          ) : null}
        </View>
        <StepStateBadge state={getStepState(assignment, 0)} />
      </View>
      <WeeklyCadenceStrip routine={routine} />
      {stepsBlock}
      {actionButtons ? <View style={styles.actionRow}>{actionButtons}</View> : null}
    </SoftCard>
  );
}

const styles = StyleSheet.create({
  standardCard: {
    gap: spacing.md,
  },
  mutedCard: {
    opacity: 0.6,
  },
  recoveryCard: {
    gap: spacing.xs,
  },
  standardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  standardCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  recoveryInlineBlock: {
    marginTop: spacing.xs,
    padding: spacing.sm,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surfaceLight,
    gap: spacing.xs,
  },
  cardTitle: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  cardDescription: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  recoveryTitle: {
    ...typography.label,
    color: colors.textPrimary,
  },
  recoveryDetail: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  recoveryFollowUp: {
    ...typography.caption,
    color: colors.warning,
  },
  recoveryInlineTitle: {
    ...typography.label,
    color: colors.textPrimary,
  },
  recoveryInlineDetail: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  stepsBlock: {
    gap: spacing.sm,
  },
  emptyStepText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surfaceLight,
  },
  hiddenStepsText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  actionRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
  },
});
