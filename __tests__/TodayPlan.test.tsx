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

function renderWithClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

function ok(data: unknown) {
  return Promise.resolve({
    ok: true,
    json: async () => ({ success: true, data }),
  }) as any; // eslint-disable-line @typescript-eslint/no-explicit-any
}

function mockFetchWithPlan(planData: unknown) {
  (global.fetch as jest.Mock) = jest.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url.includes("/api/v1/care-plan/today")) {
      return {
        ok: true,
        json: async () => ({ success: true, data: planData }),
      } as Response;
    }
    if (url.includes("/api/v1/care-graph")) {
      return {
        ok: true,
        json: async () => ({
          success: true,
          data: { triage_sessions: [], event_counts: {} },
        }),
      } as Response;
    }
    return {
      ok: false,
      json: async () => ({}),
    } as Response;
  });
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

describe("TodayPlan adaptation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders adaptation adjustments when active", async () => {
    mockFetchWithPlan({
      confidence_context: "Personalized from your routine history.",
      am_actions: [{ id: 1, action: "Cleanse", done: false }],
      pm_actions: [{ id: 2, action: "Moisturize", done: false }],
      avoid_today: [],
      watch_for: [],
      adaptation: {
        status: "active",
        suppressed: false,
        reason_codes: [],
        confidence_band: "Moderate",
        signals: {
          adherence_rate_7d: 0.42,
          logged_events_7d: 3,
          deferred_or_skipped_7d: 1,
          symptom_avg_severity_7d: 4,
          symptom_max_severity_7d: 5,
          symptom_events_7d: 2,
          high_symptom_burden: false,
          emergency_keywords_present: false,
          safety_events_7d: 0,
          context_tags: ["stress"],
        },
        next_day_adjustments: [
          {
            code: "simplify_core_steps",
            title: "Simplify to core steps",
            detail: "Focus on cleanser, moisturizer, and SPF to improve consistency tomorrow.",
            priority: "high",
          },
        ],
        fallback_message: null,
      },
    });

    const { getByText } = renderWithClient(<TodayPlan />);

    await waitFor(() => {
      expect(getByText("Tomorrow's adjustments")).toBeTruthy();
      expect(getByText("Simplify to core steps")).toBeTruthy();
    });
  });

  it("renders suppression fallback copy when adaptation is suppressed", async () => {
    mockFetchWithPlan({
      confidence_context: "Safety-first mode is active.",
      am_actions: [],
      pm_actions: [],
      avoid_today: [],
      watch_for: [],
      adaptation: {
        status: "suppressed",
        suppressed: true,
        reason_codes: ["safety_events_present"],
        confidence_band: "Low",
        signals: {
          adherence_rate_7d: null,
          logged_events_7d: 0,
          deferred_or_skipped_7d: 0,
          symptom_avg_severity_7d: null,
          symptom_max_severity_7d: null,
          symptom_events_7d: 0,
          high_symptom_burden: false,
          emergency_keywords_present: false,
          safety_events_7d: 1,
          context_tags: [],
        },
        next_day_adjustments: [],
        fallback_message: "Adaptive changes are paused because recent safety signals were detected.",
      },
    });

    const { getByText } = renderWithClient(<TodayPlan />);

    await waitFor(() => {
      expect(
        getByText("Adaptive changes are paused because recent safety signals were detected."),
      ).toBeTruthy();
    });
  });
});
