import React from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { useAuth } from "../../../src/auth/useAuth";
import { ScreenShell } from "../../../src/components/common/ScreenShell";
import { SectionHeader } from "../../../src/components/common/SectionHeader";
import { SecondaryButton } from "../../../src/components/common/SecondaryButton";
import { SoftCard } from "../../../src/components/common/SoftCard";
import { borderRadius, colors, spacing, typography } from "../../../src/theme";
import { HandoffSummaryCard } from "../../../src/components/HandoffSummaryCard";
import { usePatientProfile, usePreferenceProfile } from "../../../src/hooks/useUser";
import { useConsentStatus } from "../../../src/hooks/useConsent";
import { useEngagementSettings } from "../../../src/hooks/useEngagementSettings";
import { ProfileHero } from "../../../src/components/profile/ProfileHero";
import { ProfileStatsRow } from "../../../src/components/profile/ProfileStatsRow";
import { ProfileMenuCard } from "../../../src/components/profile/ProfileMenuCard";
import { ProfilePreferenceSummary } from "../../../src/components/profile/ProfilePreferenceSummary";

function summarizeList(values?: string[]) {
  if (!values || values.length === 0) {
    return "Not set yet";
  }
  return values.join(", ");
}

function titleize(value?: string | null) {
  if (!value) {
    return "Not set yet";
  }
  return value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatDateLabel(value?: string | null) {
  if (!value) {
    return "Not scheduled";
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "Not scheduled";
  }
  return parsed.toLocaleDateString();
}

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const { data: patientProfile } = usePatientProfile();
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
  const programContext = patientProfile?.program_context;
  const membership = programContext?.membership;
  const program = programContext?.program;
  const treatmentPlan = programContext?.treatment_plan;
  const membershipLabel =
    membership?.name || (membership?.status && membership.status !== "inactive" ? titleize(membership.status) : "Not enrolled");
  const programLabel =
    program?.name || (program?.status && program.status !== "not_started" ? titleize(program.status) : "No active program");

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
        name={patientProfile?.preferred_name || user?.name}
        email={user?.email}
        membershipLabel={membershipLabel}
        programLabel={programLabel}
        privacyLabel={privacyLabel}
        hapticsEnabled={hapticsEnabled}
        onOpenSettings={() => router.push("/(auth)/settings")}
        onOpenNotifications={() => router.push("/(auth)/notifications")}
      />

      <ProfileStatsRow
        items={[
          { label: "Goals", value: goalsCount > 0 ? `${goalsCount} saved` : "Needs review", tone: goalsCount > 0 ? "success" : "warning" },
          {
            label: "Allergies",
            value: (patientProfile?.allergies?.length ?? 0) > 0 ? `${patientProfile?.allergies?.length ?? 0} tracked` : "None yet",
            tone: (patientProfile?.allergies?.length ?? 0) > 0 ? "warning" : "default",
          },
          { label: "Privacy", value: privacyLabel, tone: pendingRequiredCount > 0 ? "warning" : "success" },
        ]}
      />

      <SoftCard style={styles.cardSection}>
        <SectionHeader
          eyebrow="Profile context"
          title="What your provider handoff can see"
          subtitle="Identity, sensitivity, and active program context now live alongside your treatment preferences."
        />
        <View style={styles.identityGrid}>
          <View style={styles.identityCell}>
            <Text style={styles.identityLabel}>Preferred name</Text>
            <Text style={styles.identityValue}>{patientProfile?.preferred_name || user?.name || "Not set yet"}</Text>
          </View>
          <View style={styles.identityCell}>
            <Text style={styles.identityLabel}>Pronouns</Text>
            <Text style={styles.identityValue}>{patientProfile?.pronouns || "Not set yet"}</Text>
          </View>
          <View style={styles.identityCell}>
            <Text style={styles.identityLabel}>Skin profile</Text>
            <Text style={styles.identityValue}>
              {`${titleize(patientProfile?.skin_type)} • ${titleize(patientProfile?.skin_sensitivity)}`}
            </Text>
          </View>
          <View style={styles.identityCell}>
            <Text style={styles.identityLabel}>Avoid list</Text>
            <Text style={styles.identityValue}>{avoidCount > 0 ? `${avoidCount} ingredients tracked` : "None yet"}</Text>
          </View>
          <View style={styles.identityCell}>
            <Text style={styles.identityLabel}>Membership</Text>
            <Text style={styles.identityValue}>{membershipLabel}</Text>
          </View>
          <View style={styles.identityCell}>
            <Text style={styles.identityLabel}>Program</Text>
            <Text style={styles.identityValue}>{programLabel}</Text>
          </View>
          <View style={styles.identityCell}>
            <Text style={styles.identityLabel}>Treatment plan</Text>
            <Text style={styles.identityValue}>{treatmentPlan?.name || "No active plan"}</Text>
          </View>
          <View style={styles.identityCell}>
            <Text style={styles.identityLabel}>Next review</Text>
            <Text style={styles.identityValue}>{formatDateLabel(treatmentPlan?.next_review_at)}</Text>
          </View>
          <View style={styles.identityFullCell}>
            <Text style={styles.identityLabel}>Allergies</Text>
            <Text style={styles.identityValue}>{summarizeList(patientProfile?.allergies)}</Text>
          </View>
          <View style={styles.identityFullCell}>
            <Text style={styles.identityLabel}>Conditions</Text>
            <Text style={styles.identityValue}>{summarizeList(patientProfile?.conditions)}</Text>
          </View>
          <View style={styles.identityFullCell}>
            <Text style={styles.identityLabel}>Care note</Text>
            <Text style={styles.identityValue}>
              {patientProfile?.notes_for_care_team || "No care-team note saved yet."}
            </Text>
          </View>
          <View style={styles.identityFullCell}>
            <Text style={styles.identityLabel}>Program summary</Text>
            <Text style={styles.identityValue}>
              {program?.summary || treatmentPlan?.summary || "Your clinic can add a structured program or plan summary here when your longitudinal care path is active."}
            </Text>
          </View>
          <View style={styles.identityFullCell}>
            <Text style={styles.identityLabel}>Key dates</Text>
            <Text style={styles.identityValue}>
              {`Membership renewal: ${formatDateLabel(membership?.renewal_at)} • Goal target: ${formatDateLabel(program?.target_date)}`}
            </Text>
          </View>
        </View>
      </SoftCard>

      <ProfilePreferenceSummary
        preferenceProfile={preferenceProfile}
        onEditPreferences={() => router.push("/(auth)/onboarding/preferences")}
        onEditBrief={() => router.push("/(auth)/onboarding/skin-brief")}
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
            onPress={() => router.push("/(auth)/interventions")}
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
  cardSection: {
    gap: spacing.md,
  },
  stack: {
    gap: spacing.md,
  },
  identityGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  identityCell: {
    flexBasis: "48%",
    flexGrow: 1,
    minWidth: 140,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surfaceLight,
    gap: spacing.xxs,
  },
  identityFullCell: {
    width: "100%",
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surfaceLight,
    gap: spacing.xxs,
  },
  identityLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  identityValue: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
});
