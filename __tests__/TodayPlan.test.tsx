import React from "react";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TodayPlan } from "../src/components/TodayPlan";
import { triggerEngagementHaptic } from "../src/engagement/haptics";

jest.mock("../src/engagement/haptics", () => ({
  triggerEngagementHaptic: jest.fn(),
}));

jest.mock("@expo/vector-icons", () => ({
  Ionicons: "Ionicons",
  MaterialIcons: "MaterialIcons",
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
      mutations: { retry: false, gcTime: Infinity },
    },
  });
  return {
    queryClient,
    wrapper: ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
  };
};

function ok(data: unknown) {
  return Promise.resolve({
    ok: true,
    json: async () => ({ success: true, data }),
  }) as any; // eslint-disable-line @typescript-eslint/no-explicit-any
}

describe("TodayPlan engagement behavior", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    global.fetch = jest.fn((url: string, init?: RequestInit) => {
      if (url.includes("/care-plan/today")) {
        return ok({
          confidence_context: "context",
          am_actions: [{ id: 10, action: "Cleanse", done: false }],
          pm_actions: [],
          avoid_today: [],
          watch_for: [],
        });
      }
      if (url.includes("/care-graph")) {
        return ok({
          triage_sessions: [{ triage_label: "urgent", red_flags: [] }],
          event_counts: { symptom_event: 1, safety_event: 1 },
        });
      }
      if (url.includes("/routines/10/log") && init?.method === "POST") {
        return ok({ id: 99 });
      }
      return Promise.resolve({
        ok: false,
        json: async () => ({ success: false }),
      }) as any; // eslint-disable-line @typescript-eslint/no-explicit-any
    }) as any; // eslint-disable-line @typescript-eslint/no-explicit-any
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  it("triggers warning haptic when safety note is acknowledged", async () => {
    const renderTarget = createWrapper();
    const { getByTestId, unmount } = render(<TodayPlan />, { wrapper: renderTarget.wrapper });

    const ackButton = await waitFor(() => getByTestId("todayplan-safety-ack-button"));
    fireEvent.press(ackButton);

    expect(triggerEngagementHaptic).toHaveBeenCalledWith("warning_acknowledged");
    unmount();
    renderTarget.queryClient.clear();
  });

  it("triggers completion haptic when routine action is completed", async () => {
    const renderTarget = createWrapper();
    const { getByText, unmount } = render(<TodayPlan />, { wrapper: renderTarget.wrapper });
    const action = await waitFor(() => getByText("Cleanse"));
    fireEvent.press(action);

    await waitFor(() => {
      expect(triggerEngagementHaptic).toHaveBeenCalledWith("routine_complete");
    });
    unmount();
    renderTarget.queryClient.clear();
  });
});
