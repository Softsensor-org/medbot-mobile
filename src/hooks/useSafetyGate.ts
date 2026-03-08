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
    // 1. Check for active backend triage sessions (Clinical Hard-stop)
    // We check the most recently updated session
    if (sessions.length > 0) {
        const latest = sessions[0];
        const triage = latest.latest_model_output?.triage_label;
        if (triage === 'urgent' || triage === 'clinician_review') {
            return {
                isSafe: false,
                reason: 'backend_restriction',
                severity: triage === 'urgent' ? 'high' : 'medium',
                message: 'Your care plan is temporarily suspended for clinical review. Please speak with your care team before continuing routines.',
                cta: { label: 'Go to Consultation', route: `/(auth)/chat/${latest.session_id}` }
            };
        }
    }

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
