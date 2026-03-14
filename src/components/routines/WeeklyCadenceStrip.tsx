import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { borderRadius, colors, spacing, typography } from "../../theme";
import type { Routine, RoutineProgressDay } from "../../types/medical";

const WEEK_DAYS = [
  { key: "sunday", label: "S" },
  { key: "monday", label: "M" },
  { key: "tuesday", label: "T" },
  { key: "wednesday", label: "W" },
  { key: "thursday", label: "T" },
  { key: "friday", label: "F" },
  { key: "saturday", label: "S" },
] as const;

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatDayPart(dayPart?: Routine["day_part"]) {
  if (!dayPart) return null;
  return capitalize(dayPart);
}

export interface RoutineCadenceSummary {
  label: string;
  detail: string;
  activeDays: boolean[];
}

export function getRoutineCadenceSummary(routine?: Routine): RoutineCadenceSummary {
  const dayPart = formatDayPart(routine?.day_part);
  const frequency =
    typeof routine?.recurrence?.frequency === "string"
      ? routine.recurrence.frequency.toLowerCase()
      : null;
  const weeklyDay =
    typeof routine?.recurrence?.day === "string"
      ? routine.recurrence.day.toLowerCase()
      : null;

  if (frequency === "daily") {
    return {
      label: "Every day",
      detail: dayPart ? `${dayPart} ritual` : "Daily rhythm",
      activeDays: WEEK_DAYS.map(() => true),
    };
  }

  if (frequency === "weekly") {
    const activeDays = WEEK_DAYS.map((day) => day.key === weeklyDay);
    const weeklyLabel = weeklyDay ? capitalize(weeklyDay) : "Provider-set day";
    return {
      label: "Weekly",
      detail: dayPart ? `${weeklyLabel} · ${dayPart}` : weeklyLabel,
      activeDays,
    };
  }

  return {
    label: dayPart ? `${dayPart}` : "Flexible cadence",
    detail: dayPart ? "Any scheduled day" : "Provider-set sequence",
    activeDays: WEEK_DAYS.map(() => false),
  };
}

function getProgressDayStyle(status: RoutineProgressDay["status"]) {
  switch (status) {
    case "completed":
      return { chip: styles.dayChipCompleted, label: styles.dayLabelCompleted };
    case "partial":
      return { chip: styles.dayChipPartial, label: styles.dayLabelPartial };
    case "skipped":
      return { chip: styles.dayChipSkipped, label: styles.dayLabelSkipped };
    case "missed":
    default:
      return { chip: styles.dayChipIdle, label: styles.dayLabelIdle };
  }
}

interface WeeklyCadenceStripProps {
  routine?: Routine;
  completionByDay?: RoutineProgressDay[];
}

export function WeeklyCadenceStrip({ routine, completionByDay }: WeeklyCadenceStripProps) {
  const cadence = getRoutineCadenceSummary(routine);

  // Build a lookup from day-of-week index to progress status
  const progressByDayIndex = React.useMemo(() => {
    if (!completionByDay || completionByDay.length === 0) return null;
    const map = new Map<number, RoutineProgressDay>();
    for (const day of completionByDay) {
      const date = new Date(day.date + "T00:00:00");
      map.set(date.getDay(), day);
    }
    return map;
  }, [completionByDay]);

  return (
    <View style={styles.wrapper}>
      <View style={styles.copy}>
        <Text style={styles.label}>{cadence.label}</Text>
        <Text style={styles.detail}>{cadence.detail}</Text>
      </View>
      <View style={styles.daysRow}>
        {WEEK_DAYS.map((day, index) => {
          const progressDay = progressByDayIndex?.get(index);
          if (progressDay) {
            const progressStyle = getProgressDayStyle(progressDay.status);
            return (
              <View
                key={day.key}
                style={[styles.dayChip, progressStyle.chip]}
              >
                <Text style={[styles.dayLabel, progressStyle.label]}>
                  {day.label}
                </Text>
              </View>
            );
          }
          const isActive = cadence.activeDays[index];
          return (
            <View
              key={day.key}
              style={[styles.dayChip, isActive ? styles.dayChipActive : styles.dayChipIdle]}
            >
              <Text style={[styles.dayLabel, isActive ? styles.dayLabelActive : styles.dayLabelIdle]}>
                {day.label}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing.sm,
  },
  copy: {
    gap: spacing.xxs,
  },
  label: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  detail: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  daysRow: {
    flexDirection: "row",
    gap: spacing.xs,
  },
  dayChip: {
    width: 28,
    height: 28,
    borderRadius: borderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  dayChipActive: {
    backgroundColor: colors.surfaceStrong,
    borderColor: colors.borderMuted,
  },
  dayChipIdle: {
    backgroundColor: colors.surfaceLight,
    borderColor: colors.borderLight,
  },
  dayLabel: {
    ...typography.caption,
    fontWeight: "700",
  },
  dayLabelActive: {
    color: colors.textPrimary,
  },
  dayLabelIdle: {
    color: colors.textSecondary,
  },
  dayChipCompleted: {
    backgroundColor: colors.successLight,
    borderColor: colors.success,
  },
  dayLabelCompleted: {
    color: colors.textPrimary,
  },
  dayChipPartial: {
    backgroundColor: colors.infoLight,
    borderColor: colors.info,
  },
  dayLabelPartial: {
    color: colors.textPrimary,
  },
  dayChipSkipped: {
    backgroundColor: colors.warningLight,
    borderColor: colors.warning,
  },
  dayLabelSkipped: {
    color: colors.textPrimary,
  },
});
