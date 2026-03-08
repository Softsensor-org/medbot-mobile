/**
 * IMP-157: Client-side aspirational claims guardrail.
 *
 * Evaluates whether aspirational/concierge content is safe to display
 * based on confidence, triage, and red-flag state. Fail-closed: if any
 * unsafe condition is detected, suppress aspirational claims and return
 * a safe fallback message.
 */

import { useMemo } from "react";
import type { ConfidenceBand, TriageLabel } from "../types/ai";

export type SuppressionReason =
  | "low_confidence"
  | "escalation_active"
  | "red_flags_present";

export interface ClaimsGuardInput {
  confidenceBand?: ConfidenceBand | null;
  triageLabel?: TriageLabel | null;
  redFlagsAcknowledged?: string[];
}

export interface ClaimsGuardResult {
  isSafe: boolean;
  suppressionReason: SuppressionReason | null;
  fallbackMessage: string | null;
}

const FALLBACK_MESSAGES: Record<SuppressionReason, string> = {
  low_confidence:
    "We don't have enough information yet to provide personalized projections. " +
    "Continue your routine and check back after more data is available.",
  escalation_active:
    "Your current situation requires clinical attention. " +
    "Please follow up with a healthcare provider before focusing on aspirational goals.",
  red_flags_present:
    "Some aspects of your situation need professional review. " +
    "We've paused aspirational content until a clinician can assess your case.",
};

/**
 * Pure evaluation function (no hooks). Useful for testing and
 * non-component contexts.
 */
export function evaluateClaimsGuard(
  input: ClaimsGuardInput,
): ClaimsGuardResult {
  const { confidenceBand, triageLabel, redFlagsAcknowledged } = input;

  // Rule 1: Low confidence → suppress
  if (confidenceBand === "Low") {
    return {
      isSafe: false,
      suppressionReason: "low_confidence",
      fallbackMessage: FALLBACK_MESSAGES.low_confidence,
    };
  }

  // Rule 2: Urgent or clinician_review → suppress
  if (triageLabel === "urgent" || triageLabel === "clinician_review") {
    return {
      isSafe: false,
      suppressionReason: "escalation_active",
      fallbackMessage: FALLBACK_MESSAGES.escalation_active,
    };
  }

  // Rule 3: Red flags present → suppress
  if (redFlagsAcknowledged && redFlagsAcknowledged.length > 0) {
    return {
      isSafe: false,
      suppressionReason: "red_flags_present",
      fallbackMessage: FALLBACK_MESSAGES.red_flags_present,
    };
  }

  // Rule 4: Missing data → fail closed (suppress)
  if (confidenceBand == null || triageLabel == null) {
    return {
      isSafe: false,
      suppressionReason: "low_confidence",
      fallbackMessage: FALLBACK_MESSAGES.low_confidence,
    };
  }

  return { isSafe: true, suppressionReason: null, fallbackMessage: null };
}

/**
 * React hook wrapper for evaluateClaimsGuard.
 * Memoized so consumers can depend on referential stability.
 */
export function useClaimsGuard(input: ClaimsGuardInput): ClaimsGuardResult {
  return useMemo(
    () => evaluateClaimsGuard(input),
    [input.confidenceBand, input.triageLabel, input.redFlagsAcknowledged],
  );
}
