import React from "react";
import { render } from "@testing-library/react-native";
import { ReadinessCard } from "../src/components/ReadinessCard";
import type { ReadinessSummary } from "../src/api/readinessApi";

const baseReadiness: ReadinessSummary = {
  readiness_score: 0.75,
  status: "ready",
  next_action: "Review your summary before your appointment.",
  evidence_completeness: 0.8,
  adherence_rate: 0.9,
  risk_flags: {
    has_red_flags: false,
    red_flag_categories: [],
    triage_label: "self_care",
    confidence_band: "High",
    escalation_active: false,
  },
  intervention_highlights: [
    {
      date: "2026-03-01T10:00:00Z",
      description: "Symptoms reported: rash, itching",
      event_type: "symptom",
    },
  ],
  photo_count: 2,
  session_count: 3,
};

describe("ReadinessCard", () => {
  it("renders title and status badge", () => {
    const { getByText } = render(<ReadinessCard readiness={baseReadiness} />);
    expect(getByText("Visit Readiness")).toBeTruthy();
    expect(getByText("Ready")).toBeTruthy();
  });

  it("renders readiness score as percentage", () => {
    const { getByText } = render(<ReadinessCard readiness={baseReadiness} />);
    expect(getByText("75%")).toBeTruthy();
  });

  it("renders evidence and adherence stats", () => {
    const { getByText } = render(<ReadinessCard readiness={baseReadiness} />);
    expect(getByText("80%")).toBeTruthy(); // evidence
    expect(getByText("90%")).toBeTruthy(); // adherence
  });

  it("renders next action", () => {
    const { getByText } = render(<ReadinessCard readiness={baseReadiness} />);
    expect(getByText("Review your summary before your appointment.")).toBeTruthy();
  });

  it("renders intervention highlights", () => {
    const { getByText } = render(<ReadinessCard readiness={baseReadiness} />);
    expect(getByText("Recent Activity")).toBeTruthy();
    expect(getByText("Symptoms reported: rash, itching")).toBeTruthy();
  });

  it("shows needs_attention badge", () => {
    const { getByText } = render(
      <ReadinessCard
        readiness={{ ...baseReadiness, status: "needs_attention", readiness_score: 0.5 }}
      />,
    );
    expect(getByText("Needs Attention")).toBeTruthy();
    expect(getByText("50%")).toBeTruthy();
  });

  it("shows not_ready badge with alert banner", () => {
    const { getByText } = render(
      <ReadinessCard
        readiness={{
          ...baseReadiness,
          status: "not_ready",
          readiness_score: 0.2,
          risk_flags: {
            ...baseReadiness.risk_flags,
            escalation_active: true,
          },
        }}
      />,
    );
    expect(getByText("Not Ready")).toBeTruthy();
    expect(getByText(/Clinical attention needed/)).toBeTruthy();
  });

  it("hides alert banner when no escalation", () => {
    const { queryByText } = render(
      <ReadinessCard readiness={baseReadiness} />,
    );
    expect(queryByText(/Clinical attention needed/)).toBeNull();
  });

  it("hides highlights section when empty", () => {
    const { queryByText } = render(
      <ReadinessCard
        readiness={{ ...baseReadiness, intervention_highlights: [] }}
      />,
    );
    expect(queryByText("Recent Activity")).toBeNull();
  });

  it("shows photo and session counts", () => {
    const { getByText } = render(<ReadinessCard readiness={baseReadiness} />);
    expect(getByText("2")).toBeTruthy(); // photos
    expect(getByText("3")).toBeTruthy(); // sessions
  });
});
