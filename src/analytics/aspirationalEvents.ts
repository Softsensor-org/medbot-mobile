/**
 * IMP-159: Aspirational KPI event emitter.
 *
 * Tracks milestone events for the aspirational wave:
 * - Goal activation (user starts a goal journey)
 * - Weekly reveal view/action
 * - Readiness check
 * - Escalation acknowledgment
 *
 * All events are PHI-safe (no PII, only event type and timestamp).
 * Events are logged locally and can be batch-synced to the backend.
 */

import { FEATURE_FLAGS } from "../config/constants";

export type AspirationalEventType =
  | "goal_activated"
  | "goal_completed"
  | "reveal_viewed"
  | "reveal_action_taken"
  | "readiness_checked"
  | "escalation_acknowledged"
  | "aspirational_surface_suppressed";

export interface AspirationalEvent {
  event_type: AspirationalEventType;
  timestamp: string;
  metadata?: Record<string, string | number | boolean>;
}

// In-memory event buffer for batch sync
const _eventBuffer: AspirationalEvent[] = [];
const MAX_BUFFER_SIZE = 100;

/**
 * Emit an aspirational KPI event.
 * No-op when the aspirational wave feature flag is disabled
 * (except for suppression events which always track).
 */
export function emitAspirationalEvent(
  eventType: AspirationalEventType,
  metadata?: Record<string, string | number | boolean>,
): void {
  // Suppression events always track (for safety audit)
  if (
    eventType !== "aspirational_surface_suppressed" &&
    !FEATURE_FLAGS.ENABLE_ASPIRATIONAL_WAVE
  ) {
    return;
  }

  const event: AspirationalEvent = {
    event_type: eventType,
    timestamp: new Date().toISOString(),
    metadata,
  };

  _eventBuffer.push(event);

  // Evict oldest if buffer is full
  if (_eventBuffer.length > MAX_BUFFER_SIZE) {
    _eventBuffer.shift();
  }
}

/**
 * Get buffered events (for batch sync or testing).
 */
export function getBufferedEvents(): readonly AspirationalEvent[] {
  return _eventBuffer;
}

/**
 * Flush the event buffer (after successful sync).
 */
export function flushEventBuffer(): AspirationalEvent[] {
  return _eventBuffer.splice(0, _eventBuffer.length);
}

/**
 * Check if aspirational surfaces should be rendered.
 * Convenience wrapper around the feature flag.
 */
export function isAspirationalEnabled(): boolean {
  return FEATURE_FLAGS.ENABLE_ASPIRATIONAL_WAVE;
}
