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
import { usePreferenceProfile, useUpdatePreferenceProfile } from "../../../src/hooks/useUser";
import { 
  BudgetPreference, 
  RoutineDepthPreference, 
  TreatmentModalityPreference 
} from "../../../src/types/user";
import { showToast } from "../../../src/providers/ToastProvider";
import { ChipSelect } from "../../../src/components/common/ChipSelect";

const BUDGET_OPTIONS: { value: BudgetPreference; label: string }[] = [
  { value: "low", label: "Budget-friendly" },
  { value: "medium", label: "Moderate" },
  { value: "high", label: "Premium / No limit" },
];

const DEPTH_OPTIONS: { value: RoutineDepthPreference; label: string }[] = [
  { value: "minimal", label: "Minimal (1-2 steps)" },
  { value: "moderate", label: "Moderate (3-5 steps)" },
  { value: "intensive", label: "Intensive (6+ steps)" },
];

const MODALITY_OPTIONS: { value: TreatmentModalityPreference; label: string }[] = [
  { value: "clinical-only", label: "Dermatologist-led" },
  { value: "home-only", label: "At-home / OTC only" },
  { value: "hybrid", label: "Hybrid approach" },
];

export default function PreferencesScreen() {
  const router = useRouter();
  const { data: profile, isLoading } = usePreferenceProfile();
  const { mutate: updateProfile, isPending } = useUpdatePreferenceProfile();

  const [budget, setBudget] = useState<BudgetPreference>("medium");
  const [depth, setDepth] = useState<RoutineDepthPreference>("moderate");
  const [modality, setModality] = useState<TreatmentModalityPreference>("hybrid");
  const [avoidList, setAvoidList] = useState("");

  useEffect(() => {
    if (profile?.essential) {
      setBudget(profile.essential.budget || "medium");
      setDepth(profile.essential.routine_depth || "moderate");
      setModality(profile.essential.treatment_modality_comfort || "hybrid");
      setAvoidList(profile.essential.avoid_list?.join(", ") || "");
    }
  }, [profile]);

  const handleSave = () => {
    const avoid_list = avoidList
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    updateProfile(
      {
        essential: {
          budget,
          routine_depth: depth,
          treatment_modality_comfort: modality,
          avoid_list,
          goals: profile?.essential?.goals || [],
        },
      },
      {
        onSuccess: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          showToast("success", "Saved", "Preferences updated successfully");
          router.back();
        },
        onError: (err) => {
          showToast("error", "Error", err instanceof Error ? err.message : "Failed to update preferences");
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
        <Text style={styles.title}>Your Preferences</Text>
        <Text style={styles.subtitle}>Customize how we recommend treatments and products.</Text>
      </View>

      <ChipSelect
        label="Product Budget"
        options={BUDGET_OPTIONS}
        selectedValue={budget}
        onSelect={(val) => setBudget(val)}
        horizontal={false}
      />

      <ChipSelect
        label="Routine Depth"
        options={DEPTH_OPTIONS}
        selectedValue={depth}
        onSelect={(val) => setDepth(val)}
        horizontal={false}
      />

      <ChipSelect
        label="Treatment Comfort Level"
        options={MODALITY_OPTIONS}
        selectedValue={modality}
        onSelect={(val) => setModality(val)}
        horizontal={false}
      />

      <View style={styles.section}>
        <Text style={styles.label}>Ingredient Avoid-List</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Fragrance, Alcohol, Parabens"
          value={avoidList}
          onChangeText={setAvoidList}
          multiline
        />
        <Text style={styles.hint}>Separate ingredients with commas.</Text>
      </View>

      <TouchableOpacity
        style={[styles.saveButton, isPending && styles.disabled]}
        onPress={handleSave}
        disabled={isPending}
      >
        {isPending ? (
          <ActivityIndicator color={colors.surface} />
        ) : (
          <Text style={styles.saveButtonText}>Save Preferences</Text>
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
  hint: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
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
