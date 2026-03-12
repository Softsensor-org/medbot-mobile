import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { colors, typography, spacing, borderRadius, shadows } from '../theme';
import type { DailySummaryResponse } from '../types/medical';
import { medicalApi } from '../api/medicalApi';

interface DailySummaryProps {
  days?: number;
  patientId?: string;
}

const trendConfig = {
  improving: { icon: 'trending-down-outline' as const, color: colors.success, label: 'Improving' },
  stable: { icon: 'remove-outline' as const, color: colors.info, label: 'Stable' },
  declining: { icon: 'trending-up-outline' as const, color: colors.error, label: 'Declining' },
};

export const DailySummary: React.FC<DailySummaryProps> = ({ days = 7, patientId }) => {
  const { data, isLoading, isError } = useQuery<DailySummaryResponse>({
    queryKey: ['daily-summary', days, patientId],
    queryFn: () => medicalApi.getDailySummary(days, patientId),
    staleTime: 30_000,
  });

  if (isLoading) {
    return <ActivityIndicator color={colors.primary} style={{ margin: spacing.xl }} testID="daily-summary-loading" />;
  }

  if (isError || !data) {
    return <Text style={styles.errorText}>Unable to load daily summary.</Text>;
  }

  const adherencePct = Math.round(data.adherence_rate * 100);
  const trendInfo = trendConfig[data.trend] || trendConfig.stable;

  return (
    <View style={styles.card} testID="daily-summary-card">
      <Text style={styles.cardTitle}>Daily Summary</Text>
      <Text style={styles.periodText}>Last {data.period_days} days</Text>

      {/* Adherence bar */}
      <View style={styles.adherenceSection}>
        <View style={styles.adherenceHeader}>
          <Text style={styles.label}>Routine Adherence</Text>
          <Text style={[
            styles.adherencePct,
            { color: adherencePct >= 80 ? colors.success : adherencePct >= 50 ? colors.warning : colors.error },
          ]}>
            {adherencePct}%
          </Text>
        </View>
        <View style={styles.progressBarBg}>
          <View style={[
            styles.progressBarFill,
            {
              width: `${Math.min(adherencePct, 100)}%`,
              backgroundColor: adherencePct >= 80 ? colors.success : adherencePct >= 50 ? colors.warning : colors.error,
            },
          ]} />
        </View>
        <Text style={styles.routineDetail}>
          {data.routine_completion_count} of {data.routine_total_count} routines completed
        </Text>
      </View>

      {/* Stats row */}
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Ionicons name={trendInfo.icon} size={20} color={trendInfo.color} />
          <Text style={styles.statValue}>{trendInfo.label}</Text>
          <Text style={styles.statLabel}>TREND</Text>
        </View>
        <View style={styles.statBox}>
          <Ionicons name="medkit-outline" size={20} color={colors.error} />
          <Text style={styles.statValue}>{data.symptom_count}</Text>
          <Text style={styles.statLabel}>SYMPTOMS</Text>
        </View>
        <View style={styles.statBox}>
          <Ionicons name="checkmark-circle-outline" size={20} color={colors.success} />
          <Text style={styles.statValue}>{data.routine_completion_count}</Text>
          <Text style={styles.statLabel}>COMPLETED</Text>
        </View>
      </View>

      {/* Severity trend */}
      {data.severity_trend.length > 0 && (
        <View style={styles.trendSection}>
          <Text style={styles.label}>Severity by Day</Text>
          {data.severity_trend.map((point) => (
            <View key={point.date} style={styles.trendRow}>
              <Text style={styles.trendDate}>{point.date}</Text>
              <Text style={styles.trendValue}>{point.avg_severity.toFixed(1)}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginVertical: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.md,
  },
  cardTitle: {
    ...typography.h2,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  periodText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  adherenceSection: {
    marginBottom: spacing.md,
  },
  adherenceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  label: {
    ...typography.label,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  adherencePct: {
    ...typography.label,
    fontWeight: '800',
  },
  progressBarBg: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.borderLight,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 8,
    borderRadius: 4,
  },
  routineDetail: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: borderRadius.md,
  },
  statValue: {
    ...typography.label,
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: 4,
  },
  statLabel: {
    ...typography.caption,
    fontSize: 9,
    color: colors.textSecondary,
    letterSpacing: 0.5,
    marginTop: 2,
  },
  trendSection: {
    marginTop: spacing.sm,
  },
  trendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  trendDate: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  trendValue: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  errorText: {
    ...typography.bodySmall,
    color: colors.error,
    textAlign: 'center',
    margin: spacing.md,
  },
});
