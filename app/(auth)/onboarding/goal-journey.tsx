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
import { colors, typography, spacing, borderRadius } from "../../../src/theme";
import { useGoalJourneys, useUpsertGoalJourney } from "../../../src/hooks/useUser";
import { showToast } from "../../../src/providers/ToastProvider";
import { ChipSelect } from "../../../src/components/common/ChipSelect";
import { NativeDateTimePicker } from "../../../src/components/common/NativeDateTimePicker";
import { addMonths, isBefore, startOfToday } from "date-fns";

const CONSTRAINT_OPTIONS = [
  { value: "sensitive", label: "Sensitive Skin" },
  { value: "budget", label: "Budget Friendly" },
  { value: "minimalist", label: "Minimalist Routine" },
  { value: "vegan", label: "Vegan Products Only" },
];

export default function GoalJourneyScreen() {
  const router = useRouter();
  const { data: journeys, isLoading } = useGoalJourneys();
  const { mutate: upsertJourney, isPending } = useUpsertGoalJourney();

  const [outcome, setOutcome] = useState("");
  const [targetDate, setTargetDate] = useState<Date>(addMonths(new Date(), 3));
  const [constraints, setConstraints] = useState<string[]>([]);

  useEffect(() => {
    if (journeys && journeys.length > 0) {
      const j = journeys[0];
      setOutcome(j.target_outcome);
      setTargetDate(new Date(j.target_date));
      setConstraints(Object.keys(j.constraints || {}));
    }
  }, [journeys]);

  const handleConstraintToggle = (val: string) => {
    if (constraints.includes(val)) {
      setConstraints(constraints.filter((c) => c !== val));
    } else {
      setConstraints([...constraints, val]);
    }
  };

  const handleSave = () => {
    if (!outcome.trim()) {
      showToast("error", "Error", "Please describe your desired outcome");
      return;
    }

    if (isBefore(targetDate, startOfToday())) {
      showToast("error", "Error", "Target date must be in the future");
      return;
    }

    const constraintsMap = constraints.reduce((acc, curr) => {
      acc[curr] = true;
      return acc;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }, {} as any);

    upsertJourney(
      {
        target_outcome: outcome,
        target_date: targetDate.toISOString(),
        constraints: constraintsMap,
      },
      {
        onSuccess: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          showToast("success", "Goal Set!", "Your Future-You journey has been initialized.");
          router.replace("/(auth)/(tabs)");
        },
        onError: (err) => {
          showToast("error", "Error", err instanceof Error ? err.message : "Failed to set goal");
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
        <Text style={styles.title}>Your Future-You</Text>
        <Text style={styles.subtitle}>Define where you want your skin to be.</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Desired Outcome</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="e.g. Clearer skin with no active breakouts, improved texture and glow."
          value={outcome}
          onChangeText={setOutcome}
          multiline
          numberOfLines={4}
        />
      </View>

      <View style={styles.section}>
        <NativeDateTimePicker
          label="Target Date"
          mode="date"
          value={targetDate}
          minimumDate={startOfToday()}
          onChange={setTargetDate}
        />
        <Text style={styles.hint}>Most clinical skincare goals take 3-6 months.</Text>
      </View>

      <ChipSelect
        label="Any constraints or preferences?"
        options={CONSTRAINT_OPTIONS}
        selectedValue={null}
        selectedValues={constraints}
        onSelect={handleConstraintToggle}
        multiSelect={true}
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
          <Text style={styles.saveButtonText}>Initialize Success Plan</Text>
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
    ...typography.h1,
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
    borderRadius: borderRadius.md,
    padding: spacing.md,
    ...typography.body,
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  hint: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
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
