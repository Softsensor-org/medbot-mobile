import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius, shadows } from '../theme';
import { useWeeklyReveal } from '../hooks/useWeeklyReveal';
import { useSafetyGate } from '../hooks/useSafetyGate';
import { useFeatureFlags } from '../hooks/useFeatureFlags';
import { SafetyGateOverlay } from './SafetyGateOverlay';
import { analytics } from '../api/AnalyticsService';
import { useRouter } from 'expo-router';
import { format, parseISO } from 'date-fns';

export const WeeklyReveal: React.FC = () => {
  const router = useRouter();
  const { data: flags } = useFeatureFlags();
  const { insight, isLoading: isLoadingWeekly } = useWeeklyReveal();
  const { safety, isLoading: isLoadingSafety } = useSafetyGate();

  useEffect(() => {
    if (insight && !isLoadingWeekly) {
      analytics.track('weekly_reveal_viewed', { status: insight.status, confidence: insight.confidence });
    }
  }, [insight, isLoadingWeekly]);

  if (!flags?.weekly_reveal_enabled) return null;

  if (isLoadingWeekly || isLoadingSafety) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  // Safety Gate Suppression
  if (!safety.isSafe && (safety.reason === 'regression' || safety.reason === 'red_flag')) {
    return <SafetyGateOverlay safety={safety} />;
  }

  if (!insight) return null;

  const handleCta = () => {
    analytics.track('weekly_reveal_cta_clicked', { label: insight.cta.label, status: insight.status });
    router.push(insight.cta.route as any);
  };

  const getStatusIcon = () => {
    switch (insight.status) {
      case 'improving': return 'trending-down';
      case 'regressing': return 'trending-up';
      case 'stable': return 'trending-flat';
      default: return 'help-outline';
    }
  };

  const getStatusColor = () => {
    switch (insight.status) {
      case 'improving': return colors.success;
      case 'regressing': return colors.error;
      case 'stable': return colors.info;
      default: return colors.textSecondary;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Weekly Reveal</Text>
        <View style={styles.confidenceContainer}>
          <Text style={styles.confidenceLabel}>Confidence</Text>
          <View style={styles.confidenceTrack}>
            <View style={[styles.confidenceFill, { width: `${insight.confidence * 100}%` }]} />
          </View>
        </View>
      </View>

      <View style={styles.statusRow}>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor() + '20' }]}>
          <MaterialIcons name={getStatusIcon()} size={20} color={getStatusColor()} />
          <Text style={[styles.statusText, { color: getStatusColor() }]}>
            {insight.status.replace('_', ' ').toUpperCase()}
          </Text>
        </View>
      </View>

      <Text style={styles.summary}>{insight.summary}</Text>
      
      {insight.comparison.before && insight.comparison.after && (
        <View style={styles.comparisonContainer}>
          <View style={styles.compareHalf}>
            <Image source={{ uri: insight.comparison.before.url }} style={styles.compareImage} />
            <Text style={styles.compareDate}>
                {format(parseISO(insight.comparison.before.timestamp), 'MMM dd')}
            </Text>
            <Text style={styles.compareLabel}>Day 0</Text>
          </View>
          <MaterialIcons name="chevron-right" size={24} color={colors.border} />
          <View style={styles.compareHalf}>
            <Image source={{ uri: insight.comparison.after.url }} style={styles.compareImage} />
            <Text style={styles.compareDate}>
                {format(parseISO(insight.comparison.after.timestamp), 'MMM dd')}
            </Text>
            <Text style={styles.compareLabel}>Day 7</Text>
          </View>
        </View>
      )}

      <View style={styles.recommendationBox}>
        <MaterialIcons name="lightbulb-outline" size={20} color={colors.primary} />
        <Text style={styles.recommendationText}>{insight.recommendation}</Text>
      </View>

      <TouchableOpacity 
        style={styles.ctaButton}
        onPress={handleCta}
      >
        <Text style={styles.ctaText}>{insight.cta.label}</Text>
        <MaterialIcons name="arrow-forward" size={18} color={colors.surface} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.xl,
    ...shadows.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  loadingContainer: {
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  headerTitle: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  confidenceContainer: {
    alignItems: 'flex-end',
  },
  confidenceLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  confidenceTrack: {
    width: 60,
    height: 4,
    backgroundColor: colors.surfaceVariant,
    borderRadius: 2,
    overflow: 'hidden',
  },
  confidenceFill: {
    height: '100%',
    backgroundColor: colors.success,
  },
  statusRow: {
    marginBottom: spacing.md,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
    alignSelf: 'flex-start',
    gap: 4,
  },
  statusText: {
    ...typography.caption,
    fontWeight: '700',
  },
  summary: {
    ...typography.body,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
    lineHeight: 24,
  },
  comparisonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
  },
  compareHalf: {
    flex: 1,
    alignItems: 'center',
  },
  compareImage: {
    width: '100%',
    height: 100,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.surfaceVariant,
  },
  compareDate: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 4,
  },
  compareLabel: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  recommendationBox: {
    flexDirection: 'row',
    backgroundColor: colors.primaryLight + '10',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  recommendationText: {
    ...typography.bodySmall,
    color: colors.textPrimary,
    flex: 1,
  },
  ctaButton: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  ctaText: {
    ...typography.button,
    color: colors.surface,
  },
});
