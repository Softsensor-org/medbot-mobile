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
  usePreferenceProfile: () => ({
    data: {
      essential: {
        goals: ["Calmer skin", "Fewer flare-ups"],
        budget: "medium",
        routine_depth: "moderate",
        treatment_modality_comfort: "hybrid",
        avoid_list: ["Fragrance"],
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
    const { getByText } = render(<ProfileScreen />);

    expect(getByText("John Doe")).toBeTruthy();
    expect(getByText("What your care plan is tuned for")).toBeTruthy();
    expect(getByText("Consents & legal")).toBeTruthy();
  });

  it("navigates to settings from the hero CTA", () => {
    const { getByTestId } = render(<ProfileScreen />);

    fireEvent.press(getByTestId("profile-open-settings-button"));

    expect(mockPush).toHaveBeenCalledWith("/(auth)/settings");
  });
});
