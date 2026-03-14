import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Image,
  TouchableOpacity,
  Dimensions,
  Share,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius, shadows } from '../theme';
import { usePatientProgress } from '../hooks/useProgress';
import { useRouter } from 'expo-router';
import { safeFormat } from '../utils/dateHelpers';
import {
  SymptomTrendPoint,
  AdherenceTrendPoint,
  ProgressPhoto,
  RitualHistorySummary,
  InsightModuleTone,
} from '../api/analyticsApi';
import { WeeklyReveal } from './WeeklyReveal';
import { deriveStreakRescueState } from '../engagement/streakRescue';
import { buildPhiSafeShareMessage, buildPhiSafeShareSummary } from '../engagement/shareScaffold';
import { hapticService } from '../api/HapticService';
import { useEngagementSettings } from '../hooks/useEngagementSettings';

interface ProgressBoardProps {
  days?: number;
}

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - spacing.lg * 2 - spacing.md) / 2;

const EMPTY_RITUAL_HISTORY: RitualHistorySummary = {
  total_logs: 0,
  active_days: 0,
  current_streak: 0,
  best_streak: 0,
  recent_days: [],
};

const getInsightToneMeta = (tone: InsightModuleTone) => {
  switch (tone) {
    case "positive":
      return {
        badgeLabel: "Positive",
        iconName: "trending-up" as const,
        accentColor: colors.success,
        backgroundColor: colors.successLight,
      };
    case "attention":
      return {
        badgeLabel: "Attention",
        iconName: "priority-high" as const,
        accentColor: colors.warning,
        backgroundColor: colors.warningLight,
      };
    case "neutral":
    default:
      return {
        badgeLabel: "Neutral",
        iconName: "info-outline" as const,
        accentColor: colors.slate,
        backgroundColor: colors.slateLight,
      };
  }
};

const formatPercent = (value: number) => `${Math.round(value * 100)}%`;

const formatRoutineNames = (routineNames: string[]) =>
  routineNames.length > 0 ? routineNames.join(', ') : 'No routine names captured.';

export const ProgressBoard: React.FC<ProgressBoardProps> = ({ days = 30 }) => {
  const router = useRouter();
  const { data, isLoading, isError, refetch } = usePatientProgress(days);
  const { hapticsEnabled } = useEngagementSettings();
  const [rescueActivated, setRescueActivated] = useState(false);
  const [rescueCompleted, setRescueCompleted] = useState(false);
  const [shareStatus, setShareStatus] = useState<"idle" | "shared" | "failed">("idle");
  const [milestoneCelebrated, setMilestoneCelebrated] = useState(false);
  const summary = data?.summary;
  const symptoms = data?.symptoms ?? [];
  const adherence = data?.adherence ?? [];
  const photos = data?.photos ?? [];
  const ritualHistory = data?.ritual_history ?? EMPTY_RITUAL_HISTORY;
  const insightModules = data?.insight_modules ?? [];
  const rescue = useMemo(() => deriveStreakRescueState(adherence), [adherence]);
  const phiSafeShare = useMemo(() => (data ? buildPhiSafeShareSummary(data) : null), [data]);
  const milestoneEligible = summary ? summary.adherence_rate >= 0.8 && summary.symptom_count <= 5 : false;

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator testID="loading-indicator" size="large" color={colors.primary} />
      </View>
    );
  }

  if (isError || !data || !summary || !phiSafeShare) {
    return (
      <View style={styles.center}>
        <MaterialIcons name="error-outline" size={48} color={colors.error} />
        <Text style={styles.errorText}>Failed to load progress data</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleStartRescue = () => {
    setRescueActivated(true);
    setRescueCompleted(false);
  };

  const handleCompleteRescueStep = () => {
    setRescueCompleted(true);
    hapticService.triggerSuccess();
  };

  const handleCelebrateMilestone = () => {
    setMilestoneCelebrated(true);
    hapticService.triggerSuccess();
  };

  const handleShare = async () => {
    if (!phiSafeShare) {
      return;
    }
    try {
      await Share.share({ message: buildPhiSafeShareMessage(phiSafeShare) });
      setShareStatus("shared");
    } catch {
      setShareStatus("failed");
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <WeeklyReveal />

      <View style={styles.grid}>
        <View style={[styles.statCard, { backgroundColor: colors.success + '10' }]}>
          <MaterialIcons name="analytics" size={24} color={colors.success} />
          <Text testID="adherence-value" style={styles.statValue}>{Math.round(summary.adherence_rate * 100)}%</Text>
          <Text style={styles.statLabel}>Adherence</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.warning + '10' }]}>
          <MaterialIcons name="bug-report" size={24} color={colors.warning} />
          <Text testID="symptom-value" style={styles.statValue}>{summary.symptom_count}</Text>
          <Text style={styles.statLabel}>Symptoms</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.info + '10' }]}>
          <MaterialIcons name="photo-library" size={24} color={colors.info} />
          <Text testID="photo-value" style={styles.statValue}>{summary.photo_count}</Text>
          <Text style={styles.statLabel}>Photos</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.teal + '10' }]}>
          <MaterialIcons name="event-note" size={24} color={colors.teal} />
          <Text testID="routine-value" style={styles.statValue}>{summary.active_routines}</Text>
          <Text style={styles.statLabel}>Active Routines</Text>
        </View>
      </View>

      {rescue.rescueEligible && (
        <View style={[styles.rescueCard, rescueActivated && { backgroundColor: colors.warning + '10', borderLeftWidth: 3, borderLeftColor: colors.warning }]} testID="streak-rescue-card">
          <View style={styles.rescueHeader}>
            <MaterialIcons name="restart-alt" size={20} color={colors.primary} />
            <Text style={styles.rescueTitle}>Streak Rescue</Text>
          </View>
          <Text style={styles.rescueText}>{rescue.supportiveMessage}</Text>
          <Text style={styles.rescueMeta}>
            Missed days this week: {rescue.missedDays}. Target: {rescue.rescueTarget}
          </Text>
          {!rescueActivated ? (
            <TouchableOpacity style={styles.rescueButton} onPress={handleStartRescue} testID="streak-rescue-start-button">
              <Text style={styles.rescueButtonText}>Start Rescue</Text>
            </TouchableOpacity>
          ) : !rescueCompleted ? (
            <TouchableOpacity style={styles.rescueButton} onPress={handleCompleteRescueStep} testID="streak-rescue-complete-button">
              <Text style={styles.rescueButtonText}>Mark Rescue Step Done</Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.rescueSuccess} testID="streak-rescue-success">
              Rescue completed. Keep momentum with one action tomorrow.
            </Text>
          )}
        </View>
      )}

      {milestoneEligible && (
        <View style={[styles.milestoneCard, { backgroundColor: colors.success + '10' }, milestoneCelebrated && { borderLeftWidth: 3, borderLeftColor: colors.success }]}>
          <View style={styles.rescueHeader}>
            <MaterialIcons name="emoji-events" size={20} color={colors.success} />
            <Text style={styles.milestoneTitle}>Milestone Reached</Text>
          </View>
          <Text style={styles.rescueText}>You maintained strong adherence this period.</Text>
          <TouchableOpacity
            style={styles.milestoneButton}
            onPress={handleCelebrateMilestone}
            testID="milestone-celebrate-button"
          >
            <Text style={styles.rescueButtonText}>
              {milestoneCelebrated ? "Milestone Celebrated" : "Celebrate Milestone"}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Symptom Severity</Text>
        {symptoms.length > 0 ? (
          <View style={styles.chartContainer}>
            <View style={styles.chartArea}>
              {symptoms.map((point: SymptomTrendPoint, index: number) => (
                <TouchableOpacity 
                  key={index} 
                  style={styles.barWrapper}
                  onPress={() => router.push({ pathname: "/(auth)/timeline", params: { date: point.date } })}
                >
                  <View 
                    style={[
                      styles.bar, 
                      { height: (point.severity / 5) * 100 },
                      point.severity >= 4 ? { backgroundColor: colors.error } :
                      point.severity >= 3 ? { backgroundColor: colors.warning } :
                      { backgroundColor: colors.infoLight }
                    ]} 
                  />
                  <Text style={styles.barLabel}>{safeFormat(point.date, 'MM/dd')}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : (
          <Text style={styles.emptyText}>No symptoms logged in this period.</Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Routine Adherence</Text>
        {adherence.length > 0 ? (
          <View style={styles.chartContainer}>
            <View style={styles.chartArea}>
              {adherence.map((point: AdherenceTrendPoint, index: number) => (
                <TouchableOpacity 
                  key={index} 
                  style={styles.barWrapper}
                  onPress={() => router.push({ pathname: "/(auth)/timeline", params: { date: point.date } })}
                >
                  <View 
                    style={[
                      styles.bar, 
                      { height: point.rate * 100, backgroundColor: colors.success }
                    ]} 
                  />
                  <Text style={styles.barLabel}>{safeFormat(point.date, 'MM/dd')}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : (
          <Text style={styles.emptyText}>No routine activity logged.</Text>
        )}
      </View>

      <View style={styles.section} testID="insight-pack-section">
        <Text style={styles.sectionTitle}>Insight Pack</Text>
        {insightModules.length > 0 ? (
          <View style={styles.insightStack}>
            {insightModules.map((module) => {
              const toneMeta = getInsightToneMeta(module.tone);

              return (
                <View
                  key={module.key}
                  style={[
                    styles.insightCard,
                    {
                      backgroundColor: toneMeta.backgroundColor,
                      borderColor: toneMeta.accentColor,
                    },
                  ]}
                  testID={`insight-module-${module.key}`}
                >
                  <View style={styles.insightHeader}>
                    <View style={styles.insightTitleRow}>
                      <MaterialIcons name={toneMeta.iconName} size={18} color={toneMeta.accentColor} />
                      <Text style={styles.insightTitle}>{module.title}</Text>
                    </View>
                    <View style={[styles.insightToneBadge, { backgroundColor: colors.surface }]}>
                      <Text style={[styles.insightToneText, { color: toneMeta.accentColor }]}>
                        {toneMeta.badgeLabel}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.insightValue}>{module.value}</Text>
                  <Text style={styles.insightDetail}>{module.detail}</Text>
                </View>
              );
            })}
          </View>
        ) : (
          <Text style={styles.emptyText}>No insights available yet.</Text>
        )}
      </View>

      <View style={styles.section} testID="ritual-history-section">
        <Text style={styles.sectionTitle}>Ritual History</Text>
        <View style={styles.ritualSummaryGrid}>
          <View style={styles.ritualMetricCard}>
            <Text style={styles.ritualMetricValue}>{ritualHistory.total_logs}</Text>
            <Text style={styles.ritualMetricLabel}>Total Logs</Text>
          </View>
          <View style={styles.ritualMetricCard}>
            <Text style={styles.ritualMetricValue}>{ritualHistory.active_days}</Text>
            <Text style={styles.ritualMetricLabel}>Active Days</Text>
          </View>
          <View style={styles.ritualMetricCard}>
            <Text style={styles.ritualMetricValue}>{ritualHistory.current_streak}</Text>
            <Text style={styles.ritualMetricLabel}>Current Streak</Text>
          </View>
          <View style={styles.ritualMetricCard}>
            <Text style={styles.ritualMetricValue}>{ritualHistory.best_streak}</Text>
            <Text style={styles.ritualMetricLabel}>Best Streak</Text>
          </View>
        </View>
        {ritualHistory.recent_days.length > 0 ? (
          <View style={styles.ritualDaysList}>
            {ritualHistory.recent_days.map((day) => (
              <TouchableOpacity
                key={day.date}
                style={styles.ritualDayCard}
                onPress={() => router.push({ pathname: "/(auth)/timeline", params: { date: day.date } })}
              >
                <View style={styles.ritualDayHeader}>
                  <Text style={styles.ritualDayDate}>{safeFormat(day.date, 'EEE, MMM d')}</Text>
                  <Text style={styles.ritualDayRate}>{formatPercent(day.avg_completion_rate)}</Text>
                </View>
                <Text style={styles.ritualDayMeta}>
                  {day.completed_count} completions logged
                </Text>
                <Text style={styles.ritualDayRoutines}>{formatRoutineNames(day.routine_names)}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <Text style={styles.emptyText}>No ritual history captured yet.</Text>
        )}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Progress Photos</Text>
          <TouchableOpacity onPress={() => router.push("/(auth)/timeline")}>
            <Text style={styles.viewAll}>View All</Text>
          </TouchableOpacity>
        </View>
        {photos.length > 0 ? (
          <View style={styles.photoListContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoList}>
              {photos.map((photo: ProgressPhoto) => (
                <TouchableOpacity
                  key={photo.id}
                  style={styles.photoWrapper}
                  onPress={() => router.push("/(auth)/timeline")}
                >
                  <Image source={{ uri: photo.url }} style={styles.photo} />
                  <Text style={styles.photoDate}>{safeFormat(photo.timestamp, 'MMM dd')}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        ) : (
          <Text style={styles.emptyText}>No photos captured yet.</Text>
        )}
      </View>

      <View style={styles.shareDivider} />
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>PHI-Safe Share Card</Text>
        <View style={styles.shareCard} testID="phi-safe-share-card">
          <Text style={styles.shareTitle}>{phiSafeShare.title}</Text>
          <Text style={styles.shareLine}>Period: {phiSafeShare.periodDays} days</Text>
          <Text style={styles.shareLine}>Adherence: {phiSafeShare.adherencePercent}%</Text>
          <Text style={styles.shareLine}>Symptom check-ins: {phiSafeShare.symptomCheckins}</Text>
          <Text style={styles.shareLine}>Photo entries: {phiSafeShare.photoEntries}</Text>
          <Text style={styles.shareLine}>Active routines: {phiSafeShare.activeRoutines}</Text>
          <Text style={styles.shareLine}>Trend: {phiSafeShare.trendNote}</Text>
          <Text style={styles.shareHint}>
            Excludes identifiers, session IDs, photo URLs, and clinical narrative.
          </Text>
          <TouchableOpacity style={styles.shareButton} onPress={handleShare} testID="phi-safe-share-button">
            <Text style={styles.rescueButtonText}>Share Snapshot</Text>
          </TouchableOpacity>
          {shareStatus === "shared" && (
            <Text style={styles.shareSuccess} testID="phi-safe-share-status">
              Shared safely.
            </Text>
          )}
          {shareStatus === "failed" && (
            <Text style={[styles.shareSuccess, { color: colors.error }]} testID="phi-safe-share-status">
              Share failed.
            </Text>
          )}
          {!hapticsEnabled && (
            <Text style={styles.hapticsOffNote}>Haptics are disabled in Settings.</Text>
          )}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 200,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  statCard: {
    width: CARD_WIDTH,
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    alignItems: 'center',
    ...shadows.sm,
  },
  statValue: {
    ...typography.h2,
    color: colors.textPrimary,
    marginTop: spacing.xs,
  },
  statLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  rescueCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: spacing.md,
    marginBottom: spacing.lg,
    gap: spacing.xs,
  },
  rescueHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  rescueTitle: {
    ...typography.label,
    color: colors.textPrimary,
    fontWeight: "700",
  },
  milestoneTitle: {
    ...typography.label,
    color: colors.success,
    fontWeight: "700",
  },
  rescueText: {
    ...typography.bodySmall,
    color: colors.textPrimary,
  },
  rescueMeta: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  rescueButton: {
    alignSelf: "flex-start",
    backgroundColor: colors.primary,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginTop: spacing.xs,
  },
  milestoneButton: {
    alignSelf: "flex-start",
    backgroundColor: colors.success,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginTop: spacing.xs,
  },
  rescueButtonText: {
    ...typography.label,
    color: colors.surface,
    fontWeight: "700",
  },
  rescueSuccess: {
    ...typography.bodySmall,
    color: colors.success,
    fontWeight: "600",
    marginTop: spacing.xs,
  },
  milestoneCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.success,
    padding: spacing.md,
    marginBottom: spacing.lg,
    gap: spacing.xs,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  insightStack: {
    gap: spacing.md,
  },
  insightCard: {
    borderRadius: borderRadius.md,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.sm,
    ...shadows.sm,
  },
  insightHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
  },
  insightTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flex: 1,
  },
  insightTitle: {
    ...typography.label,
    color: colors.textPrimary,
    fontWeight: '700',
    flex: 1,
  },
  insightToneBadge: {
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  insightToneText: {
    ...typography.caption,
    fontWeight: '700',
  },
  insightValue: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  insightDetail: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  chartContainer: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    height: 180,
    ...shadows.sm,
  },
  chartArea: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    paddingTop: spacing.md,
    backgroundColor: colors.surfaceVariant,
    borderRadius: borderRadius.sm,
  },
  barWrapper: {
    alignItems: 'center',
    flex: 1,
  },
  bar: {
    width: 12,
    borderRadius: borderRadius.xs,
    minHeight: spacing.xs,
  },
  barLabel: {
    fontSize: typography.caption.fontSize,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  ritualSummaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  ritualMetricCard: {
    width: CARD_WIDTH,
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: spacing.md,
    ...shadows.sm,
  },
  ritualMetricValue: {
    ...typography.h2,
    color: colors.textPrimary,
  },
  ritualMetricLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  ritualDaysList: {
    gap: spacing.sm,
  },
  ritualDayCard: {
    backgroundColor: colors.surfaceVariant,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: spacing.md,
    gap: spacing.xs,
  },
  ritualDayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
  },
  ritualDayDate: {
    ...typography.label,
    color: colors.textPrimary,
    fontWeight: '700',
    flex: 1,
  },
  ritualDayRate: {
    ...typography.label,
    color: colors.success,
    fontWeight: '700',
  },
  ritualDayMeta: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  ritualDayRoutines: {
    ...typography.bodySmall,
    color: colors.textPrimary,
  },
  photoListContainer: {
    backgroundColor: colors.surfaceVariant,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
  },
  photoList: {
    flexDirection: 'row',
  },
  photoWrapper: {
    marginRight: spacing.md,
    alignItems: 'center',
  },
  photo: {
    width: 100,
    height: 100,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.surfaceVariant,
  },
  photoDate: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  viewAll: {
    ...typography.bodySmall,
    color: colors.secondary,
    fontWeight: '600',
  },
  emptyText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
    padding: spacing.lg,
  },
  errorText: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  retryButton: {
    marginTop: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.primary,
  },
  retryText: {
    color: colors.surface,
    fontWeight: '600',
  },
  shareDivider: {
    height: 1,
    backgroundColor: colors.divider,
    marginBottom: spacing.xl,
  },
  shareCard: {
    backgroundColor: colors.surfaceVariant,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: spacing.md,
    gap: spacing.xs,
  },
  shareTitle: {
    ...typography.label,
    color: colors.textPrimary,
    fontWeight: "700",
  },
  shareLine: {
    ...typography.bodySmall,
    color: colors.textPrimary,
  },
  shareHint: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  shareButton: {
    alignSelf: "flex-start",
    backgroundColor: colors.primary,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginTop: spacing.xs,
  },
  shareSuccess: {
    ...typography.caption,
    color: colors.success,
    fontWeight: "600",
  },
  hapticsOffNote: {
    ...typography.caption,
    color: colors.textSecondary,
    fontStyle: "italic",
  },
});
