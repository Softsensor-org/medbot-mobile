import { colorFor, iconFor } from "../src/status/statusHelpers";

describe("statusHelpers", () => {
  it("returns correct color for self_care", () => {
    expect(colorFor("self_care")).toBe("#4CAF50");
  });

  it("returns correct color for urgent", () => {
    expect(colorFor("urgent")).toBe("#D32F2F");
  });

  it("returns grey for undefined status", () => {
    expect(colorFor(undefined)).toBe("#BDBDBD");
  });

  it("returns correct icon for clinician_review", () => {
    expect(iconFor("clinician_review")).toBe("Schedule");
  });

  it("returns HelpOutline for undefined status", () => {
    expect(iconFor(undefined)).toBe("HelpOutline");
  });
});

describe("type imports", () => {
  it("can import AI types", () => {
    // Verify types compile correctly
    const label: import("../src/types/ai").TriageLabel = "self_care";
    expect(label).toBe("self_care");
  });

  it("can import medical types", () => {
    const routine: import("../src/types/medical").Routine = {
      name: "Morning Routine",
      description: "AM skincare",
      active: true,
      steps: [],
    };
    expect(routine.name).toBe("Morning Routine");
  });
});
