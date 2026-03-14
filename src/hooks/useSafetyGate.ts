/**
 * IMP-162: Fail-closed safety gate for aspirational/concierge content.
 *
 * Suppresses non-critical guidance when clinical escalation is active,
 * triage data is missing, or symptom/confidence signals are unsafe.
 *
 * Fail-closed: when triage information is unavailable or ambiguous,
 * the gate defaults to UNSAFE (suppress) rather than allowing content through.
 */

import { useMemo } from 'react';
import { useWeeklyReveal } from './useWeeklyReveal';
import { useSessions } from './useSessions';
import type { SessionMeta } from '../api/sessionsApi';
import { useSymptoms } from './useSymptomLogging';
import type { Symptom } from '../types/medical';

export interface SafetyStatus {
  isSafe: boolean;
  reason?: 'regression' | 'low_confidence' | 'red_flag' | 'backend_restriction' | 'missing_triage';
  severity: 'low' | 'medium' | 'high';
  message: string;
  cta: { label: string; route: string };
}

/**
 * Pure evaluation function for testability without hooks.
 *
 * IMP-162: Session status-based triage proxy (backend SessionMeta does
 * not include triage_label — see IMP-161). Status mapping:
 * - "assigned": clinician is actively reviewing → suppress (high)
 * - "waiting": awaiting triage → fail-closed suppress (medium)
 * - "new": fresh session, no triage yet → fail-closed suppress (low)
 * - "closed": terminal, safe to proceed
 */
export function evaluateSafetyGate(options: {
  sessions: SessionMeta[];
  symptoms: Array<Pick<Symptom, 'severity'>> | null | undefined;
  insight: { status?: string; confidence?: number } | null | undefined;
}): SafetyStatus {
  const { sessions, symptoms, insight } = options;

  // 1. Session status-based triage check (fail-closed)
  if (sessions.length > 0) {
    const latest = sessions[0];

    // "assigned" → clinician actively reviewing → suppress
    if (latest.status === 'assigned') {
      return {
        isSafe: false,
        reason: 'backend_restriction',
        severity: 'high',
        message: 'Your care plan is under clinical review. Please follow your care team\'s guidance.',
        cta: { label: 'Go to Consultation', route: `/(auth)/chat/${latest.session_id}` },
      };
    }

    // "waiting" → awaiting provider response → fail-closed
    if (latest.status === 'waiting') {
      return {
        isSafe: false,
        reason: 'backend_restriction',
        severity: 'medium',
        message: 'Your session is awaiting clinical review. Aspirational features are paused.',
        cta: { label: 'View Session', route: `/(auth)/chat/${latest.session_id}` },
      };
    }

    // "new" with no insight data → fail-closed (not enough info)
    if (latest.status === 'new' && !insight) {
      return {
        isSafe: false,
        reason: 'missing_triage',
        severity: 'low',
        message: 'Not enough data to confirm safety. Please complete your consultation.',
        cta: { label: 'Continue Session', route: `/(auth)/chat/${latest.session_id}` },
      };
    }
  }

  // 2. Check for severe symptoms (Red Flag from local logs)
  const hasSevereSymptom = symptoms?.some(symptom => symptom.severity >= 4.5);
  if (hasSevereSymptom) {
    return {
      isSafe: false,
      reason: 'red_flag',
      severity: 'high',
      message: 'We\'ve detected severe symptom levels. A clinical review is required.',
      cta: { label: 'Talk to Clinical Assistant', route: '/(auth)/intake' },
    };
  }

  // 3. Check for regression (Fail-Closed from trend)
  if (insight?.status === 'regressing') {
    return {
      isSafe: false,
      reason: 'regression',
      severity: 'medium',
      message: 'Your progress indicates a regression. Let\'s adjust your care plan with a provider.',
      cta: { label: 'Request Plan Review', route: '/(auth)/intake' },
    };
  }

  // 4. Check for low confidence (Safety Buffer)
  if (insight && (insight.confidence ?? 0) < 0.2) {
    return {
      isSafe: false,
      reason: 'low_confidence',
      severity: 'low',
      message: 'Not enough data to confirm safety. Please complete your daily logs.',
      cta: { label: 'Log Symptoms', route: '/(auth)/intake/symptom-log' },
    };
  }

  // Default safe state
  return {
    isSafe: true,
    severity: 'low',
    message: 'Care plan is active and safe.',
    cta: { label: 'Continue', route: '/(auth)/(tabs)/' },
  };
}

export function useSafetyGate() {
  const { insight } = useWeeklyReveal();
  const { data: symptoms, isLoading: isLoadingSymptoms } = useSymptoms();
  const { data: sessions = [] } = useSessions({ sort_by: "updated_at", sort_order: "desc" });

  const safety = useMemo<SafetyStatus>(
    () => evaluateSafetyGate({ sessions, symptoms, insight }),
    [insight, sessions, symptoms],
  );

  return {
    safety,
    isLoading: isLoadingSymptoms,
  };
}
