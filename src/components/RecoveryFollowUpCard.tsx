import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { MaterialIcons } from "@expo/vector-icons";
import { borderRadius, colors, shadows, spacing, typography } from "../theme";
import { SoftCard } from "./common/SoftCard";
import type {
  RecoveryFollowUpContext,
  RecoveryFollowUpUpsertRequest,
  RecoverySymptomKey,
  RecoverySymptomRating,
} from "../types/user";
import { uriToBase64DataUrl } from "../utils/imageHelpers";

type Props = {
  recovery: RecoveryFollowUpContext;
  journeyStageLabel: string;
  treatmentPlanName?: string | null;
  isSaving?: boolean;
  error?: string | null;
  onSubmit: (payload: RecoveryFollowUpUpsertRequest) => Promise<unknown> | void;
};

const SYMPTOM_ORDER: Array<{ key: RecoverySymptomKey; label: string }> = [
  { key: "redness", label: "Redness" },
  { key: "swelling", label: "Swelling" },
  { key: "pain", label: "Pain" },
  { key: "drainage", label: "Drainage" },
  { key: "itching", label: "Itching" },
];

const SEVERITY_OPTIONS = [
  { value: 0, label: "None" },
  { value: 1, label: "Mild" },
  { value: 2, label: "Moderate" },
  { value: 3, label: "Severe" },
];

function toSymptomMap(symptoms: RecoverySymptomRating[]) {
  return symptoms.reduce<Record<string, number>>((acc, item) => {
    acc[item.symptom] = item.severity;
    return acc;
  }, {});
}

function toneForBand(band: RecoveryFollowUpContext["guidance"]["band"]) {
  if (band === "urgent") return "warning" as const;
  if (band === "concerning") return "highlight" as const;
  return "muted" as const;
}

export default function RecoveryFollowUpCard({
  recovery,
  journeyStageLabel,
  treatmentPlanName,
  isSaving = false,
  error,
  onSubmit,
}: Props) {
  const [notes, setNotes] = useState(recovery.notes ?? "");
  const [symptomMap, setSymptomMap] = useState<Record<string, number>>(() => toSymptomMap(recovery.symptoms));
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(recovery.photos[0]?.data_url ?? null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  useEffect(() => {
    setNotes(recovery.notes ?? "");
    setSymptomMap(toSymptomMap(recovery.symptoms));
    setPhotoDataUrl(recovery.photos[0]?.data_url ?? null);
  }, [recovery]);

  const payload = useMemo<RecoveryFollowUpUpsertRequest>(() => ({
    symptoms: SYMPTOM_ORDER.map(({ key }) => ({
      symptom: key,
      severity: symptomMap[key] ?? 0,
    })),
    notes,
    photos: photoDataUrl
      ? [
          {
            data_url: photoDataUrl,
            mime_type: photoDataUrl.match(/^data:([^;]+);/)?.[1] ?? "image/jpeg",
          },
        ]
      : [],
  }), [notes, photoDataUrl, symptomMap]);

  const handleSubmit = async (markResolved = false) => {
    setLocalError(null);
    try {
      await onSubmit({
        ...payload,
        mark_resolved: markResolved,
      });
    } catch (submissionError) {
      setLocalError(submissionError instanceof Error ? submissionError.message : "Failed to save recovery update.");
    }
  };

  const handleCapturePhoto = async () => {
    setLocalError(null);
    setIsCapturing(true);
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.5,
      });
      if (!result.canceled && result.assets[0]?.uri) {
        const dataUrl = await uriToBase64DataUrl(result.assets[0].uri);
        setPhotoDataUrl(dataUrl);
      }
    } catch (captureError) {
      setLocalError(captureError instanceof Error ? captureError.message : "Failed to capture recovery photo.");
    } finally {
      setIsCapturing(false);
    }
  };

  return (
    <SoftCard tone="default" style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>Recovery Follow-Up</Text>
        <Text style={styles.title}>{treatmentPlanName || "Post-treatment check-in"}</Text>
        <Text style={styles.subtitle}>
          Journey stage: {journeyStageLabel}. Capture how healing looks today so your care team can review anything outside the expected range.
        </Text>
      </View>

      <SoftCard tone={toneForBand(recovery.guidance.band)} padded={false} style={styles.guidanceCard}>
        <Text style={styles.guidanceHeadline}>{recovery.guidance.headline}</Text>
        <Text style={styles.guidanceBody}>{recovery.guidance.detail}</Text>
      </SoftCard>

      <View style={styles.metaRow}>
        <View style={styles.metaChip}>
          <Text style={styles.metaChipText}>{recovery.status.replace(/_/g, " ")}</Text>
        </View>
        <View style={styles.metaChip}>
          <Text style={styles.metaChipText}>{recovery.guidance.provider_follow_up ? "Care team review likely" : "Self-monitoring okay"}</Text>
        </View>
      </View>

      <View style={styles.symptomStack}>
        {SYMPTOM_ORDER.map(({ key, label }) => (
          <View key={key} style={styles.symptomBlock}>
            <Text style={styles.symptomLabel}>{label}</Text>
            <View style={styles.optionRow}>
              {SEVERITY_OPTIONS.map((option) => {
                const selected = (symptomMap[key] ?? 0) === option.value;
                return (
                  <TouchableOpacity
                    key={`${key}-${option.value}`}
                    onPress={() => setSymptomMap((current) => ({ ...current, [key]: option.value }))}
                    style={[styles.optionButton, selected && styles.optionButtonSelected]}
                  >
                    <Text style={[styles.optionButtonText, selected && styles.optionButtonTextSelected]}>{option.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}
      </View>

      <TextInput
        style={styles.notesInput}
        multiline
        value={notes}
        onChangeText={setNotes}
        placeholder="Add any recovery notes for your care team"
        placeholderTextColor={colors.textSecondary}
      />

      <TouchableOpacity style={styles.photoButton} onPress={() => void handleCapturePhoto()} disabled={isCapturing}>
        {isCapturing ? (
          <ActivityIndicator color={colors.primary} />
        ) : (
          <>
            <MaterialIcons name="photo-camera" size={18} color={colors.primary} />
            <Text style={styles.photoButtonText}>{photoDataUrl ? "Retake recovery photo" : "Add recovery photo"}</Text>
          </>
        )}
      </TouchableOpacity>

      {photoDataUrl ? (
        <Image source={{ uri: photoDataUrl }} style={styles.previewImage} testID="recovery-photo-preview" />
      ) : null}

      {(error || localError) ? <Text style={styles.errorText}>{error || localError}</Text> : null}

      <TouchableOpacity
        style={[styles.primaryButton, isSaving && styles.disabledButton]}
        onPress={() => void handleSubmit(false)}
        disabled={isSaving}
      >
        {isSaving ? <ActivityIndicator color={colors.surface} /> : <Text style={styles.primaryButtonText}>Save recovery update</Text>}
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.secondaryButton, isSaving && styles.disabledButton]}
        onPress={() => void handleSubmit(true)}
        disabled={isSaving}
      >
        <Text style={styles.secondaryButtonText}>Mark recovery on track</Text>
      </TouchableOpacity>

      <Text style={styles.footerText}>
        Watch for: {recovery.guidance.watch_for.join(", ")}. Next step: {recovery.guidance.next_step}
      </Text>
    </SoftCard>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.lg,
  },
  header: {
    marginBottom: spacing.md,
  },
  eyebrow: {
    ...typography.caption,
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginBottom: spacing.xs,
  },
  title: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  guidanceCard: {
    marginBottom: spacing.md,
    padding: spacing.md,
    ...shadows.sm,
  },
  guidanceHeadline: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: "700",
    marginBottom: spacing.xs,
  },
  guidanceBody: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: spacing.md,
  },
  metaChip: {
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.borderLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.surfaceLight,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  metaChipText: {
    ...typography.caption,
    color: colors.textSecondary,
    textTransform: "capitalize",
  },
  symptomStack: {
    marginTop: spacing.xs,
  },
  symptomBlock: {
    marginBottom: spacing.md,
  },
  symptomLabel: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: "600",
  },
  optionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: spacing.xs,
  },
  optionButton: {
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.borderLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.surface,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  optionButtonSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  optionButtonText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  optionButtonTextSelected: {
    color: colors.surface,
    fontWeight: "700",
  },
  notesInput: {
    minHeight: 96,
    marginTop: spacing.md,
    marginBottom: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.textPrimary,
    textAlignVertical: "top",
  },
  photoButton: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surfaceLight,
    alignSelf: "flex-start",
  },
  photoButtonText: {
    ...typography.bodySmall,
    color: colors.primary,
    fontWeight: "600",
    marginLeft: spacing.xs,
  },
  previewImage: {
    width: 132,
    height: 132,
    borderRadius: borderRadius.lg,
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  errorText: {
    ...typography.bodySmall,
    color: colors.error,
    marginTop: spacing.sm,
  },
  primaryButton: {
    marginTop: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: {
    ...typography.button,
    color: colors.surface,
  },
  secondaryButton: {
    marginTop: spacing.sm,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    backgroundColor: colors.surface,
    paddingVertical: spacing.md,
    alignItems: "center",
  },
  secondaryButtonText: {
    ...typography.button,
    color: colors.textPrimary,
  },
  disabledButton: {
    opacity: 0.6,
  },
  footerText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
});
