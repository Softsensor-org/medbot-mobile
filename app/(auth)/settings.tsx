import React, { useContext } from "react";
import {
  Alert,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { colors, spacing, typography } from "../../src/theme";
import { AuthContext } from "../../src/auth/AuthProvider";
import { HandoffSummaryCard } from "../../src/components/HandoffSummaryCard";
import { ScreenShell } from "../../src/components/common/ScreenShell";
import { SecondaryButton } from "../../src/components/common/SecondaryButton";
import { SectionHeader } from "../../src/components/common/SectionHeader";
import { SoftCard } from "../../src/components/common/SoftCard";
import { useEngagementSettings } from "../../src/hooks/useEngagementSettings";

export default function SettingsScreen() {
  const router = useRouter();
  const auth = useContext(AuthContext);
  const { hapticsEnabled, setHapticsEnabled } = useEngagementSettings();

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await auth?.logout();
          router.replace("/sign-in");
        },
      },
    ]);
  };

  return (
    <ScreenShell
      title="Settings"
      subtitle="Fine-tune feedback, privacy, and daily preferences."
      contentContainerStyle={styles.content}
    >
      <SoftCard style={styles.profileSection} tone="highlight">
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {auth?.user?.name?.[0] || auth?.user?.email?.[0] || "?"}
          </Text>
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>{auth?.user?.name || "Patient"}</Text>
          <Text style={styles.profileEmail}>{auth?.user?.email || "No email"}</Text>
        </View>
      </SoftCard>

      <SoftCard style={styles.section} padded={false}>
        <SectionHeader title="Feedback" eyebrow="Preferences" style={styles.sectionHeaderWrap} />
        <View style={styles.menuItem}>
          <View style={styles.menuItemLeft}>
            <MaterialIcons name="vibration" size={24} color={colors.primary} />
            <Text style={styles.menuItemText}>Haptic Feedback</Text>
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

      <SoftCard style={styles.section} padded={false}>
        <SectionHeader title="Personalization" eyebrow="Daily setup" style={styles.sectionHeaderWrap} />
        <TouchableOpacity style={styles.menuItem} onPress={() => router.push("/onboarding/skin-brief")}>
          <View style={styles.menuItemLeft}>
            <MaterialIcons name="face" size={24} color={colors.primary} />
            <Text style={styles.menuItemText}>Edit Skin Brief</Text>
          </View>
          <MaterialIcons name="chevron-right" size={24} color={colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => router.push("/onboarding/preferences")}>
          <View style={styles.menuItemLeft}>
            <MaterialIcons name="tune" size={24} color={colors.primary} />
            <Text style={styles.menuItemText}>Treatment Preferences</Text>
          </View>
          <MaterialIcons name="chevron-right" size={24} color={colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => router.push("/onboarding/goal-journey")}>
          <View style={styles.menuItemLeft}>
            <MaterialIcons name="flag" size={24} color={colors.primary} />
            <Text style={styles.menuItemText}>Define Skin Goal</Text>
          </View>
          <MaterialIcons name="chevron-right" size={24} color={colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => router.push("/interventions")}>
          <View style={styles.menuItemLeft}>
            <MaterialIcons name="medication" size={24} color={colors.primary} />
            <Text style={styles.menuItemText}>Intervention Ledger</Text>
          </View>
          <MaterialIcons name="chevron-right" size={24} color={colors.textSecondary} />
        </TouchableOpacity>
      </SoftCard>

      <SoftCard style={styles.section} padded={false}>
        <SectionHeader title="Trust & Privacy" eyebrow="Safety" style={styles.sectionHeaderWrap} />
        <TouchableOpacity style={styles.menuItem} onPress={() => router.push("/consent")}>
          <View style={styles.menuItemLeft}>
            <MaterialIcons name="gavel" size={24} color={colors.primary} />
            <Text style={styles.menuItemText}>Consents & Legal</Text>
          </View>
          <MaterialIcons name="chevron-right" size={24} color={colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => router.push("/notifications")}>
          <View style={styles.menuItemLeft}>
            <MaterialIcons name="notifications" size={24} color={colors.primary} />
            <Text style={styles.menuItemText}>Notification Settings</Text>
          </View>
          <MaterialIcons name="chevron-right" size={24} color={colors.textSecondary} />
        </TouchableOpacity>
      </SoftCard>

      <SecondaryButton
        label="Log Out"
        onPress={handleLogout}
        icon={<MaterialIcons name="logout" size={18} color={colors.textPrimary} />}
      />

      <HandoffSummaryCard />

      <View style={styles.footer}>
        <Text style={styles.versionText}>Medbot Mobile v0.1.0</Text>
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.md,
  },
  profileSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primaryLight,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    ...typography.h3,
    color: colors.textInverse,
    textTransform: "uppercase",
  },
  profileInfo: {
    flex: 1,
    gap: spacing.xxs,
  },
  profileName: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  profileEmail: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  section: {
    marginTop: spacing.xs,
  },
  sectionHeaderWrap: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  menuItemText: {
    ...typography.body,
    color: colors.textPrimary,
  },
  footer: {
    paddingVertical: spacing.md,
    alignItems: "center",
  },
  versionText: {
    ...typography.caption,
    color: colors.textDisabled,
  },
});
