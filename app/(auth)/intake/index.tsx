import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { colors, typography, spacing } from "../../../src/theme";

export default function IntakeModeSelector() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>How can we help?</Text>
      <Text style={styles.subtitle}>Choose how you'd like to start</Text>

      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push("/(auth)/intake/symptom-log")}
      >
        <Text style={styles.cardTitle}>Log a Symptom</Text>
        <Text style={styles.cardDesc}>Track and describe what you're experiencing</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push("/(auth)/intake/pre-visit")}
      >
        <Text style={styles.cardTitle}>Pre-Visit Check-In</Text>
        <Text style={styles.cardDesc}>Prepare information for your upcoming appointment</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
    backgroundColor: colors.background,
  },
  title: {
    ...typography.h2,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
  },
  card: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: 12,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  cardDesc: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
});
