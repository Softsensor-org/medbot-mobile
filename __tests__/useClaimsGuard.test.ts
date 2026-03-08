import { evaluateClaimsGuard } from "../src/hooks/useClaimsGuard";

describe("evaluateClaimsGuard", () => {
  describe("safe states", () => {
    it("returns safe for High confidence + self_care", () => {
      const result = evaluateClaimsGuard({
        confidenceBand: "High",
        triageLabel: "self_care",
        redFlagsAcknowledged: [],
      });
      expect(result.isSafe).toBe(true);
      expect(result.suppressionReason).toBeNull();
      expect(result.fallbackMessage).toBeNull();
    });

    it("returns safe for Moderate confidence + self_care", () => {
      const result = evaluateClaimsGuard({
        confidenceBand: "Moderate",
        triageLabel: "self_care",
        redFlagsAcknowledged: [],
      });
      expect(result.isSafe).toBe(true);
    });
  });

  describe("low confidence suppression", () => {
    it("suppresses when confidence is Low", () => {
      const result = evaluateClaimsGuard({
        confidenceBand: "Low",
        triageLabel: "self_care",
        redFlagsAcknowledged: [],
      });
      expect(result.isSafe).toBe(false);
      expect(result.suppressionReason).toBe("low_confidence");
      expect(result.fallbackMessage).toBeTruthy();
    });
  });

  describe("escalation suppression", () => {
    it("suppresses when triage is urgent", () => {
      const result = evaluateClaimsGuard({
        confidenceBand: "High",
        triageLabel: "urgent",
        redFlagsAcknowledged: [],
      });
      expect(result.isSafe).toBe(false);
      expect(result.suppressionReason).toBe("escalation_active");
    });

    it("suppresses when triage is clinician_review", () => {
      const result = evaluateClaimsGuard({
        confidenceBand: "High",
        triageLabel: "clinician_review",
        redFlagsAcknowledged: [],
      });
      expect(result.isSafe).toBe(false);
      expect(result.suppressionReason).toBe("escalation_active");
    });
  });

  describe("red flag suppression", () => {
    it("suppresses when red flags are present", () => {
      const result = evaluateClaimsGuard({
        confidenceBand: "High",
        triageLabel: "self_care",
        redFlagsAcknowledged: ["rapid_spread"],
      });
      expect(result.isSafe).toBe(false);
      expect(result.suppressionReason).toBe("red_flags_present");
    });

    it("does not suppress with empty red flags array", () => {
      const result = evaluateClaimsGuard({
        confidenceBand: "High",
        triageLabel: "self_care",
        redFlagsAcknowledged: [],
      });
      expect(result.isSafe).toBe(true);
    });
  });

  describe("fail-closed on missing data", () => {
    it("suppresses when confidenceBand is null", () => {
      const result = evaluateClaimsGuard({
        confidenceBand: null,
        triageLabel: "self_care",
        redFlagsAcknowledged: [],
      });
      expect(result.isSafe).toBe(false);
      expect(result.suppressionReason).toBe("low_confidence");
    });

    it("suppresses when triageLabel is null", () => {
      const result = evaluateClaimsGuard({
        confidenceBand: "High",
        triageLabel: null,
        redFlagsAcknowledged: [],
      });
      expect(result.isSafe).toBe(false);
      expect(result.suppressionReason).toBe("low_confidence");
    });

    it("suppresses when confidenceBand is undefined", () => {
      const result = evaluateClaimsGuard({
        triageLabel: "self_care",
      });
      expect(result.isSafe).toBe(false);
    });
  });

  describe("priority ordering", () => {
    it("low confidence takes priority over escalation", () => {
      const result = evaluateClaimsGuard({
        confidenceBand: "Low",
        triageLabel: "urgent",
        redFlagsAcknowledged: ["breathing"],
      });
      expect(result.suppressionReason).toBe("low_confidence");
    });

    it("escalation takes priority over red flags", () => {
      const result = evaluateClaimsGuard({
        confidenceBand: "High",
        triageLabel: "urgent",
        redFlagsAcknowledged: ["rapid_spread"],
      });
      expect(result.suppressionReason).toBe("escalation_active");
    });
  });

  describe("fallback messages", () => {
    it("provides meaningful fallback for each reason", () => {
      const cases = [
        { confidenceBand: "Low" as const, triageLabel: "self_care" as const, redFlagsAcknowledged: [] },
        { confidenceBand: "High" as const, triageLabel: "urgent" as const, redFlagsAcknowledged: [] },
        { confidenceBand: "High" as const, triageLabel: "self_care" as const, redFlagsAcknowledged: ["flag"] },
      ];
      for (const input of cases) {
        const result = evaluateClaimsGuard(input);
        expect(result.isSafe).toBe(false);
        expect(result.fallbackMessage).toBeTruthy();
        expect(result.fallbackMessage!.length).toBeGreaterThan(20);
      }
    });
  });
});
