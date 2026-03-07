import React, { useCallback } from "react";
import { StyleSheet, Text, TouchableOpacity, View, ActivityIndicator } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { colors, typography, spacing } from "../../../src/theme";
import { useSetIntakeMode } from "../../../src/hooks/useWellness";
import { IntakeModeValue } from "../../../src/types/medical";
import { showToast } from "../../../src/providers/ToastProvider";

export default function IntakeModeSelector() {
  const router = useRouter();
  const params = useLocalSearchParams<{ sessionId: string }>();
  const sessionId = Array.isArray(params.sessionId) ? params.sessionId[0] : params.sessionId;

  const {
    mutate: setIntakeMode,
    isPending,
    syncStatus,
    syncError,
    retrySync,
  } = useSetIntakeMode();

  const handleSelectMode = useCallback((mode: IntakeModeValue, targetRoute: string) => {
    if (sessionId) {
      setIntakeMode({ sessionId, mode }, {
        onSuccess: (result) => {
          if (result?.mode === "queued") {
            showToast("success", "Queued", "Mode saved offline and queued for sync.");
          }
          router.push({
            pathname: targetRoute as any, // eslint-disable-line @typescript-eslint/no-explicit-any
            params: { sessionId }
          });
        }
      });
    } else {
      // If no session yet, just go to the screen
      router.push(targetRoute as any); // eslint-disable-line @typescript-eslint/no-explicit-any
    }
  }, [sessionId, setIntakeMode, router]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>How can we help?</Text>
      <Text style={styles.subtitle}>Choose how you'd like to start</Text>

      {syncStatus && syncStatus !== "idle" && (
        <View style={styles.syncBanner} testID="intake-mode-sync-status">
          <Text style={styles.syncText}>
            {syncStatus === "queued" && "Intake mode queued for sync."}
            {syncStatus === "syncing" && "Syncing intake mode..."}
            {syncStatus === "synced" && "Intake mode sync complete."}
            {syncStatus === "failed" && "Intake mode sync failed. Retry."}
          </Text>
          {syncStatus === "failed" && (
            <TouchableOpacity onPress={() => void retrySync()} testID="intake-mode-sync-retry-button">
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
      {syncError ? <Text style={styles.syncError}>{syncError}</Text> : null}

      <TouchableOpacity
        style={[styles.card, isPending && styles.cardDisabled]}
        onPress={() => handleSelectMode("symptom_logging", "/(auth)/intake/symptom-log")}
        disabled={isPending}
      >
        <View style={styles.cardContent}>
          <View>
            <Text style={styles.cardTitle}>Log a Symptom</Text>
            <Text style={styles.cardDesc}>Track and describe what you're experiencing</Text>
          </View>
          {isPending && <ActivityIndicator color={colors.primary} />}
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.card, isPending && styles.cardDisabled]}
        onPress={() => handleSelectMode("triage_submission", "/(auth)/intake/pre-visit")}
        disabled={isPending}
      >
        <View style={styles.cardContent}>
          <View>
            <Text style={styles.cardTitle}>Pre-Visit Check-In</Text>
            <Text style={styles.cardDesc}>Prepare information for your upcoming appointment</Text>
          </View>
          {isPending && <ActivityIndicator color={colors.primary} />}
        </View>
      </TouchableOpacity>

      {sessionId && (
        <TouchableOpacity
          style={styles.backToChat}
          onPress={() => router.push({ pathname: "/(auth)/chat/[sessionId]", params: { sessionId } } as any)} // eslint-disable-line @typescript-eslint/no-explicit-any
        >
          <Text style={styles.backToChatText}>Return to Chat</Text>
        </TouchableOpacity>
      )}
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
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
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
  card: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: 12,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardDisabled: {
    opacity: 0.6,
  },
  cardContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  cardDesc: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  backToChat: {
    marginTop: spacing.xl,
    alignItems: "center",
  },
  backToChatText: {
    ...typography.button,
    color: colors.primary,
    textDecorationLine: "underline",
  },
});
