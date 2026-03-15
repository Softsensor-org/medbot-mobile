import React, { useCallback, useState } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  FlatList,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { formatDistanceToNow } from "date-fns";
import { MaterialIcons } from "@expo/vector-icons";
import { colors, typography, spacing, shadows } from "../../../src/theme";
import { useCreateSession, useSessions } from "../../../src/hooks/useSessions";
import { usePatientProfile, useUpdateRecoveryFollowUp } from "../../../src/hooks/useUser";
import { SessionMeta } from "../../../src/api/sessionsApi";
import { colorFor } from "../../../src/status/statusHelpers";
import { ReadinessChecklist } from "../../../src/components/ReadinessChecklist";
import RecoveryFollowUpCard from "../../../src/components/RecoveryFollowUpCard";

const JOURNEY_STAGE_COPY = {
  prep: "Prep phase: confirm your setup, products, and readiness items before treatment ramps up.",
  treatment: "Treatment phase: stay steady with the plan and keep logging how your skin responds.",
  recovery: "Recovery phase: use gentle care and track healing cues for your provider.",
  maintenance: "Maintenance phase: keep gains stable with lighter upkeep and routine follow-through.",
  next_step: "Next-step phase: review this phase and confirm what comes next with your care team.",
} as const;

function titleize(value?: string | null) {
  if (!value) {
    return "Not set yet";
  }
  return value
    .split(/[-_]/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default function CareScreen() {
  const router = useRouter();
  const { data, isLoading, isError, refetch, isRefetching } = useSessions();
  const { data: patientProfile } = usePatientProfile();
  const updateRecoveryFollowUp = useUpdateRecoveryFollowUp();
  const { mutateAsync: createSession, isPending: isBootstrapping } = useCreateSession();
  const [bootstrapError, setBootstrapError] = useState<string | null>(null);
  const journeyStage = patientProfile?.program_context?.journey_stage?.stage ?? "prep";
  const journeyStageLabel = titleize(journeyStage);
  const recoveryFollowUp = patientProfile?.program_context?.recovery_follow_up;
  const shouldShowRecoveryFollowUp = Boolean(
    recoveryFollowUp && (
      recoveryFollowUp.status !== "not_started" ||
      patientProfile?.program_context?.treatment_plan?.status !== "inactive" ||
      journeyStage !== "prep"
    )
  );

  const navigateToIntake = useCallback((sessionId: string) => {
    router.push({
      pathname: "/(auth)/intake",
      params: { sessionId },
    } as any); // eslint-disable-line @typescript-eslint/no-explicit-any
  }, [router]);

  const handleStartNewSession = useCallback(async () => {
    if (isBootstrapping) return;
    setBootstrapError(null);

    // IMP-161: data is now a bare SessionMeta[] from backend
    const reusable = data?.find((session) =>
      session.status === "new" || session.status === "waiting",
    );
    if (reusable?.session_id) {
      navigateToIntake(reusable.session_id);
      return;
    }

    try {
      const { sessionId } = await createSession({});
      navigateToIntake(sessionId);
    } catch {
      setBootstrapError("Unable to start a session right now. Please retry.");
    }
  }, [createSession, data, isBootstrapping, navigateToIntake]);

  const onRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const renderSessionCard = ({ item }: { item: SessionMeta }) => {
    // IMP-161: triage_label is not in backend SessionMeta; use status for display
    const statusColor = colorFor(item.status);
    const dateStr = item.last_message_at || item.updated_at || item.created_at;
    const relativeTime = dateStr 
      ? formatDistanceToNow(new Date(dateStr), { addSuffix: true })
      : "Recently";

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push(`/(auth)/chat/${item.session_id}`)}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.triageBadge, { backgroundColor: statusColor }]}>
            <Text style={styles.triageText}>
              {(item.status || "Pending").replace("_", " ")}
            </Text>
          </View>
          <Text style={styles.timestamp}>{relativeTime}</Text>
        </View>

        <View style={styles.cardBody}>
          <Text style={styles.sessionStatus}>
            Status: <Text style={styles.statusValue}>{item.status}</Text>
          </Text>
          <Text style={styles.sessionId} numberOfLines={1}>
            ID: {item.session_id}
          </Text>
        </View>

        <View style={styles.cardFooter}>
          <Text style={styles.resumeText}>Resume consultation</Text>
          <MaterialIcons name="chevron-right" size={20} color={colors.textSecondary} />
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <MaterialIcons name="chat-bubble-outline" size={64} color={colors.textDisabled} />
      <Text style={styles.emptyTitle}>No sessions yet</Text>
      <Text style={styles.emptySubtitle}>
        Start a new consultation to get medical guidance.
      </Text>
      <TouchableOpacity
        testID="start-session-empty-button"
        style={[styles.emptyButton, isBootstrapping && styles.disabledButton]}
        onPress={handleStartNewSession}
        disabled={isBootstrapping}
      >
        <Text style={styles.emptyButtonText}>
          {isBootstrapping ? "Starting..." : "Start New Session"}
        </Text>
      </TouchableOpacity>

      {bootstrapError && (
        <View style={styles.bootstrapErrorBox}>
          <Text style={styles.bootstrapErrorText}>{bootstrapError}</Text>
          <TouchableOpacity
            testID="start-session-retry-button"
            style={styles.retryButton}
            onPress={handleStartNewSession}
            disabled={isBootstrapping}
          >
            <Text style={styles.retryButtonText}>Retry start</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  if (isLoading && !isRefetching) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.center}>
        <MaterialIcons name="error-outline" size={48} color={colors.error} />
        <Text style={styles.errorText}>Failed to load sessions</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Care</Text>
          <Text style={styles.subtitle}>Your care sessions and history</Text>
        </View>
        <TouchableOpacity
          testID="start-session-button"
          style={[styles.headerButton, isBootstrapping && styles.disabledButton]}
          onPress={handleStartNewSession}
          disabled={isBootstrapping}
        >
          {isBootstrapping ? (
            <ActivityIndicator color={colors.surface} size="small" />
          ) : (
            <MaterialIcons name="add" size={24} color={colors.surface} />
          )}
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        testID="label-scan-button"
        style={styles.scanCard}
        onPress={() => router.push("/(auth)/label-scan")}
        activeOpacity={0.8}
      >
        <View style={styles.scanCardCopy}>
          <Text style={styles.scanEyebrow}>Inventory tools</Text>
          <Text style={styles.scanTitle}>Scan Product Label</Text>
          <Text style={styles.scanBody}>
            Capture an ingredient label and add recognized products to your inventory.
          </Text>
        </View>
        <MaterialIcons name="document-scanner" size={26} color={colors.primary} />
      </TouchableOpacity>

      <View style={styles.stageCard}>
        <View style={styles.stageHeader}>
          <View>
            <Text style={styles.stageEyebrow}>Journey stage</Text>
            <Text style={styles.stageTitle}>{journeyStageLabel}</Text>
          </View>
          <MaterialIcons name="timeline" size={22} color={colors.primary} />
        </View>
        <Text style={styles.stageBody}>{JOURNEY_STAGE_COPY[journeyStage]}</Text>
      </View>

      {journeyStage === "prep" && (
        <View style={styles.readinessWrapper}>
          <ReadinessChecklist />
        </View>
      )}

      {shouldShowRecoveryFollowUp && recoveryFollowUp ? (
        <View style={styles.recoveryCardWrap}>
          <RecoveryFollowUpCard
            recovery={recoveryFollowUp}
            journeyStageLabel={journeyStageLabel}
            treatmentPlanName={patientProfile?.program_context?.treatment_plan?.name}
            isSaving={updateRecoveryFollowUp.isPending}
            error={updateRecoveryFollowUp.isError ? "Failed to save recovery update. Please try again." : null}
            onSubmit={(payload) => updateRecoveryFollowUp.mutateAsync(payload)}
          />
        </View>
      ) : null}

      <FlatList
        data={data}
        renderItem={renderSessionCard}
        keyExtractor={(item) => item.session_id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
  },
  headerButton: {
    backgroundColor: colors.primary,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    ...shadows.md,
  },
  disabledButton: {
    opacity: 0.6,
  },
  title: {
    ...typography.h2,
    color: colors.textPrimary,
  },
  subtitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  listContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    flexGrow: 1,
  },
  scanCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
    backgroundColor: colors.surface,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    ...shadows.sm,
  },
  scanCardCopy: {
    flex: 1,
    gap: spacing.xxs,
    paddingRight: spacing.md,
  },
  scanEyebrow: {
    ...typography.caption,
    color: colors.primary,
    textTransform: "uppercase",
  },
  scanTitle: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  scanBody: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  stageCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
    backgroundColor: colors.surfaceElevated,
    gap: spacing.xs,
    ...shadows.sm,
  },
  recoveryCardWrap: {
    marginHorizontal: spacing.lg,
  },
  stageHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  stageEyebrow: {
    ...typography.caption,
    color: colors.primary,
    textTransform: "uppercase",
  },
  stageTitle: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  stageBody: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  readinessWrapper: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.sm,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  triageBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  triageText: {
    ...typography.caption,
    fontWeight: "700",
    color: colors.surface,
    textTransform: "uppercase",
  },
  timestamp: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  cardBody: {
    marginBottom: spacing.md,
  },
  sessionStatus: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  statusValue: {
    fontWeight: "600",
    color: colors.textPrimary,
    textTransform: "capitalize",
  },
  sessionId: {
    ...typography.caption,
    color: colors.textDisabled,
    fontSize: 10,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    paddingTop: spacing.sm,
  },
  resumeText: {
    ...typography.label,
    color: colors.primary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: spacing.xxl * 2,
  },
  emptyTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginTop: spacing.md,
  },
  emptySubtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: spacing.xs,
    paddingHorizontal: spacing.xl,
  },
  emptyButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: 12,
    marginTop: spacing.xl,
  },
  emptyButtonText: {
    ...typography.button,
    color: colors.surface,
  },
  bootstrapErrorBox: {
    marginTop: spacing.md,
    alignItems: "center",
    paddingHorizontal: spacing.md,
  },
  bootstrapErrorText: {
    ...typography.bodySmall,
    color: colors.error,
    marginBottom: spacing.sm,
    textAlign: "center",
  },
  errorText: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  retryButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  retryButtonText: {
    ...typography.label,
    color: colors.primary,
  },
});
