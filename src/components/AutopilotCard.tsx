import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius, shadows } from '../theme';
import { useAutopilot } from '../hooks/useAutopilot';
import { useSafetyGate } from '../hooks/useSafetyGate';
import { useFeatureFlags } from '../hooks/useFeatureFlags';
import { SafetyGateOverlay } from './SafetyGateOverlay';
import { analytics } from '../api/AnalyticsService';
import { useRouter } from 'expo-router';

export const AutopilotCard: React.FC = () => {
  const router = useRouter();
  const { data: flags } = useFeatureFlags();
  const { 
    currentStep, 
    remainingRoutines, 
    isLoading: isLoadingAutopilot, 
    handleDone, 
    handleSnooze, 
    handleSkip,
    isProcessing 
  } = useAutopilot();

  const { safety, isLoading: isLoadingSafety } = useSafetyGate();

  useEffect(() => {
    if (!safety.isSafe) {
      analytics.track('safety_gate_triggered', { reason: safety.reason, severity: safety.severity });
    }
  }, [safety]);

  if (!flags?.autopilot_enabled) return null;

  if (isLoadingAutopilot || isLoadingSafety) {
    return (
      <View style={styles.container}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!safety.isSafe && safety.reason !== 'low_confidence') {
    return <SafetyGateOverlay safety={safety} />;
  }

  const onDone = async () => {
    analytics.track('autopilot_step_done', { type: currentStep.type, id: currentStep.id });
    await handleDone();
  };

  const onSnooze = async () => {
    analytics.track('autopilot_step_snooze', { id: currentStep.id });
    await handleSnooze();
  };

  const onSkip = async () => {
    analytics.track('autopilot_step_skip', { id: currentStep.id });
    await handleSkip();
  };

  const renderContent = () => {
    if (currentStep.type === 'complete') {
      return (
        <View style={styles.completeContent}>
          <MaterialIcons name="stars" size={48} color={colors.success} />
          <Text style={styles.title}>{currentStep.title}</Text>
          <Text style={styles.subtitle}>{currentStep.subtitle}</Text>
          <TouchableOpacity 
            style={styles.statsButton}
            onPress={() => router.push("/weekly-reveal")}
          >
            <Text style={styles.statsButtonText}>View Weekly Progress</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <>
        <View style={styles.header}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {currentStep.type === 'routine' ? 'Next Routine' : 'Daily Check-in'}
            </Text>
          </View>
          {remainingRoutines > 1 && (
            <Text style={styles.countText}>+{remainingRoutines - 1} more</Text>
          )}
        </View>

        <Text style={styles.title}>{currentStep.title}</Text>
        <Text style={styles.subtitle} numberOfLines={2}>{currentStep.subtitle}</Text>

        <View style={styles.actions}>
          <TouchableOpacity 
            style={[styles.actionBtn, styles.snoozeBtn]} 
            onPress={onSnooze}
            disabled={isProcessing}
          >
            <MaterialIcons name="snooze" size={20} color={colors.amber} />
            <Text style={styles.actionBtnText}>Snooze</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionBtn, styles.mainBtn, isProcessing && styles.disabled]} 
            onPress={currentStep.type === 'photo' ? () => {
                analytics.track('autopilot_step_done', { type: 'photo' });
                router.push("/(auth)/intake/camera");
            } : onDone}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator color={colors.surface} size="small" />
            ) : (
              <>
                <MaterialIcons 
                  name={currentStep.type === 'photo' ? "photo-camera" : "check-circle"} 
                  size={24} 
                  color={colors.surface} 
                />
                <Text style={styles.mainBtnText}>
                  {currentStep.type === 'photo' ? 'Open Camera' : 'Done'}
                </Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionBtn, styles.skipBtn]} 
            onPress={onSkip}
            disabled={isProcessing}
          >
            <MaterialIcons name="fast-forward" size={20} color={colors.textSecondary} />
            <Text style={styles.actionBtnText}>Skip</Text>
          </TouchableOpacity>
        </View>
      </>
    );
  };

  return (
    <View style={[styles.container, currentStep.type === 'complete' && styles.completeContainer]}>
      {renderContent()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginVertical: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.md,
  },
  completeContainer: {
    backgroundColor: colors.successLight,
    borderColor: colors.success,
    borderStyle: 'dashed',
  },
  completeContent: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  badge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  badgeText: {
    ...typography.caption,
    color: colors.surface,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  countText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  title: {
    ...typography.h2,
    color: colors.textPrimary,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  actionBtn: {
    flex: 1,
    height: 48,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  mainBtn: {
    flex: 2,
    backgroundColor: colors.primary,
    ...shadows.sm,
  },
  snoozeBtn: {
    backgroundColor: colors.amberLight,
  },
  skipBtn: {
    backgroundColor: colors.surfaceVariant,
  },
  actionBtnText: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  mainBtnText: {
    ...typography.button,
    color: colors.surface,
  },
  statsButton: {
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.success,
  },
  statsButtonText: {
    ...typography.button,
    color: colors.success,
    fontSize: 14,
  },
  disabled: {
    opacity: 0.7,
  }
});
