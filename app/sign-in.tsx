import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Redirect } from "expo-router";
import { useAuth } from "../src/auth/useAuth";
import { LoadingSpinner } from "../src/components/common/LoadingSpinner";
import { colors, typography, spacing } from "../src/theme";

export default function SignInScreen() {
  const { isAuthenticated, isLoading, login } = useAuth();

  if (isLoading) return <LoadingSpinner />;
  if (isAuthenticated) return <Redirect href="/(auth)/(tabs)" />;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Medbot</Text>
        <Text style={styles.subtitle}>Your personal skin health assistant</Text>
      </View>

      <TouchableOpacity style={styles.button} onPress={login}>
        <Text style={styles.buttonText}>Sign In</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.lg,
    backgroundColor: colors.background,
  },
  header: {
    alignItems: "center",
    marginBottom: spacing.xxl,
  },
  title: {
    ...typography.h1,
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: "center",
  },
  button: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: 12,
    minWidth: 200,
    alignItems: "center",
  },
  buttonText: {
    ...typography.button,
    color: "#FFFFFF",
  },
});
