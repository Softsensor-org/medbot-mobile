import React from "react";
import { StyleSheet, Text, View, Switch } from "react-native";
import { colors, typography, spacing } from "../../src/theme";
import { useEngagementSettings } from "../../src/hooks/useEngagementSettings";

export default function SettingsScreen() {
  const { hapticsEnabled, setHapticsEnabled } = useEngagementSettings();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>

      <View style={styles.card}>
        <View style={styles.row}>
          <View style={styles.copyWrap}>
            <Text style={styles.label}>Haptic Feedback</Text>
            <Text style={styles.help}>
              Gentle vibration for completion, milestones, and warning acknowledgment.
            </Text>
          </View>
          <Switch
            value={hapticsEnabled}
            onValueChange={setHapticsEnabled}
            trackColor={{ false: colors.borderMuted, true: colors.primaryLight }}
            thumbColor={hapticsEnabled ? colors.primary : colors.surface}
            testID="settings-haptics-switch"
          />
        </View>
      </View>

      <Text style={styles.placeholder}>
        Additional preferences (notifications, skin brief editing, and privacy controls) will appear here.
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
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  copyWrap: {
    flex: 1,
  },
  label: {
    ...typography.label,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  help: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  placeholder: {
    ...typography.body,
    color: colors.textSecondary,
  },
});
