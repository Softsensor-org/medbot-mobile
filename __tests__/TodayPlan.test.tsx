import React from "react";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TodayPlan } from "../src/components/TodayPlan";
import { medicalApi } from "../src/api/medicalApi";
import { triggerEngagementHaptic } from "../src/engagement/haptics";
import type { CareGraphResponse, RoutineLog } from "../src/types/medical";
import type { DailyCarePlanWithAdaptation } from "../src/types/wellness";

jest.mock("../src/engagement/haptics", () => ({
  triggerEngagementHaptic: jest.fn(),
}));

jest.mock("../src/api/medicalApi", () => ({
  medicalApi: {
    getTodayCarePlan: jest.fn(),
    getCareGraph: jest.fn(),
    logRoutineCompletion: jest.fn(),
  },
}));

jest.mock("@expo/vector-icons", () => ({
  Ionicons: "Ionicons",
  MaterialIcons: "MaterialIcons",
}));

const mockedMedicalApi = medicalApi as jest.Mocked<typeof medicalApi>;

const basePlan: DailyCarePlanWithAdaptation = {
  confidence_context: "context",
  am_actions: [{ id: 10, action: "Cleanse", done: false }],
  pm_actions: [],
  avoid_today: [],
  watch_for: [],
};

const urgentCareGraph: CareGraphResponse = {
  patient_id: "patient-1",
  triage_sessions: [
    {
      session_id: "session-1",
      status: "open",
      triage_label: "urgent",
      confidence_band: "High",
      priority_score: 95,
      summary_for_patient: "Escalated symptoms noted.",
      red_flags: [],
      evidence_completeness: 0.9,
      is_preliminary: false,
      created_at: "2026-03-14T00:00:00Z",
      updated_at: "2026-03-14T00:10:00Z",
    },
  ],
  events: [],
  event_counts: { symptom_event: 1, safety_event: 1 },
  time_range: { since: null, until: null },
};

const emptyCareGraph: CareGraphResponse = {
  patient_id: "patient-1",
  triage_sessions: [],
  events: [],
  event_counts: {},
  time_range: { since: null, until: null },
};

const completedLog: RoutineLog = {
  id: 99,
  routine_id: 10,
  patient_id: "patient-1",
  status: "completed",
  completed_at: "2026-03-14T00:00:00Z",
  completion_rate: 1,
};

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

describe("TodayPlan engagement behavior", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
    mockedMedicalApi.getTodayCarePlan.mockResolvedValue(basePlan);
    mockedMedicalApi.getCareGraph.mockResolvedValue(urgentCareGraph);
    mockedMedicalApi.logRoutineCompletion.mockResolvedValue(completedLog);
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  it("loads protected data through the shared medical client", async () => {
    const renderTarget = createWrapper();
    const { getByText, unmount } = render(<TodayPlan />, { wrapper: renderTarget.wrapper });

    await waitFor(() => {
      expect(getByText("Today's Plan")).toBeTruthy();
    });

    expect(mockedMedicalApi.getTodayCarePlan).toHaveBeenCalledTimes(1);
    expect(mockedMedicalApi.getCareGraph).toHaveBeenCalledTimes(1);
    expect(global.fetch).not.toHaveBeenCalled();

    unmount();
    renderTarget.queryClient.clear();
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
    expect(mockedMedicalApi.logRoutineCompletion).toHaveBeenCalledWith(10, "completed");
    unmount();
    renderTarget.queryClient.clear();
  });
});

describe("TodayPlan adaptation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
    mockedMedicalApi.getCareGraph.mockResolvedValue(emptyCareGraph);
  });

  it("renders adaptation adjustments when active", async () => {
    mockedMedicalApi.getTodayCarePlan.mockResolvedValue({
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
    mockedMedicalApi.getTodayCarePlan.mockResolvedValue({
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

  it("keeps rendering the plan when care graph loading fails", async () => {
    mockedMedicalApi.getTodayCarePlan.mockResolvedValue(basePlan);
    mockedMedicalApi.getCareGraph.mockRejectedValue(new Error("401"));

    const { getByText, queryByTestId } = renderWithClient(<TodayPlan />);

    await waitFor(() => {
      expect(getByText("Today's Plan")).toBeTruthy();
    });

    expect(queryByTestId("todayplan-safety-ack-button")).toBeNull();
  });
});
