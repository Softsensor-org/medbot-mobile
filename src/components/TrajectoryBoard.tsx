import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius, shadows } from '../theme';
import { useTrajectory } from '../hooks/useTrajectory';

export const TrajectoryBoard: React.FC = () => {
  const { trajectory, isLoading } = useTrajectory();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!trajectory) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Future-You Trajectory</Text>
        <View style={styles.countdown}>
            <Text style={styles.countdownValue}>{trajectory.daysRemaining}</Text>
            <Text style={styles.countdownLabel}>days to go</Text>
        </View>
      </View>

      <View style={styles.goalBox}>
        <Text style={styles.goalTitle}>The Target:</Text>
        <Text style={styles.goalText} numberOfLines={2}>"{trajectory.goalOutcome}"</Text>
      </View>

      <View style={styles.progressSection}>
        <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>Progress to Target</Text>
            <Text style={styles.progressValue}>{trajectory.progressPercent}%</Text>
        </View>
        <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${trajectory.progressPercent}%` }]} />
        </View>
        <View style={styles.velocityRow}>
            <MaterialIcons 
                name={trajectory.velocity === 'accelerating' ? 'speed' : 'trending-flat'} 
                size={16} 
                color={colors.primary} 
            />
            <Text style={styles.velocityText}>
                Velocity: {trajectory.velocity.charAt(0).toUpperCase() + trajectory.velocity.slice(1)}
            </Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statBox}>
            <Text style={styles.statLabel}>Next Milestone</Text>
            <Text style={styles.statValue}>{trajectory.nextMilestone}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.statBox}>
            <Text style={styles.statLabel}>Plan Confidence</Text>
            <View style={styles.confidenceRow}>
                <Text style={styles.statValue}>{Math.round(trajectory.confidenceScore * 100)}%</Text>
                <View style={styles.confidenceTrack}>
                    <View style={[styles.confidenceFill, { width: `${trajectory.confidenceScore * 100}%` }]} />
                </View>
            </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.primary,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.xl,
    ...shadows.lg,
  },
  loadingContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  headerTitle: {
    ...typography.h3,
    color: colors.surface,
    fontWeight: '800',
  },
  countdown: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  countdownValue: {
    ...typography.h2,
    color: colors.surface,
    lineHeight: 28,
  },
  countdownLabel: {
    ...typography.caption,
    color: colors.surface,
    fontSize: typography.caption.fontSize,
    textTransform: 'uppercase',
  },
  goalBox: {
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: borderRadius.sm,
    padding: spacing.md,
  },
  goalTitle: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
  },
  goalText: {
    ...typography.body,
    color: colors.surface,
    fontStyle: 'italic',
    lineHeight: 22,
  },
  progressSection: {
    marginBottom: spacing.lg,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  progressLabel: {
    ...typography.caption,
    color: colors.surface,
    fontWeight: '700',
  },
  progressValue: {
    ...typography.caption,
    color: colors.surface,
    fontWeight: '800',
  },
  progressBarBg: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.success,
    borderRadius: borderRadius.full,
  },
  velocityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    gap: spacing.xs,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: borderRadius.sm,
    padding: spacing.xs,
  },
  velocityText: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.15)',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  statBox: {
    flex: 1,
  },
  statLabel: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: spacing.xs,
  },
  statValue: {
    ...typography.bodySmall,
    color: colors.surface,
    fontWeight: '700',
  },
  divider: {
    width: 2,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginHorizontal: spacing.md,
  },
  confidenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  confidenceTrack: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  confidenceFill: {
    height: '100%',
    backgroundColor: colors.success,
    borderRadius: borderRadius.full,
  }
});
