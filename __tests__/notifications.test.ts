import { isInQuietHours } from "../src/notifications/scheduler";
import type { QuietHours } from "../src/notifications/types";
import {
  DEFAULT_PREFERENCES,
  NOTIFICATION_CONTENT,
  WEEKLY_SUMMARY_DEEP_LINK,
} from "../src/notifications/types";
import { loadPreferences, savePreferences } from "../src/notifications/preferenceStorage";

// Mock expo-notifications
jest.mock("expo-notifications", () => ({
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  setNotificationChannelAsync: jest.fn(),
  scheduleNotificationAsync: jest.fn().mockResolvedValue("mock-id"),
  cancelScheduledNotificationAsync: jest.fn(),
  cancelAllScheduledNotificationsAsync: jest.fn(),
  getAllScheduledNotificationsAsync: jest.fn().mockResolvedValue([]),
  AndroidImportance: { DEFAULT: 3 },
  SchedulableTriggerInputTypes: { WEEKLY: "weekly", DAILY: "daily" },
}));

// Mock react-native Platform
jest.mock("react-native", () => ({
  Platform: { OS: "ios" },
}));

// Mock expo-secure-store
jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn().mockResolvedValue(null),
  setItemAsync: jest.fn().mockResolvedValue(undefined),
}));

describe("isInQuietHours", () => {
  const baseQH: QuietHours = {
    enabled: true,
    startHour: 22,
    startMinute: 0,
    endHour: 7,
    endMinute: 0,
  };

  it("returns false when quiet hours disabled", () => {
    expect(isInQuietHours({ ...baseQH, enabled: false }, new Date("2026-01-01T23:00:00"))).toBe(false);
  });

  it("detects overnight range — during quiet hours (23:00)", () => {
    expect(isInQuietHours(baseQH, new Date("2026-01-01T23:00:00"))).toBe(true);
  });

  it("detects overnight range — during quiet hours (02:00)", () => {
    expect(isInQuietHours(baseQH, new Date("2026-01-01T02:00:00"))).toBe(true);
  });

  it("detects overnight range — outside quiet hours (08:00)", () => {
    expect(isInQuietHours(baseQH, new Date("2026-01-01T08:00:00"))).toBe(false);
  });

  it("detects overnight range — boundary start is inclusive", () => {
    expect(isInQuietHours(baseQH, new Date("2026-01-01T22:00:00"))).toBe(true);
  });

  it("detects overnight range — boundary end is exclusive", () => {
    expect(isInQuietHours(baseQH, new Date("2026-01-01T07:00:00"))).toBe(false);
  });

  it("handles same-day range (9:00-17:00)", () => {
    const daytime: QuietHours = {
      enabled: true,
      startHour: 9,
      startMinute: 0,
      endHour: 17,
      endMinute: 0,
    };
    expect(isInQuietHours(daytime, new Date("2026-01-01T12:00:00"))).toBe(true);
    expect(isInQuietHours(daytime, new Date("2026-01-01T08:00:00"))).toBe(false);
    expect(isInQuietHours(daytime, new Date("2026-01-01T18:00:00"))).toBe(false);
  });

  it("handles minute-level precision", () => {
    const precise: QuietHours = {
      enabled: true,
      startHour: 22,
      startMinute: 30,
      endHour: 6,
      endMinute: 45,
    };
    // 22:29 → outside
    expect(isInQuietHours(precise, new Date("2026-01-01T22:29:00"))).toBe(false);
    // 22:30 → inside
    expect(isInQuietHours(precise, new Date("2026-01-01T22:30:00"))).toBe(true);
    // 06:44 → inside
    expect(isInQuietHours(precise, new Date("2026-01-01T06:44:00"))).toBe(true);
    // 06:45 → outside
    expect(isInQuietHours(precise, new Date("2026-01-01T06:45:00"))).toBe(false);
  });
});

describe("DEFAULT_PREFERENCES", () => {
  it("has push disabled by default", () => {
    expect(DEFAULT_PREFERENCES.pushEnabled).toBe(false);
  });

  it("has routine reminders disabled by default", () => {
    expect(DEFAULT_PREFERENCES.routineReminders).toBe(false);
  });

  it("has weekly summary disabled by default", () => {
    expect(DEFAULT_PREFERENCES.weeklySummary).toBe(false);
  });

  it("has quiet hours disabled with 22:00-7:00 defaults", () => {
    expect(DEFAULT_PREFERENCES.quietHours.enabled).toBe(false);
    expect(DEFAULT_PREFERENCES.quietHours.startHour).toBe(22);
    expect(DEFAULT_PREFERENCES.quietHours.endHour).toBe(7);
  });
});

describe("NOTIFICATION_CONTENT", () => {
  it("has routine reminder content", () => {
    expect(NOTIFICATION_CONTENT.routineReminder.title).toBeTruthy();
    expect(NOTIFICATION_CONTENT.routineReminder.body).toBeTruthy();
  });

  it("has weekly summary content", () => {
    expect(NOTIFICATION_CONTENT.weeklySummary.title).toBeTruthy();
    expect(NOTIFICATION_CONTENT.weeklySummary.body).toBeTruthy();
  });
});

describe("WEEKLY_SUMMARY_DEEP_LINK", () => {
  it("points to progress tab", () => {
    expect(WEEKLY_SUMMARY_DEEP_LINK).toContain("progress");
  });
});

describe("preferenceStorage", () => {
  it("returns defaults when no stored prefs", async () => {
    const prefs = await loadPreferences();
    expect(prefs).toEqual(DEFAULT_PREFERENCES);
  });

  it("round-trips preferences", async () => {
    const SecureStore = require("expo-secure-store");
    let stored: string | null = null;
    SecureStore.setItemAsync.mockImplementation((_k: string, v: string) => {
      stored = v;
      return Promise.resolve();
    });
    SecureStore.getItemAsync.mockImplementation(() => Promise.resolve(stored));

    const custom = {
      ...DEFAULT_PREFERENCES,
      pushEnabled: true,
      weeklySummary: true,
    };
    await savePreferences(custom);
    const loaded = await loadPreferences();
    expect(loaded.pushEnabled).toBe(true);
    expect(loaded.weeklySummary).toBe(true);
  });
});

describe("scheduler", () => {
  it("requestPermission returns true when granted", async () => {
    const Notifications = require("expo-notifications");
    Notifications.getPermissionsAsync.mockResolvedValue({ status: "granted" });
    const { requestPermission } = require("../src/notifications/scheduler");
    const result = await requestPermission();
    expect(result).toBe(true);
  });

  it("scheduleWeeklySummary returns notification id", async () => {
    const { scheduleWeeklySummary } = require("../src/notifications/scheduler");
    const id = await scheduleWeeklySummary();
    expect(id).toBe("mock-id");
  });

  it("scheduleRoutineReminder returns notification id", async () => {
    const { scheduleRoutineReminder } = require("../src/notifications/scheduler");
    const id = await scheduleRoutineReminder(8, 0);
    expect(id).toBe("mock-id");
  });

  it("syncSchedule cancels all when push disabled", async () => {
    const Notifications = require("expo-notifications");
    const { syncSchedule } = require("../src/notifications/scheduler");
    await syncSchedule({ ...DEFAULT_PREFERENCES, pushEnabled: false });
    expect(Notifications.cancelAllScheduledNotificationsAsync).toHaveBeenCalled();
  });
});
