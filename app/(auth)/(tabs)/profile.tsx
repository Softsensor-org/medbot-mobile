import React from "react";
import { Alert, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { useAuth } from "../../../src/auth/useAuth";
import { ScreenShell } from "../../../src/components/common/ScreenShell";
import { SectionHeader } from "../../../src/components/common/SectionHeader";
import { SecondaryButton } from "../../../src/components/common/SecondaryButton";
import { colors, spacing } from "../../../src/theme";
import { HandoffSummaryCard } from "../../../src/components/HandoffSummaryCard";
import { usePreferenceProfile } from "../../../src/hooks/useUser";
import { useConsentStatus } from "../../../src/hooks/useConsent";
import { useEngagementSettings } from "../../../src/hooks/useEngagementSettings";
import { ProfileHero } from "../../../src/components/profile/ProfileHero";
import { ProfileStatsRow } from "../../../src/components/profile/ProfileStatsRow";
import { ProfileMenuCard } from "../../../src/components/profile/ProfileMenuCard";
import { ProfilePreferenceSummary } from "../../../src/components/profile/ProfilePreferenceSummary";

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const { data: preferenceProfile } = usePreferenceProfile();
  const { data: consentStatus } = useConsentStatus();
  const { hapticsEnabled } = useEngagementSettings();

  const pendingRequiredCount = consentStatus?.pending_required.length ?? 0;
  const privacyLabel =
    pendingRequiredCount > 0
      ? `${pendingRequiredCount} to review`
      : "All current";
  const goalsCount = preferenceProfile?.essential.goals.length ?? 0;
  const avoidCount = preferenceProfile?.essential.avoid_list.length ?? 0;

  const handleLogout = () => {
    Alert.alert("Log out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log out",
        style: "destructive",
        onPress: () => void logout(),
      },
    ]);
  };

  return (
    <ScreenShell
      title="Profile"
      subtitle="Your patient identity hub for preferences, privacy, notifications, and support."
      testID="profile-screen"
    >
      <ProfileHero
        name={user?.name}
        email={user?.email}
        privacyLabel={privacyLabel}
        hapticsEnabled={hapticsEnabled}
        onOpenSettings={() => router.push("/(auth)/settings")}
        onOpenNotifications={() => router.push("/(auth)/notifications")}
      />

      <ProfileStatsRow
        items={[
          { label: "Goals", value: goalsCount > 0 ? `${goalsCount} saved` : "Needs review", tone: goalsCount > 0 ? "success" : "warning" },
          { label: "Avoids", value: avoidCount > 0 ? `${avoidCount} tracked` : "None yet", tone: avoidCount > 0 ? "primary" : "default" },
          { label: "Privacy", value: privacyLabel, tone: pendingRequiredCount > 0 ? "warning" : "success" },
        ]}
      />

      <ProfilePreferenceSummary
        preferenceProfile={preferenceProfile}
        onEditPreferences={() => router.push("/onboarding/preferences")}
        onEditBrief={() => router.push("/onboarding/skin-brief")}
        onEditGoal={() => router.push("/onboarding/goal-journey")}
      />

      <View style={styles.section}>
        <SectionHeader
          eyebrow="Identity paths"
          title="Manage the details"
          subtitle="Profile stays as the overview; these routes take you into focused detail screens."
        />
        <View style={styles.stack}>
          <ProfileMenuCard
            eyebrow="Settings"
            title="Open detail controls"
            description="Fine-tune haptics, review personalization routes, and manage account-level detail."
            icon="tune"
            onPress={() => router.push("/(auth)/settings")}
            testID="profile-settings-card"
          />
          <ProfileMenuCard
            eyebrow="Trust & privacy"
            title="Consents & legal"
            description="Review required and optional consents without leaving the patient identity hub."
            icon="gavel"
            onPress={() => router.push("/(auth)/consent")}
          />
          <ProfileMenuCard
            eyebrow="Notifications"
            title="Reminder settings"
            description="Control reminders, summaries, and quiet hours from the existing notification screen."
            icon="notifications"
            onPress={() => router.push("/(auth)/notifications")}
          />
          <ProfileMenuCard
            eyebrow="Support"
            title="Intervention ledger"
            description="Review the current intervention history and bring the same context into provider handoff."
            icon="medication"
            onPress={() => router.push("/interventions")}
          />
        </View>
      </View>

      <View style={styles.section}>
        <SectionHeader
          eyebrow="Care support"
          title="Provider handoff"
          subtitle="Generate the existing clinical snapshot without burying it inside Settings."
        />
        <HandoffSummaryCard />
      </View>

      <SecondaryButton
        label="Sign Out"
        onPress={handleLogout}
        icon={<MaterialIcons name="logout" size={18} color={colors.textPrimary} />}
        testID="sign-out-button"
      />
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: spacing.md,
  },
  stack: {
    gap: spacing.md,
  },
});
