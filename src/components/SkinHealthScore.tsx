import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { colors, typography, spacing, borderRadius, shadows } from '../theme';
import type { SkinHealthScoreResponse, ScoreComponent } from '../types/medical';
import { medicalApi } from '../api/medicalApi';

interface SkinHealthScoreProps {
  days?: number;
}

const trendConfig = {
  improving: { icon: 'trending-up-outline' as const, color: colors.success, label: 'Improving' },
  stable: { icon: 'remove-outline' as const, color: colors.info, label: 'Stable' },
  declining: { icon: 'trending-down-outline' as const, color: colors.error, label: 'Declining' },
};

function getScoreColor(score: number): string {
  if (score >= 70) return colors.success;
  if (score >= 40) return colors.warning;
  return colors.error;
}

const componentLabels: Record<string, string> = {
  symptom_trend: 'Symptom Trend',
  adherence: 'Routine Adherence',
  intervention_consistency: 'Engagement Consistency',
  flare_recency: 'Flare Recency',
};

export const SkinHealthScore: React.FC<SkinHealthScoreProps> = ({ days = 28 }) => {
  const [expanded, setExpanded] = useState(false);

  const { data, isLoading, isError } = useQuery<SkinHealthScoreResponse>({
    queryKey: ['skin-score', days],
    queryFn: () => medicalApi.getSkinScore(days),
    staleTime: 30_000,
  });

  if (isLoading) {
    return <ActivityIndicator color={colors.primary} style={{ margin: spacing.xl }} testID="skin-score-loading" />;
  }

  if (isError || !data) {
    return <Text style={styles.errorText}>Unable to load skin health score.</Text>;
  }

  const trendInfo = trendConfig[data.trend] || trendConfig.stable;
  const scoreColor = getScoreColor(data.score);

  // Circular progress dimensions
  const circleSize = 140;
  const strokeWidth = 10;
  const radius = (circleSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const _progressOffset = circumference - (data.score / 100) * circumference;

  return (
    <View style={styles.card} testID="skin-score-card">
      <Text style={styles.cardTitle}>Skin Health Score</Text>
      <Text style={styles.periodText}>Last {data.period_days} days</Text>

      {/* Radial score display */}
      <View style={styles.scoreContainer}>
        <View style={[styles.circleOuter, { width: circleSize, height: circleSize, borderRadius: circleSize / 2 }]}>
          <View style={[styles.circleProgress, {
            width: circleSize,
            height: circleSize,
            borderRadius: circleSize / 2,
            borderColor: scoreColor,
            borderWidth: strokeWidth,
          }]} />
          <View style={styles.circleInner}>
            <Text style={[styles.scoreValue, { color: scoreColor }]} testID="score-value">
              {data.score}
            </Text>
            <View style={styles.trendRow}>
              <Ionicons name={trendInfo.icon} size={14} color={trendInfo.color} />
              <Text style={[styles.trendLabel, { color: trendInfo.color }]} testID="trend-indicator">
                {trendInfo.label}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Expand/collapse */}
      <TouchableOpacity
        style={styles.expandButton}
        onPress={() => setExpanded(!expanded)}
        testID="expand-breakdown"
      >
        <Text style={styles.expandText}>
          {expanded ? 'Hide breakdown' : 'Tap to see breakdown'}
        </Text>
        <Ionicons
          name={expanded ? 'chevron-up-outline' : 'chevron-down-outline'}
          size={16}
          color={colors.secondary}
        />
      </TouchableOpacity>

      {/* Component breakdown */}
      {expanded && (
        <View style={styles.breakdownSection} testID="breakdown-section">
          <View style={styles.divider} />
          {data.components.map((comp: ScoreComponent) => (
            <View key={comp.name} style={styles.componentRow}>
              <View style={styles.componentHeader}>
                <Text style={styles.componentName}>
                  {componentLabels[comp.name] || comp.name}
                </Text>
                <Text style={[styles.componentScore, { color: getScoreColor(comp.score) }]}>
                  {Math.round(comp.score)}
                </Text>
              </View>
              <View style={styles.progressBarBg}>
                <View style={[
                  styles.progressBarFill,
                  {
                    width: `${Math.min(comp.score, 100)}%`,
                    backgroundColor: getScoreColor(comp.score),
                  },
                ]} />
              </View>
              <Text style={styles.componentDesc}>
                {comp.description} (weight: {Math.round(comp.weight * 100)}%)
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Disclaimer */}
      <Text style={styles.disclaimer} testID="disclaimer">
        {data.disclaimer}
      </Text>
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
  scoreContainer: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  circleOuter: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surfaceVariant,
  },
  circleProgress: {
    position: 'absolute',
  },
  circleInner: {
    alignItems: 'center',
  },
  scoreValue: {
    fontSize: 42,
    fontWeight: '800',
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trendLabel: {
    ...typography.caption,
    fontWeight: '700',
  },
  expandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: spacing.sm,
  },
  expandText: {
    ...typography.bodySmall,
    color: colors.secondary,
    fontWeight: '700',
  },
  breakdownSection: {
    marginTop: spacing.xs,
  },
  divider: {
    height: 1,
    backgroundColor: colors.divider,
    marginBottom: spacing.md,
  },
  componentRow: {
    marginBottom: spacing.md,
  },
  componentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  componentName: {
    ...typography.label,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  componentScore: {
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
  componentDesc: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 4,
  },
  disclaimer: {
    ...typography.caption,
    color: colors.textDisabled,
    textAlign: 'center',
    marginTop: spacing.md,
    fontSize: 10,
  },
  errorText: {
    ...typography.bodySmall,
    color: colors.error,
    textAlign: 'center',
    margin: spacing.md,
  },
});
