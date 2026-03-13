import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { useAuth } from "../../../src/auth/useAuth";
import { colors, spacing, typography } from "../../../src/theme";
import { ScreenShell } from "../../../src/components/common/ScreenShell";
import { SectionHeader } from "../../../src/components/common/SectionHeader";
import { SecondaryButton } from "../../../src/components/common/SecondaryButton";
import { SoftCard } from "../../../src/components/common/SoftCard";

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();

  return (
    <ScreenShell
      title="Profile"
      subtitle="Your identity, preferences, and care context."
    >
      <SoftCard style={styles.infoCard}>
        <SectionHeader eyebrow="Identity" title="Patient profile" />
        <Text style={styles.label}>Name</Text>
        <Text style={styles.value}>{user?.name ?? "—"}</Text>
        <Text style={styles.label}>Email</Text>
        <Text style={styles.value}>{user?.email ?? "—"}</Text>
      </SoftCard>

      <View style={styles.actions}>
        <SecondaryButton
          label="Settings"
          onPress={() => router.push("/(auth)/settings")}
          icon={<MaterialIcons name="tune" size={18} color={colors.textPrimary} />}
        />
        <TouchableOpacity style={styles.logoutButton} onPress={logout} testID="sign-out-button">
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  infoCard: {
    gap: spacing.sm,
  },
  label: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  value: {
    ...typography.body,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  actions: {
    gap: spacing.md,
  },
  logoutButton: {
    padding: spacing.md,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  logoutText: {
    ...typography.button,
    color: colors.error,
  },
});
