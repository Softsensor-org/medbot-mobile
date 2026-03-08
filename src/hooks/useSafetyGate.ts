import { useMemo } from 'react';
import { useWeeklyReveal } from './useWeeklyReveal';
import { usePatientProgress } from './useProgress';
import { useSessions } from './useSessions';

export interface SafetyStatus {
  isSafe: boolean;
  reason?: 'regression' | 'low_confidence' | 'red_flag' | 'backend_restriction';
  severity: 'low' | 'medium' | 'high';
  message: string;
  cta: { label: string; route: string };
}

export function useSafetyGate() {
  const { insight } = useWeeklyReveal();
  const { data: progress } = usePatientProgress(7);
  const { data: sessions = [] } = useSessions({ sort_by: "updated_at", sort_order: "desc" });

  const safety = useMemo<SafetyStatus>(() => {
    // 1. Backend triage check placeholder (IMP-162)
    // IMP-161: Backend SessionMeta does not include latest_model_output
    // or triage_label (stripped by Pydantic validation). The previous
    // check on `latest.latest_model_output?.triage_label` was dead code.
    // IMP-162 will add a proper triage-based safety gate.

    // 2. Check for severe symptoms (Red Flag from local logs)
    const hasSevereSymptom = progress?.symptoms.some(s => s.severity >= 4.5);
    if (hasSevereSymptom) {
      return {
        isSafe: false,
        reason: 'red_flag',
        severity: 'high',
        message: 'We\'ve detected severe symptom levels. A clinical review is required.',
        cta: { label: 'Talk to Clinical Assistant', route: '/(auth)/intake' }
      };
    }

    // 3. Check for regression (Fail-Closed from trend)
    if (insight?.status === 'regressing') {
      return {
        isSafe: false,
        reason: 'regression',
        severity: 'medium',
        message: 'Your progress indicates a regression. Let\'s adjust your care plan with a provider.',
        cta: { label: 'Request Plan Review', route: '/(auth)/intake' }
      };
    }

    // 4. Check for low confidence (Safety Buffer)
    if (insight && insight.confidence < 0.2) {
      return {
        isSafe: false,
        reason: 'low_confidence',
        severity: 'low',
        message: 'Not enough data to confirm safety. Please complete your daily logs.',
        cta: { label: 'Log Symptoms', route: '/(auth)/intake/symptom-log' }
      };
    }

    // Default safe state
    return {
      isSafe: true,
      severity: 'low',
      message: 'Care plan is active and safe.',
      cta: { label: 'Continue', route: '/(auth)/(tabs)/' }
    };
  }, [insight, progress, sessions]);

  return {
    safety,
    isLoading: !progress
  };
}
