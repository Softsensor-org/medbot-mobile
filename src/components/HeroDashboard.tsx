import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
  Modal,
  Animated,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius, shadows } from '../theme';
import { usePatientProgress } from '../hooks/useProgress';
import { format, parseISO } from 'date-fns';
import { useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { useNotifications } from '../hooks/useNotifications';
import { isSunday, format as formatDate } from 'date-fns';
import { useHabitStreaks, useHabitHistory } from '../hooks/useHabits';
import { hapticService } from '../api/HapticService';
import { useMotion } from '../hooks/useMotion';

const { width } = Dimensions.get('window');

export const HeroDashboard: React.FC = () => {
  const router = useRouter();
  const { settings, updateSettings } = useNotifications();
  const { data, isLoading } = usePatientProgress(30);
  const { data: streaks } = useHabitStreaks();
  const { data: history } = useHabitHistory(5);
  const { reduceMotion } = useMotion();

  const [showMilestone, setShowMilestone] = useState(false);
  const [latestMilestone, setLatestMilestone] = useState<any>(null);
  const [scaleAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    if (!isLoading && data && settings.enabled && settings.weeklySummary && isSunday(new Date())) {
        const today = formatDate(new Date(), 'yyyy-MM-dd');
        const lastNotified = (settings as any).lastWeeklyNotified;
        if (lastNotified !== today) {
            Notifications.scheduleNotificationAsync({
                content: {
                    title: "Weekly Reveal Ready!",
                    body: "See how your skin has changed this week.",
                    data: { url: "/weekly-reveal" },
                },
                trigger: null,
            });
            updateSettings({ ...settings, lastWeeklyNotified: today } as any);
        }
    }
  }, [isLoading, data, settings]);

  useEffect(() => {
    if (history && history.length > 0) {
        const milestone = history.find(e => e.event_type === 'milestone');
        if (milestone) {
            setLatestMilestone(milestone);
            setShowMilestone(true);
            hapticService.triggerSuccess();
            
            if (!reduceMotion) {
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    friction: 8,
                    tension: 40,
                    useNativeDriver: true,
                }).start();
            } else {
                scaleAnim.setValue(1);
            }
        }
    }
  }, [history, reduceMotion]);

  if (isLoading || !data) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingPlaceholder} />
      </View>
    );
  }

  const latestPhoto = data.photos && data.photos.length > 0 ? data.photos[0] : null;
  const adherenceRate = Math.round(data.summary.adherence_rate * 100);
  
  let trendDirection: 'up' | 'down' | 'stable' = 'stable';
  if (data.symptoms.length >= 2) {
    const last = data.symptoms[0].severity;
    const prev = data.symptoms[1].severity;
    if (last < prev) trendDirection = 'down';
    else if (last > prev) trendDirection = 'up';
  }

  const totalStreak = streaks?.reduce((acc, s) => acc + s.current_streak, 0) || 0;

  return (
    <View style={styles.container}>
      {/* Streak Row */}
      {totalStreak > 0 && (
        <View style={styles.streakRow}>
            <View style={styles.streakBadge}>
                <MaterialIcons name="whatshot" size={20} color={colors.amber} />
                <Text style={styles.streakText}>{totalStreak} Day Streak</Text>
            </View>
            <TouchableOpacity onPress={() => router.push("/(auth)/(tabs)/progress")}>
                <Text style={styles.streakLink}>View Rewards</Text>
            </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity 
        style={styles.heroCard}
        onPress={() => router.push("/timeline")}
        activeOpacity={0.9}
      >
        {latestPhoto ? (
          <Image source={{ uri: latestPhoto.url }} style={styles.heroImage} />
        ) : (
          <View style={[styles.heroImage, styles.emptyPhoto]}>
            <MaterialIcons name="add-a-photo" size={48} color={colors.textDisabled} />
            <Text style={styles.emptyPhotoText}>No progress photos yet</Text>
          </View>
        )}
        <View style={styles.heroOverlay}>
          <View>
            <Text style={styles.heroLabel}>Latest Progress</Text>
            <Text style={styles.heroDate}>
              {latestPhoto ? format(parseISO(latestPhoto.timestamp), 'PPP') : 'Start your journey'}
            </Text>
          </View>
          <View style={styles.trendBadge}>
            <MaterialIcons 
              name={trendDirection === 'down' ? 'trending-down' : trendDirection === 'up' ? 'trending-up' : 'trending-flat'} 
              size={16} 
              color={trendDirection === 'down' ? colors.success : trendDirection === 'up' ? colors.error : colors.textSecondary} 
            />
            <Text style={[
              styles.trendText,
              trendDirection === 'down' && { color: colors.success },
              trendDirection === 'up' && { color: colors.error },
            ]}>
              {trendDirection === 'down' ? 'Improving' : trendDirection === 'up' ? 'Check-in' : 'Stable'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{adherenceRate}%</Text>
          <Text style={styles.statLabel}>Adherence</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{data.summary.symptom_count}</Text>
          <Text style={styles.statLabel}>Symptoms</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{data.summary.photo_count}</Text>
          <Text style={styles.statLabel}>Photos</Text>
        </View>
      </View>

      <View style={styles.actionGrid}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => router.push("/(auth)/intake/symptom-log")}
        >
          <View style={[styles.actionIcon, { backgroundColor: colors.warningLight }]}>
            <MaterialIcons name="bug-report" size={24} color={colors.warning} />
          </View>
          <Text style={styles.actionText}>Symptom</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => router.push("/(auth)/intake/camera")}
        >
          <View style={[styles.actionIcon, { backgroundColor: colors.primaryLight }]}>
            <MaterialIcons name="photo-camera" size={24} color={colors.surface} />
          </View>
          <Text style={styles.actionText}>Photo</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => router.push("/(auth)/(tabs)/routines")}
        >
          <View style={[styles.actionIcon, { backgroundColor: colors.tealLight }]}>
            <MaterialIcons name="event-note" size={24} color={colors.teal} />
          </View>
          <Text style={styles.actionText}>Routines</Text>
        </TouchableOpacity>
      </View>

      {/* Milestone Modal */}
      <Modal visible={showMilestone} transparent animationType="fade">
        <View style={styles.modalOverlay}>
            <Animated.View style={[
                styles.milestoneCard,
                { transform: [{ scale: scaleAnim }] }
            ]}>
                <MaterialIcons name="stars" size={80} color={colors.amber} />
                <Text style={styles.milestoneTitle}>Milestone Reached!</Text>
                <Text style={styles.milestoneBody}>
                    You've hit a {latestMilestone?.streak_at_event} day streak for your {latestMilestone?.routine_name}!
                </Text>
                <TouchableOpacity 
                    style={styles.milestoneBtn}
                    onPress={() => setShowMilestone(false)}
                >
                    <Text style={styles.milestoneBtnText}>Keep it going!</Text>
                </TouchableOpacity>
            </Animated.View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  loadingContainer: {
    height: 250,
    marginBottom: spacing.lg,
  },
  loadingPlaceholder: {
    flex: 1,
    backgroundColor: colors.surfaceVariant,
    borderRadius: borderRadius.lg,
    opacity: 0.5,
  },
  streakRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  streakText: {
    ...typography.caption,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  streakLink: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },
  heroCard: {
    height: 200,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    ...shadows.md,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  emptyPhoto: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surfaceVariant,
  },
  emptyPhotoText: {
    ...typography.bodySmall,
    color: colors.textDisabled,
    marginTop: spacing.sm,
  },
  heroOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.md,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  heroLabel: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.8)',
    textTransform: 'uppercase',
  },
  heroDate: {
    ...typography.h3,
    color: colors.surface,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    gap: 4,
  },
  trendText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    marginTop: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    alignItems: 'center',
    ...shadows.sm,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  statLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  statDivider: {
    width: 1,
    height: '60%',
    backgroundColor: colors.divider,
  },
  actionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
    gap: spacing.md,
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionText: {
    ...typography.caption,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  milestoneCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    width: '100%',
    ...shadows.lg,
  },
  milestoneTitle: {
    ...typography.h2,
    color: colors.textPrimary,
    marginTop: spacing.md,
  },
  milestoneBody: {
    ...typography.body,
    textAlign: 'center',
    color: colors.textSecondary,
    marginVertical: spacing.lg,
  },
  milestoneBtn: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.md,
    width: '100%',
    alignItems: 'center',
  },
  milestoneBtnText: {
    ...typography.button,
    color: colors.surface,
  },
});
