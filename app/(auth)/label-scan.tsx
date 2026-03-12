import React, { useState, useRef, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  ScrollView,
  Alert,
} from "react-native";
import { CameraView, useCameraPermissions, CameraCapturedPicture } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { colors, typography, spacing, borderRadius, shadows } from "../../src/theme";
import { useCameraQuality } from "../../src/hooks/useCameraQuality";
import { useLabelExtraction, useAddUserProduct } from "../../src/hooks/useLabelExtraction";
import type { LabelExtractionResponse, InteractionFlag } from "../../src/types/product-label";

type Phase = "capture" | "preview" | "analyzing" | "results";

export default function LabelScanScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const quality = useCameraQuality();
  const cameraRef = useRef<CameraView>(null);

  const extractionMutation = useLabelExtraction();
  const addProductMutation = useAddUserProduct();

  const [phase, setPhase] = useState<Phase>("capture");
  const [photo, setPhoto] = useState<CameraCapturedPicture | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [result, setResult] = useState<LabelExtractionResponse | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  const takePicture = useCallback(async () => {
    if (!cameraRef.current || isCapturing) return;
    setIsCapturing(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    try {
      const p = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: true,
      });
      if (p) {
        setPhoto(p);
        setImageBase64(p.base64 ?? null);
        setPhase("preview");
      }
    } catch (e) {
      console.error("Capture error", e);
    } finally {
      setIsCapturing(false);
    }
  }, [isCapturing]);

  const pickFromGallery = useCallback(async () => {
    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      base64: true,
    });
    if (!pickerResult.canceled && pickerResult.assets[0]) {
      const asset = pickerResult.assets[0];
      setPhoto({ uri: asset.uri, width: asset.width, height: asset.height } as CameraCapturedPicture);
      setImageBase64(asset.base64 ?? null);
      setPhase("preview");
    }
  }, []);

  const analyzeLabel = useCallback(async () => {
    if (!imageBase64) return;
    setPhase("analyzing");
    try {
      const response = await extractionMutation.mutateAsync(imageBase64);
      setResult(response);
      setPhase("results");
    } catch {
      Alert.alert("Analysis Failed", "Could not analyze the product label. Please try again.");
      setPhase("preview");
    }
  }, [imageBase64, extractionMutation]);

  const retake = useCallback(() => {
    setPhoto(null);
    setImageBase64(null);
    setResult(null);
    setPhase("capture");
  }, []);

  const addToProducts = useCallback(async () => {
    if (!result?.product_id) {
      Alert.alert("Cannot Add", "No product was matched from extraction.");
      return;
    }
    try {
      await addProductMutation.mutateAsync({
        product_id: result.product_id,
        usage_frequency: "daily",
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Added", "Product added to your inventory.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch {
      Alert.alert("Error", "Could not add product. Please try again.");
    }
  }, [result, addProductMutation, router]);

  // --- Permission handling ---
  if (!permission) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!permission.granted && phase === "capture") {
    return (
      <View style={styles.center}>
        <MaterialIcons name="camera-alt" size={64} color={colors.textSecondary} />
        <Text style={styles.permissionTitle}>Camera Access Needed</Text>
        <Text style={styles.permissionBody}>
          We need camera access to scan product labels.
        </Text>
        <TouchableOpacity style={styles.primaryBtn} onPress={requestPermission}>
          <Text style={styles.primaryBtnText}>Grant Permission</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryBtn} onPress={pickFromGallery}>
          <MaterialIcons name="photo-library" size={20} color={colors.primary} />
          <Text style={styles.secondaryBtnText}>Choose from Gallery</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // --- Analyzing phase ---
  if (phase === "analyzing") {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.analyzingText}>Analyzing your product label...</Text>
        <Text style={styles.analyzingSubtext}>
          This may take a few seconds
        </Text>
      </View>
    );
  }

  // --- Results phase ---
  if (phase === "results" && result) {
    return <ResultsView result={result} onRetake={retake} onAdd={addToProducts} isAdding={addProductMutation.isPending} />;
  }

  // --- Preview phase ---
  if (phase === "preview" && photo) {
    return (
      <View style={styles.container}>
        <Image source={{ uri: photo.uri }} style={styles.previewImage} />
        <View style={styles.previewActions}>
          <TouchableOpacity style={styles.actionBtn} onPress={retake}>
            <MaterialIcons name="refresh" size={32} color={colors.surface} />
            <Text style={styles.actionBtnLabel}>Retake</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, styles.confirmActionBtn]}
            onPress={analyzeLabel}
          >
            <MaterialIcons name="search" size={32} color={colors.surface} />
            <Text style={styles.actionBtnLabel}>Analyze</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // --- Camera capture phase ---
  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} ref={cameraRef} facing="back">
        <View style={styles.overlay}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
              <MaterialIcons name="close" size={28} color={colors.surface} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Scan Label</Text>
            <TouchableOpacity onPress={pickFromGallery} style={styles.closeBtn}>
              <MaterialIcons name="photo-library" size={28} color={colors.surface} />
            </TouchableOpacity>
          </View>

          <View style={styles.guideContainer}>
            <View style={styles.labelFrame}>
              <View style={[styles.cornerTL, styles.corner]} />
              <View style={[styles.cornerTR, styles.corner]} />
              <View style={[styles.cornerBL, styles.corner]} />
              <View style={[styles.cornerBR, styles.corner]} />
            </View>
            <Text
              style={[
                styles.feedbackText,
                quality.isLevel && quality.isStable && styles.feedbackSuccess,
              ]}
            >
              {quality.feedback}
            </Text>
          </View>

          <View style={styles.controls}>
            <View style={styles.shutterContainer}>
              <TouchableOpacity
                style={[
                  styles.shutter,
                  (!quality.isLevel || !quality.isStable) && styles.shutterDisabled,
                ]}
                onPress={takePicture}
                disabled={isCapturing}
              >
                <View style={styles.shutterInner} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </CameraView>
    </View>
  );
}

// --- Results sub-component ---

function ResultsView({
  result,
  onRetake,
  onAdd,
  isAdding,
}: {
  result: LabelExtractionResponse;
  onRetake: () => void;
  onAdd: () => void;
  isAdding: boolean;
}) {
  const { extraction, interaction_flags } = result;

  return (
    <ScrollView style={styles.resultsContainer} contentContainerStyle={styles.resultsContent}>
      {/* Product header */}
      <View style={[styles.card, styles.productHeader]}>
        <MaterialIcons name="verified" size={32} color={colors.primary} />
        <View style={styles.productHeaderText}>
          {extraction.brand && (
            <Text style={styles.brandText}>{extraction.brand}</Text>
          )}
          <Text style={styles.productNameText}>
            {extraction.product_name ?? "Unknown Product"}
          </Text>
          {extraction.category && (
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryBadgeText}>{extraction.category}</Text>
            </View>
          )}
        </View>
        <ConfidenceBadge confidence={extraction.confidence} />
      </View>

      {/* Interaction flags */}
      {interaction_flags.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Interaction Alerts</Text>
          {interaction_flags.map((flag, idx) => (
            <InteractionFlagCard key={idx} flag={flag} />
          ))}
        </View>
      )}

      {/* Ingredients */}
      {extraction.ingredients.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Ingredients ({extraction.ingredients.length})
          </Text>
          <View style={styles.card}>
            {extraction.ingredients.map((ing, idx) => (
              <View
                key={idx}
                style={[
                  styles.ingredientRow,
                  idx < extraction.ingredients.length - 1 && styles.ingredientBorder,
                ]}
              >
                <Text style={styles.ingredientName}>{ing.name}</Text>
                {ing.inci_name && ing.inci_name !== ing.name && (
                  <Text style={styles.ingredientInci}>{ing.inci_name}</Text>
                )}
                <View style={styles.ingredientMeta}>
                  {ing.category && (
                    <Text style={styles.ingredientCategory}>{ing.category}</Text>
                  )}
                  {ing.concentration_hint && (
                    <Text style={styles.ingredientConcentration}>
                      {ing.concentration_hint}
                    </Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Active compounds */}
      {extraction.active_compounds.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Active Compounds</Text>
          <View style={styles.chipRow}>
            {extraction.active_compounds.map((compound, idx) => (
              <View key={idx} style={styles.chip}>
                <Text style={styles.chipText}>{compound}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Warnings */}
      {extraction.warnings.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Warnings</Text>
          <View style={[styles.card, styles.warningCard]}>
            {extraction.warnings.map((warning, idx) => (
              <View key={idx} style={styles.warningRow}>
                <MaterialIcons
                  name="warning"
                  size={16}
                  color={colors.warning}
                />
                <Text style={styles.warningText}>{warning}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Usage instructions */}
      {extraction.usage_instructions && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Usage Instructions</Text>
          <View style={styles.card}>
            <Text style={styles.usageText}>{extraction.usage_instructions}</Text>
          </View>
        </View>
      )}

      {/* Action buttons */}
      <View style={styles.resultsActions}>
        {result.product_id != null && (
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={onAdd}
            disabled={isAdding}
          >
            {isAdding ? (
              <ActivityIndicator color={colors.surface} />
            ) : (
              <>
                <MaterialIcons name="add" size={20} color={colors.surface} />
                <Text style={styles.primaryBtnText}>Add to My Products</Text>
              </>
            )}
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.secondaryBtn} onPress={onRetake}>
          <MaterialIcons name="camera-alt" size={20} color={colors.primary} />
          <Text style={styles.secondaryBtnText}>Scan Another</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function ConfidenceBadge({ confidence }: { confidence: number }) {
  const pct = Math.round(confidence * 100);
  const color = pct >= 80 ? colors.success : pct >= 50 ? colors.warning : colors.error;
  return (
    <View style={[styles.confidenceBadge, { borderColor: color }]}>
      <Text style={[styles.confidenceText, { color }]}>{pct}%</Text>
    </View>
  );
}

function InteractionFlagCard({ flag }: { flag: InteractionFlag }) {
  const severityColors: Record<InteractionFlag["severity"], { bg: string; text: string; icon: string }> = {
    low: { bg: colors.infoLight, text: colors.info, icon: colors.info },
    moderate: { bg: colors.warningLight, text: colors.amber, icon: colors.warning },
    high: { bg: colors.errorLight, text: colors.error, icon: colors.error },
  };
  const sc = severityColors[flag.severity];

  return (
    <View style={[styles.flagCard, { backgroundColor: sc.bg }]}>
      <View style={styles.flagHeader}>
        <MaterialIcons
          name={flag.severity === "high" ? "error" : flag.severity === "moderate" ? "warning" : "info"}
          size={20}
          color={sc.icon}
        />
        <Text style={[styles.flagIngredient, { color: sc.text }]}>
          {flag.ingredient_name}
        </Text>
        <View style={[styles.severityBadge, { backgroundColor: sc.text }]}>
          <Text style={styles.severityBadgeText}>{flag.severity.toUpperCase()}</Text>
        </View>
      </View>
      <Text style={styles.flagReason}>{flag.reason}</Text>
      <Text style={styles.flagRecommendation}>{flag.recommendation}</Text>
    </View>
  );
}

const CORNER_SIZE = 24;
const CORNER_THICKNESS = 3;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  camera: { flex: 1 },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
    backgroundColor: colors.background,
  },
  permissionTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  permissionBody: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: spacing.lg,
  },

  // Camera overlay
  overlay: { flex: 1, justifyContent: "space-between" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: spacing.xl * 2,
    paddingHorizontal: spacing.lg,
  },
  headerTitle: { ...typography.h3, color: colors.surface },
  closeBtn: { padding: spacing.xs },

  guideContainer: { alignItems: "center", justifyContent: "center" },
  labelFrame: {
    width: 280,
    height: 180,
    position: "relative",
  },
  corner: { position: "absolute", width: CORNER_SIZE, height: CORNER_SIZE },
  cornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: CORNER_THICKNESS,
    borderLeftWidth: CORNER_THICKNESS,
    borderColor: colors.surface,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: CORNER_THICKNESS,
    borderRightWidth: CORNER_THICKNESS,
    borderColor: colors.surface,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: CORNER_THICKNESS,
    borderLeftWidth: CORNER_THICKNESS,
    borderColor: colors.surface,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: CORNER_THICKNESS,
    borderRightWidth: CORNER_THICKNESS,
    borderColor: colors.surface,
  },
  feedbackText: {
    ...typography.bodySmall,
    color: colors.surface,
    marginTop: spacing.md,
    fontWeight: "700",
    textTransform: "uppercase",
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: "hidden",
  },
  feedbackSuccess: { color: colors.success },

  controls: { paddingBottom: spacing.xxl, alignItems: "center" },
  shutterContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  shutter: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.surface,
    padding: 4,
  },
  shutterInner: {
    flex: 1,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: "#000",
  },
  shutterDisabled: { opacity: 0.5 },

  // Preview
  previewImage: { flex: 1, resizeMode: "contain" },
  previewActions: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: spacing.xl,
    backgroundColor: "rgba(0,0,0,0.8)",
  },
  actionBtn: { alignItems: "center", gap: spacing.xs },
  actionBtnLabel: { ...typography.caption, color: colors.surface, fontWeight: "700" },
  confirmActionBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },

  // Analyzing
  analyzingText: {
    ...typography.h3,
    color: colors.textPrimary,
    marginTop: spacing.lg,
  },
  analyzingSubtext: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },

  // Results
  resultsContainer: { flex: 1, backgroundColor: colors.background },
  resultsContent: { padding: spacing.lg, paddingBottom: spacing.xxl },

  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    ...shadows.sm,
  },
  productHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
  },
  productHeaderText: { flex: 1 },
  brandText: {
    ...typography.caption,
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  productNameText: {
    ...typography.h2,
    color: colors.textPrimary,
    marginTop: 2,
  },
  categoryBadge: {
    alignSelf: "flex-start",
    backgroundColor: colors.surfaceVariant,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.xs,
    marginTop: spacing.xs,
  },
  categoryBadgeText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  confidenceBadge: {
    borderWidth: 2,
    borderRadius: borderRadius.full,
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  confidenceText: {
    ...typography.caption,
    fontWeight: "800",
  },

  // Sections
  section: { marginTop: spacing.lg },
  sectionTitle: {
    ...typography.label,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },

  // Ingredients
  ingredientRow: { paddingVertical: spacing.sm },
  ingredientBorder: { borderBottomWidth: 1, borderBottomColor: colors.divider },
  ingredientName: { ...typography.body, color: colors.textPrimary, fontWeight: "600" },
  ingredientInci: { ...typography.caption, color: colors.textSecondary, fontStyle: "italic" },
  ingredientMeta: { flexDirection: "row", gap: spacing.sm, marginTop: 2 },
  ingredientCategory: { ...typography.caption, color: colors.teal },
  ingredientConcentration: { ...typography.caption, color: colors.slate },

  // Active compounds
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  chip: {
    backgroundColor: colors.tealLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  chipText: { ...typography.caption, color: colors.teal, fontWeight: "600" },

  // Warnings
  warningCard: { backgroundColor: colors.warningLight },
  warningRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  warningText: { ...typography.bodySmall, color: colors.textPrimary, flex: 1 },

  // Usage
  usageText: { ...typography.body, color: colors.textPrimary },

  // Interaction flags
  flagCard: {
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  flagHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  flagIngredient: { ...typography.body, fontWeight: "700", flex: 1 },
  severityBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.xs,
  },
  severityBadgeText: {
    ...typography.caption,
    color: colors.surface,
    fontWeight: "800",
    fontSize: 10,
  },
  flagReason: { ...typography.bodySmall, color: colors.textPrimary, marginBottom: spacing.xs },
  flagRecommendation: { ...typography.bodySmall, color: colors.textSecondary, fontStyle: "italic" },

  // Buttons
  primaryBtn: {
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.md,
    width: "100%",
  },
  primaryBtnText: { ...typography.button, color: colors.surface },
  secondaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    width: "100%",
    marginTop: spacing.sm,
  },
  secondaryBtnText: { ...typography.button, color: colors.primary },

  resultsActions: { marginTop: spacing.xl },
});
