import React from "react";
import { render, waitFor, fireEvent } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SkinHealthScore } from "../src/components/SkinHealthScore";
import { medicalApi } from "../src/api/medicalApi";

jest.mock("@expo/vector-icons", () => ({
  Ionicons: "Ionicons",
  MaterialIcons: "MaterialIcons",
}));

jest.mock("../src/api/medicalApi", () => ({
  medicalApi: {
    getSkinScore: jest.fn(),
    getDailySummary: jest.fn(),
  },
}));

const mockScore = {
  patient_id: "patient-1",
  score: 72,
  trend: "improving" as const,
  components: [
    { name: "symptom_trend", score: 80, weight: 0.30, weighted_score: 24.0, description: "Symptoms improving." },
    { name: "adherence", score: 85, weight: 0.30, weighted_score: 25.5, description: "Excellent adherence at 85%." },
    { name: "intervention_consistency", score: 60, weight: 0.20, weighted_score: 12.0, description: "Moderate engagement." },
    { name: "flare_recency", score: 100, weight: 0.20, weighted_score: 20.0, description: "No flares recorded." },
  ],
  computed_at: "2026-03-12T10:00:00",
  period_days: 28,
  disclaimer: "This score is for informational purposes only and is not a medical diagnosis.",
};

function renderWithClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
  );
}

describe("SkinHealthScore", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders loading state initially", () => {
    (medicalApi.getSkinScore as jest.Mock).mockReturnValue(new Promise(() => {}));

    const { getByTestId } = renderWithClient(<SkinHealthScore />);
    expect(getByTestId("skin-score-loading")).toBeTruthy();
  });

  it("renders score value when loaded", async () => {
    (medicalApi.getSkinScore as jest.Mock).mockResolvedValue(mockScore);

    const { getByTestId, getByText } = renderWithClient(<SkinHealthScore />);

    await waitFor(() => {
      expect(getByTestId("skin-score-card")).toBeTruthy();
    });

    expect(getByText("Skin Health Score")).toBeTruthy();
    expect(getByTestId("score-value")).toBeTruthy();
    expect(getByText("72")).toBeTruthy();
  });

  it("renders trend indicator", async () => {
    (medicalApi.getSkinScore as jest.Mock).mockResolvedValue(mockScore);

    const { getByTestId, getByText } = renderWithClient(<SkinHealthScore />);

    await waitFor(() => {
      expect(getByTestId("skin-score-card")).toBeTruthy();
    });

    expect(getByText("Improving")).toBeTruthy();
  });

  it("renders disclaimer", async () => {
    (medicalApi.getSkinScore as jest.Mock).mockResolvedValue(mockScore);

    const { getByTestId } = renderWithClient(<SkinHealthScore />);

    await waitFor(() => {
      expect(getByTestId("disclaimer")).toBeTruthy();
    });
  });

  it("renders error state on failure", async () => {
    (medicalApi.getSkinScore as jest.Mock).mockRejectedValue(new Error("fail"));

    const { getByText } = renderWithClient(<SkinHealthScore />);

    await waitFor(() => {
      expect(getByText("Unable to load skin health score.")).toBeTruthy();
    });
  });

  it("expands breakdown on tap", async () => {
    (medicalApi.getSkinScore as jest.Mock).mockResolvedValue(mockScore);

    const { getByTestId, getByText } = renderWithClient(<SkinHealthScore />);

    await waitFor(() => {
      expect(getByTestId("skin-score-card")).toBeTruthy();
    });

    // Tap to expand
    fireEvent.press(getByTestId("expand-breakdown"));

    await waitFor(() => {
      expect(getByTestId("breakdown-section")).toBeTruthy();
    });

    expect(getByText("Symptom Trend")).toBeTruthy();
    expect(getByText("Routine Adherence")).toBeTruthy();
    expect(getByText("Symptoms improving. (weight: 30%)")).toBeTruthy();
  });
});
