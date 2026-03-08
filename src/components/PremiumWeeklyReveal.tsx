import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Dimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius, shadows } from '../theme';
import { useWeeklyReveal } from '../hooks/useWeeklyReveal';
import { useTrajectory } from '../hooks/useTrajectory';
import { useSafetyGate } from '../hooks/useSafetyGate';
import { SafetyGateOverlay } from './SafetyGateOverlay';
import { CompareSlider } from './common/CompareSlider';
import { analytics } from '../api/AnalyticsService';
import { useRouter } from 'expo-router';
import { format, parseISO } from 'date-fns';
import { useMotion } from '../hooks/useMotion';

const { width, height } = Dimensions.get('window');

export const PremiumWeeklyReveal: React.FC = () => {
  const router = useRouter();
  const { insight, isLoading: isLoadingWeekly } = useWeeklyReveal();
  const { trajectory, isLoading: isLoadingTrajectory } = useTrajectory();
  const { safety, isLoading: isLoadingSafety } = useSafetyGate();
  const { reduceMotion } = useMotion();

  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));

  useEffect(() => {
    if (insight && !isLoadingWeekly) {
      analytics.track('weekly_reveal_viewed', { 
        status: insight.status, 
        confidence: insight.confidence,
        is_premium: true 
      });

      if (!reduceMotion) {
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 600,
            useNativeDriver: true,
          })
        ]).start();
      } else {
        fadeAnim.setValue(1);
        slideAnim.setValue(0);
      }
    }
  }, [insight, isLoadingWeekly, reduceMotion]);

  if (isLoadingWeekly || isLoadingSafety || isLoadingTrajectory) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Preparing your reveal...</Text>
      </View>
    );
  }

  // Safety Gate Suppression
  if (!safety.isSafe && (safety.reason === 'regression' || safety.reason === 'red_flag')) {
    return (
        <View style={styles.safeContainer}>
            <SafetyGateOverlay safety={safety} />
        </View>
    );
  }

  if (!insight) return null;

  const getStatusColor = () => {
    switch (insight.status) {
      case 'improving': return colors.success;
      case 'regressing': return colors.error;
      default: return colors.primary;
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <Text style={styles.overtitle}>Weekly Edition</Text>
        <Text style={styles.title}>The Reveal</Text>
        <View style={[styles.divider, { backgroundColor: getStatusColor() }]} />
      </Animated.View>

      <Animated.View style={[styles.card, { opacity: fadeAnim }]}>
        <View style={styles.insightHeader}>
            <MaterialIcons 
                name={insight.status === 'improving' ? 'verified' : 'auto-graph'} 
                size={24} 
                color={getStatusColor()} 
            />
            <Text style={[styles.statusText, { color: getStatusColor() }]}>
                {insight.status === 'improving' ? 'Clinical Improvement Detected' : 'Condition Stable'}
            </Text>
        </View>
        
        <Text style={styles.summaryText}>{insight.summary}</Text>
      </Animated.View>

      {insight.comparison.before && insight.comparison.after && (
        <View style={styles.comparisonSection}>
            <Text style={styles.sectionLabel}>Visual Progress</Text>
            <CompareSlider 
                beforeUri={insight.comparison.before.url}
                afterUri={insight.comparison.after.url}
                beforeLabel={format(parseISO(insight.comparison.before.timestamp), 'MMM dd')}
                afterLabel={format(parseISO(insight.comparison.after.timestamp), 'MMM dd')}
            />
            <Text style={styles.comparisonHint}>Swipe the handle to see the change</Text>
        </View>
      )}

      {trajectory && (
        <View style={styles.trajectoryCard}>
            <View style={styles.trajectoryInfo}>
                <Text style={styles.trajectoryLabel}>On track for your goal:</Text>
                <Text style={styles.trajectoryGoal}>"{trajectory.goalOutcome}"</Text>
            </View>
            <View style={styles.trajectoryMetrics}>
                <View style={styles.metric}>
                    <Text style={styles.metricValue}>{trajectory.daysRemaining}</Text>
                    <Text style={styles.metricLabel}>Days to go</Text>
                </View>
                <View style={styles.metricDivider} />
                <View style={styles.metric}>
                    <Text style={styles.metricValue}>{trajectory.progressPercent}%</Text>
                    <Text style={styles.metricLabel}>Progress</Text>
                </View>
            </View>
        </View>
      )}

      <View style={styles.actionSection}>
        <Text style={styles.nextActionLabel}>Recommended Next Move</Text>
        <TouchableOpacity 
            style={[styles.ctaButton, { backgroundColor: getStatusColor() }]}
            onPress={() => {
                analytics.track('weekly_reveal_cta_clicked', { label: insight.cta.label, is_premium: true });
                router.push(insight.cta.route as any);
            }}
        >
            <Text style={styles.ctaText}>{insight.cta.label}</Text>
            <MaterialIcons name="arrow-forward" size={20} color={colors.surface} />
        </TouchableOpacity>

        <TouchableOpacity 
            style={styles.shareButton}
            onPress={() => analytics.track('weekly_reveal_share_clicked')}
        >
            <MaterialIcons name="ios-share" size={20} color={colors.primary} />
            <Text style={styles.shareText}>Save PHI-Safe Summary</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xxl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    ...typography.body,
    marginTop: spacing.md,
    color: colors.textSecondary,
  },
  safeContainer: {
    flex: 1,
    padding: spacing.lg,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  overtitle: {
    ...typography.label,
    color: colors.textSecondary,
    letterSpacing: 2,
    marginBottom: 4,
  },
  title: {
    ...typography.h1,
    fontSize: 42,
    lineHeight: 48,
    fontWeight: '900',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  divider: {
    width: 60,
    height: 4,
    marginTop: spacing.md,
    borderRadius: 2,
  },
  card: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    ...shadows.md,
    marginBottom: spacing.xl,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  statusText: {
    ...typography.label,
    fontWeight: '800',
  },
  summaryText: {
    ...typography.body,
    fontSize: 18,
    lineHeight: 26,
    color: colors.textPrimary,
  },
  comparisonSection: {
    marginBottom: spacing.xl,
  },
  sectionLabel: {
    ...typography.label,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  comparisonHint: {
    ...typography.caption,
    textAlign: 'center',
    color: colors.textDisabled,
    marginTop: spacing.sm,
    fontStyle: 'italic',
  },
  trajectoryCard: {
    backgroundColor: colors.primary,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.xl,
    ...shadows.lg,
  },
  trajectoryInfo: {
    marginBottom: spacing.md,
  },
  trajectoryLabel: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '700',
  },
  trajectoryGoal: {
    ...typography.h3,
    color: colors.surface,
    fontStyle: 'italic',
  },
  trajectoryMetrics: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  metric: {
    flex: 1,
    alignItems: 'center',
  },
  metricValue: {
    ...typography.h2,
    color: colors.surface,
  },
  metricLabel: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.6)',
    fontSize: 10,
    textTransform: 'uppercase',
  },
  metricDivider: {
    width: 1,
    height: '60%',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  actionSection: {
    gap: spacing.md,
  },
  nextActionLabel: {
    ...typography.label,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
    ...shadows.md,
  },
  ctaText: {
    ...typography.button,
    color: colors.surface,
    fontSize: 18,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  shareText: {
    ...typography.button,
    color: colors.primary,
    fontSize: 14,
  }
});
