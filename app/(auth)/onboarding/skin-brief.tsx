import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { colors, typography, spacing } from "../../../src/theme";
import { useOnboardingBrief, useUpdateOnboardingBrief } from "../../../src/hooks/useUser";
import { showToast } from "../../../src/providers/ToastProvider";
import { ChipSelect } from "../../../src/components/common/ChipSelect";

const GOAL_OPTIONS = [
  { value: "Anti-aging", label: "Anti-aging" },
  { value: "Acne control", label: "Acne control" },
  { value: "Dark spots", label: "Dark spots" },
  { value: "Redness", label: "Redness" },
  { value: "Texture", label: "Texture" },
  { value: "Hydration", label: "Hydration" },
  { value: "Pore size", label: "Pore size" },
];

export default function SkinBriefScreen() {
  const router = useRouter();
  const { data: brief, isLoading } = useOnboardingBrief();
  const { mutate: updateBrief, isPending } = useUpdateOnboardingBrief();

  const [goals, setGoals] = useState<string[]>([]);
  const [baseline, setBaseline] = useState("");
  const [climate, setClimate] = useState("");
  const [lifestyle, setLifestyle] = useState("");

  useEffect(() => {
    if (brief) {
      setGoals(brief.goals || []);
      setBaseline(brief.baseline || "");
      setClimate(brief.climate_lifestyle?.split(" - ")[0] || "");
      setLifestyle(brief.climate_lifestyle?.split(" - ")[1] || "");
    }
  }, [brief]);

  const handleGoalSelect = (goal: string) => {
    if (goals.includes(goal)) {
      setGoals(goals.filter((g) => g !== goal));
    } else {
      setGoals([...goals, goal]);
    }
  };

  const handleSave = () => {
    updateBrief(
      {
        goals,
        baseline,
        climate_lifestyle: `${climate}${lifestyle ? ` - ${lifestyle}` : ""}`,
      },
      {
        onSuccess: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          showToast("success", "Saved", "Skin brief updated successfully");
          router.back();
        },
        onError: (err) => {
          showToast("error", "Error", err instanceof Error ? err.message : "Failed to update brief");
        },
      }
    );
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Your Skin Brief</Text>
        <Text style={styles.subtitle}>Help us understand your baseline and goals.</Text>
      </View>

      <ChipSelect
        label="What are your skin goals?"
        options={GOAL_OPTIONS}
        selectedValue={null}
        selectedValues={goals}
        onSelect={handleGoalSelect}
        multiSelect={true}
        horizontal={false}
      />

      <View style={styles.section}>
        <Text style={styles.label}>Current Skin Baseline</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Dry, sensitive, occasional hormonal acne"
          value={baseline}
          onChangeText={setBaseline}
          multiline
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Climate Context</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Dry/cold winter, high humidity summer"
          value={climate}
          onChangeText={setClimate}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Lifestyle Factors</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Frequent travel, high stress, outdoor worker"
          value={lifestyle}
          onChangeText={setLifestyle}
        />
      </View>

      <TouchableOpacity
        style={[styles.saveButton, isPending && styles.disabled]}
        onPress={handleSave}
        disabled={isPending}
      >
        {isPending ? (
          <ActivityIndicator color={colors.surface} />
        ) : (
          <Text style={styles.saveButtonText}>Save Skin Brief</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xl * 2,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    marginBottom: spacing.xl,
  },
  title: {
    ...typography.h2,
    color: colors.textPrimary,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  section: {
    marginBottom: spacing.xl,
  },
  label: {
    ...typography.label,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: spacing.md,
    ...typography.body,
    minHeight: 50,
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: spacing.md,
    alignItems: "center",
    marginTop: spacing.lg,
  },
  disabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    ...typography.button,
    color: colors.surface,
  },
});
