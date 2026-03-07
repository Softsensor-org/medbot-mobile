import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import SettingsScreen from "../app/(auth)/settings";

// Mock notifications module
const mockLoadPreferences = jest.fn();
const mockSavePreferences = jest.fn();
const mockRequestPermission = jest.fn();
const mockSetupChannels = jest.fn();
const mockSyncSchedule = jest.fn();

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

// Spy on Alert from react-native
import { Alert } from "react-native";
jest.spyOn(Alert, "alert").mockImplementation(() => {});

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

describe("SettingsScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLoadPreferences.mockResolvedValue({ ...DEFAULT_PREFS });
    mockSavePreferences.mockResolvedValue(undefined);
    mockRequestPermission.mockResolvedValue(true);
    mockSetupChannels.mockResolvedValue(undefined);
    mockSyncSchedule.mockResolvedValue(undefined);
  });

  it("renders title and notification toggles", async () => {
    const { getByText } = render(<SettingsScreen />);
    await waitFor(() => {
      expect(getByText("Settings")).toBeTruthy();
    });
    expect(getByText("Push Notifications")).toBeTruthy();
    expect(getByText("Routine Reminders")).toBeTruthy();
    expect(getByText("Weekly Summary")).toBeTruthy();
  });

  it("renders quiet hours section", async () => {
    const { getByText } = render(<SettingsScreen />);
    await waitFor(() => {
      expect(getByText("Enable Quiet Hours")).toBeTruthy();
    });
    expect(getByText("Start")).toBeTruthy();
    expect(getByText("End")).toBeTruthy();
  });

  it("loads preferences on mount", async () => {
    render(<SettingsScreen />);
    await waitFor(() => {
      expect(mockLoadPreferences).toHaveBeenCalledTimes(1);
    });
  });

  it("requests permission when enabling push", async () => {
    const { getAllByRole } = render(<SettingsScreen />);
    await waitFor(() => {
      expect(mockLoadPreferences).toHaveBeenCalled();
    });
    // Find the first switch (Push Notifications)
    const switches = getAllByRole("switch");
    fireEvent(switches[0], "valueChange", true);
    await waitFor(() => {
      expect(mockRequestPermission).toHaveBeenCalled();
    });
  });

  it("shows alert when permission denied", async () => {
    mockRequestPermission.mockResolvedValue(false);
    const { getAllByRole } = render(<SettingsScreen />);
    await waitFor(() => {
      expect(mockLoadPreferences).toHaveBeenCalled();
    });
    const switches = getAllByRole("switch");
    fireEvent(switches[0], "valueChange", true);
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        "Permission Required",
        expect.any(String),
      );
    });
  });

  it("saves and syncs when toggling routine reminders", async () => {
    mockLoadPreferences.mockResolvedValue({
      ...DEFAULT_PREFS,
      pushEnabled: true,
    });
    const { getAllByRole } = render(<SettingsScreen />);
    await waitFor(() => {
      expect(mockLoadPreferences).toHaveBeenCalled();
    });
    const switches = getAllByRole("switch");
    // switches[1] is Routine Reminders
    fireEvent(switches[1], "valueChange", true);
    await waitFor(() => {
      expect(mockSavePreferences).toHaveBeenCalledWith(
        expect.objectContaining({ routineReminders: true }),
      );
      expect(mockSyncSchedule).toHaveBeenCalled();
    });
  });

  it("displays quiet hours times", async () => {
    const { getByText } = render(<SettingsScreen />);
    await waitFor(() => {
      expect(getByText("10:00 PM")).toBeTruthy(); // startHour 22
      expect(getByText("7:00 AM")).toBeTruthy(); // endHour 7
    });
  });

  it("cycles quiet hours start time", async () => {
    mockLoadPreferences.mockResolvedValue({
      ...DEFAULT_PREFS,
      pushEnabled: true,
      quietHours: { ...DEFAULT_PREFS.quietHours, enabled: true },
    });
    const { getByLabelText } = render(<SettingsScreen />);
    await waitFor(() => {
      expect(mockLoadPreferences).toHaveBeenCalled();
    });
    const increaseBtn = getByLabelText("Increase Start hour");
    fireEvent.press(increaseBtn);
    await waitFor(() => {
      expect(mockSavePreferences).toHaveBeenCalledWith(
        expect.objectContaining({
          quietHours: expect.objectContaining({ startHour: 23 }),
        }),
      );
    });
  });
});
