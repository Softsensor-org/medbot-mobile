import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import SettingsScreen from "../app/(auth)/settings";
import { AuthContext } from "../src/auth/AuthProvider";
import { useRouter } from "expo-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useHandoffSummary } from "../src/hooks/useInterventions";

// Mock notifications module
const mockLoadPreferences = jest.fn();
const mockSavePreferences = jest.fn();
const mockRequestPermission = jest.fn();
const mockSetupChannels = jest.fn();
const mockSyncSchedule = jest.fn();

jest.mock("../src/hooks/useEngagementSettings", () => ({
  useEngagementSettings: () => ({
    hapticsEnabled: true,
    setHapticsEnabled: jest.fn(),
  }),
}));

jest.mock("../src/notifications", () => ({
  DEFAULT_PREFERENCES: {
    pushEnabled: false,
    routineReminders: false,
    weeklySummary: false,
    quietHours: {
      enabled: false,
      startHour: 22,
      startMinute: 0,
      endHour: 7,
      endMinute: 0,
    },
  },
  loadPreferences: (...args: unknown[]) => mockLoadPreferences(...args),
  savePreferences: (...args: unknown[]) => mockSavePreferences(...args),
  requestPermission: (...args: unknown[]) => mockRequestPermission(...args),
  setupChannels: (...args: unknown[]) => mockSetupChannels(...args),
  syncSchedule: (...args: unknown[]) => mockSyncSchedule(...args),
}));

// Mocks
jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
}));

jest.mock('expo-auth-session', () => ({
  makeRedirectUri: jest.fn().mockReturnValue('medbot://auth'),
  useAuthRequest: jest.fn().mockReturnValue([null, null, jest.fn()]),
}));

jest.mock('expo-linking', () => ({
  createURL: jest.fn().mockReturnValue('medbot://'),
}));

jest.mock('@expo/vector-icons', () => ({
  MaterialIcons: 'MaterialIcons',
}));

jest.mock('../src/hooks/useInterventions', () => ({
  useHandoffSummary: jest.fn(),
}));

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe("SettingsScreen", () => {
  const mockRouter = { push: jest.fn(), replace: jest.fn() };
  const mockAuth = {
    user: { name: 'John Doe', email: 'john@example.com', sub: 'user-123' },
    logout: jest.fn(),
    token: 'token',
    isAuthenticated: true,
    isLoading: false,
    login: jest.fn(),
  };

  const DEFAULT_PREFS = {
    pushEnabled: false,
    routineReminders: false,
    weeklySummary: false,
    quietHours: {
      enabled: false,
      startHour: 22,
      startMinute: 0,
      endHour: 7,
      endMinute: 0,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useHandoffSummary as jest.Mock).mockReturnValue({ data: null, isLoading: false, refetch: jest.fn() });
    mockLoadPreferences.mockResolvedValue({ ...DEFAULT_PREFS });
    mockSavePreferences.mockResolvedValue(undefined);
    mockRequestPermission.mockResolvedValue(true);
    mockSetupChannels.mockResolvedValue(undefined);
    mockSyncSchedule.mockResolvedValue(undefined);
  });

  it("renders user profile info", async () => {
    const { getByText } = render(
      <AuthContext.Provider value={mockAuth}>
        <SettingsScreen />
      </AuthContext.Provider>,
      { wrapper }
    );

    await waitFor(() => {
      expect(getByText('John Doe')).toBeTruthy();
      expect(getByText('john@example.com')).toBeTruthy();
    });
  });

  it("renders notification and haptic labels", async () => {
    const { getByText } = render(
      <AuthContext.Provider value={mockAuth}>
        <SettingsScreen />
      </AuthContext.Provider>,
      { wrapper }
    );
    await waitFor(() => {
      expect(getByText("Haptic Feedback")).toBeTruthy();
      expect(getByText("Notification Settings")).toBeTruthy();
    });
  });

  it("navigates to skin brief", async () => {
    const { getByText } = render(
      <AuthContext.Provider value={mockAuth}>
        <SettingsScreen />
      </AuthContext.Provider>,
      { wrapper }
    );

    await waitFor(() => {
      fireEvent.press(getByText('Edit Skin Brief'));
      expect(mockRouter.push).toHaveBeenCalledWith('/onboarding/skin-brief');
    });
  });

  it("navigates to preferences", async () => {
    const { getByText } = render(
      <AuthContext.Provider value={mockAuth}>
        <SettingsScreen />
      </AuthContext.Provider>,
      { wrapper }
    );

    await waitFor(() => {
      fireEvent.press(getByText('Treatment Preferences'));
      expect(mockRouter.push).toHaveBeenCalledWith('/onboarding/preferences');
    });
  });
});
