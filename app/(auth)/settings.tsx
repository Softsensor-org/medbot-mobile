import React, { useContext, useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { colors, typography, spacing } from "../../src/theme";
import { AuthContext } from "../../src/auth/AuthProvider";
import { HandoffSummaryCard } from "../../src/components/HandoffSummaryCard";
import { useEngagementSettings } from "../../src/hooks/useEngagementSettings";
import type { ReminderPreferences } from "../../src/notifications";
import {
  DEFAULT_PREFERENCES,
  loadPreferences,
} from "../../src/notifications";

function SectionHeader({ title }: { title: string }) {
  return <Text style={styles.sectionTitle}>{title}</Text>;
}

export default function SettingsScreen() {
  const router = useRouter();
  const auth = useContext(AuthContext);
  const { hapticsEnabled, setHapticsEnabled } = useEngagementSettings();
  const [_prefs, setPrefs] = useState<ReminderPreferences>({
    ...DEFAULT_PREFERENCES,
  });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    loadPreferences().then((p) => {
      setPrefs(p);
      setLoaded(true);
    });
  }, []);

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to log out?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Logout", 
          style: "destructive",
          onPress: async () => {
            await auth?.logout();
            router.replace("/sign-in");
          }
        },
      ]
    );
  };

  if (!loaded) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Settings</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
      </View>

      <View style={styles.profileSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {auth?.user?.name?.[0] || auth?.user?.email?.[0] || "?"}
          </Text>
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>{auth?.user?.name || "Patient"}</Text>
          <Text style={styles.profileEmail}>{auth?.user?.email || "No email"}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <SectionHeader title="Feedback" />
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
      </View>

      <View style={styles.section}>
        <SectionHeader title="Personalization" />
        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => router.push("/onboarding/skin-brief")}
        >
          <View style={styles.menuItemLeft}>
            <MaterialIcons name="face" size={24} color={colors.primary} />
            <Text style={styles.menuItemText}>Edit Skin Brief</Text>
          </View>
          <MaterialIcons name="chevron-right" size={24} color={colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => router.push("/onboarding/preferences")}
        >
          <View style={styles.menuItemLeft}>
            <MaterialIcons name="tune" size={24} color={colors.primary} />
            <Text style={styles.menuItemText}>Treatment Preferences</Text>
          </View>
          <MaterialIcons name="chevron-right" size={24} color={colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => router.push("/onboarding/goal-journey")}
        >
          <View style={styles.menuItemLeft}>
            <MaterialIcons name="flag" size={24} color={colors.primary} />
            <Text style={styles.menuItemText}>Define Skin Goal</Text>
          </View>
          <MaterialIcons name="chevron-right" size={24} color={colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => router.push("/interventions")}
        >
          <View style={styles.menuItemLeft}>
            <MaterialIcons name="medication" size={24} color={colors.primary} />
            <Text style={styles.menuItemText}>Intervention Ledger</Text>
          </View>
          <MaterialIcons name="chevron-right" size={24} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <SectionHeader title="Trust & Privacy" />
        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => router.push("/consent")}
        >
          <View style={styles.menuItemLeft}>
            <MaterialIcons name="gavel" size={24} color={colors.primary} />
            <Text style={styles.menuItemText}>Consents & Legal</Text>
          </View>
          <MaterialIcons name="chevron-right" size={24} color={colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => router.push("/notifications")}
        >
          <View style={styles.menuItemLeft}>
            <MaterialIcons name="notifications" size={24} color={colors.primary} />
            <Text style={styles.menuItemText}>Notification Settings</Text>
          </View>
          <MaterialIcons name="chevron-right" size={24} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <MaterialIcons name="logout" size={20} color={colors.error} />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </View>

      <HandoffSummaryCard />

      <View style={styles.footer}>
        <Text style={styles.versionText}>Medbot Mobile v0.1.0</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingBottom: spacing.xl,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: spacing.lg,
    paddingTop: spacing.xl,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    ...typography.h2,
    color: colors.textPrimary,
  },
  profileSection: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.lg,
    backgroundColor: colors.surface,
    marginBottom: spacing.md,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primaryLight,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.md,
  },
  avatarText: {
    ...typography.h3,
    color: colors.primary,
    textTransform: "uppercase",
  },
  profileInfo: {
    flex: 1,
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
    marginTop: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderTopColor: colors.border,
    borderBottomColor: colors.border,
  },
  sectionTitle: {
    ...typography.label,
    color: colors.textSecondary,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xs,
    textTransform: "uppercase",
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
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
    gap: spacing.sm,
  },
  logoutText: {
    ...typography.button,
    color: colors.error,
  },
  footer: {
    padding: spacing.xl,
    alignItems: "center",
  },
  versionText: {
    ...typography.caption,
    color: colors.textDisabled,
  },
});
