import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, typography, spacing } from "../../../src/theme";

export default function PreferencesScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Preferences</Text>
      <Text style={styles.placeholder}>
        Budget, routine depth, treatment comfort level, and product avoid-list.
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
