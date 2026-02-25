import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { colors, typography, spacing } from "../../../src/theme";

export default function CareScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Care</Text>
      <Text style={styles.subtitle}>Your care sessions and chat history</Text>

      <TouchableOpacity
        style={styles.newChat}
        onPress={() => router.push("/(auth)/intake")}
      >
        <Text style={styles.newChatText}>Start New Session</Text>
      </TouchableOpacity>

      <Text style={styles.placeholder}>Previous sessions will appear here.</Text>
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
    marginBottom: spacing.lg,
  },
  newChat: {
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  newChatText: {
    ...typography.button,
    color: "#FFFFFF",
  },
  placeholder: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: spacing.lg,
  },
});
