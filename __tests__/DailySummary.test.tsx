import React from "react";
import { render, waitFor } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { DailySummary } from "../src/components/DailySummary";
import { medicalApi } from "../src/api/medicalApi";

jest.mock("@expo/vector-icons", () => ({
  Ionicons: "Ionicons",
  MaterialIcons: "MaterialIcons",
}));

jest.mock("../src/api/medicalApi", () => ({
  medicalApi: {
    getDailySummary: jest.fn(),
  },
}));

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

describe("DailySummary", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders loading state initially", () => {
    (medicalApi.getDailySummary as jest.Mock).mockReturnValue(new Promise(() => {}));

    const { getByTestId } = renderWithClient(<DailySummary />);
    expect(getByTestId("daily-summary-loading")).toBeTruthy();
  });

  it("renders summary data when loaded", async () => {
    (medicalApi.getDailySummary as jest.Mock).mockResolvedValue({
      patient_id: "patient-1",
      period_days: 7,
      adherence_rate: 0.85,
      trend: "improving",
      symptom_count: 2,
      routine_completion_count: 6,
      routine_total_count: 7,
      severity_trend: [
        { date: "2026-03-10", avg_severity: 4.0 },
        { date: "2026-03-11", avg_severity: 3.0 },
      ],
    });

    const { getByText, getByTestId } = renderWithClient(<DailySummary />);

    await waitFor(() => {
      expect(getByTestId("daily-summary-card")).toBeTruthy();
    });

    expect(getByText("Daily Summary")).toBeTruthy();
    expect(getByText("85%")).toBeTruthy();
    expect(getByText("Improving")).toBeTruthy();
    expect(getByText("6 of 7 routines completed")).toBeTruthy();
    expect(getByText("4.0")).toBeTruthy();
    expect(getByText("3.0")).toBeTruthy();
  });

  it("renders error state on failure", async () => {
    (medicalApi.getDailySummary as jest.Mock).mockRejectedValue(new Error("fail"));

    const { getByText } = renderWithClient(<DailySummary />);

    await waitFor(() => {
      expect(getByText("Unable to load daily summary.")).toBeTruthy();
    });
  });

  it("renders zeroed summary with no data", async () => {
    (medicalApi.getDailySummary as jest.Mock).mockResolvedValue({
      patient_id: "patient-1",
      period_days: 7,
      adherence_rate: 0,
      trend: "stable",
      symptom_count: 0,
      routine_completion_count: 0,
      routine_total_count: 0,
      severity_trend: [],
    });

    const { getByText } = renderWithClient(<DailySummary />);

    await waitFor(() => {
      expect(getByText("0%")).toBeTruthy();
      expect(getByText("Stable")).toBeTruthy();
      expect(getByText("0 of 0 routines completed")).toBeTruthy();
    });
  });
});
