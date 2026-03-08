import { evaluateSafetyGate, SafetyStatus } from "../src/hooks/useSafetyGate";
import type { SessionMeta } from "../src/api/sessionsApi";

/**
 * IMP-162: Comprehensive safety gate regression tests.
 *
 * Tests cover:
 * - Session status-based triage suppression (assigned, waiting, new)
 * - Missing/invalid triage data → fail-closed
 * - Severe symptom red flags
 * - Regression detection
 * - Low confidence suppression
 * - Transitive contract-break scenarios (empty sessions, missing fields)
 */

const NOW = "2026-03-08T00:00:00Z";

function makeSession(overrides: Partial<SessionMeta> = {}): SessionMeta {
  return {
    session_id: "test-session",
    status: "new",
    created_at: NOW,
    updated_at: NOW,
    last_message_at: NOW,
    ...overrides,
  };
}

describe("evaluateSafetyGate", () => {
  describe("session status-based triage (IMP-162)", () => {
    it("suppresses for 'assigned' status (clinician review active)", () => {
      const result = evaluateSafetyGate({
        sessions: [makeSession({ status: "assigned", session_id: "s-assigned" })],
        progress: null,
        insight: null,
      });

      expect(result.isSafe).toBe(false);
      expect(result.reason).toBe("backend_restriction");
      expect(result.severity).toBe("high");
      expect(result.cta.route).toContain("s-assigned");
    });

    it("suppresses for 'waiting' status (awaiting provider)", () => {
      const result = evaluateSafetyGate({
        sessions: [makeSession({ status: "waiting" })],
        progress: null,
        insight: null,
      });

      expect(result.isSafe).toBe(false);
      expect(result.reason).toBe("backend_restriction");
      expect(result.severity).toBe("medium");
    });

    it("fail-closed for 'new' session when insight is unavailable", () => {
      const result = evaluateSafetyGate({
        sessions: [makeSession({ status: "new" })],
        progress: null,
        insight: null,
      });

      expect(result.isSafe).toBe(false);
      expect(result.reason).toBe("missing_triage");
    });

    it("allows progression for 'new' session when insight IS available and safe", () => {
      const result = evaluateSafetyGate({
        sessions: [makeSession({ status: "new" })],
        progress: { symptoms: [] },
        insight: { status: "stable", confidence: 0.8 },
      });

      expect(result.isSafe).toBe(true);
    });

    it("allows progression for 'closed' session", () => {
      const result = evaluateSafetyGate({
        sessions: [makeSession({ status: "closed" })],
        progress: { symptoms: [] },
        insight: { status: "stable", confidence: 0.8 },
      });

      expect(result.isSafe).toBe(true);
    });
  });

  describe("fail-closed on missing/invalid data", () => {
    it("returns safe when no sessions and no negative signals", () => {
      const result = evaluateSafetyGate({
        sessions: [],
        progress: { symptoms: [] },
        insight: { status: "stable", confidence: 0.8 },
      });

      expect(result.isSafe).toBe(true);
    });

    it("suppresses when insight is missing and low confidence threshold", () => {
      const result = evaluateSafetyGate({
        sessions: [],
        progress: { symptoms: [] },
        insight: { confidence: 0.1 },
      });

      expect(result.isSafe).toBe(false);
      expect(result.reason).toBe("low_confidence");
    });

    it("handles null progress gracefully", () => {
      const result = evaluateSafetyGate({
        sessions: [],
        progress: null,
        insight: { status: "stable", confidence: 0.8 },
      });

      expect(result.isSafe).toBe(true);
    });

    it("handles undefined insight gracefully (no suppress if no sessions)", () => {
      const result = evaluateSafetyGate({
        sessions: [],
        progress: { symptoms: [] },
        insight: null,
      });

      // No sessions + no negative signals → safe
      expect(result.isSafe).toBe(true);
    });
  });

  describe("symptom red flags", () => {
    it("suppresses for severe symptoms (>= 4.5)", () => {
      const result = evaluateSafetyGate({
        sessions: [makeSession({ status: "closed" })],
        progress: { symptoms: [{ severity: 4.8 }] },
        insight: { status: "stable", confidence: 0.9 },
      });

      expect(result.isSafe).toBe(false);
      expect(result.reason).toBe("red_flag");
      expect(result.severity).toBe("high");
    });

    it("allows for moderate symptoms (< 4.5)", () => {
      const result = evaluateSafetyGate({
        sessions: [makeSession({ status: "closed" })],
        progress: { symptoms: [{ severity: 3.0 }] },
        insight: { status: "stable", confidence: 0.8 },
      });

      expect(result.isSafe).toBe(true);
    });
  });

  describe("regression detection", () => {
    it("suppresses when insight status is regressing", () => {
      const result = evaluateSafetyGate({
        sessions: [makeSession({ status: "closed" })],
        progress: { symptoms: [] },
        insight: { status: "regressing", confidence: 0.5 },
      });

      expect(result.isSafe).toBe(false);
      expect(result.reason).toBe("regression");
      expect(result.severity).toBe("medium");
    });
  });

  describe("low confidence", () => {
    it("suppresses when confidence below threshold (0.2)", () => {
      const result = evaluateSafetyGate({
        sessions: [makeSession({ status: "closed" })],
        progress: { symptoms: [] },
        insight: { status: "stable", confidence: 0.15 },
      });

      expect(result.isSafe).toBe(false);
      expect(result.reason).toBe("low_confidence");
    });

    it("allows when confidence at threshold", () => {
      const result = evaluateSafetyGate({
        sessions: [makeSession({ status: "closed" })],
        progress: { symptoms: [] },
        insight: { status: "stable", confidence: 0.2 },
      });

      expect(result.isSafe).toBe(true);
    });
  });

  describe("transitive contract-break scenarios (IMP-162)", () => {
    it("handles empty session array from contract drift", () => {
      // If session list returns [] due to contract mismatch, don't crash
      const result = evaluateSafetyGate({
        sessions: [],
        progress: { symptoms: [] },
        insight: { status: "stable", confidence: 0.8 },
      });

      expect(result.isSafe).toBe(true);
    });

    it("handles session with missing optional fields", () => {
      const sparseSession: SessionMeta = {
        session_id: "sparse",
        status: "assigned",
        created_at: NOW,
        updated_at: NOW,
        last_message_at: NOW,
        // No notes, no priority_score, no timeline_events
      };

      const result = evaluateSafetyGate({
        sessions: [sparseSession],
        progress: null,
        insight: null,
      });

      expect(result.isSafe).toBe(false);
      expect(result.reason).toBe("backend_restriction");
    });

    it("priority: assigned status takes precedence over safe insight", () => {
      // Even with a stable/high-confidence insight, assigned status suppresses
      const result = evaluateSafetyGate({
        sessions: [makeSession({ status: "assigned" })],
        progress: { symptoms: [] },
        insight: { status: "stable", confidence: 0.9 },
      });

      expect(result.isSafe).toBe(false);
      expect(result.reason).toBe("backend_restriction");
    });

    it("priority: severe symptoms override safe session status", () => {
      const result = evaluateSafetyGate({
        sessions: [makeSession({ status: "closed" })],
        progress: { symptoms: [{ severity: 5.0 }] },
        insight: { status: "stable", confidence: 0.9 },
      });

      expect(result.isSafe).toBe(false);
      expect(result.reason).toBe("red_flag");
    });
  });
});
