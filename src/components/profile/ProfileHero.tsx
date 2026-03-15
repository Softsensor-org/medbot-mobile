import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { borderRadius, colors, spacing, typography } from "../../theme";
import { HeroSurface } from "../common/HeroSurface";
import { PrimaryButton } from "../common/PrimaryButton";
import { SecondaryButton } from "../common/SecondaryButton";

interface ProfileHeroProps {
  name?: string | null;
  email?: string | null;
  membershipLabel: string;
  programLabel: string;
  journeyStageLabel: string;
  privacyLabel: string;
  hapticsEnabled: boolean;
  onOpenSettings: () => void;
  onOpenNotifications: () => void;
}

export function ProfileHero({
  name,
  email,
  membershipLabel,
  programLabel,
  journeyStageLabel,
  privacyLabel,
  hapticsEnabled,
  onOpenSettings,
  onOpenNotifications,
}: ProfileHeroProps) {
  const firstInitial = name?.trim()?.[0] || email?.trim()?.[0] || "?";

  return (
    <HeroSurface
      eyebrow="Identity hub"
      title={name?.trim() || "Patient"}
      subtitle={email || "Keep your care preferences, privacy posture, and support tools in one place."}
      media={
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{firstInitial.toUpperCase()}</Text>
        </View>
      }
      metrics={
        <>
          <View style={styles.metric}>
            <Text style={styles.metricLabel}>Membership</Text>
            <Text style={styles.metricValue}>{membershipLabel}</Text>
          </View>
          <View style={styles.metric}>
            <Text style={styles.metricLabel}>Program</Text>
            <Text style={styles.metricValue}>{programLabel}</Text>
          </View>
          <View style={styles.metric}>
            <Text style={styles.metricLabel}>Stage</Text>
            <Text style={styles.metricValue}>{journeyStageLabel}</Text>
          </View>
          <View style={styles.metric}>
            <Text style={styles.metricLabel}>Privacy</Text>
            <Text style={styles.metricValue}>{privacyLabel}</Text>
          </View>
          <View style={styles.metric}>
            <Text style={styles.metricLabel}>Feedback</Text>
            <Text style={styles.metricValue}>{hapticsEnabled ? "Haptics on" : "Haptics off"}</Text>
          </View>
        </>
      }
      actions={
        <>
          <PrimaryButton
            label="Open Settings"
            onPress={onOpenSettings}
            icon={<MaterialIcons name="tune" size={18} color={colors.textInverse} />}
            style={styles.action}
            testID="profile-open-settings-button"
          />
          <SecondaryButton
            label="Notifications"
            onPress={onOpenNotifications}
            icon={<MaterialIcons name="notifications" size={18} color={colors.textPrimary} />}
            style={styles.action}
          />
        </>
      }
    />
  );
}

const styles = StyleSheet.create({
  avatar: {
    width: 72,
    height: 72,
    borderRadius: borderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
  },
  avatarText: {
    ...typography.h1,
    color: colors.textInverse,
  },
  metric: {
    minWidth: 108,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.borderMuted,
    backgroundColor: colors.surfaceElevated,
    gap: spacing.xxs,
  },
  metricLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  metricValue: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  action: {
    flex: 1,
  },
});
