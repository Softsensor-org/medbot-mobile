import React from "react";
import {
  Image,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { colors, spacing, typography } from "../theme";
import { usePatientProgress } from "../hooks/useProgress";
import { safeFormat } from "../utils/dateHelpers";
import { HeroSurface } from "./common/HeroSurface";
import { MetricChip } from "./common/MetricChip";
import { PrimaryButton } from "./common/PrimaryButton";
import { SecondaryButton } from "./common/SecondaryButton";

export const HeroDashboard = () => {
  const router = useRouter();
  const { data: progress, isLoading } = usePatientProgress();

  if (isLoading || !progress) return null;

  const { summary, photos, symptoms } = progress;
  const latestPhoto = photos?.[0];
  const lastSymptom = symptoms?.[0];
  const prevSymptom = symptoms?.[1];

  const trend =
    lastSymptom && prevSymptom
      ? lastSymptom.severity < prevSymptom.severity
        ? "improving"
        : "stable"
      : "stable";

  const heroTitle = latestPhoto
    ? "Your routine is building visible momentum."
    : "Capture today's baseline to anchor your progress.";
  const heroSubtitle = latestPhoto
    ? `Latest photo from ${safeFormat(latestPhoto.timestamp, "MMMM do, yyyy")}.`
    : "Start with one photo and one check-in so tomorrow has something to compare against.";

  return (
    <HeroSurface
      eyebrow="Daily snapshot"
      title={heroTitle}
      subtitle={heroSubtitle}
      metrics={
        <>
          <MetricChip
            tone="primary"
            label="Adherence"
            value={`${Math.round(summary.adherence_rate * 100)}%`}
            icon={<MaterialIcons name="favorite-border" size={16} color={colors.primary} />}
          />
          <MetricChip
            tone={trend === "improving" ? "success" : "info"}
            label="Trend"
            value={trend === "improving" ? "Improving" : "Stable"}
            icon={
              <MaterialIcons
                name={trend === "improving" ? "trending-down" : "trending-flat"}
                size={16}
                color={trend === "improving" ? colors.success : colors.info}
              />
            }
          />
          <MetricChip
            tone="default"
            label="Photos"
            value={`${summary.photo_count}`}
            icon={<MaterialIcons name="photo-library" size={16} color={colors.textSecondary} />}
          />
        </>
      }
      media={
        <View style={styles.media}>
          {latestPhoto ? (
            <>
              <Image source={{ uri: latestPhoto.url }} style={styles.latestPhoto} />
              <View style={styles.photoOverlay}>
                <Text style={styles.photoDate}>
                  {safeFormat(latestPhoto.timestamp, "MMMM do, yyyy")}
                </Text>
              </View>
            </>
          ) : (
            <View style={styles.placeholder}>
              <MaterialIcons name="add-a-photo" size={44} color={colors.borderMuted} />
              <Text style={styles.placeholderText}>No progress photo yet</Text>
            </View>
          )}
        </View>
      }
      actions={
        <View style={styles.actions}>
          <PrimaryButton
            label="Symptom"
            onPress={() => router.push("/(auth)/intake/symptom-log")}
            icon={<MaterialIcons name="report-problem" size={18} color={colors.textInverse} />}
            style={styles.primaryAction}
          />
          <SecondaryButton
            label="Photo"
            onPress={() => router.push("/(auth)/intake/camera")}
            icon={<MaterialIcons name="photo-camera" size={18} color={colors.textPrimary} />}
            style={styles.secondaryAction}
          />
          <SecondaryButton
            label="Routines"
            onPress={() => router.push("/(auth)/(tabs)/routines")}
            icon={<MaterialIcons name="check-circle" size={18} color={colors.textPrimary} />}
            style={styles.secondaryAction}
          />
        </View>
      }
    />
  );
};

const styles = StyleSheet.create({
  media: {
    position: "relative",
    height: 232,
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: colors.surface,
  },
  latestPhoto: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  placeholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    backgroundColor: colors.surfaceLight,
  },
  placeholderText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  photoOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: "rgba(44, 34, 28, 0.34)",
  },
  photoDate: {
    ...typography.caption,
    color: colors.textInverse,
    fontWeight: "700",
  },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  primaryAction: {
    flex: 1,
    minWidth: 160,
  },
  secondaryAction: {
    flex: 1,
    minWidth: 136,
  },
});
