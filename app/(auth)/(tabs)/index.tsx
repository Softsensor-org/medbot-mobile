import React from "react";
import { StyleSheet, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { colors, spacing, typography } from "../../../src/theme";
import { AutopilotCard } from "../../../src/components/AutopilotCard";
import { HeroDashboard } from "../../../src/components/HeroDashboard";
import { TodayPlan } from "../../../src/components/TodayPlan";
import { ScreenShell } from "../../../src/components/common/ScreenShell";
import { SoftCard } from "../../../src/components/common/SoftCard";

export default function DailyScreen() {
  const router = useRouter();

  return (
    <ScreenShell
      title="Daily Plan"
      subtitle="How you're doing, what comes next, and what to watch today."
      headerRight={
        <TouchableOpacity
          style={styles.statsButton}
          accessibilityRole="button"
          testID="daily-progress-button"
          onPress={() => router.push("/(auth)/(tabs)/progress")}
        >
          <MaterialIcons name="trending-up" size={22} color={colors.primary} />
        </TouchableOpacity>
      }
    >
      <HeroDashboard />

      <AutopilotCard />

      <TodayPlan />

      <SoftCard tone="muted" style={styles.infoCard}>
        <MaterialIcons name="lightbulb-outline" size={20} color={colors.primary} />
        <Text style={styles.infoText}>
          One photo, one completed step, and one quick symptom note give tomorrow's plan better context.
        </Text>
      </SoftCard>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  statsButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surfaceElevated,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.borderMuted,
  },
  infoCard: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  infoText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    flex: 1,
  },
});
