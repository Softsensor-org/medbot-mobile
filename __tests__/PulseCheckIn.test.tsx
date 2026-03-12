import React from "react";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PulseCheckIn } from "../src/components/PulseCheckIn";
import { triggerEngagementHaptic } from "../src/engagement/haptics";
import { medicalApi } from "../src/api/medicalApi";

jest.mock("../src/engagement/haptics", () => ({
  triggerEngagementHaptic: jest.fn(),
}));

jest.mock("../src/api/medicalApi", () => ({
  medicalApi: {
    submitPulse: jest.fn(),
    getRecentPulses: jest.fn(),
  },
}));

function renderWithClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
  );
}

describe("PulseCheckIn", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (medicalApi.submitPulse as jest.Mock).mockResolvedValue({
      pulse_id: "test-123",
      patient_id: "user-1",
      severity: 3,
      created_at: new Date().toISOString(),
    });
  });

  it("renders severity options", () => {
    const { getByText } = renderWithClient(<PulseCheckIn />);

    expect(getByText("How's your skin today?")).toBeTruthy();
    expect(getByText("Great")).toBeTruthy();
    expect(getByText("Good")).toBeTruthy();
    expect(getByText("Okay")).toBeTruthy();
    expect(getByText("Bad")).toBeTruthy();
    expect(getByText("Terrible")).toBeTruthy();
  });

  it("triggers haptic on severity selection", () => {
    const { getByTestId } = renderWithClient(<PulseCheckIn />);

    fireEvent.press(getByTestId("pulse-severity-3"));
    expect(triggerEngagementHaptic).toHaveBeenCalledWith("routine_complete");
  });

  it("submits pulse and shows success", async () => {
    const { getByTestId, getByText } = renderWithClient(<PulseCheckIn />);

    fireEvent.press(getByTestId("pulse-severity-2"));
    fireEvent.press(getByTestId("pulse-submit"));

    await waitFor(() => {
      expect(medicalApi.submitPulse).toHaveBeenCalledWith(2, undefined);
    });

    await waitFor(() => {
      expect(getByText(/pulse logged/i)).toBeTruthy();
    });
  });

  it("submit button is disabled when no severity selected", () => {
    const { getByTestId } = renderWithClient(<PulseCheckIn />);
    const submitBtn = getByTestId("pulse-submit");

    // The button should be disabled (TouchableOpacity with disabled prop)
    expect(submitBtn.props.accessibilityState?.disabled ?? submitBtn.props.disabled).toBeTruthy();
  });
});
