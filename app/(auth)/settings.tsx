import React from "react";
import { Alert, StyleSheet, Switch, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { useAuth } from "../../src/auth/useAuth";
import { colors, spacing, typography } from "../../src/theme";
import { ScreenShell } from "../../src/components/common/ScreenShell";
import { SoftCard } from "../../src/components/common/SoftCard";
import { SectionHeader } from "../../src/components/common/SectionHeader";
import { SecondaryButton } from "../../src/components/common/SecondaryButton";
import { useEngagementSettings } from "../../src/hooks/useEngagementSettings";
import { ProfileMenuCard } from "../../src/components/profile/ProfileMenuCard";

export default function SettingsScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { hapticsEnabled, setHapticsEnabled } = useEngagementSettings();

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/sign-in");
        },
      },
    ]);
  };

  return (
    <ScreenShell
      title="Settings"
      subtitle="Focused detail controls for feedback, personalization, privacy, and account support."
      contentContainerStyle={styles.content}
    >
      <SoftCard tone="muted" style={styles.profileHubCard}>
        <SectionHeader
          eyebrow="Profile hub"
          title={user?.name || "Patient"}
          subtitle={user?.email || "Open your profile tab for the full identity overview."}
        />
        <SecondaryButton
          label="Back to Profile Hub"
          onPress={() => router.push("/(auth)/(tabs)/profile")}
          icon={<MaterialIcons name="person-outline" size={18} color={colors.textPrimary} />}
        />
      </SoftCard>

      <SoftCard style={styles.section}>
        <SectionHeader
          eyebrow="Feedback"
          title="Session feel"
          subtitle="Keep one tactile control here while the broader identity view lives on Profile."
        />
        <View style={styles.settingRow}>
          <View style={styles.settingCopy}>
            <Text style={styles.settingTitle}>Haptic Feedback</Text>
            <Text style={styles.settingDescription}>Keep touch feedback on for taps, confirmations, and routine actions.</Text>
          </View>
          <Switch
            value={hapticsEnabled}
            onValueChange={setHapticsEnabled}
            trackColor={{ false: colors.border, true: colors.primaryLight }}
            thumbColor={hapticsEnabled ? colors.primary : colors.surface}
            testID="settings-haptics-switch"
          />
        </View>
      </SoftCard>

      <View style={styles.section}>
        <SectionHeader
          eyebrow="Personalization"
          title="Edit the current setup"
          subtitle="These routes keep the same data domains and forms you already use."
        />
        <View style={styles.stack}>
          <ProfileMenuCard
            title="Edit Skin Brief"
            description="Refresh the brief summary that anchors your current skin context."
            icon="face"
            onPress={() => router.push("/onboarding/skin-brief")}
          />
          <ProfileMenuCard
            title="Treatment Preferences"
            description="Adjust budget, routine depth, treatment comfort, and avoid-list preferences."
            icon="tune"
            onPress={() => router.push("/onboarding/preferences")}
          />
          <ProfileMenuCard
            title="Define Skin Goal"
            description="Review the goal journey target already used to shape future care direction."
            icon="flag"
            onPress={() => router.push("/onboarding/goal-journey")}
          />
        </View>
      </View>

      <View style={styles.section}>
        <SectionHeader
          eyebrow="Trust & account"
          title="Privacy, notifications, and support detail"
          subtitle="These remain the same screens, now framed as focused drill-downs."
        />
        <View style={styles.stack}>
          <ProfileMenuCard
            title="Consents & Legal"
            description="Review privacy agreements and legal acknowledgements."
            icon="gavel"
            onPress={() => router.push("/(auth)/consent")}
          />
          <ProfileMenuCard
            title="Notification Settings"
            description="Control reminders, weekly summaries, and quiet-hour behavior."
            icon="notifications"
            onPress={() => router.push("/(auth)/notifications")}
          />
          <ProfileMenuCard
            title="Intervention Ledger"
            description="Open the existing intervention history and related support context."
            icon="medication"
            onPress={() => router.push("/interventions")}
          />
        </View>
      </View>

      <SecondaryButton
        label="Log Out"
        onPress={handleLogout}
        icon={<MaterialIcons name="logout" size={18} color={colors.textPrimary} />}
      />
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.md,
  },
  profileHubCard: {
    gap: spacing.md,
  },
  section: {
    gap: spacing.md,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  settingCopy: {
    flex: 1,
    gap: spacing.xxs,
  },
  settingTitle: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  settingDescription: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  stack: {
    gap: spacing.md,
  },
});
