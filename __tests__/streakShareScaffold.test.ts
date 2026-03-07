import { deriveStreakRescueState } from "../src/engagement/streakRescue";
import { buildPhiSafeShareSummary, buildPhiSafeShareMessage } from "../src/engagement/shareScaffold";

describe("streak rescue", () => {
  it("marks rescue eligible when recent adherence has misses", () => {
    const state = deriveStreakRescueState([
      { date: "2026-03-01", rate: 1 },
      { date: "2026-03-02", rate: 0.4 },
      { date: "2026-03-03", rate: 0 },
    ]);

    expect(state.rescueEligible).toBe(true);
    expect(state.missedDays).toBe(2);
    expect(state.supportiveMessage.toLowerCase()).toContain("missed");
  });

  it("keeps rescue disabled when adherence is stable", () => {
    const state = deriveStreakRescueState([
      { date: "2026-03-01", rate: 1 },
      { date: "2026-03-02", rate: 0.8 },
      { date: "2026-03-03", rate: 1 },
    ]);

    expect(state.rescueEligible).toBe(false);
    expect(state.missedDays).toBe(0);
  });
});

describe("PHI-safe share scaffold", () => {
  it("omits identifiers and raw photo/session details", () => {
    const summary = buildPhiSafeShareSummary({
      patient_id: "patient-123",
      period_days: 30,
      summary: {
        symptom_count: 4,
        adherence_rate: 0.82,
        photo_count: 3,
        active_routines: 2,
      },
      symptoms: [{ date: "2026-03-01", severity: 2, count: 1 }],
      adherence: [{ date: "2026-03-01", rate: 0.9 }],
      photos: [
        {
          id: "photo-1",
          timestamp: "2026-03-01T10:00:00Z",
          url: "https://example.test/photo-1.jpg",
          session_id: "session-1",
        },
      ],
    });

    const serialized = JSON.stringify(summary);
    expect(serialized).not.toContain("patient-123");
    expect(serialized).not.toContain("session-1");
    expect(serialized).not.toContain("photo-1.jpg");

    const message = buildPhiSafeShareMessage(summary);
    expect(message).toContain("No personal identifiers");
    expect(message).not.toContain("patient-123");
  });
});
