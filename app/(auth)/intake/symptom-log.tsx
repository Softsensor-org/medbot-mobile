import React, { useState, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { colors, typography, spacing, borderRadius, shadows } from "../../../src/theme";
import { useSymptomTypes, useLogSymptom } from "../../../src/hooks/useSymptomLogging";
import { SymptomType, Symptom } from "../../../src/types/medical";
import { showToast } from "../../../src/providers/ToastProvider";
import { ChipSelect } from "../../../src/components/common/ChipSelect";
import { hapticService } from "../../../src/api/HapticService";

type SymptomLogPayload = Omit<Symptom, "id" | "created_at"> & { session_id?: string };

export default function SymptomLogScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ sessionId: string }>();
  const sessionId = Array.isArray(params.sessionId) ? params.sessionId[0] : params.sessionId;

  const { data: symptomTypes, isLoading: isLoadingTypes } = useSymptomTypes();
  const {
    mutate: logSymptom,
    isPending: isSubmitting,
    syncStatus,
    syncError,
    retrySync,
  } = useLogSymptom();

  const [selectedType, setSelectedType] = useState<SymptomType | null>(null);
  const [severity, setSeverity] = useState<number>(3);
  const [notes, setNotes] = useState("");
  const canSubmit = Boolean(selectedType) && !isSubmitting;

  const handleSubmit = useCallback(() => {
    if (!selectedType) {
      showToast("error", "Error", "Please select a symptom type");
      return;
    }

    const payload: SymptomLogPayload = {
      symptom_type_id: selectedType.id,
      severity,
      description: selectedType.name,
      notes,
      occurred_at: new Date().toISOString(),
      ...(sessionId ? { session_id: sessionId } : {}),
    };

    logSymptom(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      payload as any,
      {
        onSuccess: (result) => {
          hapticService.triggerSuccess();
          if (result?.mode === "queued") {
            showToast("success", "Queued", "Saved offline. We will sync this symptom automatically.");
          } else {
            showToast("success", "Success", "Symptom logged successfully");
          }
          if (sessionId) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            router.push({ pathname: "/(auth)/chat/[sessionId]", params: { sessionId } } as any);
          } else {
            router.back();
          }
        },
        onError: (error) => {
          showToast("error", "Error", "Failed to log symptom");
          console.error("Log symptom error:", error);
        },
      }
    );
  }, [selectedType, severity, notes, logSymptom, router, sessionId]);

  const handleSeverityChange = (num: number) => {
    hapticService.triggerSelection();
    setSeverity(num);
  };

  const symptomOptions = (symptomTypes || []).map(t => ({
    value: t.id,
    label: t.name,
  }));

  if (isLoadingTypes) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
          <MaterialIcons name="close" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Log Symptom</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {syncStatus && syncStatus !== "idle" && (
          <View style={styles.syncBanner} testID="symptom-sync-status">
            <Text style={styles.syncText}>
              {syncStatus === "queued" && "Symptom saved offline and queued for sync."}
              {syncStatus === "syncing" && "Syncing queued symptom..."}
              {syncStatus === "synced" && "Symptom sync complete."}
              {syncStatus === "failed" && "Symptom sync failed. Retry."}
            </Text>
            {syncStatus === "failed" && (
              <TouchableOpacity onPress={() => void retrySync()} testID="symptom-sync-retry-button">
                <Text style={styles.retryText}>Retry</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {syncError ? <Text style={styles.syncError}>{syncError}</Text> : null}

        <ChipSelect
          label="What symptom are you experiencing?"
          options={symptomOptions}
          selectedValue={selectedType?.id || null}
          onSelect={(id) => {
            if (id === null) {
              setSelectedType(null);
              return;
            }
            const type = symptomTypes?.find(t => t.id === id);
            if (type) setSelectedType(type);
          }}
          horizontal={true}
          allowDeselect={true}
        />
        {selectedType ? (
          <TouchableOpacity style={styles.clearSelectionButton} onPress={() => setSelectedType(null)}>
            <Text style={styles.clearSelectionText}>Clear symptom selection</Text>
          </TouchableOpacity>
        ) : (
          <Text style={styles.selectionHint}>Select a symptom to log, or skip for now.</Text>
        )}

        <Text style={styles.label}>How severe is it? (1-5)</Text>
        <View style={styles.severityContainer}>
          {[1, 2, 3, 4, 5].map((num) => (
            <TouchableOpacity
              key={num}
              style={[
                styles.severityButton,
                severity === num && styles.severityButtonSelected,
              ]}
              onPress={() => handleSeverityChange(num)}
            >
              <Text
                style={[
                  styles.severityButtonText,
                  severity === num && styles.severityButtonTextSelected,
                ]}
              >
                {num}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.severityLabels}>
          <Text style={styles.caption}>Mild</Text>
          <Text style={styles.caption}>Severe</Text>
        </View>

        <Text style={styles.label}>Notes (Optional)</Text>
        <TextInput
          style={styles.textArea}
          placeholder="Add any additional details..."
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={4}
          maxLength={500}
        />

        <TouchableOpacity
          style={[styles.submitButton, !canSubmit && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={!canSubmit}
        >
          {isSubmitting ? (
            <ActivityIndicator color={colors.surface} />
          ) : (
            <Text style={styles.submitButtonText}>Log Symptom</Text>
          )}
        </TouchableOpacity>
        {!selectedType ? (
          <TouchableOpacity style={styles.skipButton} onPress={() => router.back()}>
            <Text style={styles.skipButtonText}>Skip for now</Text>
          </TouchableOpacity>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  headerTitle: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  iconButton: {
    padding: spacing.xs,
  },
  scrollContent: {
    padding: spacing.md,
  },
  syncBanner: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    gap: spacing.xs,
  },
  syncText: {
    ...typography.bodySmall,
    color: colors.textPrimary,
  },
  retryText: {
    ...typography.label,
    color: colors.primary,
  },
  syncError: {
    ...typography.caption,
    color: colors.error,
    marginBottom: spacing.sm,
  },
  label: {
    ...typography.label,
    color: colors.textPrimary,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  severityContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing.xs,
  },
  severityButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.surface,
  },
  severityButtonSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  severityButtonText: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  severityButtonTextSelected: {
    color: colors.surface,
  },
  severityLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  caption: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  selectionHint: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  clearSelectionButton: {
    alignSelf: "flex-start",
    marginTop: spacing.xs,
  },
  clearSelectionText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: "600",
  },
  textArea: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    height: 120,
    textAlignVertical: "top",
    ...typography.body,
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: "center",
    marginTop: spacing.xl,
    marginBottom: spacing.xxl,
    ...shadows.md,
  },
  submitButtonDisabled: {
    backgroundColor: colors.textDisabled,
  },
  submitButtonText: {
    ...typography.button,
    color: colors.surface,
  },
  skipButton: {
    marginTop: spacing.sm,
    alignItems: "center",
    paddingVertical: spacing.sm,
  },
  skipButtonText: {
    ...typography.label,
    color: colors.textSecondary,
  },
});
