import React from "react";
import { StyleSheet, Text, View } from "react-native";
import type { PreferenceProfile } from "../../types/user";
import { borderRadius, colors, spacing, typography } from "../../theme";
import { SectionHeader } from "../common/SectionHeader";
import { SecondaryButton } from "../common/SecondaryButton";
import { SoftCard } from "../common/SoftCard";

function titleize(value: string) {
  return value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function summarizeList(values?: string[]) {
  if (!values || values.length === 0) {
    return "Not set yet";
  }
  if (values.length <= 2) {
    return values.join(", ");
  }
  return `${values.slice(0, 2).join(", ")} +${values.length - 2} more`;
}

interface ProfilePreferenceSummaryProps {
  preferenceProfile?: PreferenceProfile | null;
  onEditPreferences: () => void;
  onEditBrief: () => void;
  onEditGoal: () => void;
}

export function ProfilePreferenceSummary({
  preferenceProfile,
  onEditPreferences,
  onEditBrief,
  onEditGoal,
}: ProfilePreferenceSummaryProps) {
  const essential = preferenceProfile?.essential;

  return (
    <SoftCard style={styles.card}>
      <SectionHeader
        eyebrow="Preferences snapshot"
        title="What your care plan is tuned for"
        subtitle="These are the current settings already shaping your routines and guidance."
      />

      <View style={styles.grid}>
        <View style={styles.cell}>
          <Text style={styles.label}>Goals</Text>
          <Text style={styles.value}>{summarizeList(essential?.goals)}</Text>
        </View>
        <View style={styles.cell}>
          <Text style={styles.label}>Budget</Text>
          <Text style={styles.value}>{essential?.budget ? titleize(essential.budget) : "Not set yet"}</Text>
        </View>
        <View style={styles.cell}>
          <Text style={styles.label}>Routine depth</Text>
          <Text style={styles.value}>
            {essential?.routine_depth ? titleize(essential.routine_depth) : "Not set yet"}
          </Text>
        </View>
        <View style={styles.cell}>
          <Text style={styles.label}>Treatment comfort</Text>
          <Text style={styles.value}>
            {essential?.treatment_modality_comfort
              ? titleize(essential.treatment_modality_comfort)
              : "Not set yet"}
          </Text>
        </View>
        <View style={styles.fullCell}>
          <Text style={styles.label}>Avoid list</Text>
          <Text style={styles.value}>{summarizeList(essential?.avoid_list)}</Text>
        </View>
      </View>

      <View style={styles.actions}>
        <SecondaryButton label="Treatment Preferences" onPress={onEditPreferences} style={styles.action} />
        <SecondaryButton label="Skin Brief" onPress={onEditBrief} style={styles.action} />
        <SecondaryButton label="Skin Goal" onPress={onEditGoal} style={styles.action} />
      </View>
    </SoftCard>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.md,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  cell: {
    flexBasis: "48%",
    flexGrow: 1,
    minWidth: 140,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surfaceLight,
    gap: spacing.xxs,
  },
  fullCell: {
    width: "100%",
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surfaceLight,
    gap: spacing.xxs,
  },
  label: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  value: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  actions: {
    gap: spacing.sm,
  },
  action: {
    width: "100%",
  },
});
