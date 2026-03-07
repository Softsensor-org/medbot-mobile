export interface QuietHours {
  enabled: boolean;
  startHour: number; // 0-23
  startMinute: number; // 0-59
  endHour: number; // 0-23
  endMinute: number; // 0-59
}

export interface ReminderPreferences {
  pushEnabled: boolean;
  routineReminders: boolean;
  weeklySummary: boolean;
  quietHours: QuietHours;
}

export const DEFAULT_PREFERENCES: ReminderPreferences = {
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

export const NOTIFICATION_CONTENT = {
  routineReminder: {
    title: "Time for your routine",
    body: "Your skincare routine is waiting. Tap to check in.",
  },
  weeklySummary: {
    title: "Your weekly skin health summary",
    body: "See how your week went. Tap to view your progress.",
  },
} as const;

export const WEEKLY_SUMMARY_DEEP_LINK = "medbot:///(auth)/(tabs)/progress";
