import React from "react";
import { ActivityIndicator, Alert, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { useAuth } from "../../src/auth/useAuth";
import { colors, spacing, typography } from "../../src/theme";
import { ScreenShell } from "../../src/components/common/ScreenShell";
import { SoftCard } from "../../src/components/common/SoftCard";
import { SectionHeader } from "../../src/components/common/SectionHeader";
import { ChipSelect } from "../../src/components/common/ChipSelect";
import { PrimaryButton } from "../../src/components/common/PrimaryButton";
import { SecondaryButton } from "../../src/components/common/SecondaryButton";
import { useEngagementSettings } from "../../src/hooks/useEngagementSettings";
import { usePatientProfile, useUpdatePatientProfile } from "../../src/hooks/useUser";
import { ProfileMenuCard } from "../../src/components/profile/ProfileMenuCard";
import type { SkinSensitivity, SkinType } from "../../src/types/user";
import { showToast } from "../../src/providers/ToastProvider";

const SKIN_TYPE_OPTIONS: { value: SkinType; label: string }[] = [
  { value: "dry", label: "Dry" },
  { value: "oily", label: "Oily" },
  { value: "combination", label: "Combination" },
  { value: "sensitive", label: "Sensitive" },
  { value: "normal", label: "Normal" },
];

const SENSITIVITY_OPTIONS: { value: SkinSensitivity; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "moderate", label: "Moderate" },
  { value: "high", label: "High" },
];

function parseList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

export default function SettingsScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { hapticsEnabled, setHapticsEnabled } = useEngagementSettings();
  const { data: patientProfile, isLoading: isProfileLoading } = usePatientProfile();
  const { mutate: updatePatientProfile, isPending: isSavingProfile } = useUpdatePatientProfile();
  const [preferredName, setPreferredName] = React.useState("");
  const [pronouns, setPronouns] = React.useState("");
  const [skinType, setSkinType] = React.useState<SkinType | null>(null);
  const [skinSensitivity, setSkinSensitivity] = React.useState<SkinSensitivity | null>(null);
  const [allergies, setAllergies] = React.useState("");
  const [conditions, setConditions] = React.useState("");
  const [notesForCareTeam, setNotesForCareTeam] = React.useState("");

  React.useEffect(() => {
    if (!patientProfile) {
      return;
    }
    setPreferredName(patientProfile.preferred_name ?? "");
    setPronouns(patientProfile.pronouns ?? "");
    setSkinType(patientProfile.skin_type ?? null);
    setSkinSensitivity(patientProfile.skin_sensitivity ?? null);
    setAllergies((patientProfile.allergies ?? []).join(", "));
    setConditions((patientProfile.conditions ?? []).join(", "));
    setNotesForCareTeam(patientProfile.notes_for_care_team ?? "");
  }, [patientProfile]);

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

  const handleSaveIdentity = () => {
    updatePatientProfile(
      {
        preferred_name: preferredName.trim() || null,
        pronouns: pronouns.trim() || null,
        skin_type: skinType,
        skin_sensitivity: skinSensitivity,
        allergies: parseList(allergies),
        conditions: parseList(conditions),
        notes_for_care_team: notesForCareTeam.trim() || null,
      },
      {
        onSuccess: () => {
          showToast("success", "Saved", "Identity details updated");
        },
        onError: (error) => {
          showToast("error", "Error", error instanceof Error ? error.message : "Failed to save identity details");
        },
      }
    );
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
          eyebrow="Identity"
          title="Patient profile detail"
          subtitle="These details follow your routines, product guidance, and provider handoff."
        />
        {isProfileLoading ? (
          <ActivityIndicator color={colors.primary} />
        ) : (
          <View style={styles.formStack}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Preferred Name</Text>
              <TextInput
                style={styles.input}
                value={preferredName}
                onChangeText={setPreferredName}
                placeholder="How should we address you?"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Pronouns</Text>
              <TextInput
                style={styles.input}
                value={pronouns}
                onChangeText={setPronouns}
                placeholder="she/her, he/him, they/them"
              />
            </View>
            <ChipSelect
              label="Skin Type"
              options={SKIN_TYPE_OPTIONS}
              selectedValue={skinType}
              onSelect={(value) => setSkinType(value)}
              horizontal={false}
            />
            <ChipSelect
              label="Sensitivity"
              options={SENSITIVITY_OPTIONS}
              selectedValue={skinSensitivity}
              onSelect={(value) => setSkinSensitivity(value)}
              horizontal={false}
            />
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Allergies</Text>
              <TextInput
                style={styles.input}
                value={allergies}
                onChangeText={setAllergies}
                placeholder="Fragrance, lanolin"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Conditions</Text>
              <TextInput
                style={styles.input}
                value={conditions}
                onChangeText={setConditions}
                placeholder="Rosacea, eczema"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Note for Care Team</Text>
              <TextInput
                style={[styles.input, styles.multilineInput]}
                value={notesForCareTeam}
                onChangeText={setNotesForCareTeam}
                placeholder="Anything your provider should keep in mind"
                multiline
              />
            </View>
            <PrimaryButton
              label={isSavingProfile ? "Saving..." : "Save Identity Details"}
              onPress={handleSaveIdentity}
              disabled={isSavingProfile}
              testID="settings-save-identity-button"
            />
          </View>
        )}
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
  formStack: {
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
  inputGroup: {
    gap: spacing.xs,
  },
  inputLabel: {
    ...typography.label,
    color: colors.textPrimary,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    color: colors.textPrimary,
  },
  multilineInput: {
    minHeight: 88,
    textAlignVertical: "top",
  },
  stack: {
    gap: spacing.md,
  },
});
