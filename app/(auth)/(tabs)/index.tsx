import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, typography, spacing } from "../../../src/theme";

export default function DailyScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Today's Plan</Text>
      <Text style={styles.placeholder}>Your daily care plan and routine reminders will appear here.</Text>
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
    marginBottom: spacing.md,
  },
  placeholder: {
    ...typography.body,
    color: colors.textSecondary,
  },
});
