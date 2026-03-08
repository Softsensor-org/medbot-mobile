import {
  emitAspirationalEvent,
  flushEventBuffer,
  getBufferedEvents,
  isAspirationalEnabled,
} from "../src/analytics/aspirationalEvents";

// Reset buffer between tests
beforeEach(() => {
  flushEventBuffer();
});

describe("aspirationalEvents", () => {
  describe("emitAspirationalEvent", () => {
    it("buffers suppression events even when flag is disabled", () => {
      // ENABLE_ASPIRATIONAL_WAVE defaults to false
      emitAspirationalEvent("aspirational_surface_suppressed", {
        reason: "low_confidence",
      });
      const events = getBufferedEvents();
      expect(events.length).toBe(1);
      expect(events[0].event_type).toBe("aspirational_surface_suppressed");
      expect(events[0].metadata?.reason).toBe("low_confidence");
    });

    it("skips non-suppression events when flag is disabled", () => {
      emitAspirationalEvent("goal_activated");
      emitAspirationalEvent("reveal_viewed");
      expect(getBufferedEvents().length).toBe(0);
    });

    it("includes timestamp on every event", () => {
      emitAspirationalEvent("aspirational_surface_suppressed");
      const events = getBufferedEvents();
      expect(events[0].timestamp).toBeTruthy();
      expect(events[0].timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    it("caps buffer at MAX_BUFFER_SIZE", () => {
      for (let i = 0; i < 120; i++) {
        emitAspirationalEvent("aspirational_surface_suppressed", { i });
      }
      expect(getBufferedEvents().length).toBeLessThanOrEqual(100);
    });
  });

  describe("flushEventBuffer", () => {
    it("returns and clears buffered events", () => {
      emitAspirationalEvent("aspirational_surface_suppressed");
      emitAspirationalEvent("aspirational_surface_suppressed");
      const flushed = flushEventBuffer();
      expect(flushed.length).toBe(2);
      expect(getBufferedEvents().length).toBe(0);
    });

    it("returns empty array when no events", () => {
      const flushed = flushEventBuffer();
      expect(flushed.length).toBe(0);
    });
  });

  describe("getBufferedEvents", () => {
    it("returns readonly view of buffer", () => {
      emitAspirationalEvent("aspirational_surface_suppressed");
      const events = getBufferedEvents();
      expect(events.length).toBe(1);
      // Should be the same reference (readonly)
      expect(getBufferedEvents()).toBe(events);
    });
  });

  describe("isAspirationalEnabled", () => {
    it("returns false when flag is disabled (default)", () => {
      expect(isAspirationalEnabled()).toBe(false);
    });
  });

  describe("event types", () => {
    it("supports all defined event types", () => {
      const types = [
        "goal_activated",
        "goal_completed",
        "reveal_viewed",
        "reveal_action_taken",
        "readiness_checked",
        "escalation_acknowledged",
        "aspirational_surface_suppressed",
      ] as const;
      // Only suppression events will actually buffer (flag off)
      for (const t of types) {
        emitAspirationalEvent(t);
      }
      // Only the suppression event should be buffered
      const events = getBufferedEvents();
      expect(events.length).toBe(1);
      expect(events[0].event_type).toBe("aspirational_surface_suppressed");
    });
  });
});
