import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { borderRadius, colors, spacing, typography } from "../../theme";
import type { Routine, RoutineAssignment, RoutineStepCompletion } from "../../types/medical";
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

function getStatusDetail(status: RoutineAssignment["status"]) {
  switch (status) {
    case "completed":
      return {
        label: "Completed",
        summary: "This ritual has already been finished for the current window.",
        metricTone: "success" as const,
      };
    case "deferred":
      return {
        label: "Deferred",
        summary: "A structured defer reason was captured and the next timing was adjusted.",
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

function getStepState(status: RoutineAssignment["status"], index: number): StepState {
  if (status === "completed") return "completed";
  if (status === "deferred") return "deferred";
  if (status === "cancelled") return "cancelled";
  return index === 0 ? "up-next" : "queued";
}

interface RoutineAssignmentCardProps {
  assignment: RoutineAssignment;
  routine?: Routine;
  variant?: CardVariant;
  disabled?: boolean;
  stepCompletions?: Map<number, RoutineStepCompletion>;
  onStepToggle?: (stepId: number) => void;
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
  onComplete,
  onDefer,
}: RoutineAssignmentCardProps) {
  const status = getStatusDetail(assignment.status);
  const cadence = getRoutineCadenceSummary(routine);
  const name = assignment.routine_name || routine?.name || `Routine #${assignment.routine_id}`;
  const description =
    assignment.routine_description || routine?.description || status.summary;
  const steps = routine?.steps ?? [];
  const visibleSteps = variant === "featured" ? steps.slice(0, 4) : steps.slice(0, 2);
  const hiddenStepCount = steps.length - visibleSteps.length;
  const actionButtons =
    assignment.status === "active" ? (
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
                state={getStepState(assignment.status, index)}
                completionState={completion?.state}
                onToggle={assignment.status === "active" ? onStepToggle : undefined}
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
        <WeeklyCadenceStrip routine={routine} />
        {stepsBlock}
      </HeroSurface>
    );
  }

  return (
    <SoftCard style={styles.standardCard}>
      <View style={styles.standardHeader}>
        <View style={styles.standardCopy}>
          <Text style={styles.cardTitle}>{name}</Text>
          <Text style={styles.cardDescription}>{description}</Text>
        </View>
        <StepStateBadge state={assignment.status === "active" ? "active" : getStepState(assignment.status, 0)} />
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
  cardTitle: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  cardDescription: {
    ...typography.bodySmall,
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
