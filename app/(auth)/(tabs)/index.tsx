import React from "react";
import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { colors, typography, spacing } from "../../../src/theme";
import { TodayPlan } from "../../../src/components/TodayPlan";
import { HeroDashboard } from "../../../src/components/HeroDashboard";
import { AutopilotCard } from "../../../src/components/AutopilotCard";
import { MaterialIcons } from "@expo/vector-icons";

export default function DailyScreen() {
  const router = useRouter();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Daily Plan</Text>
          <Text style={styles.subtitle}>Your personalized care routine</Text>
        </View>
        <TouchableOpacity 
          style={styles.statsButton}
          onPress={() => router.push("/(auth)/(tabs)/progress")}
        >
          <MaterialIcons name="trending-up" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <HeroDashboard />

      <AutopilotCard />

      <View style={styles.infoCard}>
        <MaterialIcons name="lightbulb-outline" size={20} color={colors.primary} />
        <Text style={styles.infoText}>
          Consistency is key to skin health. Complete your morning and evening routines to see progress.
        </Text>
      </View>
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
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.h2,
    color: colors.textPrimary,
  },
  subtitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  statsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceLight,
    padding: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  infoText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
    flex: 1,
  },
});
