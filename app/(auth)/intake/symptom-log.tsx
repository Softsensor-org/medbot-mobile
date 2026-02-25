import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, typography, spacing } from "../../../src/theme";

export default function SymptomLogScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Log Symptom</Text>
      <Text style={styles.placeholder}>
        Symptom logging form with photo capture will be implemented here.
      </Text>
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
