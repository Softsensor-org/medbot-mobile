import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Switch,
} from "react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { colors, typography, spacing } from "../../../src/theme";
import { usePreferenceProfile, useUpdatePreferenceProfile } from "../../../src/hooks/useUser";
import { 
  BudgetPreference, 
  ReminderCadence,
  RoutineDepthPreference, 
  ShoppingPreference,
  TexturePreference,
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

const TEXTURE_OPTIONS: { value: TexturePreference; label: string }[] = [
  { value: "gel", label: "Gel" },
  { value: "cream", label: "Cream" },
  { value: "serum", label: "Serum" },
  { value: "balm", label: "Balm" },
  { value: "mist", label: "Mist" },
];

const REMINDER_OPTIONS: { value: ReminderCadence; label: string }[] = [
  { value: "gentle", label: "Gentle" },
  { value: "standard", label: "Standard" },
  { value: "structured", label: "Structured" },
];

const SHOPPING_OPTIONS: { value: ShoppingPreference; label: string }[] = [
  { value: "otc", label: "OTC first" },
  { value: "mixed", label: "Mixed" },
  { value: "clinical", label: "Clinical / provider-guided" },
];

export default function PreferencesScreen() {
  const router = useRouter();
  const { data: profile, isLoading } = usePreferenceProfile();
  const { mutate: updateProfile, isPending } = useUpdatePreferenceProfile();

  const [budget, setBudget] = useState<BudgetPreference>("medium");
  const [depth, setDepth] = useState<RoutineDepthPreference>("moderate");
  const [modality, setModality] = useState<TreatmentModalityPreference>("hybrid");
  const [avoidList, setAvoidList] = useState("");
  const [texturePreferences, setTexturePreferences] = useState<TexturePreference[]>([]);
  const [fragranceFreeOnly, setFragranceFreeOnly] = useState(false);
  const [reminderCadence, setReminderCadence] = useState<ReminderCadence>("standard");
  const [shoppingPreference, setShoppingPreference] = useState<ShoppingPreference>("mixed");

  useEffect(() => {
    if (profile?.essential) {
      setBudget(profile.essential.budget || "medium");
      setDepth(profile.essential.routine_depth || "moderate");
      setModality(profile.essential.treatment_modality_comfort || "hybrid");
      setAvoidList(profile.essential.avoid_list?.join(", ") || "");
      setTexturePreferences(profile.essential.texture_preferences || []);
      setFragranceFreeOnly(profile.essential.fragrance_free_only || false);
      setReminderCadence(profile.essential.reminder_cadence || "standard");
      setShoppingPreference(profile.essential.shopping_preference || "mixed");
    }
  }, [profile]);

  const toggleTexturePreference = (value: TexturePreference) => {
    setTexturePreferences((current) =>
      current.includes(value) ? current.filter((item) => item !== value) : [...current, value]
    );
  };

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
          texture_preferences: texturePreferences,
          fragrance_free_only: fragranceFreeOnly,
          reminder_cadence: reminderCadence,
          shopping_preference: shoppingPreference,
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

      <ChipSelect
        label="Preferred Textures"
        options={TEXTURE_OPTIONS}
        selectedValue={null}
        selectedValues={texturePreferences}
        multiSelect
        onSelect={(val) => toggleTexturePreference(val)}
        horizontal={false}
      />

      <View style={styles.toggleRow}>
        <View style={styles.toggleCopy}>
          <Text style={styles.label}>Fragrance-free only</Text>
          <Text style={styles.hint}>Prioritize fragrance-free formulas across plan recommendations.</Text>
        </View>
        <Switch
          value={fragranceFreeOnly}
          onValueChange={setFragranceFreeOnly}
          trackColor={{ false: colors.border, true: colors.primaryLight }}
          thumbColor={fragranceFreeOnly ? colors.primary : colors.surface}
        />
      </View>

      <ChipSelect
        label="Reminder Cadence"
        options={REMINDER_OPTIONS}
        selectedValue={reminderCadence}
        onSelect={(val) => setReminderCadence(val)}
        horizontal={false}
      />

      <ChipSelect
        label="Shopping Preference"
        options={SHOPPING_OPTIONS}
        selectedValue={shoppingPreference}
        onSelect={(val) => setShoppingPreference(val)}
        horizontal={false}
      />

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
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  toggleCopy: {
    flex: 1,
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
