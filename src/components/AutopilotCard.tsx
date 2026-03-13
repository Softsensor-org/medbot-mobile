import React, { useEffect, useRef } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  View,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { analytics } from "../api/AnalyticsService";
import { colors, spacing } from "../theme";
import { useAutopilot } from "../hooks/useAutopilot";
import { useFeatureFlags } from "../hooks/useFeatureFlags";
import { useSafetyGate } from "../hooks/useSafetyGate";
import { SafetyGateOverlay } from "./SafetyGateOverlay";
import { MetricChip } from "./common/MetricChip";
import { PrimaryButton } from "./common/PrimaryButton";
import { SecondaryButton } from "./common/SecondaryButton";
import { SectionHeader } from "./common/SectionHeader";
import { SoftCard } from "./common/SoftCard";

export const AutopilotCard: React.FC = () => {
  const router = useRouter();
  const { data: flags } = useFeatureFlags();
  const {
    currentStep,
    remainingRoutines,
    isLoading: isLoadingAutopilot,
    handleDone,
    handleSnooze,
    handleSkip,
    isProcessing,
  } = useAutopilot();
  const { safety, isLoading: isLoadingSafety } = useSafetyGate();
  const lastSafetyGateEvent = useRef<string | null>(null);

  useEffect(() => {
    if (!safety.isSafe) {
      const eventKey = `${safety.reason}:${safety.severity}`;
      if (lastSafetyGateEvent.current === eventKey) {
        return;
      }
      lastSafetyGateEvent.current = eventKey;
      analytics.track("safety_gate_triggered", { reason: safety.reason, severity: safety.severity });
      return;
    }
    lastSafetyGateEvent.current = null;
  }, [safety]);

  if (!flags?.autopilot_enabled) return null;

  if (isLoadingAutopilot || isLoadingSafety) {
    return (
      <SoftCard style={styles.loadingCard}>
        <ActivityIndicator color={colors.primary} />
      </SoftCard>
    );
  }

  if (!safety.isSafe && safety.reason !== "low_confidence") {
    return <SafetyGateOverlay safety={safety} />;
  }

  const onDone = async () => {
    analytics.track("autopilot_step_done", { type: currentStep.type, id: currentStep.id });
    await handleDone();
  };

  const onSnooze = async () => {
    analytics.track("autopilot_step_snooze", { id: currentStep.id });
    await handleSnooze();
  };

  const onSkip = async () => {
    analytics.track("autopilot_step_skip", { id: currentStep.id });
    await handleSkip();
  };

  if (currentStep.type === "complete") {
    return (
      <SoftCard tone="success" style={styles.card}>
        <View style={styles.completeHero}>
          <MaterialIcons name="stars" size={44} color={colors.success} />
          <SectionHeader
            eyebrow="Complete"
            title={currentStep.title}
            subtitle={currentStep.subtitle}
          />
          <SecondaryButton
            label="View Weekly Progress"
            onPress={() => router.push("/weekly-reveal")}
          />
        </View>
      </SoftCard>
    );
  }

  const isPhotoStep = currentStep.type === "photo";

  return (
    <SoftCard tone="highlight" style={styles.card}>
      <SectionHeader
        eyebrow="Autopilot"
        title={currentStep.title}
        subtitle={currentStep.subtitle}
      />

      <View style={styles.metaRow}>
        <MetricChip
          tone="primary"
          label={currentStep.type === "routine" ? "Next routine" : "Daily check-in"}
          value={currentStep.type === "photo" ? "Photo step" : "Active"}
          icon={<MaterialIcons name="auto-awesome" size={16} color={colors.primary} />}
          style={styles.metaChip}
        />
        {remainingRoutines > 1 ? (
          <MetricChip
            tone="default"
            label="Queue"
            value={`+${remainingRoutines - 1} more`}
            icon={<MaterialIcons name="schedule" size={16} color={colors.textSecondary} />}
            style={styles.metaChip}
          />
        ) : null}
      </View>

      <View style={styles.actions}>
        <SecondaryButton
          label="Snooze"
          onPress={onSnooze}
          disabled={isProcessing}
          icon={<MaterialIcons name="snooze" size={18} color={colors.textPrimary} />}
          style={styles.sideAction}
        />
        <PrimaryButton
          label={isProcessing ? "Working..." : isPhotoStep ? "Open Camera" : "Done"}
          onPress={
            isPhotoStep
              ? () => {
                  analytics.track("autopilot_step_done", { type: "photo" });
                  router.push("/(auth)/intake/camera");
                }
              : onDone
          }
          disabled={isProcessing}
          icon={
            isProcessing ? (
              <ActivityIndicator size="small" color={colors.textInverse} />
            ) : (
              <MaterialIcons
                name={isPhotoStep ? "photo-camera" : "check-circle"}
                size={20}
                color={colors.textInverse}
              />
            )
          }
          style={styles.primaryAction}
        />
        <SecondaryButton
          label="Skip"
          onPress={onSkip}
          disabled={isProcessing}
          icon={<MaterialIcons name="fast-forward" size={18} color={colors.textPrimary} />}
          style={styles.sideAction}
        />
      </View>
    </SoftCard>
  );
};

const styles = StyleSheet.create({
  card: {
    marginVertical: spacing.md,
    gap: spacing.md,
  },
  loadingCard: {
    minHeight: 120,
    alignItems: "center",
    justifyContent: "center",
  },
  completeHero: {
    alignItems: "center",
    gap: spacing.md,
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  metaChip: {
    flex: 1,
    minWidth: 150,
  },
  actions: {
    flexDirection: "row",
    gap: spacing.sm,
    alignItems: "stretch",
  },
  sideAction: {
    flex: 1,
    minWidth: 94,
  },
  primaryAction: {
    flex: 1.3,
  },
});
