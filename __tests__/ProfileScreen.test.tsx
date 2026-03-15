import React from "react";
import { fireEvent, render } from "@testing-library/react-native";
import ProfileScreen from "../app/(auth)/(tabs)/profile";

const mockPush = jest.fn();
const mockLogout = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock("../src/auth/useAuth", () => ({
  useAuth: () => ({
    user: { name: "John Doe", email: "john@example.com", sub: "user-123" },
    logout: mockLogout,
    token: "token",
    isAuthenticated: true,
    isLoading: false,
    login: jest.fn(),
  }),
}));

jest.mock("../src/hooks/useUser", () => ({
  usePatientProfile: () => ({
    data: {
      preferred_name: "Maya",
      pronouns: "she/her",
      skin_type: "sensitive",
      skin_sensitivity: "high",
      allergies: ["Fragrance"],
      conditions: ["Rosacea"],
      notes_for_care_team: "Patch test new actives first.",
      program_context: {
        version: 1,
        membership: {
          status: "active",
          name: "Glow Club",
          cadence_label: "Monthly",
          renewal_at: "2026-04-15T00:00:00Z",
        },
        program: {
          status: "active",
          name: "Acne Reset Program",
          focus: "Acne Maintenance",
          summary: "Six-week physician-led acne reset.",
          target_date: "2026-05-01T00:00:00Z",
          source: "manual",
        },
        treatment_plan: {
          status: "active",
          name: "Azelaic + Peel Series",
          summary: "Continue nightly azelaic acid and monthly peel cadence.",
          next_review_at: "2026-03-28T00:00:00Z",
        },
      },
    },
  }),
  usePreferenceProfile: () => ({
    data: {
      essential: {
        goals: ["Calmer skin", "Fewer flare-ups"],
        budget: "medium",
        routine_depth: "moderate",
        treatment_modality_comfort: "hybrid",
        avoid_list: ["Fragrance"],
        texture_preferences: ["gel"],
        fragrance_free_only: true,
        reminder_cadence: "structured",
        shopping_preference: "clinical",
      },
    },
  }),
}));

jest.mock("../src/hooks/useConsent", () => ({
  useConsentStatus: () => ({
    data: {
      pending_required: [],
    },
  }),
}));

jest.mock("../src/hooks/useEngagementSettings", () => ({
  useEngagementSettings: () => ({
    hapticsEnabled: true,
  }),
}));

jest.mock("../src/components/HandoffSummaryCard", () => ({
  HandoffSummaryCard: () => null,
}));

jest.mock("@expo/vector-icons", () => ({
  MaterialIcons: "MaterialIcons",
}));

describe("ProfileScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the new identity hub summary", () => {
    const { getAllByText, getByText } = render(<ProfileScreen />);

    expect(getAllByText("Maya").length).toBeGreaterThan(0);
    expect(getAllByText("Glow Club").length).toBeGreaterThan(0);
    expect(getAllByText("Acne Reset Program").length).toBeGreaterThan(0);
    expect(getByText("What your care plan is tuned for")).toBeTruthy();
    expect(getByText("What your provider handoff can see")).toBeTruthy();
    expect(getByText("Consents & legal")).toBeTruthy();
  });

  it("navigates to settings from the hero CTA", () => {
    const { getByTestId } = render(<ProfileScreen />);

    fireEvent.press(getByTestId("profile-open-settings-button"));

    expect(mockPush).toHaveBeenCalledWith("/(auth)/settings");
  });
});
